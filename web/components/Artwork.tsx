import {skyIdentity} from './AmbientSky';
import {useState} from 'react';
import type {PlayRecord} from '../../shared/contracts';
export function Artwork({record,className='',alternatives=[]}:{record:PlayRecord;className?:string;alternatives?:(string|null)[]}){
 const [failed,setFailed]=useState<string[]>([]);
 const source=[record.art,...alternatives].find((url):url is string=>!!url&&!failed.includes(url));
 const tile=source?.startsWith('tile-')?Number(source.slice(5)):null;
 return <div data-sky-title={skyIdentity(record)} aria-hidden="true" className={`artwork ${className} ${tile!==null?'tile tile-'+tile:''} ${!source?'art-missing':''}`}>
 {source&&tile===null&&<img src={source} alt="" loading="lazy" decoding="async" onError={()=>setFailed(previous=>[...previous,source])}/>}
 {!source&&<span className="artwork-fallback"><span className="fallback-orbit">◌</span><strong>{record.title}</strong></span>}
 </div>;
}
