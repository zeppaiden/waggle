import { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PulsingPawProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export function PulsingPaw({ 
  size = 50, 
  color = '#fff',
  backgroundColor = 'rgba(0,0,0,0.3)'
}: PulsingPawProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]);

    Animated.loop(pulse).start();

    return () => {
      scaleAnim.stopAnimation();
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons name="paw" size={size} color={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 