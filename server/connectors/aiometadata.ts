import {readJson} from './http.ts';
import {normalizePlaystate,opaque} from '../data/normalize.ts';
import {artSource,canonicalVideoId} from './enrichment.ts';
type GenreCache=Record<string,{at:number;genres:string[];logo?:string|null;poster?:string|null;artVersion?:number}>;
export async function fetchPlaystate(url:string,key:string,signal?:AbortSignal,cache:GenreCache={}){
 const input:any=await readJson(url,{'x-admin-key':key},{signal});
 const rows=[...input.inProgress,...input.recentlyPlayed];const aliases:Record<string,string>={};
 for(const r of rows){const owner=input.profiles?.find((p:any)=>p.sharedWith?.includes(r.profile))?.name||r.profile;r.canonicalId=canonicalVideoId(r);aliases[opaque('aiom|'+owner+'|'+r.videoId)]=opaque('aiom|'+owner+'|'+r.canonicalId);}
 const plays=normalizePlaystate(input,Date.now());const images:Record<string,string>={};
 // A small sequential enrichment budget; successful lookups are retained for a week.
 let budget=4;const configId=new URL(url).pathname.split('/').pop();
 for(const r of rows){
  const owner=input.profiles?.find((p:any)=>p.sharedWith?.includes(r.profile))?.name||r.profile;
  const row=plays.find(p=>p.id===opaque('aiom|'+owner+'|'+r.canonicalId));if(!row)continue;
  const art=artSource(r.imageUrl)||artSource(r.posterUrl);if(art){const id=opaque(art);images[id]=art;row.art='/api/art/'+id;}
  const type=r.episode?'series':'movie';const id=r.episode?r.canonicalId.replace(/:\d+:\d+$/,''):r.canonicalId;const cacheKey=type+'|'+id;
  const entry=cache[cacheKey];const ttl=entry?.genres.length?7*86400000:3600000;
  if((!entry||entry.artVersion!==2||Date.now()-entry.at>ttl)&&budget>0){budget--;try{
   const endpoint=new URL(`/stremio/${configId}/meta/${type}/${encodeURIComponent(id)}.json`,url);
   const result:any=await readJson(endpoint.href,{}, {signal});
   cache[cacheKey]={artVersion:2,logo:artSource(result.meta?.logo),poster:artSource(result.meta?.poster),at:Date.now(),genres:Array.isArray(result.meta?.genres)?result.meta.genres.filter((g:unknown)=>typeof g==='string'&&g.trim()):[]};
  }catch{cache[cacheKey]={artVersion:2,at:Date.now(),genres:entry?.genres||[],logo:entry?.logo||null,poster:entry?.poster||null};}}
  row.genre=cache[cacheKey]?.genres[0]||'Unclassified';
  for(const field of ['logo','poster'] as const){const source=artSource(cache[cacheKey]?.[field]);if(source){const key=opaque(source);images[key]=source;row[field]='/api/art/'+key;}}
 }
 return {plays,images,aliases,genreCache:cache};
}
