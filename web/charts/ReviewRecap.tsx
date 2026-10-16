import {useMemo} from 'react';
import {recapData} from '../../shared/recap';
import type {JournalGroup} from '../../shared/journal';
import type {PlayRecord} from '../../shared/contracts';
import {Artwork} from '../components/Artwork';
import {ArtworkReel} from '../components/ArtworkReel';
export function ReviewRecap({groups,period,onSelect,onGenre,onDay,onWeekday,onStreak,onSeries}:{groups:JournalGroup[];period:string;onSelect:(r:PlayRecord)=>void;onGenre:(g:string)=>void;onDay:(day:string)=>void;onWeekday:(day:number)=>void;onStreak:(start:string,end:string)=>void;onSeries:(r:PlayRecord)=>void}){
 const recap=useMemo(()=>recapData(groups,period),[groups,period]);if(!groups.length)return null;
 const year=period.length===4;
 const dateLabel=(day:string)=>new Date(day+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});

 return <section className="review-recap" aria-label="Viewing recap">
 {year&&<><div className="recap-art-heading"><h2>Your {year?'year':'month'} in artwork</h2><span>{recap.titles.length} recorded titles</span></div>
 <ArtworkReel records={recap.titles.map(t=>t.record)} onSelect={onSelect}/>
 {recap.series[0]&&<p className="recap-standout">Your most-watched series was <button onClick={()=>onSeries(recap.series[0].record)}>{recap.series[0].record.title}</button><span>{recap.series[0].episodes.size} distinct episodes recorded</span></p>}</>}
 <div className="recap-milestones" aria-label="Viewing milestones"><button onClick={()=>onStreak(new Date(Date.parse(recap.end+'T12:00:00Z')-(recap.longest-1)*86400000).toISOString().slice(0,10),recap.end)}><strong>{recap.longest}<small> {recap.longest===1?'day':'days'}</small></strong><span>Longest recorded streak</span><small>Through {dateLabel(recap.end)}</small></button><button onClick={()=>onWeekday(recap.topWeekday)}><strong>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][recap.topWeekday]}</strong><span>Most active weekday</span></button><button onClick={()=>recap.busiest&&onDay(recap.busiest[0])}><strong>{recap.busiest?dateLabel(recap.busiest[0]):'—'}</strong><span>Busiest recorded day</span><small>{recap.busiest?.[1]} entries</small></button></div>
 <div className="recap-patterns">{recap.series.length>0&&<section><h2>Most-watched series</h2><div className="recap-series">{recap.series.map((t,i)=><button key={t.record.id} onClick={()=>onSeries(t.record)}><span className="recap-rank">{String(i+1).padStart(2,'0')}</span><Artwork record={{...t.record,art:t.record.poster||t.record.art}}/><span className="recap-series-title">{t.record.title}</span><span className="recap-series-count">{t.episodes.size}<small>episodes</small></span></button>)}</div></section>}
 </div>
 </section>;
}
