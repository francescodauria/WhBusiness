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
        <main className={styles.main}>
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/chat"     element={<ChatPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
