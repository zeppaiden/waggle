import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import TutorialCard from './TutorialCard';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
} from 'react-native-reanimated';

const TUTORIAL_STEPS = [
  {
    title: 'Discover Your Perfect Pet',
    description: "Swipe right on pets you're interested in, or left to pass. Your perfect match is just a swipe away!",
    icon: 'paw' as const,
  },
  {
    title: 'Explore Pet Profiles',
    description: "View detailed profiles with photos, videos, and information about each pet's personality and needs.",
    icon: 'information-circle' as const,
  },
  {
    title: 'Chat with Pet Owners',
    description: 'Connect directly with pet owners through our messaging system to learn more about potential pets.',
    icon: 'chatbubbles' as const,
  },
  {
    title: 'Save Your Favorites',
    description: 'Keep track of pets you love by adding them to your favorites list for easy access later.',
    icon: 'heart' as const,
  },
  {
    title: 'Manage Your Profile',
    description: 'Update your preferences and information anytime to find the best matches for your lifestyle.',
    icon: 'person-circle' as const,
  },
];

interface TutorialFlowProps {
  onComplete: () => void;
}

export default function TutorialFlow({ onComplete }: TutorialFlowProps) {
  console.log('[TutorialFlow] Rendering component');
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  useEffect(() => {
    console.log('[TutorialFlow] Component mounted');
    return () => {
      console.log('[TutorialFlow] Component unmounting');
    };
  }, []);

  useEffect(() => {
    console.log('[TutorialFlow] Current step changed:', {
      currentStep,
      stepTitle: TUTORIAL_STEPS[currentStep].title,
      isNavigatingBack,
    });
  }, [currentStep, isNavigatingBack]);

  const handleNext = () => {
    console.log('[TutorialFlow] handleNext called:', {
      currentStep,
      isLastStep: currentStep === TUTORIAL_STEPS.length - 1,
    });

    if (currentStep === TUTORIAL_STEPS.length - 1) {
      console.log('[TutorialFlow] Completing tutorial');
      onComplete();
    } else {
      console.log('[TutorialFlow] Moving to next step');
      setIsNavigatingBack(false);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    console.log('[TutorialFlow] handleSkip called');
    onComplete();
  };

  const entering = isNavigatingBack ? SlideInLeft : SlideInRight;
  const exiting = isNavigatingBack ? SlideOutRight : SlideOutLeft;

  console.log('[TutorialFlow] Rendering step:', {
    currentStep,
    totalSteps: TUTORIAL_STEPS.length,
    isNavigatingBack,
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={styles.cardContainer}
        entering={entering}
        exiting={exiting}
      >
        <TutorialCard
          {...TUTORIAL_STEPS[currentStep]}
          index={currentStep}
          totalSteps={TUTORIAL_STEPS.length}
          onNext={handleNext}
          onSkip={handleSkip}
          isLast={currentStep === TUTORIAL_STEPS.length - 1}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cardContainer: {
    flex: 1,
  },
}); 