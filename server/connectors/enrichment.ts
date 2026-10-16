import {allowedArt} from '../data/art.ts';
export function artSource(raw:unknown):string|null{
 if(allowedArt(raw))return raw;
 if(typeof raw!=='string')return null;
 try{const u=new URL(raw);const prefix='/poster-cache/background/';if(u.pathname.startsWith(prefix)){const nested=u.pathname.slice(prefix.length);if(allowedArt(nested))return nested;}}catch{}
 return null;
}
// AIOM's poster route supplies an explicit mapped title ID. Never merge by title text.
export function canonicalVideoId(r:{videoId:string;posterUrl?:string;episode?:string|null}):string{
 try{const path=new URL(r.posterUrl||'').pathname;const match=path.match(/^\/poster-cache\/proxy\/poster\/(movie|series)\/(tt\d+)$/);if(match){if(!r.episode&&match[1]==='movie')return match[2];const episode=r.videoId.match(/:(\d+):(\d+)$/);if(r.episode&&match[1]==='series'&&episode)return `${match[2]}:${episode[1]}:${episode[2]}`;}}catch{}
 return r.videoId;
}
