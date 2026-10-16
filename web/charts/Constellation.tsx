import {Artwork} from '../components/Artwork';
import {formatDate,duration} from '../../shared/filters';
import {genreColor} from '../genreColor';
import {useGrouping} from '../useGrouping';
import {GalaxySphere,ClearLogo} from './GalaxySphere';
import {useMemo,useState} from 'react';
import type {PlayRecord} from '../../shared/contracts';
import {groupJournal} from '../../shared/journal';



export function Constellation({records}:{records:PlayRecord[];onSelect:(r:PlayRecord)=>void}){
 const [windowMinutes]=useGrouping();
 const [resetVersion,setResetVersion]=useState(0);
 const [breakdown,setBreakdown]=useState(false),[selected,setSelected]=useState<string|null>(null),[titleId,setTitleId]=useState<string|null>(null);
 const [pinned,setPinned]=useState(false);const [panel,setPanel]=useState(false);const [recordId,setRecordId]=useState<string|null>(null);
 const galaxies=useMemo(()=>{
  const groups=groupJournal(records.filter(r=>r.played),windowMinutes);
  const byTitle=new Map<string,typeof groups>();
  for(const g of groups){const key=g.latest.titleKey||JSON.stringify([g.latest.kind,g.latest.title]);byTitle.set(key,[...(byTitle.get(key)||[]),g]);}
  const genres=new Map<string,{id:string;title:string;groups:typeof groups;latest:PlayRecord}[]>();
  for(const [id,entries] of byTitle){const latest=entries[0].latest;const genre=latest.genre||'Unclassified';genres.set(genre,[...(genres.get(genre)||[]),{id,title:latest.title,groups:entries,latest}]);}
  return [...genres].map(([name,titles])=>({name,titles,count:titles.reduce((n,t)=>n+t.groups.length,0)})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)).map(g=>({...g,color:genreColor(g.name)}));
 },[records,windowMinutes]);
 const total=galaxies.reduce((n,g)=>n+g.count,0);const active=galaxies.find(g=>g.name===selected)||galaxies[0];
 const choose=(name:string)=>{setSelected(name);setTitleId(null);setRecordId(null);setPinned(true);setPanel(true);};
 const selectTitle=(genre:string,id:string)=>{setSelected(genre);setTitleId(id);setRecordId(null);setPinned(true);setPanel(true);};
 const title=active?.titles.find(t=>t.id===titleId);
 const detail=title?.groups.flatMap(g=>g.records).find(r=>r.id===recordId)||title?.latest;
 const closePanel=()=>{setPanel(false);setPinned(false);setTitleId(null);setRecordId(null);};

 const content=<section className="constellation galaxy-section constellation-page"><div className="section-heading"><h1>Constellation</h1></div><div className="galaxy-toolbar"><p className="galaxy-summary"><strong>{galaxies.length}</strong> genres <span>·</span> <strong>{total}</strong> entries</p><div className="galaxy-actions"><button className="text-button" aria-label={breakdown?'Show genre galaxies':'Show genre breakdown'} onClick={()=>setBreakdown(!breakdown)}>{breakdown?'Galaxies':'Breakdown'}</button>{!breakdown&&<button className="text-button" onClick={()=>{closePanel();setSelected(null);setResetVersion(n=>n+1);}}>Return to overview</button>}</div></div>
 {!total?<p className="empty small">No recorded watched entries for this profile and date range.</p>:<div className={`constellation-workspace ${panel?'has-detail-panel':''}`}><div className="constellation-stage">
 {breakdown?<div className="galaxy-breakdown" aria-label="Genre breakdown">{galaxies.map(g=><button key={g.name} aria-pressed={active?.name===g.name} onClick={()=>choose(g.name)}><span className="galaxy-bar-label"><span><i style={{background:g.color}}/>{g.name}</span><strong>{g.count} <small>· {Math.round(g.count/total*100)}%</small></strong></span><span className="galaxy-bar-track"><i style={{width:`${g.count/total*100}%`,background:g.color}}/></span><small>{g.titles.length} {g.titles.length===1?'title':'titles'}</small></button>)}</div>:
 <GalaxySphere detailOpen={panel} resetVersion={resetVersion} galaxies={galaxies} selected={active?.name} selectedTitle={titleId||undefined} onGenre={choose} onPreview={(genre,id)=>{if(!pinned){setSelected(genre);setTitleId(id);}}} onTitle={selectTitle}/>}
 </div>
 {panel&&active&&<aside className="sky-detail-panel" aria-label={title?`${title.title} details`:`${active.name} titles`}>
 <header className="sky-panel-header"><button className="text-button" onClick={()=>choose(active.name)}>{active.name}{title?' / All titles':''}</button><button className="text-button" aria-label="Close constellation details" onClick={closePanel}>×</button></header>
 {title&&detail?<>
 <div className="sky-title-intro"><Artwork record={{...title.latest,art:title.latest.poster||title.latest.art}}/><div><div className="sky-detail-logo"><ClearLogo record={title.latest}/></div><h2 className={title.latest.logo?'sr-only':'sky-fallback-heading'}>{title.title}</h2><p>{detail.kind==='movie'?'Film':'Series'} · {active.name}</p><span>{title.groups.length} {title.groups.length===1?'viewing entry':'viewing entries'}</span></div></div>
 <div className="sky-record-detail"><h3>{detail.episode||'Latest viewing'}</h3><p>{detail.profile} · {formatDate(detail.at)}</p><div className="sky-position"><span>Saved position</span><span>{duration(detail.positionMs)} / {detail.runtimeMs?duration(detail.runtimeMs):'—'}</span></div>{detail.runtimeMs>0&&<progress aria-label="Saved playback position" max={detail.runtimeMs} value={Math.min(detail.positionMs,detail.runtimeMs)}/>}<small>{detail.played?'Recorded watched':'In progress'}</small></div>
 <div className="sky-panel-entries"><h3>{detail.kind==='movie'?'Viewing history':'Episodes'}</h3>{title.groups.map(g=><button key={g.latest.id} aria-pressed={detail.id===g.latest.id} onClick={()=>setRecordId(g.latest.id)}><Artwork record={g.latest}/><span><strong>{g.latest.episode||formatDate(g.latest.at)}</strong><small>{[...new Set(g.records.map(r=>r.profile))].join(' & ')} · {formatDate(g.latest.at)}</small></span></button>)}</div>
 </>:<><div className="sky-genre-heading"><h2>{active.name}</h2><p>{active.titles.length} titles · {active.count} entries</p></div><div className="sky-genre-list">{active.titles.map(t=><button key={t.id} onClick={()=>selectTitle(active.name,t.id)}><Artwork record={{...t.latest,art:t.latest.poster||t.latest.art}}/><span><strong>{t.title}</strong><small>{t.groups.length} {t.groups.length===1?'entry':'entries'} · {formatDate(t.latest.at)}</small></span><span aria-hidden="true">↗</span></button>)}</div></>}
 </aside>}
 </div>}
 </section>;
 return content;
}
