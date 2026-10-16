import {createHash} from 'node:crypto';
import type {PlayRecord,SessionSample} from '../../shared/contracts.ts';
export const opaque=(s:string)=>createHash('sha256').update(s).digest('hex').slice(0,20);
export function estimateInterval(a:SessionSample,b:SessionSample):number|null {
 const elapsed=(b.at-a.at)/1000,progress=(b.positionMs-a.positionMs)/1000;
 if(a.paused||b.paused||elapsed<=0||elapsed>45||progress<0||Math.abs(progress-elapsed)>30)return null;
 return elapsed;
}
const nonnegative=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)&&x>=0?x:0;
export function normalizePlaystate(input:unknown,now:number):PlayRecord[]{
 const x=input as any;
 if(!x||!Array.isArray(x.inProgress)||!Array.isArray(x.recentlyPlayed))throw Error('Unsupported playback response');
 const shared=new Map<string,string>();
 for(const p of Array.isArray(x.profiles)?x.profiles:[])if(typeof p.name==='string'&&Array.isArray(p.sharedWith))for(const name of p.sharedWith)if(typeof name==='string')shared.set(name,p.name);
 const rows=new Map<string,PlayRecord>();
 for(const r of [...x.inProgress,...x.recentlyPlayed]){
  if(typeof r.videoId!=='string'||typeof r.title!=='string'||typeof r.profile!=='string'||!Number.isFinite(r.updatedAt))throw Error('Unsupported playback record');
  const owner=shared.get(r.profile)||r.profile;const id=opaque('aiom|'+owner+'|'+(r.canonicalId||r.videoId));
  const row:PlayRecord={id,titleKey:opaque('title|'+(r.episode?'series|':'movie|')+(r.episode?(r.canonicalId||r.videoId).replace(/:\d+:\d+$/,''):(r.canonicalId||r.videoId))),itemKey:opaque('item|'+(r.canonicalId||r.videoId)),profile:owner,title:r.title,episode:typeof r.episode==='string'?r.episode:null,kind:r.episode?'episode':'movie',positionMs:nonnegative(r.positionMs),runtimeMs:nonnegative(r.runtimeMs),played:r.played===true,at:nonnegative(r.lastPlayedAt)||nonnegative(r.updatedAt)||now,genre:'Unclassified',art:null,source:'AIOMetadata playstate'};
  if(!rows.has(id)||rows.get(id)!.at<row.at)rows.set(id,row);
 }
 return [...rows.values()];
}
