import type {PlayRecord} from './contracts.ts';
import {localDate} from './filters.ts';
import {groupJournal} from './journal.ts';
export function reviewData(records:PlayRecord[],period:string,profile:string,minutes=120){
 const rows=records.filter(r=>r.played&&(profile==='all'||r.profile===profile)&&localDate(r.at).startsWith(period));
 const groups=groupJournal(rows,minutes);
 const bins=new Map<string,number>();const genres=new Map<string,number>();
 for(const g of groups){const key=localDate(g.latest.at).slice(0,period.length===4?7:10);bins.set(key,(bins.get(key)||0)+1);genres.set(g.latest.genre,(genres.get(g.latest.genre)||0)+1);}
 return {groups,rows,bins,genres:[...genres].sort((a,b)=>b[1]-a[1]),films:groups.filter(g=>g.latest.kind==='movie').length,episodes:groups.filter(g=>g.latest.kind==='episode').length,days:new Set(groups.map(g=>localDate(g.latest.at))).size};
}
