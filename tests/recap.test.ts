import test from 'node:test';import assert from 'node:assert/strict';
import {recapData,comparablePeriods} from '../shared/recap.ts';import type {PlayRecord} from '../shared/contracts.ts';
const group=(id:string,at:string,extra:Partial<PlayRecord>={})=>{const latest:PlayRecord={id,itemKey:id,titleKey:'series',title:'Series',kind:'episode',episode:id,profile:'a',played:true,at:Date.parse(at),genre:'Drama',art:null,positionMs:0,runtimeMs:0,source:'test',...extra};return {latest,records:[latest]};};
test('recap deduplicates ranked episodes across repeated viewing entries',()=>{
 const r=recapData([group('a','2026-10-04T12:00:00Z'),group('b','2026-10-03T12:00:00Z',{itemKey:'a'}),group('c','2026-10-02T12:00:00Z')],'2026');
 assert.equal(r.series[0].episodes.size,2);assert.equal(r.series[0].entries,3);assert.equal(r.longest,3);assert.equal(r.trends[0].total,3);
});
test('recap handles gaps, timezone date boundaries, and separate verified titles',()=>{
 const r=recapData([group('a','2026-10-04T12:00:00Z'),group('b','2026-10-02T12:00:00Z',{titleKey:'other'}),group('c','2026-10-01T02:00:00Z')],'2026');
 assert.equal(r.longest,1);assert.equal(r.titles.length,2);assert.equal(r.trends.length,2);
});
test('empty recap has no streak or ranked series',()=>{const r=recapData([],'2026');assert.equal(r.longest,0);assert.equal(r.busiest,undefined);assert.equal(r.series.length,0);});

test('comparisons require explicit full coverage of both completed periods',()=>{
 assert.equal(comparablePeriods('2026-09','2026-10-16'),null);
 assert.equal(comparablePeriods('2026-09','2026-10-16',{start:'2026-08-01',end:'2026-09-30',complete:true}),'2026-08');
 assert.equal(comparablePeriods('2026-09','2026-10-16',{start:'2026-08-02',end:'2026-09-30',complete:true}),null);
 assert.equal(comparablePeriods('2026-10','2026-10-16',{start:'2026-01-01',end:'2026-12-31',complete:true}),null);
 assert.equal(comparablePeriods('2025','2026-10-16',{start:'2024-01-01',end:'2025-12-31',complete:true}),'2024');
});
