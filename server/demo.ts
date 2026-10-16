import type {DashboardData,Metric,PlayRecord} from '../shared/contracts.ts';
export const DAY=86400000;
export function metric(value:number|null,unit:string,source:string,now:number,start:number|null):Metric<number>{return {value,unit,source,observedAt:value===null?null:now,coverageStart:start,coverageEnd:value===null?null:now,completeness:'partial',status:value===null?'unavailable':'measured'};}
export function demoData(now=Date.now()):DashboardData {
 const titles=['Evening screening','The Salt Between','A Quieter Sky','The Last Bell','North of Somewhere','The Glass Orchard','A Slow Departure','Blue Meridian','The Shape of Rain','Still Water','The Long Way Home','Silent Satellites','After the Tide'];
 const genres=['Adventure','Drama','Science fiction','Drama','Adventure'];
 const plays:PlayRecord[]=titles.map((title,i)=>({id:'demo-'+i,profile:i%3===0?'Alex':'Sam',title,episode:i===5?'S1E3 · The orchard':null,kind:i===5?'episode':'movie',positionMs:i===0?1697000:0,runtimeMs:i===0?7560000:6200000+i*60000,played:i!==0,at:now-(i===0?120000:(i*2-1)*DAY),genre:genres[i%5],art:i===0?'/art/evening.svg':'tile-'+((i-1)%4),source:'Fictional demo playstate'}));
 const end=Math.floor(now/3600000)*3600000;
 const traffic=Array.from({length:30*24},(_,i)=>({at:end-(30*24-1-i)*3600000,bytes:Math.round((0.15+Math.pow(Math.sin(i*.167),6)*1.4+Math.pow(Math.cos(i*.039),8)*.7)*1e9)}));
 return {mode:'demo',now,plays,traffic,providers:[{name:'Primary provider',bytes:traffic.slice(-168).reduce((s,p)=>s+p.bytes,0)*.75},{name:'Backup provider',bytes:traffic.slice(-168).reduce((s,p)=>s+p.bytes,0)*.25}],sources:[{name:'AIOMetadata',state:'disabled',lastSuccess:null,message:'Demo fixture. No private service connected.'},{name:'AIOStreams',state:'disabled',lastSuccess:null,message:'Demo fixture. No private service connected.'}],metrics:{downloads:metric(traffic.reduce((s,p)=>s+p.bytes,0),'bytes','Demo provider downloads',now,traffic[0].at),watchTime:metric(null,'seconds','No verified viewing intervals',now,null)},coverage:'Illustrative 30-day dataset. Fictional titles and profiles; no private activity.'};
}
