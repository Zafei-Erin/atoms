import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage, LoginPage } from './pages'
import { AuthProvider } from './context/auth'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
