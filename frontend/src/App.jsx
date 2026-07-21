import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import JobDetailPage from './pages/JobDetailPage'
import AppLayout from './components/AppLayout'
import UnprotectedLayout from './components/UnprotectedLayout'

function App() {
  return (
    <div className="bg-black min-h-screen text-white font-sans">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Unprotected routes (redirect to dashboard if logged in) */}
        <Route element={<UnprotectedLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Protected routes with shared layout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
