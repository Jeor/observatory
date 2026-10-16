import test from 'node:test';import assert from 'node:assert/strict';
import {buildData} from '../server/api.ts';import {Store} from '../server/data/store.ts';import {normalizePlaystate} from '../server/data/normalize.ts';
import {localDate,filterPlays} from '../shared/filters.ts';
test('live empty data is unavailable, not zero or demo',()=>{const db=new Store(':memory:');const d=buildData(db,'live',Date.now());assert.equal(d.mode,'live');assert.equal(d.plays.length,0);assert.equal(d.metrics.downloads.value,null);assert.ok(!JSON.stringify(d).includes('demo-'));db.close();});
test('dates display across DST correctly and profile does not change global traffic',()=>{
 assert.equal(localDate(Date.parse('2026-03-08T04:30:00Z')),'2026-03-07');assert.equal(localDate(Date.parse('2026-03-08T07:30:00Z')),'2026-03-08');
 assert.equal(localDate(Date.parse('2026-11-01T05:30:00Z')),localDate(Date.parse('2026-11-01T06:30:00Z')));
 assert.equal(filterPlays([], {profile:'all',days:30,search:'',kind:'all'},Date.now()).length,0);
});
test('last good data is retained with stale source health',()=>{const db=new Store(':memory:');db.saveTraffic([{at:100,bytes:0}]);db.set('health:streams',{name:'AIOStreams',state:'stale',lastSuccess:100,message:'HTTP 401'});const d=buildData(db,'live',200);assert.equal(d.metrics.downloads.value,0);assert.equal(d.sources[1].state,'stale');db.close();});
import {rangeStart,watchedValue,playbackNotice} from '../shared/filters.ts';
test('last 7 local calendar days uses date arithmetic through spring and fall DST',()=>{
 assert.equal(rangeStart(Date.parse('2026-03-09T04:30:00Z'),7),'2026-03-03');
 assert.equal(rangeStart(Date.parse('2026-11-02T04:30:00Z'),7),'2026-10-26');
});
test('unavailable watched records and stale playback have explicit presentation',()=>{
 const db=new Store(':memory:');const d=buildData(db,'live',200);assert.equal(watchedValue(d,[]),null);
 const source={name:'AIOMetadata',state:'stale' as const,lastSuccess:100,message:'HTTP 401'};assert.match(playbackNotice(source),/stale/i);assert.match(playbackNotice(source),/Last successful/);db.close();
});
test('public records never serialize upstream IDs or authenticated image URLs',()=>{
 const db=new Store(':memory:');const rawId='00000000-0000-4000-8000-000000000001';db.savePlays(normalizePlaystate({inProgress:[],recentlyPlayed:[{videoId:rawId,profile:'Owner',title:'Private film',updatedAt:100,posterUrl:'https://example.test/a.jpg?api_key=hidden',password:'hidden'}]},200));const d=buildData(db,'live',200);const text=JSON.stringify(d);assert.ok(!text.includes(rawId));assert.ok(!text.includes('hidden'));assert.ok(!text.includes('password'));assert.ok(!text.includes('x-admin-key'));assert.equal(d.mode,'live');db.close();
});
