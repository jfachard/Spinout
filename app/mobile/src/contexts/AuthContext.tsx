import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getAccessToken } from '@/lib/auth';

type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  isReady: false,
  isAuthenticated: false,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getAccessToken();
    setIsAuthenticated(token !== null);
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsReady(true));
  }, [refresh]);

  const value = useMemo(
    () => ({ isReady, isAuthenticated, refresh }),
    [isReady, isAuthenticated, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
