import test from 'node:test';import assert from 'node:assert/strict';
import {readJson} from '../server/connectors/http.ts';
import {normalizeTraffic} from '../server/connectors/aiostreams.ts';
import {startPoller} from '../server/connectors/poller.ts';
test('HTTP rejects auth, HTML, malformed and redirects with sanitized errors',async()=>{
 for(const status of [401,403,429,302])await assert.rejects(()=>readJson('http://localhost/private',{},{fetcher:async()=>new Response('secret-token',{status,headers:{'content-type':'application/json'}})}),e=>!String(e).includes('secret-token'));
 await assert.rejects(()=>readJson('http://localhost',{}, {fetcher:async()=>new Response('<html>login</html>',{headers:{'content-type':'text/html'}})}));
});
test('traffic keeps aggregate buckets and does not invent provider series',()=>{
 const v=normalizeTraffic({success:true,data:{generatedAt:123456,throughput:[{bucketMs:100000,bytes:20}],providers:[{name:'Primary',bytes:20}],bucketMs:3600000}});assert.equal(v.buckets[0].bytes,20);assert.equal(v.providers[0].bytes,20);
 assert.throws(()=>normalizeTraffic({success:true,data:{throughput:[{bytes:-1}]}}));
});
test('poller does not overlap and stops cleanly',async()=>{
 let active=0,max=0,calls=0;const stop=startPoller({interval:5,task:async()=>{active++;max=Math.max(max,active);calls++;await new Promise(r=>setTimeout(r,15));active--;},onError:()=>{}});
 await new Promise(r=>setTimeout(r,52));stop();let n=calls;await new Promise(r=>setTimeout(r,30));assert.equal(max,1);assert.equal(calls,n);
});
import {allowedArt} from '../server/data/art.ts';
test('artwork accepts known public image paths only and rejects credentials and redirects',()=>{
 assert.equal(allowedArt('https://image.tmdb.org/t/p/original/a.jpg'),true);assert.equal(allowedArt('https://image.tmdb.org/t/p/original/a.svg'),true);
 for(const u of ['http://127.0.0.1/a.jpg','https://image.tmdb.org.evil.test/a.jpg','https://user:secret@image.tmdb.org/a.jpg','https://image.tmdb.org/a.jpg?api_key=secret','https://image.tmdb.org/a.jpg#secret'])assert.equal(allowedArt(u),false);
});
import {createStreamsClient} from '../server/connectors/aiostreams.ts';
test('streams authenticates once then reuses its session, never sends password on GET',async()=>{
 const calls:{url:string;method:string;body:unknown}[]=[];
 const fetcher:typeof fetch=async(url,init)=>{calls.push({url:String(url),method:init?.method||'GET',body:init?.body});return String(url).endsWith('/login')?new Response('{}',{headers:{'content-type':'application/json','set-cookie':'aiostreams.session=private; Path=/; HttpOnly'}}):new Response(JSON.stringify({success:true,data:{generatedAt:10,bucketMs:3600000,throughput:[],providers:[]}}),{headers:{'content-type':'application/json'}});};
 const client=createStreamsClient('http://localhost/api/v1/dashboard/usenet/stats?window=7d',{username:'owner',password:'secret'},fetcher);
 await client();await client();assert.equal(calls.filter(c=>c.method==='POST').length,1);assert.equal(calls.filter(c=>c.method==='GET'&&c.body).length,0);
});
test('expired streams sessions refresh once and repeated 401 does not loop',async()=>{
 let logins=0,gets=0;const fetcher:typeof fetch=async(url)=>String(url).endsWith('/login')?(logins++,new Response('{}',{headers:{'set-cookie':'aiostreams.session=x; Path=/'}})):(gets++,new Response('{}',{status:401,headers:{'content-type':'application/json'}}));
 await assert.rejects(()=>createStreamsClient('http://localhost/api/v1/dashboard/usenet/stats',{username:'owner',password:'secret'},fetcher)(),/HTTP 401/);assert.equal(logins,2);assert.equal(gets,2);
});
test('expired session login redirect renews once, retries stats and keeps new cookie',async()=>{
 let logins=0,gets=0;const cookies:string[]=[];
 const fetcher:typeof fetch=async(url,init)=>{
  if(String(url).endsWith('/auth/login')){logins++;return new Response('{}',{headers:{'set-cookie':`aiostreams.session=session${logins}; Max-Age=86400; Path=/`}});}
  gets++;assert.equal(init?.redirect,'manual');cookies.push((init?.headers as Record<string,string>).cookie);
  if(gets===2)return new Response(null,{status:302,headers:{location:'/login?next=%2Fapi%2Fv1%2Fdashboard%2Fusenet%2Fstats'}});
  return Response.json({data:{generatedAt:10,bucketMs:3600000,throughput:[],providers:[]}});
 };
 const client=createStreamsClient('http://localhost/api/v1/dashboard/usenet/stats',{username:'owner',password:'secret'},fetcher);
 await client();await client();await client();assert.equal(logins,2);assert.equal(gets,4);assert.deepEqual(cookies,['aiostreams.session=session1','aiostreams.session=session1','aiostreams.session=session2','aiostreams.session=session2']);
});
test('repeated login redirects do not loop, and unrelated redirects do not trigger login',async()=>{
 for(const location of ['/login?next=private','https://other.test/login','/different','http://user:secret@localhost/login']){
  let logins=0,gets=0;const fetcher:typeof fetch=async(url)=>{
   if(String(url).endsWith('/auth/login')){logins++;return new Response('{}',{headers:{'set-cookie':'aiostreams.session=x; Path=/'}});}
   gets++;return new Response(null,{status:302,headers:{location}});
  };
  await assert.rejects(()=>createStreamsClient('http://localhost/api/v1/dashboard/usenet/stats',{username:'owner',password:'secret'},fetcher)(),e=>!String(e).includes('secret')&&!String(e).includes('private'));
  assert.equal(logins,location.startsWith('/login?')?2:1);assert.equal(gets,logins);
 }
});
