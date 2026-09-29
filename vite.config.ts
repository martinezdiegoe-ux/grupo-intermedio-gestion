import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.GITHUB_ACTIONS ? '/grupo-intermedio-gestion/' : '/'

export default defineConfig({
  base,
  plugins:[
    react(),
    VitePWA({
      registerType:'autoUpdate',
      workbox:{importScripts:[`${base}push-handler.js`]},
      includeAssets:['icons/ac-512.svg','icons/ac-192.png','icons/ac-512.png'],
      manifest:{
        id:base,
        scope:base,
        name:'Asamblea Cristiana — Grupo Intermedio',
        short_name:'Grupo Intermedio',
        description:'Gestión de asistencia, jóvenes, cronograma y proyectos.',
        lang:'es-AR',
        theme_color:'#0f1020',
        background_color:'#090a12',
        display:'standalone',
        start_url:base,
        icons:[
          {src:'icons/ac-192.png',sizes:'192x192',type:'image/png'},
          {src:'icons/ac-512.png',sizes:'512x512',type:'image/png'}
        ]
      }
    })
  ]
})
