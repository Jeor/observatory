import {DatabaseSync} from 'node:sqlite';
import type {PlayRecord,TrafficBucket} from '../../shared/contracts.ts';
export class Store {
 db:DatabaseSync;
 constructor(path:string){this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS plays(id TEXT PRIMARY KEY,at INTEGER NOT NULL,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS traffic(at INTEGER PRIMARY KEY,bytes REAL NOT NULL CHECK(bytes>=0)); CREATE TABLE IF NOT EXISTS state(key TEXT PRIMARY KEY,payload TEXT NOT NULL);');}
 savePlays(rows:PlayRecord[]){const s=this.db.prepare('INSERT INTO plays VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET at=excluded.at,payload=excluded.payload WHERE excluded.at>=plays.at');this.db.exec('BEGIN');try{for(const r of rows)s.run(r.id,r.at,JSON.stringify(r));this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}}
 reconcileAliases(aliases:Record<string,string>){
  this.db.exec('BEGIN');try{for(const [oldId,newId] of Object.entries(aliases)){if(oldId===newId)continue;const old=this.db.prepare('SELECT payload FROM plays WHERE id=?').get(oldId);if(!old)continue;const row=JSON.parse(String(old.payload));row.id=newId;this.db.prepare('INSERT INTO plays VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET at=excluded.at,payload=excluded.payload WHERE excluded.at>plays.at').run(newId,row.at,JSON.stringify(row));this.db.prepare('DELETE FROM plays WHERE id=?').run(oldId);}this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 plays():PlayRecord[]{return this.db.prepare('SELECT payload FROM plays ORDER BY at DESC').all().map(r=>JSON.parse(String(r.payload)));}
 saveTraffic(rows:TrafficBucket[]){const s=this.db.prepare('INSERT INTO traffic VALUES(?,?) ON CONFLICT(at) DO UPDATE SET bytes=excluded.bytes');this.db.exec('BEGIN');try{for(const r of rows){if(!Number.isFinite(r.at)||!Number.isFinite(r.bytes)||r.bytes<0)throw Error('Invalid traffic');s.run(r.at,r.bytes);}this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}}
 traffic():TrafficBucket[]{return this.db.prepare('SELECT at,bytes FROM traffic ORDER BY at').all() as unknown as TrafficBucket[];}
 set(key:string,value:unknown){this.db.prepare('INSERT INTO state VALUES(?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload').run(key,JSON.stringify(value));}
 get<T>(key:string):T|null{const r=this.db.prepare('SELECT payload FROM state WHERE key=?').get(key);return r?JSON.parse(String(r.payload)):null;}
 cleanup(now:number){this.db.prepare('DELETE FROM plays WHERE at<?').run(now-400*86400000);this.db.prepare('DELETE FROM traffic WHERE at<?').run(now-365*86400000);this.pruneEnrichment(now);}
 pruneEnrichment(now:number){const used=new Set(this.plays().flatMap(p=>[p.art,p.logo,p.poster].map(url=>url?.split('/').pop())).filter(Boolean));const images=this.get<Record<string,string>>('images')||{};this.set('images',Object.fromEntries(Object.entries(images).filter(([id])=>used.has(id))));const genres=this.get<Record<string,{at:number;genres:string[]}>>('genre-cache')||{};this.set('genre-cache',Object.fromEntries(Object.entries(genres).filter(([,v])=>v.at>=now-7*86400000).sort((a,b)=>b[1].at-a[1].at).slice(0,10000)));}
 close(){this.db.close();}
}
