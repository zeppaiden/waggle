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

type OnboardingStep = 'role' | 'identification' | 'preferences' | 'owner-profile';

export default function OnboardingScreen() {
  const { tempRegistration, completeRegistration, setTempRegistration } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('role');
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  useEffect(() => {
    if (!tempRegistration) {
      router.replace('/(auth)/sign-up');
    }
  }, [tempRegistration]);

  const handleNext = (data: Partial<UserProfile>) => {
    const updatedProfile = { ...profile, ...data };
    setProfile(updatedProfile);
    setIsNavigatingBack(false);

    switch (currentStep) {
      case 'role':
        setCurrentStep('identification');
        break;
      case 'identification':
        if (updatedProfile.role === 'buyer') {
          setCurrentStep('preferences');
        } else if (updatedProfile.role === 'owner') {
          setCurrentStep('owner-profile');
        } else if (updatedProfile.role === 'both') {
          setCurrentStep('preferences');
        }
        break;
      case 'preferences':
        if (updatedProfile.role === 'both') {
          setCurrentStep('owner-profile');
        } else {
          handleComplete(updatedProfile);
        }
        break;
      case 'owner-profile':
        handleComplete(updatedProfile);
        break;
    }
  };

  const handleBack = () => {
    setIsNavigatingBack(true);
    switch (currentStep) {
      case 'role':
        setTempRegistration(null);
        router.replace('/(auth)/sign-up');
        break;
      case 'identification':
        setCurrentStep('role');
        break;
      case 'preferences':
        setCurrentStep('identification');
        break;
      case 'owner-profile':
        if (profile.role === 'both') {
          setCurrentStep('preferences');
        } else {
          setCurrentStep('identification');
        }
        break;
    }
  };

  const handleComplete = async (finalProfile: Partial<UserProfile>) => {
    try {
      if (!tempRegistration) {
        throw new Error('No registration data found');
      }

      // Add preferencesLastUpdated timestamp for initial preferences
      const profileWithTimestamp = {
        ...finalProfile,
        preferencesLastUpdated: Date.now()
      };

      await completeRegistration(profileWithTimestamp as UserProfile);
    } catch (error) {
      // Handle error silently or show user feedback if needed
    }
  };

  const renderStep = () => {
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
      case 'owner-profile':
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