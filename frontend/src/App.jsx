import { Routes } from 'react-router-dom'
import Login from './Pages/Login'
import { Route } from 'react-router-dom'
import Register from './Pages/Register'
import ChatDashboard from './Pages/ChatDashboard'
import PublicRoute from './components/PublicRoute'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from 'react-hot-toast'

function App() {
  

  return (
    <>
     <Toaster position="top-center" reverseOrder={false} />
     <Routes>
       <Route element={<PublicRoute />} >
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
       </Route>

        <Route element={<ProtectedRoute />} >
        <Route path="/" element={<ChatDashboard />} />
        </Route>
     </Routes>
    </>
  )
}

export default App
