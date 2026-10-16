import {lookup} from 'node:dns/promises';import {isIP} from 'node:net';
const hosts=new Set(['image.tmdb.org','artworks.thetvdb.com','assets.fanart.tv','images.fanart.tv','m.media-amazon.com']);
export function allowedArt(raw:unknown):raw is string{try{if(typeof raw!=='string')return false;const u=new URL(raw);return u.protocol==='https:'&&hosts.has(u.hostname)&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash&&/\.(png|jpe?g|webp)$/i.test(u.pathname);}catch{return false;}}
export async function downloadArt(url:string):Promise<{bytes:Buffer;mime:string}>{
 if(!allowedArt(url))throw Error('Unsupported artwork');
 const addresses=await lookup(new URL(url).hostname,{all:true});
 if(!addresses.length||addresses.some(({address})=>isIP(address)===4?/^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address):/^(::|fc|fd|fe80)/i.test(address)))throw Error('Non-public artwork origin');
 const res=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(10000)});const mime=(res.headers.get('content-type')||'').split(';')[0];
 if(!res.ok||!['image/jpeg','image/png','image/webp'].includes(mime))throw Error('Artwork unavailable');
 const reader=res.body?.getReader();if(!reader)throw Error('Empty artwork');let size=0;const chunks:Uint8Array[]=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8*1024*1024){await reader.cancel();throw Error('Artwork too large');}chunks.push(value);}return {bytes:Buffer.concat(chunks),mime};
}
