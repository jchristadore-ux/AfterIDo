import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as api from '@/lib/api';
import { OFFLINE_CONFIG, type Account, type ServerConfig } from '@/lib/api';

/**
 * Who is signed in, and what they have paid for.
 *
 * ── Why this is separate from AppContext ──────────────────────────────────
 * AppContext holds the user's plan for changing her name: her details, her
 * tasks, her progress. All of that lives in her browser and never leaves it.
 * This holds the two facts that cannot live in a browser and be believed —
 * her identity and her entitlement — and both come from the server.
 *
 * ── The rule ──────────────────────────────────────────────────────────────
 * `plan` here is only ever assigned from a server response. There is no
 * setter, no local override, and no way for the UI to grant itself Premium.
 * That is deliberate: an entitlement a client can set is not an entitlement.
 */

export type AccountStatus = 'loading' | 'ready';

interface AccountContextValue {
  status: AccountStatus;
  /** What this deployment can actually do. False everywhere on a static host. */
  config: ServerConfig;
  /** The signed-in account, or null. */
  account: Account | null;
  /** Server-verified entitlement. Never set locally. */
  plan: 'free' | 'premium';
  /** True while a sign-in or checkout request is in flight. */
  busy: boolean;
  requestSignInLink: (
    email: string,
    next?: string,
  ) => Promise<{ delivered: boolean; devLink?: string }>;
  signOut: () => Promise<void>;
  beginCheckout: () => Promise<void>;
  confirmCheckout: (sessionId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  setRemindersOptIn: (optIn: boolean, reminders: api.ReminderPayload[]) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AccountStatus>('loading');
  const [config, setConfig] = useState<ServerConfig>(OFFLINE_CONFIG);
  const [account, setAccount] = useState<Account | null>(null);
  const [busy, setBusy] = useState(false);

  // One round trip at startup answers both questions: what can this
  // deployment do, and is anyone signed in.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await api.loadConfig();
      if (cancelled) return;
      setConfig(loaded);

      if (loaded.accounts) {
        try {
          const me = await api.fetchAccount();
          if (!cancelled) setAccount(me);
        } catch {
          // A transient failure means "we don't know", not "signed out".
        }
      }
      if (!cancelled) setStatus('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!config.accounts) return;
    try {
      setAccount(await api.fetchAccount());
    } catch {
      /* keep what we had */
    }
  }, [config.accounts]);

  const requestSignInLink = useCallback(async (email: string, next?: string) => {
    setBusy(true);
    try {
      const result = await api.requestSignInLink(email, next);
      return { delivered: result.delivery === 'email', devLink: result.devLink };
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await api.signOut();
      setAccount(null);
    } finally {
      setBusy(false);
    }
  }, []);

  /**
   * Hands off to Stripe's hosted Checkout. The card is entered on Stripe's
   * page, on Stripe's domain — no card detail ever touches AfterIDo.
   */
  const beginCheckout = useCallback(async () => {
    setBusy(true);
    try {
      const { url } = await api.startCheckout();
      window.location.href = url;
    } finally {
      setBusy(false);
    }
  }, []);

  /**
   * Called on the success page. The session id in the URL is only a lookup
   * key — the server reads the payment status back from Stripe and checks the
   * session belongs to the signed-in account before granting anything.
   */
  const confirmCheckout = useCallback(async (sessionId: string) => {
    try {
      const updated = await api.confirmCheckout(sessionId);
      setAccount(updated);
      return updated.plan === 'premium';
    } catch {
      return false;
    }
  }, []);

  const setRemindersOptIn = useCallback(
    async (optIn: boolean, reminders: api.ReminderPayload[]) => {
      await api.saveReminders(optIn, reminders);
      setAccount((current) => (current ? { ...current, remindersOptIn: optIn } : current));
    },
    [],
  );

  const deleteAccount = useCallback(async () => {
    await api.deleteAccount();
    setAccount(null);
  }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      status,
      config,
      account,
      plan: account?.plan ?? 'free',
      busy,
      requestSignInLink,
      signOut,
      beginCheckout,
      confirmCheckout,
      refresh,
      setRemindersOptIn,
      deleteAccount,
    }),
    [
      status,
      config,
      account,
      busy,
      requestSignInLink,
      signOut,
      beginCheckout,
      confirmCheckout,
      refresh,
      setRemindersOptIn,
      deleteAccount,
    ],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside <AccountProvider>');
  return ctx;
}
