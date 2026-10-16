import {validLogin,type Login} from './auth.ts';
import {readFileSync} from 'node:fs';
export interface Config {mode:'demo'|'live';port:number;host:string;dataDir:string;timeZone:string;login?:Login;streamsScope?:string;aiom?:{url:string;key:string};streams?:{url:string;cookie?:string;credentials?:{username:string;password:string}}}
function jsonSecret(path:string):any {try{return JSON.parse(readFileSync(path,'utf8'));}catch{throw Error('Unable to read valid JSON credential file');}}
function secret(path:string){const text=readFileSync(path,'utf8').trim();if(!text||/[\r\n]/.test(text))throw Error('Secret file is empty or contains multiple lines');return text;}
function endpoint(raw:string,path:string){const u=new URL(raw);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw Error('Configure an origin without credentials or path');return new URL(path,u).href;}
export function readConfig():Config {
 const mode=process.env.OBSERVATORY_MODE||process.env.AFTERGLOW_MODE||'live';if(mode!=='live'&&mode!=='demo')throw Error('Invalid mode');
 const c:Config={mode,port:Number(process.env.PORT||8080),host:process.env.HOST||'127.0.0.1',dataDir:process.env.DATA_DIR||'./data',timeZone:process.env.OBSERVATORY_TIMEZONE||'America/New_York'};
 new Intl.DateTimeFormat('en',{timeZone:c.timeZone}).format(0);
 if(process.env.OBSERVATORY_AUTH_FILE){const login=jsonSecret(process.env.OBSERVATORY_AUTH_FILE);if(!validLogin(login))throw Error('Dashboard login requires a username and password of at least 16 characters');c.login=login;}
 if(mode==='live'&&!['127.0.0.1','::1','localhost'].includes(c.host)&&!c.login)throw Error('Live network access requires OBSERVATORY_AUTH_FILE; use HTTPS at your reverse proxy');
 c.streamsScope=process.env.STREAMS_ACCOUNT_SCOPE;
 if(!Number.isInteger(c.port)||c.port<1||c.port>65535)throw Error('Invalid port');
 if(mode==='live'&&process.env.AIOM_ORIGIN&&process.env.AIOM_ADMIN_KEY_FILE&&process.env.AIOM_CONFIG_ID_FILE){const id=secret(process.env.AIOM_CONFIG_ID_FILE);if(!/^[a-f0-9-]{36}$/i.test(id))throw Error('Invalid configuration ID');c.aiom={url:endpoint(process.env.AIOM_ORIGIN,`/api/dashboard/jellyfin/${id}`),key:secret(process.env.AIOM_ADMIN_KEY_FILE)};}
 if(mode==='live'&&process.env.STREAMS_ORIGIN&&process.env.STREAMS_COOKIE_FILE)c.streams={url:endpoint(process.env.STREAMS_ORIGIN,'/api/v1/dashboard/usenet/stats?window=7d'),cookie:secret(process.env.STREAMS_COOKIE_FILE)};
 if(mode==='live'&&process.env.STREAMS_ORIGIN&&process.env.STREAMS_CREDENTIALS_FILE){const credentials=jsonSecret(process.env.STREAMS_CREDENTIALS_FILE);if(typeof credentials.username!=='string'||typeof credentials.password!=='string'||!credentials.username||!credentials.password)throw Error('Invalid credentials file');c.streams={url:endpoint(process.env.STREAMS_ORIGIN,'/api/v1/dashboard/usenet/stats?window=7d'),credentials};}
 if(c.streams&&!c.streams.credentials&&!c.streamsScope)throw Error('Cookie authentication requires STREAMS_ACCOUNT_SCOPE');
 return c;
}
