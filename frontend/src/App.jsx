import { Routes } from 'react-router-dom'
import Login from './Pages/Login'
import { Route } from 'react-router-dom'
import Register from './Pages/Register'
import ChatDashboard from './Pages/ChatDashboard'

function App() {
  

  return (
    <>
     <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ChatDashboard />} />
     </Routes>
    </>
  )
}

export default App
