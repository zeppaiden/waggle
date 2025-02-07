import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import TutorialFlow from '@/components/tutorial/TutorialFlow';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/configs/firebase';
import { useAuth } from '@/contexts/auth';
import { router } from 'expo-router';

export default function TutorialScreen() {
  console.log('[TutorialScreen] Rendering screen');
  const { user } = useAuth();

  useEffect(() => {
    console.log('[TutorialScreen] Component mounted:', {
      hasUser: !!user,
      userId: user?.uid,
    });
    return () => {
      console.log('[TutorialScreen] Component unmounting');
    };
  }, [user]);

  const handleTutorialComplete = async () => {
    console.log('[TutorialScreen] Tutorial completion handler called');
    
    if (!user) {
      console.error('[TutorialScreen] No user found when trying to complete tutorial');
      return;
    }
    
    try {
      console.log('[TutorialScreen] Marking tutorial as completed in Firestore');
      await setDoc(doc(db, 'users', user.uid), {
        hasCompletedTutorial: true
      }, { merge: true });

      console.log('[TutorialScreen] Successfully marked tutorial as completed, navigating to main app');
      router.replace('/(app)/(tabs)');
    } catch (error) {
      console.error('[TutorialScreen] Error marking tutorial as complete:', error);
    }
  };

  if (!user) {
    console.log('[TutorialScreen] No user found, redirecting to sign in');
    router.replace('/(auth)/sign-in');
    return null;
  }

  console.log('[TutorialScreen] Rendering tutorial flow');
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TutorialFlow onComplete={handleTutorialComplete} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
}); 