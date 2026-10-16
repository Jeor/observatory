import {useState} from 'react';
import type {PlayRecord} from '../../shared/contracts';
export function Artwork({record,className=''}:{record:PlayRecord;className?:string}){
 const [failed,setFailed]=useState<string>();
 const tile=record.art?.startsWith('tile-')?Number(record.art.slice(5)):null;
 const missing=!record.art||failed===record.art;
 return <div aria-hidden="true" className={`artwork ${className} ${tile!==null?'tile tile-'+tile:''} ${missing?'art-missing':''}`}>
 {!missing&&tile===null&&<img src={record.art||undefined} alt="" loading="lazy" decoding="async" onError={()=>setFailed(record.art||undefined)}/>}
 {missing&&<span className="artwork-fallback">{record.title.slice(0,1)}<small>Artwork unavailable</small></span>}
 </div>;
}
