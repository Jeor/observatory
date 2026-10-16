import type {PlayRecord} from './contracts.ts';
export interface JournalGroup {latest:PlayRecord;records:PlayRecord[]}
export function groupJournal(records:PlayRecord[],minutes:number):JournalGroup[]{
 const groups:JournalGroup[]=[];const latestByItem=new Map<string,JournalGroup>();
 for(const r of [...records].sort((a,b)=>b.at-a.at)){
  // Without a verified identity, preserve separate records rather than guessing by title.
  const key=JSON.stringify([r.itemKey||r.id,r.kind,r.played]);
  const existing=latestByItem.get(key);
  if(minutes>0&&existing&&existing.latest.at-r.at<=minutes*60000)existing.records.push(r);
  else{const group={latest:r,records:[r]};groups.push(group);latestByItem.set(key,group);}
 }
 return groups;
}

export interface JournalDay {day:string;blocks:JournalGroup[][]}
// Group verified series across the entire day before deciding how much to display.
export function journalDays(groups:JournalGroup[],dateKey:(at:number)=>string):JournalDay[]{
 const days=new Map<string,JournalDay>();const series=new Map<string,JournalGroup[]>();
 for(const group of groups){
  const r=group.latest,day=dateKey(r.at);let bucket=days.get(day);
  if(!bucket){bucket={day,blocks:[]};days.set(day,bucket);}
  const key=r.kind==='episode'&&r.titleKey?JSON.stringify([day,r.titleKey]):null;
  const existing=key?series.get(key):undefined;
  if(existing)existing.push(group);
  else{const block=[group];bucket.blocks.push(block);if(key)series.set(key,block);}
 }
 return [...days.values()];
}
