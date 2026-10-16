import test from 'node:test';import assert from 'node:assert/strict';import {groupJournal} from '../shared/journal.ts';import type {PlayRecord} from '../shared/contracts.ts';
const row=(id:string,at:number,extra:Partial<PlayRecord>={}):PlayRecord=>({id,itemKey:'episode-a',at,profile:id,title:'Show',episode:'S1E1',kind:'episode',played:true,positionMs:1,runtimeMs:1,genre:'Drama',art:null,source:'test',...extra});
test('journal groups shared item within window and retains originals',()=>{const records=[row('one',10_000_000),row('two',9_000_000)];const groups=groupJournal(records,30);assert.equal(groups.length,1);assert.equal(groups[0].records.length,2);assert.equal(records.length,2);assert.equal(groupJournal(records,0).length,2);});
test('journal keeps later view, other episode, unknown identity and distinct statuses separate',()=>{assert.equal(groupJournal([row('a',10_000_000),row('b',1),row('c',10_000_000,{itemKey:'episode-b'}),row('d',10_000_000,{itemKey:undefined}),row('e',10_000_000,{played:false})],30).length,5);});
test('time grouping is bounded by newest record, not a chain of close events',()=>{assert.equal(groupJournal([row('a',3600000),row('b',2400000),row('c',1200000)],30).length,2);});

import {journalDays} from '../shared/journal.ts';
test('timeline groups nonconsecutive episodes by verified series within complete days',()=>{
 const groups=groupJournal([row('a',500,{titleKey:'series-a'}),row('b',400,{titleKey:'series-b'}),row('c',300,{titleKey:'series-a',itemKey:'episode-c'}),row('d',100,{titleKey:'series-a'})],0);
 const days=journalDays(groups,at=>at>200?'new':'old');
 assert.equal(days.length,2);assert.equal(days[0].blocks.length,2);
 assert.deepEqual(days[0].blocks[0].map(g=>g.latest.id),['a','c']);
 assert.equal(days.slice(0,1)[0].blocks.flat().length,3);
 assert.equal(days[1].blocks[0][0].latest.id,'d');
});
test('timeline preserves films and episodes without a verified series identity',()=>{
 const groups=groupJournal([row('a',500),row('b',400),row('c',300,{kind:'movie',titleKey:'same'}),row('d',200,{kind:'movie',titleKey:'same'})],0);
 assert.equal(journalDays(groups,()=> 'day')[0].blocks.length,4);
});
