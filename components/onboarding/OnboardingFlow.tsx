import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/themed';
import { UserProfile } from '@/types/user';
import IdentificationStep from '@/components/onboarding/steps/IdentificationStep';
import RoleSelectionStep from '@/components/onboarding/steps/RoleSelectionStep';
import BuyerPreferencesStep from '@/components/onboarding/steps/BuyerPreferencesStep';
import OwnerProfileStep from '@/components/onboarding/steps/OwnerProfileStep';
import { Colors } from '@/constants/colors-theme';

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
  initialData?: Partial<UserProfile>;
}

const STEPS = {
  identification: {
    id: 'identification',
    title: 'Tell us about yourself',
    description: 'We need some basic information to get started.',
  },
  roleSelection: {
    id: 'roleSelection',
    title: 'Choose your role',
    description: 'How would you like to use Waggle?',
  },
  buyerPreferences: {
    id: 'buyerPreferences',
    title: 'Your Pet Preferences',
    description: 'Help us understand what kind of pets you are interested in.',
  },
  ownerProfile: {
    id: 'ownerProfile',
    title: 'List Your Pet',
    description: 'Tell us about the pet you want to rehome.',
  },
};

export default function OnboardingFlow({ onComplete, initialData = {} }: OnboardingFlowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userData, setUserData] = useState<Partial<UserProfile>>(initialData);

  const getStepSequence = () => {
    const steps = [STEPS.identification, STEPS.roleSelection];
    
    if (userData.role === 'buyer') {
      steps.push(STEPS.buyerPreferences);
    } else if (userData.role === 'owner') {
      steps.push(STEPS.ownerProfile);
    } else if (userData.role === 'both') {
      steps.push(STEPS.buyerPreferences, STEPS.ownerProfile);
    }

    return steps;
  };

  const steps = getStepSequence();
  const currentStep = steps[currentStepIndex];

  const handleNext = (data: Partial<UserProfile>) => {
    const updatedData = {
      ...userData,
      ...data,
    };
    setUserData(updatedData);

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete(updatedData as UserProfile);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep.id) {
      case 'identification':
        return (
          <IdentificationStep
            data={userData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'roleSelection':
        return (
          <RoleSelectionStep
            data={userData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'buyerPreferences':
        return (
          <BuyerPreferencesStep
            data={userData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'ownerProfile':
        return (
          <OwnerProfileStep
            data={userData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <View style={styles.header}>
        <View style={styles.progressBar}>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <View
                style={[
                  styles.progressDot,
                  index <= currentStepIndex && styles.progressDotActive,
                ]}
              />
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.progressLine,
                    index < currentStepIndex && styles.progressLineActive,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.title}>{currentStep.title}</Text>
        <Text style={styles.description}>{currentStep.description}</Text>
      </View>

      <View style={styles.content}>
        {renderStep()}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  progressDotActive: {
    backgroundColor: Colors.light.primary,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: Colors.light.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 24,
  },
}); 