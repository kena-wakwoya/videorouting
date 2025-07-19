
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AdminPanel } from './pages/AdminPanel'
import { ClientView } from './pages/ClientView'

function App() {
  

  return (
    <Router >
    <Routes>
      <Route path="/admin/:adminId" element={<AdminPanel />} />
      <Route path="/client/:clientUUID" element={<ClientView />} />
    </Routes>
  </Router>
  )
}

export default App
