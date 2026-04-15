import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import ParticipantInfo from './pages/ParticipantInfo'
import Survey from './pages/Survey'
import Result from './pages/Result'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import ParticipantList from './pages/admin/ParticipantList'
import ParticipantDetail from './pages/admin/ParticipantDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" />} />
        <Route path="/s/:slug" element={<Landing />} />
        <Route path="/s/:slug/info" element={<ParticipantInfo />} />
        <Route path="/s/:slug/survey" element={<Survey />} />
        <Route path="/result/:id" element={<Result />} />
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/participants" element={<ParticipantList />} />
        <Route path="/admin/participant/:id" element={<ParticipantDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
