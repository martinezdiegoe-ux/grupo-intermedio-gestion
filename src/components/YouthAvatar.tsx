import { useEffect, useState } from 'react'
import { getYouthPhoto } from '../services/youth'

export default function YouthAvatar({firstName,lastName,photoPath}:{firstName:string;lastName:string;photoPath?:string}){
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
 return <div className="avatar">{url?<img src={url} alt="" loading="lazy" onError={()=>setPhoto(null)}/>:<>{firstName[0]}{lastName[0]}</>}</div>
}
