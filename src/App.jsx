import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateDeck from './pages/CreateDeck';
import MyDecks from './pages/MyDecks';
import DeckStudy from './pages/DeckStudy';
import Collections from './pages/Collections';
import Quiz from './pages/Quiz';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Home from './pages/Home';
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
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
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
