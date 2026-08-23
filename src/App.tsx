import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { AppProvider, useApp } from '@/store/AppContext';
import { AppShell } from '@/components/AppShell';
import { Landing } from '@/pages/Landing';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { Checklist } from '@/pages/Checklist';
import { TaskDetail } from '@/pages/TaskDetail';
import { Documents } from '@/pages/Documents';
import { Profile } from '@/pages/Profile';
import { Packet } from '@/pages/Packet';
import { HowItWorks } from '@/pages/HowItWorks';
import { Pricing } from '@/pages/Pricing';
import { Trust } from '@/pages/Trust';

/** Someone landing on /app without a profile gets the questions first. */
function RequireProfile({ children }: { children: ReactElement }) {
  const { state } = useApp();
  if (!state.onboarded) return <Navigate to="/start" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <AppProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/trust" element={<Trust />} />
        <Route path="/start" element={<Onboarding />} />

        <Route
          path="/app"
          element={
            <RequireProfile>
              <AppShell />
            </RequireProfile>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="checklist" element={<Checklist />} />
          <Route path="task/:taskId" element={<TaskDetail />} />
          <Route path="documents" element={<Documents />} />
          <Route path="profile" element={<Profile />} />
          <Route path="packet" element={<Packet />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
