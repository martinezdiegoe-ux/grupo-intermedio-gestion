self.addEventListener('push',event=>{
 let message={}
 try{message=event.data?.json()??{}}catch{message={body:event.data?.text()??''}}
 const target=new URL('alertas',self.registration.scope).href
 event.waitUntil(self.registration.showNotification(message.title||'Grupo Intermedio',{
  body:message.body||'Tenés un nuevo aviso.',
  icon:new URL('icons/ac-192.png',self.registration.scope).href,
  badge:new URL('icons/ac-192.png',self.registration.scope).href,
  tag:message.id?`gi-${message.id}`:undefined,
  data:{url:target}
 }))
})
self.addEventListener('notificationclick',event=>{
 event.notification.close()
 const url=event.notification.data?.url||new URL('alertas',self.registration.scope).href
 event.waitUntil((async()=>{
  const windows=await clients.matchAll({type:'window',includeUncontrolled:true})
  const existing=windows.find(window=>window.url.startsWith(self.registration.scope))
  if(existing){await existing.focus();await existing.navigate(url);return}
  await clients.openWindow(url)
 })())
})
