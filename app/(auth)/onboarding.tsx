import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '@/contexts/auth';
import { UserProfile } from '@/types/user';
import RoleSelectionStep from '@/components/onboarding/steps/RoleSelectionStep';
import IdentificationStep from '@/components/onboarding/steps/IdentificationStep';
import BuyerPreferencesStep from '@/components/onboarding/steps/BuyerPreferencesStep';
import OwnerProfileStep from '@/components/onboarding/steps/OwnerProfileStep';
import { router } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInRight, 
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
} from 'react-native-reanimated';

type OnboardingStep = 'role' | 'identification' | 'preferences' | 'owner';

export default function OnboardingScreen() {
  console.log('[OnboardingScreen] Rendering screen');
  const { tempRegistration, completeRegistration, setTempRegistration } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('role');
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  useEffect(() => {
    if (!tempRegistration) {
      console.log('[OnboardingScreen] No registration data found, redirecting to sign up');
      router.replace('/(auth)/sign-up');
    }
  }, [tempRegistration]);

  useEffect(() => {
    console.log('[OnboardingScreen] Current step:', currentStep);
    console.log('[OnboardingScreen] Current profile:', profile);
  }, [currentStep, profile]);

  const handleNext = (data: Partial<UserProfile>) => {
    console.log('[OnboardingScreen] Handling next with data:', data);
    const updatedProfile = { ...profile, ...data };
    setProfile(updatedProfile);
    setIsNavigatingBack(false);

    // Determine next step based on current step and role
    switch (currentStep) {
      case 'role':
        console.log('[OnboardingScreen] Moving to identification step');
        setCurrentStep('identification');
        break;
      case 'identification':
        if (updatedProfile.role === 'buyer') {
          console.log('[OnboardingScreen] Moving to preferences step (buyer)');
          setCurrentStep('preferences');
        } else if (updatedProfile.role === 'owner') {
          console.log('[OnboardingScreen] Moving to owner step');
          setCurrentStep('owner');
        } else {
          console.log('[OnboardingScreen] Moving to preferences step (both)');
          setCurrentStep('preferences');
        }
        break;
      case 'preferences':
        if (updatedProfile.role === 'both') {
          console.log('[OnboardingScreen] Moving to owner step (after preferences)');
          setCurrentStep('owner');
        } else {
          console.log('[OnboardingScreen] Completing onboarding (after preferences)');
          handleComplete(updatedProfile);
        }
        break;
      case 'owner':
        console.log('[OnboardingScreen] Completing onboarding (after owner)');
        handleComplete(updatedProfile);
        break;
    }
  };

  const handleBack = () => {
    console.log('[OnboardingScreen] Handling back');
    setIsNavigatingBack(true);
    switch (currentStep) {
      case 'role':
        // If we're at the first step, go back to sign up
        setTempRegistration(null);
        router.replace('/(auth)/sign-up');
        break;
      case 'identification':
        setCurrentStep('role');
        break;
      case 'preferences':
        setCurrentStep('identification');
        break;
      case 'owner':
        if (profile.role === 'both') {
          setCurrentStep('preferences');
        } else {
          setCurrentStep('identification');
        }
        break;
    }
  };

  const handleComplete = async (finalProfile: Partial<UserProfile>) => {
    console.log('[OnboardingScreen] Completing registration with profile:', finalProfile);
    try {
      if (!tempRegistration) {
        console.error('[OnboardingScreen] No registration data found');
        throw new Error('No registration data found');
      }

      await completeRegistration(finalProfile as UserProfile);
      console.log('[OnboardingScreen] Registration completed successfully');
    } catch (error) {
      console.error('[OnboardingScreen] Error completing registration:', error);
    }
  };

  const renderStep = () => {
    console.log('[OnboardingScreen] Rendering step:', currentStep);
    const entering = isNavigatingBack ? SlideInLeft : SlideInRight;
    const exiting = isNavigatingBack ? SlideOutRight : SlideOutLeft;

    const props = {
      entering,
      exiting,
      style: styles.stepContainer,
    };

    switch (currentStep) {
      case 'role':
        return (
          <Animated.View {...props}>
            <RoleSelectionStep
              data={profile}
              onNext={handleNext}
              onBack={handleBack}
            />
          </Animated.View>
        );
      case 'identification':
        return (
          <Animated.View {...props}>
            <IdentificationStep
              data={profile}
              onNext={handleNext}
              onBack={handleBack}
            />
          </Animated.View>
        );
      case 'preferences':
        return (
          <Animated.View {...props}>
            <BuyerPreferencesStep
              data={profile}
              onNext={handleNext}
              onBack={handleBack}
            />
          </Animated.View>
        );
      case 'owner':
        return (
          <Animated.View {...props}>
            <OwnerProfileStep
              data={profile}
              onNext={handleNext}
              onBack={handleBack}
            />
          </Animated.View>
        );
      default:
        console.warn('[OnboardingScreen] Unknown step:', currentStep);
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {renderStep()}
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
  stepContainer: {
    flex: 1,
    width: '100%',
  },
}); 