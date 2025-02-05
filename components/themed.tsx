import { Text as TamaguiText, Button as TamaguiButton, Input, styled } from 'tamagui';
import { Colors } from '@/constants/colors-theme';
import { useColorScheme } from '@/hooks/useColorScheme';

const StyledText = styled(TamaguiText, {
  color: Colors.light.text,
  variants: {
    theme: {
      dark: {
        color: Colors.dark.text,
      },
      light: {
        color: Colors.light.text,
      },
    },
  },
});

const StyledButton = styled(TamaguiButton, {
  backgroundColor: Colors.light.primary,
  color: Colors.light.text,
  borderRadius: 8,
  variants: {
    theme: {
      dark: {
        backgroundColor: Colors.dark.primary,
        color: Colors.dark.text,
      },
      light: {
        backgroundColor: Colors.light.primary,
        color: Colors.light.text,
      },
    },
    variant: {
      text: {
        backgroundColor: 'transparent',
        color: Colors.light.primary,
      },
    },
  },
});

const StyledInput = styled(Input, {
  backgroundColor: Colors.light.card,
  color: Colors.light.text,
  borderColor: Colors.light.border,
  borderWidth: 1,
  borderRadius: 8,
  padding: 12,
  variants: {
    theme: {
      dark: {
        backgroundColor: Colors.dark.card,
        color: Colors.dark.text,
        borderColor: Colors.dark.border,
      },
      light: {
        backgroundColor: Colors.light.card,
        color: Colors.light.text,
        borderColor: Colors.light.border,
      },
    },
  },
});

export function Text(props: React.ComponentProps<typeof StyledText>) {
  const colorScheme = useColorScheme();
  return <StyledText theme={colorScheme ?? 'light'} {...props} />;
}

export function Button(props: React.ComponentProps<typeof StyledButton>) {
  const colorScheme = useColorScheme();
  return <StyledButton theme={colorScheme ?? 'light'} {...props} />;
}

export function TextInput(props: React.ComponentProps<typeof StyledInput>) {
  const colorScheme = useColorScheme();
  return <StyledInput theme={colorScheme ?? 'light'} {...props} />;
} 