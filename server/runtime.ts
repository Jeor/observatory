import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';import {authorized} from './auth.ts';import {enforceScope} from './scope.ts';import {createArtCache} from './art-cache.ts';
import {createServer} from 'node:http';import {mkdirSync,readFileSync,existsSync} from 'node:fs';import {resolve,extname,sep} from 'node:path';
import type {Config} from './config.ts';import {loadSettings} from './settings.ts';import type {ManagementHandler} from './setup.ts';import {Store} from './data/store.ts';import {buildData} from './api.ts';import {startPoller} from './connectors/poller.ts';import {fetchPlaystate} from './connectors/aiometadata.ts';import {fetchTraffic,createStreamsClient} from './connectors/aiostreams.ts';import type {SourceHealth} from '../shared/contracts.ts';
export function startDashboard(c:Config,manage:ManagementHandler){mkdirSync(c.dataDir,{recursive:true,mode:0o700});const db=new Store(resolve(c.dataDir,`${c.mode}.sqlite`));const stops:(()=>void)[]=[];
try{enforceScope(db,c);}catch(e){db.close();throw e;}
const getArt=createArtCache();
function health(key:string,name:string,message?:string){const old=db.get<SourceHealth>('health:'+key);db.set('health:'+key,{name,state:message?(old?.lastSuccess?'stale':'error'):'connected',lastSuccess:message?old?.lastSuccess??null:Date.now(),message:message||'Read-only connection; partial upstream history.'});}
if(c.aiom){const a=c.aiom;stops.push(startPoller({interval:15000,task:async signal=>{const snapshot=await fetchPlaystate(a.url,a.key,signal,db.get<any>('genre-cache')||{});db.reconcileAliases(snapshot.aliases);db.savePlays(snapshot.plays);db.set('genre-cache',snapshot.genreCache);db.set('images',{...db.get<Record<string,string>>('images'),...snapshot.images});health('aiom','AIOMetadata');},onError:m=>health('aiom','AIOMetadata',m)}));}
if(c.streams){const a=c.streams;const client=a.credentials?createStreamsClient(a.url,a.credentials):(signal?:AbortSignal)=>fetchTraffic(a.url,a.cookie!,signal);stops.push(startPoller({interval:60000,task:async signal=>{const d=await client(signal);db.saveTraffic(d.buckets);db.set('providers',d.providers);health('streams','AIOStreams');},onError:m=>health('streams','AIOStreams',m)}));}
// Previously connected sources are explicitly disabled when configuration is removed.
for(const [key,enabled,name] of [['aiom',!!c.aiom,'AIOMetadata'],['streams',!!c.streams,'AIOStreams']] as const)if(!enabled&&c.mode==='live'){const old=db.get<SourceHealth>('health:'+key);db.set('health:'+key,{name,state:'disabled',lastSuccess:old?.lastSuccess??null,message:'Not configured; any retained records are historical.'});}
const cleanup=setInterval(()=>db.cleanup(Date.now()),3600000);db.cleanup(Date.now());
let cachedOverview:{body:string;gzip:Buffer;etag:string;at:number}|undefined;
function overview(){if(!cachedOverview||Date.now()-cachedOverview.at>=10000){const body=JSON.stringify({...buildData(db,c.mode),timeZone:c.timeZone});cachedOverview={body,gzip:gzipSync(body),etag:'"'+createHash('sha256').update(body).digest('hex')+'"',at:Date.now()};}return cachedOverview;}
const root=resolve('dist');const allowedHosts=new Set(['localhost','127.0.0.1','[::1]',...(loadSettings()?.allowedHosts||[]),...(process.env.ALLOWED_HOSTS||'').split(',').map(s=>s.trim()).filter(Boolean)]);
const server=createServer({maxHeaderSize:65536},async(req,res)=>{
 if(req.url==='/healthz'&&(req.method==='GET'||req.method==='HEAD')){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:'{"status":"ok"}');return;}
 const hostname=(req.headers.host||'').replace(/:\d+$/,'');
 if(!allowedHosts.has(hostname)){res.writeHead(403);res.end('Host not allowed');return;}
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
 if(!authorized(req,c.login)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Observatory", charset="UTF-8"'});res.end('Authentication required');return;}
 if(await manage(req,res))return;
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
 try{
 const url=new URL(req.url||'/',`http://${req.headers.host}`);
 if(['/api/overview','/api/journal','/api/traffic','/api/connections'].includes(url.pathname)){res.setHeader('Content-Type','application/json');const value=overview();res.setHeader('ETag',value.etag);res.setHeader('Vary','Accept-Encoding');res.setHeader('Cache-Control','private, no-cache');if(req.headers['if-none-match']===value.etag){res.writeHead(304);res.end();return;}const compressed=(req.headers['accept-encoding']||'').split(',').some(part=>{const [name,...options]=part.toLowerCase().split(';').map(s=>s.trim());const q=options.find(s=>s.startsWith('q='));return name==='gzip'&&(!q||Number(q.slice(2))>0);});res.setHeader('Vary','Accept-Encoding');if(compressed)res.setHeader('Content-Encoding','gzip');res.end(req.method==='HEAD'?undefined:compressed?value.gzip:value.body);return;}
 if(url.pathname.startsWith('/api/art/')){const id=url.pathname.slice(9);const target=/^[a-f0-9]{20}$/.test(id)?db.get<Record<string,string>>('images')?.[id]:null;if(!target){res.writeHead(404);res.end();return;}try{const art=await getArt(target);res.setHeader('Content-Type',art.mime);res.setHeader('Cache-Control','private, max-age=3600');res.end(req.method==='HEAD'?undefined:art.bytes);}catch{res.writeHead(404);res.end();}return;}
 if(url.pathname.startsWith('/api/')){res.writeHead(404);res.end();return;}
 const candidate=resolve(root,'.'+decodeURIComponent(url.pathname));if(candidate!==root&&!candidate.startsWith(root+sep)){res.writeHead(400);res.end();return;}
 const file=extname(candidate)?candidate:resolve(root,'index.html');if(!existsSync(file)){res.writeHead(404);res.end('Build the frontend first.');return;}
 const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.ico':'image/x-icon'};res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(req.method==='HEAD'?undefined:readFileSync(file));
 }catch{res.writeHead(500);res.end('Request unavailable');}
});
server.listen(c.port,c.host,()=>console.log(`Observatory ${c.mode} · http://${c.host}:${c.port}`));
return async()=>{stops.forEach(s=>s());clearInterval(cleanup);server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));db.close();};
}
