import {opaque} from './data/normalize.ts';
import type {Config} from './config.ts';
import type {Store} from './data/store.ts';
export function enforceScope(db:Store,c:Config){
 for(const [key,url,account] of [['aiom',c.aiom?.url,''],['streams',c.streams?.url,c.streams?.credentials?.username||c.streamsScope||'']]){
  if(!url)continue;
  const scope=opaque(JSON.stringify([url,account]));const previous=db.get<string>('scope-v2:'+key);
  if(previous&&previous!==scope)throw Error('Source account changed: use a separate DATA_DIR.');
  // Legacy databases never recorded account identity. Never silently adopt them.
  if(!previous&&db.get('scope:'+key)&&process.env.OBSERVATORY_ADOPT_LEGACY_SCOPE!=='true')throw Error('Legacy database: confirm its account with OBSERVATORY_ADOPT_LEGACY_SCOPE=true once, or use a new DATA_DIR.');
  db.set('scope-v2:'+key,scope);
 }
}
