import { Platform } from 'react-native';
import { Stack, XStack, YStack, Text, Button, ScrollView, Image } from 'tamagui';
import { VideoItem } from '../../types/pets';

interface PetProfileProps {
  pet: VideoItem;
  onClose: () => void;
  onContinue: () => void;
}

export function PetProfile({ pet, onClose, onContinue }: PetProfileProps) {
  return (
    <YStack f={1} bg="$background" pt={Platform.OS === 'ios' ? 60 : 40}>
      <ScrollView bounces={false}>
        <YStack space="$4" p="$4">
          <Button
            size="$4"
            alignSelf="flex-end"
            onPress={onClose}
          >
            <Text fontSize={20}>✕</Text>
          </Button>

          <XStack space="$2">
            {pet.photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                width={100}
                height={100}
                borderRadius="$2"
              />
            ))}
          </XStack>

          <YStack space="$2">
            <XStack ai="center" space="$2">
              <Text fontSize={28} fontWeight="bold">
                {pet.petName}
              </Text>
              <Text fontSize={24} color="$gray10">
                {pet.age} years
              </Text>
            </XStack>

            <XStack ai="center" space="$2">
              <Text fontSize={18} color="$gray11">
                📍 {pet.location}
              </Text>
              <Text fontSize={18} color="$gray11">
                • {pet.breed}
              </Text>
            </XStack>
          </YStack>

          <YStack space="$2">
            <Text fontSize={20} fontWeight="bold">
              About
            </Text>
            <Text fontSize={16} color="$gray11">
              {pet.description}
            </Text>
          </YStack>

          <YStack space="$2">
            <Text fontSize={20} fontWeight="bold">
              Interests
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              {pet.interests.map((interest, index) => (
                <Stack
                  key={index}
                  bg="$gray5"
                  px="$3"
                  py="$2"
                  br="$4"
                >
                  <Text fontSize={14}>{interest}</Text>
                </Stack>
              ))}
            </XStack>
          </YStack>

          <YStack space="$2">
            <Text fontSize={20} fontWeight="bold">
              Owner
            </Text>
            <XStack ai="center" space="$2">
              <Text fontSize={16}>
                {pet.owner.name}
              </Text>
              {pet.owner.verified && (
                <Text fontSize={16} color="$blue10">
                  ✓ Verified
                </Text>
              )}
            </XStack>
          </YStack>

          <Button
            size="$6"
            bg="$green10"
            onPress={onContinue}
          >
            <Text color="white" fontSize={18}>
              Continue Browsing
            </Text>
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
} 