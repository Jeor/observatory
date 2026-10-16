import {demoData,metric} from './demo.ts';import type {Store} from './data/store.ts';import type {DashboardData,SourceHealth,ProviderTotal} from '../shared/contracts.ts';
export function buildData(db:Store,mode:'live'|'demo',now=Date.now()):DashboardData{
 if(mode==='demo')return demoData(now);
 const traffic=db.traffic(),plays=db.plays();
 const sources=['aiom','streams'].map((key,i)=>db.get<SourceHealth>('health:'+key)||{name:i?'AIOStreams':'AIOMetadata',state:'disabled' as const,lastSuccess:null,message:'Not connected. Configure server-side secret files to enable.'});
 return {mode,now,plays,traffic,providers:db.get<ProviderTotal[]>('providers')||[],sources,metrics:{downloads:metric(traffic.length?traffic.reduce((s,p)=>s+p.bytes,0):null,'bytes','AIOStreams upstream NNTP downloads',sources[1].lastSuccess||now,traffic[0]?.at??null),watchTime:metric(null,'seconds','Requires reliable client session identifiers',now,null)},coverage:'Partial history: AIOMetadata recent playstate is limited by the upstream dashboard. Rewatches and full viewing time are not reconstructed. Traffic is recorded independently.'};
}
