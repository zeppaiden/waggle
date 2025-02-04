import { useState } from 'react';
import { Platform, Modal, ActivityIndicator } from 'react-native';
import { Stack, XStack, YStack, Text, Button } from 'tamagui';
import { Theme } from 'tamagui';
import { VideoCard } from '@/components/video-card/VideoCard';
import { PetProfile } from '@/components/pet-profile/PetProfile';
import { VideoItem } from '@/types/pets';
import { LAYOUT } from '@/constants/layout';

// Sample video data - in a real app, this would come from an API
const VIDEOS: VideoItem[] = [
  {
    id: '1',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    petName: 'Max',
    age: 3,
    distance: '2.5 km',
    score: 9.2,
    breed: 'Golden Retriever',
    location: 'New York',
    description: 'Friendly and energetic pup who loves to play fetch and go on long walks. Great with kids and other dogs!',
    interests: ['Fetch', 'Swimming', 'Park Visits', 'Treats'],
    owner: {
      name: 'Sarah',
      verified: true,
    },
    photos: [
      'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=500',
      'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=500',
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=500',
    ],
  },
  {
    id: '2',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    petName: 'Luna',
    age: 2,
    distance: '3.1 km',
    score: 8.9,
    breed: 'Persian Cat',
    location: 'Brooklyn',
    description: 'A gentle and affectionate cat who loves cuddles. Perfectly house-trained and great with other cats.',
    interests: ['Napping', 'Bird Watching', 'Laser Games', 'Treats'],
    owner: {
      name: 'Emma',
      verified: true,
    },
    photos: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500',
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=500',
      'https://images.unsplash.com/photo-1492370284958-c20b15c692d2?q=80&w=500',
    ],
  },
  {
    id: '3',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    petName: 'Charlie',
    age: 4,
    distance: '1.8 km',
    score: 9.5,
    breed: 'French Bulldog',
    location: 'Manhattan',
    description: 'Playful and social Frenchie looking for friends. Loves belly rubs and short walks in the park.',
    interests: ['Belly Rubs', 'Short Walks', 'Toys', 'Naps'],
    owner: {
      name: 'Mike',
      verified: false,
    },
    photos: [
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=500',
      'https://images.unsplash.com/photo-1575859431774-2e57ed632664?q=80&w=500',
      'https://images.unsplash.com/photo-1620189507187-4ba2422b5979?q=80&w=500',
    ],
  },
];

export default function VideoTimelineScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Guard against empty video list
  if (VIDEOS.length === 0) {
    return (
      <Theme name="light">
        <YStack f={1} ai="center" jc="center" space="$4">
          <Text fontSize={20} color="$gray11">
            No pets available right now
          </Text>
          <Text fontSize={16} color="$gray10">
            Check back later!
          </Text>
        </YStack>
      </Theme>
    );
  }

  const currentVideo = VIDEOS[currentIndex];

  const loadNextVideo = () => {
    setIsLoading(true);
    if (currentIndex < VIDEOS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleDislike = () => {
    loadNextVideo();
  };

  const handleLike = () => {
    setShowProfile(true);
  };

  const handleContinue = () => {
    setShowProfile(false);
    loadNextVideo();
  };

  return (
    <Theme name="light">
      <YStack f={1} pt={Platform.OS === 'ios' ? 60 : 40} bg="$background">
        <XStack mb="$4" px="$4" ai="center" jc="space-between">
          <Text fontSize={24} fontWeight="bold">
            For You
          </Text>
        </XStack>

        <YStack f={1} ai="center" jc="flex-start">
          <Stack w={LAYOUT.CARD.WIDTH} h={LAYOUT.CARD.HEIGHT} position="relative">
            <VideoCard
              video={currentVideo}
              onLoadingChange={setIsLoading}
            />
            {isLoading && (
              <Stack
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                ai="center"
                jc="center"
                backgroundColor="rgba(0,0,0,0.3)"
              >
                <ActivityIndicator size="large" color="white" />
              </Stack>
            )}
          </Stack>

          <XStack mt="$4" space="$4">
            <Button
              size="$6"
              circular
              onPress={handleDislike}
              bg="$red10"
              disabled={isLoading}
              o={isLoading ? 0.5 : 1}
            >
              <Text fontSize={24}>❌</Text>
            </Button>
            <Button
              size="$6"
              circular
              onPress={handleLike}
              bg="$green10"
              disabled={isLoading}
              o={isLoading ? 0.5 : 1}
            >
              <Text fontSize={24}>🐾</Text>
            </Button>
          </XStack>
        </YStack>

        <Modal
          visible={showProfile}
          animationType="slide"
          onRequestClose={() => setShowProfile(false)}
        >
          <PetProfile
            pet={currentVideo}
            onClose={() => setShowProfile(false)}
            onContinue={handleContinue}
          />
        </Modal>
      </YStack>
    </Theme>
  );
}
