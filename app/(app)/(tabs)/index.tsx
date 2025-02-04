import { useState, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Stack, XStack, YStack, Text, Button } from 'tamagui';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Theme } from 'tamagui';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = WINDOW_WIDTH - 32;
const CARD_HEIGHT = CARD_WIDTH * 1.5; // 2:3 aspect ratio for portrait videos

interface VideoItem {
  id: string;
  url: string;
  petName: string;
  age: number;
  distance: string;
  score: number;
}

const CURRENT_VIDEO: VideoItem = {
  id: '1',
  url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  petName: 'Max',
  age: 3,
  distance: '2.5 km',
  score: 9.2,
};

export default function VideoTimelineScreen() {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
    }
  };

  const handleDislike = () => {
    console.log('Disliked video:', CURRENT_VIDEO.id);
  };

  const handleLike = () => {
    console.log('Liked video:', CURRENT_VIDEO.id);
  };

  return (
    <Theme>
      <YStack f={1} backgroundColor="$background" pt={Platform.OS === 'ios' ? 50 : 30}>
        {/* Header */}
        <XStack px="$4" py="$3" ai="center" space="$2" mb="$4">
          <Text fontSize={28} fontWeight="600" color="$color">Pets Nearby</Text>
          <IconSymbol name="location.fill" size={20} color="$secondary" />
        </XStack>

        {/* Card Container */}
        <YStack f={1} ai="center" jc="flex-start" pb="$10">
          <Stack
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            borderRadius={20}
            overflow="hidden"
            backgroundColor="$card"
            shadowColor="$color"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.1}
            shadowRadius={8}
          >
            {/* Video */}
            <Video
              ref={videoRef}
              source={{ uri: CURRENT_VIDEO.url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay
              isMuted={false}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            />

            {/* Pet Info Overlay */}
            <Stack
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              backgroundColor="rgba(0,0,0,0.4)"
              py="$3"
              px="$4"
            >
              <XStack jc="space-between" ai="center">
                <YStack>
                  <Text color="white" fontSize={20} fontWeight="600">
                    {CURRENT_VIDEO.petName}, {CURRENT_VIDEO.age}
                  </Text>
                  <Text color="white" fontSize={14} o={0.9}>
                    {CURRENT_VIDEO.distance}
                  </Text>
                </YStack>
                <Text color="white" fontSize={20} fontWeight="600">
                  {CURRENT_VIDEO.score}
                </Text>
              </XStack>
            </Stack>
          </Stack>

          {/* Action Buttons */}
          <XStack mt="$6" space="$6">
            <Button
              size="$7"
              circular
              backgroundColor="#FF4C4C"
              onPress={handleDislike}
              pressStyle={{ opacity: 0.7 }}
              icon={<IconSymbol name="xmark" size={32} color="white" />}
            />
            <Button
              size="$7"
              circular
              backgroundColor="$primary"
              onPress={handleLike}
              pressStyle={{ opacity: 0.7 }}
              icon={<IconSymbol name="pawprint.fill" size={32} color="white" />}
            />
          </XStack>
        </YStack>
      </YStack>
    </Theme>
  );
}
