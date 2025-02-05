/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const phthaloGreen = '#123524';
const white = '#FFFFFF';
const black = '#1A1A1A';
const lightGreen = '#1D4D3B';
const darkGreen = '#0A1F15';

export const Colors = {
  light: {
    text: black,
    background: white,
    tint: phthaloGreen,
    icon: lightGreen,
    tabIconDefault: '#687076',
    tabIconSelected: phthaloGreen,
    card: white,
    border: '#E6E6E6',
    notification: phthaloGreen,
    primary: phthaloGreen,
    secondary: lightGreen,
  },
  dark: {
    text: white,
    background: black,
    tint: lightGreen,
    icon: white,
    tabIconDefault: '#9BA1A6',
    tabIconSelected: lightGreen,
    card: '#242424',
    border: '#333333',
    notification: lightGreen,
    primary: lightGreen,
    secondary: darkGreen,
  },
};
