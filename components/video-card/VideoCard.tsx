import { useRef, useState, useEffect } from 'react';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Stack, YStack, Text } from 'tamagui';
import { VideoItem } from '../../types/pets';

interface VideoCardProps {
  video: VideoItem;
  onLoadingChange: (isLoading: boolean) => void;
}

export function VideoCard({ video, onLoadingChange }: VideoCardProps) {
  const videoRef = useRef<Video>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup video resources on unmount
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      onLoadingChange(false);
      setError(null);
    } else {
      // Handle error state
      if (status.error) {
        setError('Failed to load video');
        onLoadingChange(false);
      }
    }
  };

  const onError = () => {
    setError('Failed to load video');
    onLoadingChange(false);
  };

  return (
    <Stack
      w="100%"
      h="100%"
      br="$4"
      bg="black"
      position="relative"
      overflow="hidden"
      ai="center"
      jc="center"
    >
      {error ? (
        <YStack ai="center" space="$2">
          <Text color="white" fontSize={16}>
            {error}
          </Text>
          <Text color="$gray10" fontSize={14}>
            Try again later
          </Text>
        </YStack>
      ) : (
        <>
          <Video
            ref={videoRef}
            source={{ uri: video.url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            onError={onError}
            onLoadStart={() => onLoadingChange(true)}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          />
          <YStack
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            p="$4"
            backgroundColor="rgba(0,0,0,0.6)"
          >
            <Text color="white" fontSize={24} fontWeight="bold" mb="$2">
              {video.petName}, {video.age}
            </Text>
            <Text color="white" fontSize={16} mb="$2">
              {video.distance} away
            </Text>
            <Text color="white" fontSize={16}>
              Match Score: {video.score}
            </Text>
          </YStack>
        </>
      )}
    </Stack>
  );
} 