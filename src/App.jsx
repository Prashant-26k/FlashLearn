import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateDeck = lazy(() => import('./pages/CreateDeck'));
const MyDecks = lazy(() => import('./pages/MyDecks'));
const DeckStudy = lazy(() => import('./pages/DeckStudy'));
const Collections = lazy(() => import('./pages/Collections'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>Loading...</div>}>
            <Routes>
              {/* Public route */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={
                <PublicRoute><Login /></PublicRoute>
              } />

              {/* Protected routes with layout */}
              <Route element={
                <ProtectedRoute><Layout /></ProtectedRoute>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create" element={<CreateDeck />} />
                <Route path="/decks" element={<MyDecks />} />
                <Route path="/decks/:id" element={<DeckStudy />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
