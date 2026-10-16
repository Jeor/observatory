export async function readJson(url:string,headers:Record<string,string>={},options:{fetcher?:typeof fetch;signal?:AbortSignal}={}):Promise<unknown>{
 try{
 const res=await (options.fetcher||fetch)(url,{headers,redirect:'error',signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)});
 if(!res.ok)throw Error(`HTTP ${res.status}`);
 if(!res.headers.get('content-type')?.includes('application/json'))throw Error('Expected JSON; authentication or version mismatch');
 const length=Number(res.headers.get('content-length'));if(length>8*1024*1024)throw Error('Response too large');
 const reader=res.body?.getReader();if(!reader)throw Error('Empty response');let size=0;const chunks:Uint8Array[]=[];
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8*1024*1024){await reader.cancel();throw Error('Response too large');}chunks.push(value);}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
 }catch(e){const message=e instanceof Error?e.message:'';throw Error(/^HTTP \d{3}$/.test(message)?message:'Connection failed or unsupported response');}
}
