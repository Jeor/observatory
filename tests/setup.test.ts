import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {validLogin} from '../server/auth.ts';
import {validateSettings} from '../server/settings.ts';
test('any non-empty password is accepted, including one character',()=>{assert.equal(validLogin({username:'owner',password:'x'}),true);assert.equal(validLogin({username:'owner',password:''}),false);assert.equal(validLogin({username:'owner',password:'a'.repeat(1000)}),true);});
test('service origins reject credentials and paths',()=>{const base={login:{username:'owner',password:'x'},timeZone:'UTC',allowedHosts:['localhost']};assert.throws(()=>validateSettings({...base,aiom:{origin:'http://user:password@localhost',configId:'a'.repeat(36),key:'key'}}));assert.throws(()=>validateSettings({...base,streams:{origin:'http://localhost/admin',username:'owner',password:'x'}}));});
test('first-run wizard protects setup, persists short-password login, restarts and permits authenticated management',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'observatory-setup-'));
 const listener=createServer();await new Promise<void>(r=>listener.listen(0,'127.0.0.1',r));const port=(listener.address() as any).port;await new Promise<void>(r=>listener.close(()=>r()));
 const env={PATH:process.env.PATH,HOST:'127.0.0.1',PORT:String(port),DATA_DIR:dir,CONFIG_DIR:dir,OBSERVATORY_MODE:'live'};
 const start=()=>{const child=spawn(process.execPath,['server/main.ts'],{env,stdio:['ignore','pipe','pipe']});return child;};
 let child=start(),output='';child.stdout!.on('data',b=>output+=b);child.stderr!.on('data',b=>output+=b);
 const base=`http://127.0.0.1:${port}`;
 async function wait(check:()=>Promise<boolean>){for(let i=0;i<100;i++){try{if(await check())return;}catch{}await new Promise(r=>setTimeout(r,40));}throw Error('Server did not reach expected state');}
 async function stop(){if(child.exitCode!==null)return;child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}
 try{
  await wait(async()=>output.includes('Observatory setup code:')&&(await fetch(base+'/healthz')).ok);
  const token=output.match(/Observatory setup code: ([a-f0-9]+)/)![1];
  assert.equal((await fetch(base+'/',{redirect:'manual'})).status,302);
  assert.equal((await fetch(base+'/api/overview')).status,503);
  const settings={login:{username:'owner',password:'x'},timeZone:'UTC'};
  const post=(path:string,data:unknown,headers:Record<string,string>={})=>fetch(base+'/api/setup/'+path,{method:'POST',headers:{origin:base,'content-type':'application/json',...headers},body:JSON.stringify(data)});
  assert.equal((await post('save',settings)).status,401);
  assert.equal((await post('save',settings,{'x-setup-code':token,origin:'http://evil.test'})).status,403);
  assert.equal((await post('save',{...settings,login:{username:'owner',password:''}},{'x-setup-code':token})).status,400);
  assert.equal((await post('unlock',{}, {'x-setup-code':token})).status,200);
  assert.equal((await post('save',settings,{'x-setup-code':token})).status,200);
  assert.equal(statSync(join(dir,'settings.json')).mode&0o777,0o600);
  await wait(async()=>(await fetch(base+'/')).status===401);
  const auth={authorization:'Basic '+Buffer.from('owner:x').toString('base64')};
  assert.equal((await fetch(base+'/api/overview',{headers:auth})).status,200);
  assert.equal((await post('save',settings,{'x-setup-code':token})).status,401);
  const unlocked=await (await post('unlock',{},auth)).json();assert.equal(unlocked.configured,true);assert.ok(!JSON.stringify(unlocked).includes('password'));
  assert.equal((await fetch(base+'/setup',{headers:auth})).status,200);
  await stop();output='';child=start();child.stdout!.on('data',b=>output+=b);child.stderr!.on('data',b=>output+=b);
  await wait(async()=>(await fetch(base+'/api/overview',{headers:auth})).ok);
  assert.ok(!output.includes('Observatory setup code:'));
  assert.equal(JSON.parse(readFileSync(join(dir,'settings.json'),'utf8')).login.password,'x');
 }finally{await stop();rmSync(dir,{recursive:true,force:true});}
});
