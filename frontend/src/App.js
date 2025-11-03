import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import LandingPage from '@/pages/LandingPage';
import StudentDashboard from '@/pages/StudentDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import SubjectSelection from '@/pages/SubjectSelection';
import ARModelViewer from '@/pages/ARModelViewer';
import Assessment from '@/pages/Assessment';
import Performance from '@/pages/Performance';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-xl font-medium text-indigo-600">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={!user ? <LandingPage /> : user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={user && user.role === 'student' ? <StudentDashboard /> : <Navigate to="/" />} />
            <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/subjects" element={user ? <SubjectSelection /> : <Navigate to="/" />} />
            <Route path="/model/:modelId" element={user ? <ARModelViewer /> : <Navigate to="/" />} />
            <Route path="/assessment/:modelId" element={user ? <Assessment /> : <Navigate to="/" />} />
            <Route path="/performance" element={user ? <Performance /> : <Navigate to="/" />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;