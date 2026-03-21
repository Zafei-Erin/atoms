import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage, LoginPage, ChatPage } from './pages'
import { AuthProvider } from './context/auth'
import { TooltipProvider } from './components/ui/tooltip'
import { ProtectedRoute } from './components'

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/chat/:projectId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  )
}
