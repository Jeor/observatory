export interface Metric<T> {value:T|null;source:string;unit:string;observedAt:number|null;coverageStart:number|null;coverageEnd:number|null;completeness:'partial'|'complete'|'unknown';status:'measured'|'estimated'|'unavailable'}
export interface PlayRecord {id:string;itemKey?:string;titleKey?:string;profile:string;title:string;episode:string|null;kind:'movie'|'episode';positionMs:number;runtimeMs:number;played:boolean;at:number;genre:string;art:string|null;source:string}
export interface TrafficBucket {at:number;bytes:number}
export interface ProviderTotal {name:string;bytes:number}
export interface SourceHealth {name:string;state:'connected'|'disabled'|'stale'|'error';lastSuccess:number|null;message:string}
export interface SessionSample {at:number;positionMs:number;paused:boolean}
export interface DashboardData {timeZone?:string;mode:'demo'|'live';now:number;plays:PlayRecord[];traffic:TrafficBucket[];providers:ProviderTotal[];sources:SourceHealth[];metrics:{downloads:Metric<number>;watchTime:Metric<number>};coverage:string}
