import test from 'node:test';import assert from 'node:assert/strict';
import {artSource,canonicalVideoId} from '../server/connectors/enrichment.ts';
test('unwrap cached background only when nested source is allowed',()=>{
 assert.equal(artSource('https://example.test/poster-cache/background/https://image.tmdb.org/t/p/original/x.jpg'),'https://image.tmdb.org/t/p/original/x.jpg');
 assert.equal(artSource('https://example.test/poster-cache/background/http://127.0.0.1/x.jpg'),null);
});
test('explicit artwork identity maps provider aliases without merging episodes',()=>{
 const posterUrl='https://example.test/poster-cache/proxy/poster/series/tt12345?private=value';
 assert.equal(canonicalVideoId({videoId:'tvdb:123:2:4',episode:'S2E4',posterUrl}),'tt12345:2:4');
 assert.notEqual(canonicalVideoId({videoId:'tvdb:123:2:5',episode:'S2E5',posterUrl}),'tt12345:2:4');
 assert.equal(canonicalVideoId({videoId:'tvdb:123',episode:'Unknown',posterUrl}),'tvdb:123');
});
import {Store} from '../server/data/store.ts';
import {normalizePlaystate} from '../server/data/normalize.ts';
test('stored alias reconciliation retains latest progress and preserves other profiles',()=>{
 const s=new Store(':memory:');const base={profile:'one',videoId:'tvdb:123:2:4',title:'Show',episode:'S2E4',updatedAt:10,positionMs:500};
 const old=normalizePlaystate({inProgress:[base,{...base,profile:'two'}],recentlyPlayed:[]},10);s.savePlays(old);
 const fresh=normalizePlaystate({inProgress:[{...base,canonicalId:'tt12345:2:4',updatedAt:20,positionMs:800}],recentlyPlayed:[]},20);
 s.reconcileAliases({[old[0].id]:fresh[0].id});s.savePlays(fresh);assert.equal(s.plays().length,2);assert.equal(s.plays().find(r=>r.profile==='one')?.positionMs,800);s.close();
});
