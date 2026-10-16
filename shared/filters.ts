import {timeZone} from './timezone.ts';
import type {PlayRecord,DashboardData,SourceHealth} from './contracts.ts';
export const localDate=(at:number)=>new Intl.DateTimeFormat('en-CA',{timeZone:timeZone(),year:'numeric',month:'2-digit',day:'2-digit'}).format(at);
export interface Filters {profile:string;days:number;search:string;kind:string}
export function filterPlays(rows:PlayRecord[],f:Filters,now:number){const first=rangeStart(now,f.days),last=localDate(now);return rows.filter(r=>(f.profile==='all'||r.profile===f.profile)&&(f.kind==='all'||r.kind===f.kind)&&r.title.toLowerCase().includes(f.search.toLowerCase())&&localDate(r.at)>=first&&localDate(r.at)<=last).sort((a,b)=>b.at-a.at);}
export const formatDate=(at:number)=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:timeZone()}).format(at);
export const duration=(ms:number)=>`${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;
export const bytes=(n:number|null)=>n===null?'—':n>=1e9?`${(n/1e9).toFixed(1)} GB`:n>=1e6?`${(n/1e6).toFixed(1)} MB`:`${Math.round(n)} B`;

export function rangeStart(now:number,days:number){const d=new Date(localDate(now)+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-(days-1));return d.toISOString().slice(0,10);}
export function watchedValue(data:DashboardData,records:PlayRecord[]):number|null{return data.mode==='demo'||data.sources[0].lastSuccess!==null?records.filter(r=>r.played).length:null;}
export function playbackNotice(source:SourceHealth):string{if(source.state==='connected')return '';return `Playback ${source.state}. ${source.lastSuccess!==null?'Retained records may be stale. Last successful collection: '+new Date(source.lastSuccess).toLocaleString('en-US',{timeZone:timeZone()})+' '+timeZone()+'.':'No playback history has been collected.'}`;}
