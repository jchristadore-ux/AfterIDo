import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { AppProvider, useApp } from '@/store/AppContext';
import { AccountProvider } from '@/store/AccountContext';
import { AppShell } from '@/components/AppShell';
import { Landing } from '@/pages/Landing';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { Checklist } from '@/pages/Checklist';
import { TaskDetail } from '@/pages/TaskDetail';
import { Documents } from '@/pages/Documents';
import { Profile } from '@/pages/Profile';
import { Packet } from '@/pages/Packet';
import { Letters } from '@/pages/Letters';
import { HowItWorks } from '@/pages/HowItWorks';
import { Premium } from '@/pages/Premium';
import { PremiumSuccess } from '@/pages/PremiumSuccess';
import { Trust } from '@/pages/Trust';
import { SignIn } from '@/pages/SignIn';
import { StateGuide } from '@/pages/StateGuide';
import { Contact, DisclaimerPage, Privacy, Terms } from '@/pages/Legal';
import { NotFound } from '@/pages/NotFound';

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

/**
 * AccountProvider wraps AppProvider, not the other way round: the app's
 * `can(feature)` reads the entitlement out of the account, so the account has
 * to exist first.
 */
export function App() {
  return (
    <AccountProvider>
      <AppProvider>
        <ScrollToTop />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/premium/success" element={<PremiumSuccess />} />
          <Route path="/trust" element={<Trust />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/name-change-after-marriage/:slug" element={<StateGuide />} />

          {/* Kept because it was the pricing URL before launch. */}
          <Route path="/pricing" element={<Navigate to="/premium" replace />} />

          {/* Account */}
          <Route path="/sign-in" element={<SignIn mode="sign-in" />} />
          <Route path="/create-account" element={<SignIn mode="create" />} />

          {/* Onboarding */}
          <Route path="/start" element={<Onboarding />} />

          {/* The signed-in app */}
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
            <Route path="letters" element={<Letters />} />
            <Route path="profile" element={<Profile />} />
            <Route path="packet" element={<Packet />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppProvider>
    </AccountProvider>
  );
}
