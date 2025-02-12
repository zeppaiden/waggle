import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/configs/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '@/types/user';

type TempRegistration = {
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  hasCompletedTutorial: boolean;
  tempRegistration: TempRegistration | null;
  setTempRegistration: (data: TempRegistration | null) => void;
  completeRegistration: (profile: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isOnboarded: false,
  hasCompletedTutorial: false,
  tempRegistration: null,
  setTempRegistration: () => {},
  completeRegistration: async () => {},
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
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);
  const [tempRegistration, setTempRegistration] = useState<TempRegistration | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const exists = userDoc.exists();
          const userData = userDoc.data();
          
          if (isMounted) {
            setIsOnboarded(exists);
            setHasCompletedTutorial(userData?.hasCompletedTutorial ?? false);
            setIsLoading(false);
          }
        } catch (error) {
          if (isMounted) {
            setIsOnboarded(false);
            setHasCompletedTutorial(false);
            setIsLoading(false);
          }
        }
      } else {
        if (isMounted) {
          setIsOnboarded(false);
          setHasCompletedTutorial(false);
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const completeRegistration = async (profile: UserProfile) => {
    if (!tempRegistration) {
      throw new Error('No temporary registration data found');
    }

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        tempRegistration.email,
        tempRegistration.password
      );

      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        email: tempRegistration.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setTempRegistration(null);
      setIsOnboarded(true);
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const handleSignOut = () => signOut(auth);

  // Memoize the value to prevent unnecessary re-renders.
  const value = useMemo(
    () => ({
      user,
      isLoading,
      isOnboarded,
      hasCompletedTutorial,
      tempRegistration,
      setTempRegistration,
      completeRegistration,
      signOut: handleSignOut
    }),
    [user, isLoading, isOnboarded, hasCompletedTutorial, tempRegistration]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 