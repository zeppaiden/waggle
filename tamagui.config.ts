import { createTamagui } from 'tamagui'
import { createInterFont } from '@tamagui/font-inter'
import { shorthands } from '@tamagui/shorthands'
import { themes, tokens } from '@tamagui/themes'
import { createMedia } from '@tamagui/react-native-media-driver'

const phthaloGreen = '#123524'
const antiqueWhite = '#FAEBD7'
const black = '#1A1A1A'
const lightGreen = '#1D4D3B'
const darkGreen = '#0A1F15'

const interFont = createInterFont()

const appConfig = createTamagui({
  fonts: {
    heading: interFont,
    body: interFont,
  },
  tokens,
  themes: {
    ...themes,
    light: {
      background: antiqueWhite,
      color: black,
      primary: phthaloGreen,
      secondary: lightGreen,
      card: '#FFFFFF',
      border: '#E6D5C1',
    },
    dark: {
      background: black,
      color: antiqueWhite,
      primary: lightGreen,
      secondary: darkGreen,
      card: '#242424',
      border: '#333333',
    },
  },
  shorthands,
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),
})

export type AppConfig = typeof appConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig 