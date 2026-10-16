import {existsSync, readFileSync, mkdirSync, writeFileSync, renameSync, chmodSync} from 'node:fs';
import {resolve} from 'node:path';
import {validLogin, type Login} from './auth.ts';
export interface Settings {login:Login;timeZone:string;allowedHosts:string[];aiom?:{origin:string;configId:string;key:string};streams?:{origin:string;username:string;password:string}}
export function settingsPath(){return resolve(process.env.CONFIG_DIR||process.env.DATA_DIR||'./data','settings.json');}
export function loadSettings():Settings|undefined {const path=settingsPath();if(!existsSync(path))return;try{return validateSettings(JSON.parse(readFileSync(path,'utf8')));}catch{throw Error('Saved settings could not be read. Check the configuration volume and file permissions.');}}
export function origin(value:unknown):string {if(typeof value!=='string')throw Error('Enter a service address.');let u:URL;try{u=new URL(value);}catch{throw Error('Use a complete service address, including http:// or https://.');}if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw Error('Use a service origin without a path, credentials, or query string.');return u.origin;}
function text(value:unknown,name:string){if(typeof value!=='string'||!value.trim()||/[\r\n]/.test(value))throw Error(`Enter ${name}.`);return value;}
export function validateSettings(value:any):Settings {
 if(!validLogin(value?.login))throw Error('Enter an owner username and a non-empty password.');
 const timeZone=text(value.timeZone,'a time zone');try{new Intl.DateTimeFormat('en',{timeZone}).format();}catch{throw Error('Enter a valid time zone, for example America/New_York.');}
 if(!Array.isArray(value.allowedHosts)||!value.allowedHosts.length||value.allowedHosts.some((s:unknown)=>typeof s!=='string'||!/^([a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\])$/.test(s)))throw Error('Invalid dashboard hostname.');
 const result:Settings={login:{username:value.login.username,password:value.login.password},timeZone,allowedHosts:value.allowedHosts};
 if(value.aiom){const a=value.aiom;const configId=text(a.configId,'your AIOMetadata configuration ID').trim();if(!/^[a-f0-9-]{36}$/i.test(configId))throw Error('AIOMetadata configuration ID must be a UUID.');result.aiom={origin:origin(a.origin),configId,key:text(a.key,'your AIOMetadata admin key')};}
 if(value.streams){const a=value.streams;result.streams={origin:origin(a.origin),username:text(a.username,'your AIOStreams admin username'),password:text(a.password,'your AIOStreams admin password')};}
 return result;
}
export function saveSettings(settings:Settings){const path=settingsPath(),dir=resolve(path,'..');mkdirSync(dir,{recursive:true,mode:0o700});const temp=path+'.tmp';try{writeFileSync(temp,JSON.stringify(validateSettings(settings)),{mode:0o600});chmodSync(temp,0o600);renameSync(temp,path);}catch{throw Error('Could not save settings. Ensure the configuration volume is writable by container UID 1000.');}}
