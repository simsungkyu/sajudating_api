import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import LocalLogPage from './pages/LocalLogPage';
import ProfileDetailPage from './pages/ProfileDetailPage';
import PhyPartnersPage from './pages/PhyPartnersPage';
import SajuProfilesPage from './pages/SajuProfilesPage';
import AIMetaPage from './pages/AIMetaPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/saju-profiles" element={<SajuProfilesPage />} />
          <Route path="/profiles/:uid" element={<ProfileDetailPage />} />
          <Route path="/phy-partners" element={<PhyPartnersPage />} />
          <Route path="/ai-meta" element={<AIMetaPage />} />
          <Route path="/local-logs" element={<LocalLogPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
