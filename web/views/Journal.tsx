import {JournalDrawer} from '../components/JournalDrawer';
import type {JournalGroup} from '../../shared/journal';
import {timeZone} from '../../shared/timezone';
import {useGrouping} from '../useGrouping';
import {groupJournal,journalDays} from '../../shared/journal';
import {useState,useEffect,Fragment} from 'react';
import type {PlayRecord} from '../../shared/contracts';
import {Artwork} from '../components/Artwork';
import {formatDate,localDate} from '../../shared/filters';
const savedJournal=()=>{try{return JSON.parse(sessionStorage.getItem('observatory.journal')||'{}');}catch{return {};}};
export function Journal({records,onSelect,compact=false,onViewAll}:{records:PlayRecord[];onSelect:(r:PlayRecord)=>void;compact?:boolean;onViewAll?:()=>void}){
 const [drawer,setDrawer]=useState<JournalGroup[]|null>(null),[saved]=useState(savedJournal);
 const [search,setSearch]=useState<string>(compact?'':saved.search||'');
 const [kind,setKind]=useState<string>(compact?'all':saved.kind||'all');
 const [status,setStatus]=useState<string>(compact?'all':saved.status||'all');
 const [layout,setLayout]=useState<string>(compact?'grid':saved.layout||'grid');
 const [visibleDays,setVisibleDays]=useState<number>(compact?3:saved.visibleDays||3);
 const [filtersOpen,setFiltersOpen]=useState(false);const [windowMinutes]=useGrouping();
 useEffect(()=>{if(!compact)try{sessionStorage.setItem('observatory.journal',JSON.stringify({search,kind,status,layout,visibleDays}));}catch{}},[search,kind,status,layout,visibleDays,compact]);
 const changeFilter=(set:(v:string)=>void,value:string)=>{set(value);setVisibleDays(3);};
 const filtered=records.filter(r=>(!compact||r.played)&&`${r.title} ${r.episode||''}`.toLowerCase().includes(search.toLowerCase())&&(kind==='all'||r.kind===kind)&&(status==='all'||r.played===(status==='watched')));
 const rows=groupJournal(filtered,windowMinutes);
 const days=compact?rows.slice(0,2).map(g=>({day:localDate(g.latest.at),blocks:[[g]]})):journalDays(rows,localDate);
 const shown=compact?days:days.slice(0,visibleDays);
 const clear=()=>{setSearch('');setKind('all');setStatus('all');setVisibleDays(3);};
 const entry=(groups:JournalGroup[])=>{
  const r=groups[0].latest,profiles=[...new Set(groups.flatMap(g=>g.records.map(p=>p.profile)))];
  const multiple=groups.length>1||groups[0].records.length>1;
  const watched=groups.every(g=>g.latest.played),progress=groups.every(g=>!g.latest.played);
  return <div className="journal-entry" key={r.id}><button className="journal-card" onClick={()=>multiple?setDrawer(groups):onSelect(r)} aria-label={`${r.title}, ${groups.length>1?`${groups.length} episodes`:r.episode||'Film'}, ${profiles.join(', ')}. ${multiple?'Open viewing activity':'Open latest record'}.`}>
   <Artwork record={r}/><div className="card-copy"><h3>{r.title}</h3>
   <span>{compact?`${formatDate(r.at)} · `:''}{profiles.join(' & ')}</span>
   <small>{groups.length>1?`${groups.length} episode entries`:r.episode||'Film'}</small>
   <span className={`journal-status ${watched?'is-watched':''}`}>{watched?'Recorded watched':progress?'In progress':'Watched & in progress'}</span>
   {multiple&&<small className="journal-activity-hint">{groups.length>1?'View episodes':'View activity'} <span aria-hidden="true">↗</span></small>}
   </div></button></div>;
 };
 return <section className={`journal ${compact?'compact':'journal-timeline'}`}>
 <div className="section-heading">{compact?<h2>Viewing journal</h2>:<h1>Viewing journal</h1>}{compact?<button className="text-button" onClick={onViewAll}>View all ↗</button>:<span className="micro">{rows.length} journal entries</span>}</div>
 {!compact&&<><div className="journal-toolbar">
  <label className="journal-search"><span className="sr-only">Search titles or episodes</span><input type="search" placeholder="Search titles or episodes…" value={search} onChange={e=>changeFilter(setSearch,e.target.value)}/></label>
  <button className="journal-filter-toggle" aria-expanded={filtersOpen} aria-controls="journal-filters" onClick={()=>setFiltersOpen(v=>!v)}>Filter{kind!=='all'||status!=='all'?' · active':''}</button>
  <div className="journal-layout-toggle" role="group" aria-label="Journal layout"><button aria-label="Artwork grid" title="Artwork grid" aria-pressed={layout==='grid'} onClick={()=>setLayout('grid')}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z"/></svg></button><button aria-label="Chronological list" title="Chronological list" aria-pressed={layout==='list'} onClick={()=>setLayout('list')}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4h3v3H3zM3 12h3v3H3zM9 5.5h8M9 13.5h8"/></svg></button></div>
 </div>{filtersOpen&&<div className="journal-filter-panel" id="journal-filters"><label>Type<select value={kind} onChange={e=>changeFilter(setKind,e.target.value)}><option value="all">Films & episodes</option><option value="movie">Films</option><option value="episode">Episodes</option></select></label><label>Status<select value={status} onChange={e=>changeFilter(setStatus,e.target.value)}><option value="all">All records</option><option value="watched">Recorded watched</option><option value="progress">In progress</option></select></label>{(kind!=='all'||status!=='all'||search)&&<button className="text-button" onClick={clear}>Clear filters</button>}</div>}</>}
 {shown.length?<div className={`journal-grid ${layout==='list'&&!compact?'list':''}`}>{shown.map((day,index)=><Fragment key={`${day.day}-${index}`}>
 {!compact&&<h2 className="journal-date">{formatDate(day.blocks[0][0].latest.at)}<span>{new Date(day.blocks[0][0].latest.at).toLocaleDateString('en-US',{timeZone:timeZone(),weekday:'long'})}</span><small>{day.blocks.length} {day.blocks.length===1?'item':'items'}</small></h2>}
 {day.blocks.map(entry)}</Fragment>)}</div>:<div className="empty">No records match these filters.<button className="text-button" onClick={clear}>Clear filters</button></div>}
 {!compact&&days.length>visibleDays&&<div className="journal-load-more"><button className="load-more" onClick={()=>setVisibleDays(n=>n+3)}>Load more <span>· {days.length-visibleDays} earlier {days.length-visibleDays===1?'day':'days'}</span></button></div>}
 {drawer&&<JournalDrawer groups={drawer} onClose={()=>setDrawer(null)} onSelect={onSelect}/>}</section>;
}
