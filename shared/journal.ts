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
