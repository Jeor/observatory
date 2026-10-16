import {readJson} from './http.ts';import type {TrafficBucket,ProviderTotal} from '../../shared/contracts.ts';
export function normalizeTraffic(input:unknown):{buckets:TrafficBucket[];providers:ProviderTotal[];at:number}{
 const x=(input as any)?.data;
 if(!x||!Array.isArray(x.throughput)||!Array.isArray(x.providers)||!Number.isFinite(x.generatedAt)||x.bucketMs!==3600000)throw Error('Unsupported traffic response');
 const buckets=x.throughput.map((r:any)=>{if(!Number.isFinite(r.bucketMs)||!Number.isFinite(r.bytes)||r.bytes<0)throw Error('Invalid traffic bucket');return {at:r.bucketMs,bytes:r.bytes};});
 const providers=x.providers.map((r:any,i:number)=>{if(!Number.isFinite(r.bytes)||r.bytes<0)throw Error('Invalid provider total');return {name:typeof r.name==='string'?r.name:`Provider ${i+1}`,bytes:r.bytes};});
 return {buckets,providers,at:x.generatedAt};
}
export async function fetchTraffic(url:string,cookie:string,signal?:AbortSignal){return normalizeTraffic(await readJson(url,{cookie},{signal}));}
export function createStreamsClient(url:string,credentials:{username:string;password:string},fetcher:typeof fetch=fetch){
 let cookie='';
 async function login(signal?:AbortSignal){
  try{const response=await fetcher(new URL('/api/v1/auth/login',url),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(credentials),redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)});
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  cookie=response.headers.getSetCookie().find(c=>c.startsWith('aiostreams.session='))?.split(';')[0]||'';
  if(!cookie)throw Error('Session unavailable');await response.body?.cancel();
  }catch(e){throw Error(e instanceof Error&&/^HTTP \d{3}$/.test(e.message)?e.message:'Authentication unavailable');}
 }
 return async(signal?:AbortSignal)=>{if(!cookie)await login(signal);try{return normalizeTraffic(await readJson(url,{cookie},{fetcher,signal}));}catch(e){if(e instanceof Error&&e.message==='HTTP 401'){cookie='';await login(signal);return normalizeTraffic(await readJson(url,{cookie},{fetcher,signal}));}throw e;}};
}
