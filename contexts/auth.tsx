import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/configs/firebase';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: () => Promise.resolve(),
});

/**
 * Provides authentication context to the app.
 * 
 * @param {React.ReactNode} children - The child components to be wrapped by the AuthProvider.
 * @returns {React.ReactNode} The AuthProvider component.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes. Recommended by the Firebase docs.
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
  }, []);

  const handleSignOut = () => signOut(auth);

  // Memoize the value to prevent unnecessary re-renders.
  const value = useMemo(
    () => ({
      user,
      isLoading,
      signOut: handleSignOut
    }),
    [user, isLoading] // handleSignOut is stable (doesn't change between renders)
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 