import { Platform, Image as RNImage } from 'react-native';
import { Stack, XStack, YStack, Text, Button, ScrollView, Image } from 'tamagui';
import { VideoItem } from '../../types/pets';
import { LAYOUT } from '../../constants/layout';

interface PetProfileProps {
  pet: VideoItem;
  onClose: () => void;
  onContinue: () => void;
}

export function PetProfile({ pet, onClose, onContinue }: PetProfileProps) {
  return (
    <YStack f={1} bg="$background">
      {/* Main Image */}
      <Stack position="relative" height={LAYOUT.CARD.HEIGHT * 0.7}>
        <Image
          source={{ uri: pet.photos[0] }}
          width="100%"
          height="100%"
          resizeMode="cover"
        />
        <Button
          size="$4"
          position="absolute"
          top={Platform.OS === 'ios' ? 60 : 20}
          left={20}
          circular
          onPress={onClose}
          bg="$background"
          opacity={0.9}
        >
          <Text fontSize={20}>←</Text>
        </Button>
      </Stack>

      {/* Thumbnail Images */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} px="$4" mt="$2">
        <XStack space="$2">
          {pet.photos.slice(1).map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              width={80}
              height={80}
              borderRadius="$2"
            />
          ))}
        </XStack>
      </ScrollView>

      {/* Profile Info */}
      <ScrollView bounces={false} px="$4" mt="$4">
        <YStack space="$4">
          {/* Name, Age and Location */}
          <YStack>
            <XStack space="$2" ai="center">
              <Text fontSize={28} fontWeight="bold">
                {pet.petName}
              </Text>
              <Text fontSize={24} color="$gray11">
                {pet.age}
              </Text>
              {pet.owner.verified && (
                <Text fontSize={20} color="$blue10">
                  ✓
                </Text>
              )}
            </XStack>
            <XStack space="$2" ai="center" mt="$1">
              <Text fontSize={16} color="$gray11">
                📍 {pet.location}
              </Text>
              <Text fontSize={16} color="$gray11">
                • {pet.breed}
              </Text>
            </XStack>
          </YStack>

          {/* Match Score */}
          <XStack ai="center" space="$2">
            <Text fontSize={16} color="$gray11">
              Match Score
            </Text>
            <Stack
              backgroundColor="$green5"
              px="$2"
              py="$1"
              br="$4"
            >
              <Text color="$green10" fontWeight="bold">
                {pet.score}
              </Text>
            </Stack>
          </XStack>

          {/* Interests */}
          <YStack space="$2">
            <Text fontSize={16} fontWeight="bold" color="$gray11">
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
                  <Text fontSize={14} color="$gray11">
                    {interest}
                  </Text>
                </Stack>
              ))}
            </XStack>
          </YStack>

          {/* About */}
          <YStack space="$2">
            <Text fontSize={16} fontWeight="bold" color="$gray11">
              About
            </Text>
            <Text fontSize={14} color="$gray11">
              {pet.description}
            </Text>
          </YStack>

          {/* Action Buttons */}
          <XStack mt="$4" mb="$6" space="$4" jc="center">
            <Button
              size="$6"
              circular
              onPress={onClose}
              bg="$red10"
            >
              <Text fontSize={24}>❌</Text>
            </Button>
            <Button
              size="$6"
              circular
              onPress={onContinue}
              bg="$green10"
            >
              <Text fontSize={24}>🐾</Text>
            </Button>
          </XStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
} 