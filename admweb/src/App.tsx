import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import LocalLogPage from './pages/LocalLogPage';
import ProfileDetailPage from './pages/ProfileDetailPage';
import PhyPartnersPage from './pages/PhyPartnersPage';
import SajuProfilesPage from './pages/SajuProfilesPage';
import AIMetaPage from './pages/AIMetaPage';
import DestinyAssemblePage from './pages/DestinyAssemblePage';
import DestinyAssemble_SajuAssemblePage from './pages/DestinyAssemble_SajuAssemblePage';
import DestinyAssemble_PairAssemblePage from './pages/DestinyAssemble_PairAssemblePage';
import DestinyAssemble_SajuCardsPage from './pages/DestinyAssemble_SajuCardsPage';
import DestinyAssemble_PairCardsPage from './pages/DestinyAssemble_PairCardsPage';
import DestinyAssemble_SajuTestPage from './pages/DestinyAssemble_SajuTestPage';
import DestinyAssemble_PairTestPage from './pages/DestinyAssemble_PairTestPage';
import AdminUserListPage from './pages/AdminUserListPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/adminusers" element={<AdminUserListPage />} />
          <Route path="/saju-profiles" element={<SajuProfilesPage />} />
          <Route path="/profiles/:uid" element={<ProfileDetailPage />} />
          <Route path="/phy-partners" element={<PhyPartnersPage />} />
          <Route path="/ai-meta" element={<AIMetaPage />} />
          <Route path="/destiny_assemble" element={<DestinyAssemblePage />} />
          <Route path="/destiny_assemble/saju_assemble" element={<DestinyAssemble_SajuAssemblePage />} />
          <Route path="/destiny_assemble/pair_assemble" element={<DestinyAssemble_PairAssemblePage />} />
          <Route path="/destiny_assemble/saju" element={<DestinyAssemble_SajuCardsPage />} />
          <Route path="/destiny_assemble/pair" element={<DestinyAssemble_PairCardsPage />} />
          <Route path="/destiny_assemble/saju-test" element={<DestinyAssemble_SajuTestPage />} />
          <Route path="/destiny_assemble/pair-test" element={<DestinyAssemble_PairTestPage />} />
          <Route path="/local-logs" element={<LocalLogPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
