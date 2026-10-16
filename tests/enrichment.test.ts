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
import {fetchPlaystate} from '../server/connectors/aiometadata.ts';
test('metadata enrichment proxies logos and posters without exposing upstream URLs',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async(input)=>new Response(JSON.stringify(String(input).includes('/meta/')?{meta:{genres:['Drama'],logo:'https://image.tmdb.org/t/p/original/logo.png',poster:'https://image.tmdb.org/t/p/original/poster.jpg'}}:{inProgress:[],recentlyPlayed:[{profile:'one',videoId:'tt12345',title:'Film',played:true,updatedAt:10}]}),{headers:{'content-type':'application/json'}});
 try{const result=await fetchPlaystate('https://example.test/playstate/config','key');assert.match(result.plays[0].logo||'',/^\/api\/art\/[a-f0-9]{20}$/);assert.match(result.plays[0].poster||'',/^\/api\/art\/[a-f0-9]{20}$/);assert.equal(result.plays[0].genre,'Drama');const db=new Store(':memory:');db.savePlays(result.plays);db.set('images',result.images);db.pruneEnrichment(Date.now());assert.equal(Object.keys(db.get('images')||{}).length,2);db.close();}finally{globalThis.fetch=original;}
});
test('unwrap clear SVG logos and standard poster fallback without accepting arbitrary origins',()=>{
 assert.equal(artSource('https://aiom.example/poster-cache/logo/https://image.tmdb.org/t/p/original/logo.svg'),'https://image.tmdb.org/t/p/original/logo.svg');
 const fallback='https://aiom.example/poster-cache/poster/https://image.tmdb.org/t/p/original/poster.jpg';
 assert.equal(artSource('https://aiom.example/poster-cache/proxy/poster/series/tt123?url=private&sig=secret&fallback='+encodeURIComponent(fallback)),'https://image.tmdb.org/t/p/original/poster.jpg');
 assert.equal(artSource('https://aiom.example/poster-cache/logo/http://127.0.0.1/secret.svg'),null);
 assert.equal(artSource('https://aiom.example/poster-cache/proxy/poster/series/tt123?fallback='+encodeURIComponent('https://evil.example/x.svg')),null);
});
