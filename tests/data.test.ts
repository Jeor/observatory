import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateInterval, normalizePlaystate } from '../server/data/normalize.ts';
import { Store } from '../server/data/store.ts';
test('fresh playback intervals are bounded and pause/seek/gaps rejected',()=>{
 const a={at:100000,positionMs:30000,paused:false};
 assert.equal(estimateInterval(a,{...a,at:115000,positionMs:45000}),15);
 for(const b of [{...a,at:115000,paused:true},{...a,at:200000},{...a,at:115000,positionMs:200000},{...a,at:115000,positionMs:0}]) assert.equal(estimateInterval(a,b),null);
});
test('same records and traffic buckets upsert without doubling, distinct episodes stay distinct',()=>{
 const db=new Store(':memory:');
 const input={inProgress:[],recentlyPlayed:[{profile:'Main',videoId:'tt1:1:1',title:'Test',episode:'S1E1',played:true,positionMs:0,runtimeMs:100,updatedAt:100000},{profile:'Main',videoId:'tt1:1:2',title:'Test',episode:'S1E2',played:true,positionMs:0,runtimeMs:100,updatedAt:100000}]};
 const rows=normalizePlaystate(input,100000);
 db.savePlays(rows);db.savePlays(rows);assert.equal(db.plays().length,2);
 db.saveTraffic([{at:100000,bytes:23}]);db.saveTraffic([{at:100000,bytes:25}]); assert.equal(db.traffic()[0].bytes,25);assert.equal(db.traffic().length,1);db.close();
});
test('upstream duplicate aliases supplied with canonical ID merge, unknown titles never fuzzy-merge',()=>{
 const rows=normalizePlaystate({inProgress:[],recentlyPlayed:[{profile:'A',videoId:'tt1',canonicalId:'tt1',title:'Same',updatedAt:10},{profile:'A',videoId:'tmdb:1',canonicalId:'tt1',title:'Same',updatedAt:20},{profile:'A',videoId:'tt2',title:'Same',updatedAt:30}]},40);
 assert.equal(rows.length,2);assert.equal(rows[0].id.includes('tt1'),false);
});
test('explicit shared-history profiles merge, independent profiles stay separate',()=>{
 const row={videoId:'ttshared',title:'Shared film',updatedAt:100,played:true};
 const payload={profiles:[{name:'Main',sharedWith:['Alex']}],inProgress:[],recentlyPlayed:[{...row,profile:'Main'},{...row,profile:'Alex'},{...row,profile:'Independent'}]};
 assert.equal(normalizePlaystate(payload,100).length,2);
});
