import {createServer,type IncomingMessage,type ServerResponse} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {authorized} from './auth.ts';
import type {Config} from './config.ts';
import {type Settings,validateSettings,saveSettings,loadSettings} from './settings.ts';
import {readJson} from './connectors/http.ts';
import {createStreamsClient} from './connectors/aiostreams.ts';
export type ManagementHandler=(req:IncomingMessage,res:ServerResponse)=>Promise<boolean>;
function reply(res:ServerResponse,status:number,data:unknown){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function sameOrigin(req:IncomingMessage){try{return new URL(req.headers.origin||'').host===req.headers.host;}catch{return false;}}
async function body(req:IncomingMessage){let size=0;const chunks:Buffer[]=[];for await(const chunk of req){size+=chunk.length;if(size>16384)throw Error('Settings are too large.');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('Invalid settings request.');}}
function fromConfig(c:Config):Settings {return {login:c.login!,timeZone:c.timeZone,allowedHosts:['localhost','127.0.0.1'],aiom:c.aiom?{origin:new URL(c.aiom.url).origin,configId:new URL(c.aiom.url).pathname.split('/').pop()!,key:c.aiom.key}:undefined,streams:c.streams?.credentials?{origin:new URL(c.streams.url).origin,...c.streams.credentials}:undefined};}
export function createManagement(config:Config|undefined,onSaved:()=>void):ManagementHandler {
 const configured=!!config?.login;
 const code=configured?'':randomBytes(24).toString('hex');
 if(!configured)console.log(`Observatory setup code: ${code}\nOpen the WebUI and enter this code. It changes when the container restarts.`);
 let current=configured?fromConfig(config!):undefined;
 if(configured){try{current=loadSettings()||current;}catch{/* Keep the running owner credentials. */}}
 let failures=0,windowStart=Date.now(),busy=false,saved=false;
 return async(req,res)=>{
  const path=(req.url||'/').split('?')[0];
  const assetPaths=['/setup','/setup.js','/setup.css','/fonts/fonts.css','/fonts/source-sans-3.ttf'];
  if(!assetPaths.includes(path)&&!path.startsWith('/api/setup/'))return false;
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  if(configured&&!authorized(req,config!.login)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Observatory", charset="UTF-8"'});res.end('Authentication required');return true;}
  if(assetPaths.includes(path)){
   if(req.method!=='GET'&&req.method!=='HEAD'){reply(res,405,{error:'Method not allowed'});return true;}
   const file=path==='/setup'?'setup.html':path.slice(1);
   try{res.setHeader('Content-Type',file.endsWith('.ttf')?'font/ttf':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(req.method==='HEAD'?undefined:readFileSync(resolve('public',file)));}catch{reply(res,500,{error:'Setup files unavailable. Reinstall the image.'});}return true;
  }
  if(path==='/api/setup/status'&&req.method==='GET'){reply(res,200,{configured});return true;}
  if(req.method!=='POST'){reply(res,405,{error:'Method not allowed'});return true;}
  if(!sameOrigin(req)||!req.headers['content-type']?.startsWith('application/json')){reply(res,403,{error:'Open setup from the dashboard address and try again.'});return true;}
  if(saved){reply(res,409,{error:'Setup is complete. Open the dashboard.'});return true;}
  if(!configured){
   if(Date.now()-windowStart>60000){failures=0;windowStart=Date.now();}
   if(failures>=10){reply(res,429,{error:'Too many attempts. Wait a minute and try again.'});return true;}
   const candidate=Buffer.from(String(req.headers['x-setup-code']||''));const expected=Buffer.from(code);
   if(candidate.length!==expected.length||!timingSafeEqual(candidate,expected)){failures++;reply(res,401,{error:'Enter the setup code from the current container log.'});return true;}
  }
  if(path==='/api/setup/unlock'){
   reply(res,200,{configured,timeZone:current?.timeZone||process.env.OBSERVATORY_TIMEZONE||'UTC',aiom:current?.aiom?{origin:current.aiom.origin,configId:current.aiom.configId}:null,streams:current?.streams?{origin:current.streams.origin,username:current.streams.username}:null});return true;
  }
  if(busy){reply(res,429,{error:'Another connection check is in progress. Try again shortly.'});return true;}
  busy=true;
  try{
   const input=await body(req);
   const hostname=(req.headers.host||'').replace(/:\d+$/,'');
   const candidate=validateSettings({...input,login:current?.login||input.login,allowedHosts:[...new Set([...(current?.allowedHosts||[]),hostname,'localhost','127.0.0.1',...(process.env.ALLOWED_HOSTS||'').split(',').filter(Boolean)])],aiom:input.aiom?{...input.aiom,key:input.aiom.key||current?.aiom?.key}:undefined,streams:input.streams?{...input.streams,password:input.streams.password||current?.streams?.password}:undefined});
   // Changing the identity of an existing source must not mix two accounts' history.
   if(current?.aiom&&candidate.aiom&&(current.aiom.origin!==candidate.aiom.origin||current.aiom.configId!==candidate.aiom.configId))throw Error('Use a separate data volume for a different AIOMetadata instance or configuration.');
   if(current?.streams&&candidate.streams&&(current.streams.origin!==candidate.streams.origin||current.streams.username!==candidate.streams.username))throw Error('Use a separate data volume for a different AIOStreams instance or account.');
   if(path==='/api/setup/test'){
    if(input.service==='aiom'&&candidate.aiom){const a=candidate.aiom;const result:any=await readJson(`${a.origin}/api/dashboard/jellyfin/${a.configId}`,{'x-admin-key':a.key});if(!Array.isArray(result?.inProgress)||!Array.isArray(result?.recentlyPlayed))throw Error('AIOMetadata did not return viewing activity. Check the configuration ID and Jellyfin API setting.');}
    else if(input.service==='streams'&&candidate.streams){const a=candidate.streams;await createStreamsClient(`${a.origin}/api/v1/dashboard/usenet/stats?window=7d`,a)();}
    else throw Error('Choose a service to test.');
    reply(res,200,{ok:true,message:'Connection verified.'});
   }else if(path==='/api/setup/save'){saveSettings(candidate);saved=true;reply(res,200,{ok:true});onSaved();}
   else reply(res,404,{error:'Not found'});
  }catch(e){const message=e instanceof Error?e.message:'Unable to complete setup.';reply(res,400,{error:message});}finally{busy=false;}
  return true;
 };
}
export function startSetupServer(manage:ManagementHandler){
 const server=createServer({maxHeaderSize:65536},async(req,res)=>{
  if(req.url==='/healthz'){reply(res,200,{status:'setup_required'});return;}
  if(req.url==='/'){res.writeHead(302,{Location:'/setup','Cache-Control':'no-store'});res.end();return;}
  if(!await manage(req,res))reply(res,503,{error:'Complete setup before opening the dashboard.'});
 });
 server.requestTimeout=15000;server.headersTimeout=10000;
 const port=Number(process.env.PORT||8080);server.listen(Number.isInteger(port)&&port>0&&port<=65535?port:8080,process.env.HOST||'127.0.0.1');
 return async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));};
}
