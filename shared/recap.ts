import type {JournalGroup} from './journal.ts';
import {localDate} from './filters.ts';
export function recapData(groups:JournalGroup[],period:string){
 const titles=new Map<string,{record:JournalGroup['latest'];episodes:Set<string>;entries:number}>();
 const days=new Map<string,number>(),weekdays=Array<number>(7).fill(0);
 const months=new Map<string,Map<string,number>>();
 for(const g of groups){
  const r=g.latest,key=r.titleKey||r.itemKey||r.id;
  let title=titles.get(key);if(!title){title={record:r,episodes:new Set(),entries:0};titles.set(key,title);}
  title.entries++;if(r.kind==='episode')title.episodes.add(r.itemKey||r.id);
  const day=localDate(r.at);days.set(day,(days.get(day)||0)+1);
  weekdays[new Date(day+'T12:00:00Z').getUTCDay()]++;
  const bucket=period.length===4?day.slice(0,7):`${period}-${String(Math.floor((+day.slice(-2)-1)/7)*7+1).padStart(2,'0')}`;
  if(!months.has(bucket))months.set(bucket,new Map());
  const genres=months.get(bucket)!;genres.set(r.genre,(genres.get(r.genre)||0)+1);
 }
 const orderedDays=[...days.keys()].sort();let longest=0,run=0,previous=-Infinity,end='';
 for(const day of orderedDays){const n=Date.parse(day+'T00:00:00Z')/86400000;run=n===previous+1?run+1:1;previous=n;if(run>longest){longest=run;end=day;}}
 const busiest=[...days].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
 const topWeekday=weekdays.indexOf(Math.max(...weekdays));
 return {titles:[...titles.values()],series:[...titles.values()].filter(t=>t.record.kind==='episode').sort((a,b)=>b.episodes.size-a.episodes.size||a.record.title.localeCompare(b.record.title)).slice(0,5),longest,end,busiest,topWeekday,
  trends:[...months].sort((a,b)=>a[0].localeCompare(b[0])).map(([key,genres])=>({key,genres:[...genres].sort((a,b)=>b[1]-a[1]),total:[...genres.values()].reduce((a,b)=>a+b,0)}))};
}

// Coverage must be explicitly supplied by a source; record timestamps alone
// cannot establish that an empty day or period is complete.
export function comparablePeriods(period:string,today:string,coverage?:{start:string;end:string;complete:boolean}){
 const yearly=period.length===4;
 const start=yearly?`${period}-01-01`:`${period}-01`;
 const d=new Date(start+'T12:00:00Z');
 const next=new Date(d);if(yearly)next.setUTCFullYear(next.getUTCFullYear()+1);else next.setUTCMonth(next.getUTCMonth()+1);
 const prior=new Date(d);if(yearly)prior.setUTCFullYear(prior.getUTCFullYear()-1);else prior.setUTCMonth(prior.getUTCMonth()-1);
 const previous=prior.toISOString().slice(0,yearly?4:7);
 const end=new Date(+next-86400000).toISOString().slice(0,10);
 return coverage?.complete&&coverage.start<=prior.toISOString().slice(0,10)&&coverage.end>=end&&end<today?previous:null;
}
