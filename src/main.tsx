import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './state/AuthContext'
import App from './App'
import './styles.css'
import './login-controls.css'
import './attendance-controls.css'
import './showcase.css'
import './controls-projects.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter basename={import.meta.env.BASE_URL}><AuthProvider><App/></AuthProvider></BrowserRouter></React.StrictMode>
)
