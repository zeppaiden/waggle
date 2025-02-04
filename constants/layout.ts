import { Dimensions } from 'react-native';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export const LAYOUT = {
  CARD: {
    WIDTH: WINDOW_WIDTH - 32,
    get HEIGHT() {
      return this.WIDTH * 1.5; // 2:3 aspect ratio for portrait videos
    },
  },
  SPACING: {
    PADDING: 16,
  },
} as const; 