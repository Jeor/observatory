import {allowedArt} from '../data/art.ts';
export function artSource(raw:unknown,depth=0):string|null{
 if(allowedArt(raw))return raw;
 if(typeof raw!=='string'||depth>3)return null;
 try{
  const u=new URL(raw);
  for(const kind of ['background','logo','poster']){
   const prefix=`/poster-cache/${kind}/`;
   if(u.pathname.startsWith(prefix))return artSource(u.pathname.slice(prefix.length),depth+1);
  }
  // Use the provider's standard poster, not the user's rating/textless override.
  if(/^\/poster-cache\/proxy\/poster\/(movie|series)\/[^/]+$/.test(u.pathname))return artSource(u.searchParams.get('fallback'),depth+1);
 }catch{}
 return null;
}
// AIOM's poster route supplies an explicit mapped title ID. Never merge by title text.
export function canonicalVideoId(r:{videoId:string;posterUrl?:string;episode?:string|null}):string{
 try{const path=new URL(r.posterUrl||'').pathname;const match=path.match(/^\/poster-cache\/proxy\/poster\/(movie|series)\/(tt\d+)$/);if(match){if(!r.episode&&match[1]==='movie')return match[2];const episode=r.videoId.match(/:(\d+):(\d+)$/);if(r.episode&&match[1]==='series'&&episode)return `${match[2]}:${episode[1]}:${episode[2]}`;}}catch{}
 return r.videoId;
}
