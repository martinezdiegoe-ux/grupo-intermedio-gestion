import { useEffect, useState } from 'react'
import { getYouthPhoto } from '../services/youth'

export default function YouthAvatar({firstName,lastName,photoPath,onPreview}:{
 firstName:string;lastName:string;photoPath?:string;onPreview?:(url:string)=>void
}){
 const [photo,setPhoto]=useState<{path:string;url:string}|null>(null)
 useEffect(()=>{
  let active=true
  setPhoto(null)
  if(!photoPath)return
  const path=photoPath
  async function load(){
   try{const url=await getYouthPhoto(path);if(active)setPhoto(url?{path,url}:null)}
   catch{if(active)setPhoto(null)}
  }
  void load()
  // Signed links last one hour; refresh during long attendance sessions.
  const timer=window.setInterval(load,50*60*1000)
  return()=>{active=false;window.clearInterval(timer)}
 },[photoPath])
 const url=photo&&photo.path===photoPath?photo.url:null
 if (!url) return <div className="avatar">{firstName[0]}{lastName[0]}</div>
 const image = <img src={url} alt="" loading="lazy" onError={()=>setPhoto(null)}/>
 if (!onPreview) return <div className="avatar">{image}</div>
 return <button type="button" className="avatar attendance-photo-trigger"
  aria-label={`Ampliar foto de ${firstName} ${lastName}`} aria-haspopup="dialog"
  onClick={()=>onPreview(url)}>{image}</button>
}
