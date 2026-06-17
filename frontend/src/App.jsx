import { Routes } from 'react-router-dom'
import Login from './Pages/Login'
import { Route } from 'react-router-dom'
import Register from './Pages/Register'
import ChatDashboard from './Pages/ChatDashboard'
import PublicRoute from './components/PublicRoute'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  

  return (
    <>
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
