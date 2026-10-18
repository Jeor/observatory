export class LoginRedirectError extends Error {constructor(){super('Login session expired');}}
export async function readJson(url:string,headers:Record<string,string>={},options:{fetcher?:typeof fetch;signal?:AbortSignal;detectLoginRedirect?:boolean}={}):Promise<unknown>{
 try{
 const res=await (options.fetcher||fetch)(url,{headers,redirect:options.detectLoginRedirect?'manual':'error',signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)});
 if(options.detectLoginRedirect&&[301,302,303,307,308].includes(res.status)){
  const location=res.headers.get('location');let login=false;
  try{if(location){const target=new URL(location,url);login=target.origin===new URL(url).origin&&!target.username&&!target.password&&target.pathname==='/login';}}catch{}
  await res.body?.cancel();
  if(login)throw new LoginRedirectError();
 }
 if(!res.ok)throw Error(`HTTP ${res.status}`);
 if(!res.headers.get('content-type')?.includes('application/json'))throw Error('Expected JSON; authentication or version mismatch');
 const length=Number(res.headers.get('content-length'));if(length>8*1024*1024)throw Error('Response too large');
 const reader=res.body?.getReader();if(!reader)throw Error('Empty response');let size=0;const chunks:Uint8Array[]=[];
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8*1024*1024){await reader.cancel();throw Error('Response too large');}chunks.push(value);}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
 }catch(e){if(e instanceof LoginRedirectError)throw e;const message=e instanceof Error?e.message:'';throw Error(/^HTTP \d{3}$/.test(message)?message:'Connection failed or unsupported response');}
}
