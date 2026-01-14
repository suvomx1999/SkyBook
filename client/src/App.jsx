import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ChatAssistant from './components/ChatAssistant';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddFlight from './pages/AddFlight';
import BookingDetails from './pages/BookingDetails';
import Invoice from './pages/Invoice';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-flight" element={<AddFlight />} />
            <Route path="/book/:flightId" element={<BookingDetails />} />
            <Route path="/invoice/:bookingId" element={<Invoice />} />
          </Routes>
          <ChatAssistant />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
