import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '@/configs/firebase';
import { doc, getDoc } from 'firebase/firestore';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isOnboarded: false,
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
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    console.log('[Auth] Setting up auth state listener');
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Auth] Auth state changed:', {
        email: user?.email,
        uid: user?.uid,
        isNewUser: user?.metadata.creationTime === user?.metadata.lastSignInTime
      });
      
      if (!isMounted) return;
      setUser(user);
      
      if (user) {
        // Check if user has completed onboarding
        console.log('[Auth] Checking Firestore for user document');
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const exists = userDoc.exists();
          console.log('[Auth] User document check:', {
            exists,
            data: userDoc.data(),
            previousOnboardingState: isOnboarded,
            willSetOnboardedTo: exists
          });
          
          if (isMounted) {
            setIsOnboarded(exists);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('[Auth] Error checking user document:', error);
          if (isMounted) {
            setIsOnboarded(false);
            setIsLoading(false);
          }
        }
      } else {
        console.log('[Auth] No user, resetting states');
        if (isMounted) {
          setIsOnboarded(false);
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleSignOut = () => signOut(auth);

  // Memoize the value to prevent unnecessary re-renders.
  const value = useMemo(
    () => ({
      user,
      isLoading,
      isOnboarded,
      signOut: handleSignOut
    }),
    [user, isLoading, isOnboarded]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 