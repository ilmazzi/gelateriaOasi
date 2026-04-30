import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/apiClient.js';
import { assertSupabase, isSupabaseConfigured } from '@/lib/supabase-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
  const [role, setRole] = useState('guest');

  const loadUserRole = useCallback(async (userId) => {
    if (!userId || !isSupabaseConfigured) {
      setRole('guest');
      return 'guest';
    }

    try {
      const client = assertSupabase();
      const { data, error } = await client
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Role check failed:', error.message);
        setRole('guest');
        return 'guest';
      }

      const nextRole = data?.role ?? 'guest';
      setRole(nextRole);
      return nextRole;
    } catch (error) {
      console.warn('Role check failed:', error);
      setRole('guest');
      return 'guest';
    }
  }, []);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await apiClient.auth.me();
      setUser(currentUser ?? null);
      setIsAuthenticated(Boolean(currentUser));
      await loadUserRole(currentUser?.id);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setUser(null);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setRole('guest');
      setAuthChecked(true);
    }
  }, [loadUserRole]);

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      setAppPublicSettings({ public_settings: { auth_required: false } });
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  }, [checkUserAuth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAppState();
  }, [checkAppState]);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setRole('guest');
    
    if (shouldRedirect) {
      apiClient.auth.logout(window.location.href);
    } else {
      apiClient.auth.logout();
    }
  };

  const navigateToLogin = () => {
    apiClient.auth.redirectToLogin(window.location.href);
  };

  useEffect(() => {
    const { data } = apiClient.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        loadUserRole(session.user.id);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setRole('guest');
      }
      setAuthChecked(true);
      setIsLoadingAuth(false);
    });

    return () => data.subscription.unsubscribe();
  }, [loadUserRole]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      role,
      isAdmin: role === 'admin',
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
