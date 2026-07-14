import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';

// Redirect /join/:code to dashboard with the code pre-filled
function JoinRedirect() {
  const { code } = useParams();
  return <Navigate to={`/dashboard?join=${code}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/join/:code" element={<JoinRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
