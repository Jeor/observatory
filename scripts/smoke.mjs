import {request} from 'node:http';
import {spawn} from 'node:child_process';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';
const dir=await mkdtemp(join(tmpdir(),'observatory-smoke-'));
const login={username:'test-owner',password:'test-only-password-12345'};await writeFile(join(dir,'auth.json'),JSON.stringify(login),{mode:0o600});
const child=spawn(process.execPath,['server/main.ts'],{env:{PATH:process.env.PATH,OBSERVATORY_MODE:'live',HOST:'127.0.0.1',PORT:'18084',DATA_DIR:dir,OBSERVATORY_TIMEZONE:'Asia/Tokyo',OBSERVATORY_AUTH_FILE:join(dir,'auth.json')},stdio:['ignore','ignore','pipe']});let errors='';child.stderr.on('data',b=>errors+=b);
try{
 let ready=false;for(let i=0;i<50;i++){try{ready=(await fetch('http://127.0.0.1:18084/healthz')).ok;if(ready)break;}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,errors);
 const base='http://127.0.0.1:18084';for(const path of ['/','/api/overview','/api/art/00000000000000000000'])assert.equal((await fetch(base+path)).status,401);
 const headers={authorization:'Basic '+Buffer.from(`${login.username}:${login.password}`).toString('base64')};const r=await fetch(base+'/api/overview',{headers});assert.equal(r.status,200);assert.equal(r.headers.get('content-encoding'),'gzip');const body=await r.json();assert.equal(body.timeZone,'Asia/Tokyo');assert.equal(body.plays.length,0);assert.equal(body.mode,'live');assert.equal((await fetch(base+'/api/overview',{headers:{...headers,'if-none-match':r.headers.get('etag')}})).status,304);assert.equal((await fetch(base+'/',{headers})).status,200);
 const hostStatus=await new Promise((resolve,reject)=>{const q=request(base+'/api/overview',{headers:{...headers,host:'untrusted.example'}},r=>{r.resume();resolve(r.statusCode);});q.on('error',reject);q.end();});assert.equal(hostStatus,403);
 console.log('HTTP smoke passed: health, authentication, empty live setup, timezone, ETag, frontend.');
}finally{child.kill('SIGTERM');await new Promise(r=>child.once('close',r));await rm(dir,{recursive:true,force:true});}
