import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Text } from '@/components/themed';
import { Colors } from '@/constants/colors-theme';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBackground?: string;
  index: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  isLast?: boolean;
}

export default function TutorialCard({
  title,
  description,
  icon,
  iconBackground = Colors.light.primary + '20',
  index,
  totalSteps,
  onNext,
  onSkip,
  isLast = false,
}: TutorialCardProps) {
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, [index]);

  const handleNext = () => {
    onNext();
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.skipButton} 
        onPress={handleSkip}
        hitSlop={20}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={48} color={Colors.light.primary} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressDots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index && styles.activeDot
              ]}
            />
          ))}
        </View>

        <Pressable 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          {!isLast && (
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color="#fff" 
              style={styles.nextButtonIcon}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    padding: 8,
    zIndex: 1,
  },
  skipText: {
    color: Colors.light.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: Colors.light.primary,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    lineHeight: 26,
  },
  footer: {
    paddingBottom: 48,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  activeDot: {
    backgroundColor: Colors.light.primary,
    width: 24,
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  nextButtonIcon: {
    marginLeft: 8,
  },
}); 