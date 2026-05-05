import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar   from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ChatPage  from './pages/ChatPage';
import Settings  from './pages/Settings';
import styles    from './App.module.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.content}>
          <Routes>
            <Route path="/"          element={<Navigate to="/chat" replace />} />
            <Route path="/chat"      element={<ChatPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings"  element={<Settings />} />
            <Route path="*"          element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
