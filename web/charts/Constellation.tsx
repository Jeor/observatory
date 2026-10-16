import {genreColor} from '../genreColor';
import {useGrouping} from '../useGrouping';
import {GalaxySphere} from './GalaxySphere';
import {useMemo,useState,useRef,useEffect} from 'react';
import type {PlayRecord} from '../../shared/contracts';
import {groupJournal} from '../../shared/journal';
import {formatDate} from '../../shared/filters';
import {Artwork} from '../components/Artwork';

export function Constellation({records,onSelect}:{records:PlayRecord[];onSelect:(r:PlayRecord)=>void}){
 const [windowMinutes]=useGrouping();const [expanded,setExpanded]=useState(false);const dialog=useRef<HTMLDialogElement>(null);const expandButton=useRef<HTMLButtonElement>(null);const wasExpanded=useRef(false);useEffect(()=>{if(expanded)dialog.current?.showModal();else if(wasExpanded.current)expandButton.current?.focus();wasExpanded.current=expanded;},[expanded]);
 const [resetVersion,setResetVersion]=useState(0);
 const [breakdown,setBreakdown]=useState(false),[selected,setSelected]=useState<string|null>(null),[titleId,setTitleId]=useState<string|null>(null);
 const galaxies=useMemo(()=>{
  const groups=groupJournal(records.filter(r=>r.played),windowMinutes);
  const byTitle=new Map<string,typeof groups>();
  for(const g of groups){const key=g.latest.titleKey||JSON.stringify([g.latest.kind,g.latest.title]);byTitle.set(key,[...(byTitle.get(key)||[]),g]);}
  const genres=new Map<string,{id:string;title:string;groups:typeof groups;latest:PlayRecord}[]>();
  for(const [id,entries] of byTitle){const latest=entries[0].latest;const genre=latest.genre||'Unclassified';genres.set(genre,[...(genres.get(genre)||[]),{id,title:latest.title,groups:entries,latest}]);}
  return [...genres].map(([name,titles])=>({name,titles,count:titles.reduce((n,t)=>n+t.groups.length,0)})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)).map(g=>({...g,color:genreColor(g.name)}));
 },[records,windowMinutes]);
 const total=galaxies.reduce((n,g)=>n+g.count,0);const active=galaxies.find(g=>g.name===selected)||galaxies[0];const title=active?.titles.find(t=>t.id===titleId);
 const choose=(name:string)=>{setSelected(name);setTitleId(null);};

 const content=<section className="constellation galaxy-section"><div className="section-heading"><h2>Viewing constellation</h2><button ref={expandButton} className="text-button" onClick={()=>setExpanded(!expanded)}>{expanded?'Close':'Expand'}</button></div><div className="galaxy-toolbar"><p className="galaxy-summary"><strong>{galaxies.length}</strong> genres <span>·</span> <strong>{total}</strong> entries</p><div className="galaxy-actions"><button className="text-button" aria-label={breakdown?'Show genre galaxies':'Show genre breakdown'} onClick={()=>setBreakdown(!breakdown)}>{breakdown?'Galaxies':'Breakdown'}</button>{!breakdown&&<button className="text-button" onClick={()=>setResetVersion(n=>n+1)}>Reset view</button>}</div></div>
 {!total?<p className="empty small">No recorded watched entries for this profile and date range.</p>:<>
 {breakdown?<div className="galaxy-breakdown" aria-label="Genre breakdown">{galaxies.map(g=><button key={g.name} aria-pressed={active?.name===g.name} onClick={()=>choose(g.name)}><span className="galaxy-bar-label"><span><i style={{background:g.color}}/>{g.name}</span><strong>{g.count} <small>· {Math.round(g.count/total*100)}%</small></strong></span><span className="galaxy-bar-track"><i style={{width:`${g.count/total*100}%`,background:g.color}}/></span><small>{g.titles.length} {g.titles.length===1?'title':'titles'}</small></button>)}</div>:
 <GalaxySphere resetVersion={resetVersion} galaxies={galaxies} selected={active?.name} selectedTitle={titleId||undefined} onGenre={choose} onTitle={(genre,id)=>{setSelected(genre);setTitleId(id);}}/>}
 {active&&<div className="galaxy-inspector"><div className="galaxy-inspector-heading"><div><span className="micro">{title?'Selected title':'Selected genre'}</span><h3 style={{color:active.color}}>{title?.title||active.name}</h3></div>{title?<button className="text-button" onClick={()=>setTitleId(null)}>All titles</button>:<span>{active.count} entries · {active.titles.length} titles</span>}</div>
 <div className="galaxy-title-list">{title?title.groups.flatMap(g=>g.records).map(r=><button key={r.id} onClick={()=>onSelect(r)}><span>{r.episode||'Film'}<small>{r.profile} · {formatDate(r.at)}</small></span><span aria-hidden="true">↗</span></button>):active.titles.map(t=><button key={t.id} onClick={()=>setTitleId(t.id)}><Artwork record={t.latest}/><span>{t.title}<small>{t.groups.length} grouped {t.groups.length===1?'entry':'entries'}</small></span><span aria-hidden="true">↗</span></button>)}</div></div>}
 </>}
 </section>;
 return expanded?<dialog aria-label="Expanded viewing constellation" className="galaxy-dialog" ref={dialog} onCancel={()=>setExpanded(false)} onClick={e=>{if(e.target===e.currentTarget)setExpanded(false);}}>{content}</dialog>:content;
}
