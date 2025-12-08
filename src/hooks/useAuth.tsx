import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Helper function to safely access storage
    const safeLocalStorage = {
      clear: () => {
        try {
          localStorage.clear();
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Error removing ${key} from localStorage:`, e);
        }
      },
      key: (index: number) => {
        try {
          return localStorage.key(index);
        } catch (e) {
          return null;
        }
      },
      get length() {
        try {
          return localStorage.length;
        } catch (e) {
          return 0;
        }
      }
    };

    const safeSessionStorage = {
      clear: () => {
        try {
          sessionStorage.clear();
        } catch (e) {
          console.error('Error clearing sessionStorage:', e);
        }
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Handle SIGNED_OUT event explicitly
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
          // Clear all storage on sign out
          safeLocalStorage.clear();
          safeSessionStorage.clear();
          // Clear Supabase-related storage
          const keys: string[] = [];
          for (let i = 0; i < safeLocalStorage.length; i++) {
            const key = safeLocalStorage.key(i);
            if (key) keys.push(key);
          }
          keys.forEach(key => {
            if (key.startsWith('sb-') || key.startsWith('supabase.')) {
              safeLocalStorage.removeItem(key);
            }
          });
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    }).catch((error) => {
      console.error("Error getting session:", error);
      setLoading(false);
    });

    // Handle browser back button - check session on popstate
    const handlePopState = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          setSession(null);
          setUser(null);
          // Redirect to auth if not already there
          if (window.location.pathname !== '/auth' && !window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth';
          }
        }
      });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/auth?verified=true`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    
    // Don't automatically sign in - require email confirmation
    // The user will need to confirm their email before accessing the app
    
    return { error: error as Error | null, data };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error: error as Error | null };
  };

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth?verified=true`
      }
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Helper function to safely access storage
    const safeLocalStorage = {
      clear: () => {
        try {
          localStorage.clear();
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Error removing ${key} from localStorage:`, e);
        }
      },
      key: (index: number) => {
        try {
          return localStorage.key(index);
        } catch (e) {
          return null;
        }
      },
      get length() {
        try {
          return localStorage.length;
        } catch (e) {
          return 0;
        }
      }
    };

    const safeSessionStorage = {
      clear: () => {
        try {
          sessionStorage.clear();
        } catch (e) {
          console.error('Error clearing sessionStorage:', e);
        }
      }
    };

    // Clear state immediately to prevent any race conditions
    setUser(null);
    setSession(null);
    
    // Clear all storage first
    safeLocalStorage.clear();
    safeSessionStorage.clear();
    
    // Clear any Supabase-related storage
    const keys: string[] = [];
    for (let i = 0; i < safeLocalStorage.length; i++) {
      const key = safeLocalStorage.key(i);
      if (key) keys.push(key);
    }
    keys.forEach(key => {
      if (key && (key.startsWith('sb-') || key.startsWith('supabase.') || key.includes('supabase'))) {
        safeLocalStorage.removeItem(key);
      }
    });
    
    // Clear all cookies related to Supabase/auth
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      if (name.includes('supabase') || name.includes('auth') || name.includes('session')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
      }
    });
    
    // Sign out from Supabase (this invalidates the session on the server)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (err) {
      console.error('Error during signOut:', err);
    }
    
    // Use replace instead of href to prevent back button from going back to authenticated pages
    // This removes the current page from history
    window.location.replace('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resendConfirmationEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
