import {downloadArt} from './data/art.ts';
type Art=Awaited<ReturnType<typeof downloadArt>>;
export function createArtCache(loader=downloadArt){
 const cache=new Map<string,Art>(),pending=new Map<string,Promise<Art>>();let bytes=0,active=0;
 const queue:Array<()=>void>=[];
 return async function get(url:string):Promise<Art>{
  const hit=cache.get(url);if(hit){cache.delete(url);cache.set(url,hit);return hit;}
  const existing=pending.get(url);if(existing)return existing;
  if(pending.size>=64)throw Error('Artwork queue full');
  const task=(async()=>{
   if(active>=4)await new Promise<void>(r=>queue.push(r));else active++;
   try{const art=await loader(url);cache.set(url,art);bytes+=art.bytes.length;
    while(bytes>32*1024*1024||cache.size>100){const key=cache.keys().next().value!;bytes-=cache.get(key)!.bytes.length;cache.delete(key);}return art;
   }finally{const next=queue.shift();if(next)next();else active--;}
  })();pending.set(url,task);
  try{return await task;}finally{pending.delete(url);}
 };
}
