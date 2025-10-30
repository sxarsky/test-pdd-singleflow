import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const response = await authApi.getUser();
    if (response.data?.user) {
      setUser(response.data.user);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await authApi.signIn(email, password);

    if (response.error) {
      throw new Error(response.error);
    }

    if (response.data?.user) {
      setUser(response.data.user);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    const response = await authApi.signUp(email, password, username);

    if (response.error) {
      throw new Error(response.error);
    }

    if (response.data?.user) {
      setUser(response.data.user);
    }
  };

  const signOut = async () => {
    const response = await authApi.signOut();

    if (response.error) {
      throw new Error(response.error);
    }

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
