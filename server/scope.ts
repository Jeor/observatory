import {opaque} from './data/normalize.ts';
import type {Config} from './config.ts';
import type {Store} from './data/store.ts';
export function enforceScope(db:Store,c:Config){
 for(const [key,url,account] of [['aiom',c.aiom?.url,''],['streams',c.streams?.url,c.streams?.credentials?.username||c.streamsScope||'']]){
  if(!url)continue;
  const scope=opaque(JSON.stringify([url,account]));const previous=db.get<string>('scope-v2:'+key);
  if(previous&&previous!==scope)throw Error('Source account changed: use a separate DATA_DIR.');
  // Reject stored data whose account identity cannot be verified.
  if(!previous&&db.get('scope:'+key))throw Error('Unverified database account: use a new DATA_DIR.');
  db.set('scope-v2:'+key,scope);
 }
}
