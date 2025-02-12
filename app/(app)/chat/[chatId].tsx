import { View, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, Image, Animated } from 'react-native';
import { Text } from '@/components/themed';
import { Colors } from '@/constants/colors-theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { usePets } from '@/hooks/usePets';
import { useAuth } from '@/contexts/auth';
import { PulsingPaw } from '@/components/ui/PulsingPaw';
import { db, storage } from '@/configs/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { useFavorites } from '@/hooks/useFavorites';
import { generateAIResponse } from '@/services/openai';

type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isRead: boolean;
  chatId: string;
};

function TypingIndicator() {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, []);

  return (
    <View style={[styles.messageContainer, styles.otherMessage]}>
      <View style={[styles.messageBubble, styles.otherBubble, styles.typingBubble]}>
        <View style={styles.typingContainer}>
          {[dot1, dot2, dot3].map((dot, index) => (
            <Animated.View
              key={index}
              style={[
                styles.typingDot,
                {
                  transform: [{
                    translateY: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4]
                    })
                  }]
                }
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function ChatDetailScreen() {
  console.log('[ChatDetail] Screen mounted');
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const router = useRouter();
  const { user } = useAuth();
  const { pets } = usePets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [petImage, setPetImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [isTyping, setIsTyping] = useState(false);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites(user?.uid || '');
  const [isFavorited, setIsFavorited] = useState(false);
  const [messageHistory, setMessageHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);

  const chatId = params.chatId as string;
  const pet = pets.find(p => p.id === chatId);

  const loadPetImage = async () => {
    if (!pet) return;
    
    try {
      setImageLoading(true);
      setImageError(false);
      
      // Try to get photo from Firebase Storage first
      const photosRef = ref(storage, `pets/${pet.id}/photos/0.jpg`);
      try {
        const url = await getDownloadURL(photosRef);
        setPetImage(url);
      } catch (storageError) {
        console.log(`⚠️ Firebase Storage failed for pet ${pet.id}, trying original URL`);
        // If Firebase Storage fails, try using the original URL
        setPetImage(pet.photos[0] || pet.videoUrl);
      }
    } catch (error) {
      console.error(`❌ Error loading image for pet ${pet.id}:`, error);
      setImageError(true);
      setPetImage(pet.photos[0] || pet.videoUrl); // Fallback to original URL
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    if (pet) {
      loadPetImage();
    }
  }, [pet]);

  // Add this helper function at the component level
  const scrollToBottom = (animated = true) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated });
    }
  };

  // Add this helper function at the component level
  const generateChatId = (userId: string, petId: string) => {
    return `${userId}_${petId}`;
  };

  // Update the messages effect to maintain message history
  useEffect(() => {
    if (!chatId || !user) return;

    console.log('[ChatDetail] Setting up messages listener');
    const uniqueChatId = generateChatId(user.uid, chatId);
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('uniqueChatId', '==', uniqueChatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Message[];

      console.log('[ChatDetail] Received messages update:', {
        count: newMessages.length,
        lastMessage: newMessages[newMessages.length - 1]?.text
      });

      setMessages(newMessages);
      
      // Update message history for AI context
      const history = newMessages.map(msg => ({
        role: msg.senderId === user.uid ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));
      setMessageHistory(history);
      
      setIsLoading(false);
      setTimeout(() => scrollToBottom(), 100);
    }, (error) => {
      console.error('[ChatDetail] Error subscribing to messages:', error);
      setIsLoading(false);
    });

    return () => {
      console.log('[ChatDetail] Cleaning up messages listener');
      unsubscribe();
    };
  }, [chatId, user]);

  // Add effect to scroll when typing state changes
  useEffect(() => {
    if (isTyping) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [isTyping]);

  // Add effect to sync favorite state
  useEffect(() => {
    if (user && chatId) {
      setIsFavorited(isFavorite(chatId));
    }
  }, [user, chatId, isFavorite]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !pet) return;

    try {
      const uniqueChatId = generateChatId(user.uid, chatId);
      const messageData = {
        text: newMessage.trim(),
        senderId: user.uid,
        timestamp: serverTimestamp(),
        isRead: false,
        chatId,
        uniqueChatId,
        participants: [user.uid, 'mock-owner-id'],
      };

      console.log('[ChatDetail] Sending message:', messageData);
      await addDoc(collection(db, 'messages'), messageData);
      setNewMessage('');
      scrollToBottom();

      // Show typing indicator
      setIsTyping(true);
      
      try {
        // Generate AI response
        const aiResponse = await generateAIResponse(
          pet,
          messageHistory,
          newMessage.trim()
        );

        // Send AI response
        const responseData = {
          text: aiResponse,
          senderId: 'mock-owner-id',
          timestamp: serverTimestamp(),
          isRead: false,
          chatId,
          uniqueChatId,
          participants: [user.uid, 'mock-owner-id'],
        };
        
        await addDoc(collection(db, 'messages'), responseData);
      } catch (error) {
        console.error('[ChatDetail] Error generating AI response:', error);
        // Send fallback message if AI fails
        const fallbackData = {
          text: `I apologize, but I'm having trouble responding right now. Please try again in a moment.`,
          senderId: 'mock-owner-id',
          timestamp: serverTimestamp(),
          isRead: false,
          chatId,
          uniqueChatId,
          participants: [user.uid, 'mock-owner-id'],
        };
        await addDoc(collection(db, 'messages'), fallbackData);
      } finally {
        setIsTyping(false);
      }

    } catch (error) {
      console.error('[ChatDetail] Error sending message:', error);
      setIsTyping(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !chatId) return;
    
    try {
      if (isFavorited) {
        await removeFavorite(chatId);
      } else {
        await addFavorite(chatId);
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('[ChatDetail] Error toggling favorite:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.uid;

    return (
      <View style={[
        styles.messageContainer,
        isOwn ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwn ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.timestamp,
            isOwn ? styles.ownTimestamp : styles.otherTimestamp
          ]}>
            {format(item.timestamp, 'h:mm a')}
          </Text>
        </View>
      </View>
    );
  };

  if (!pet || isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <PulsingPaw size={60} backgroundColor="transparent" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
        </Pressable>
        <Pressable 
          style={styles.headerContent}
          onPress={() => router.push(`/pet/${chatId}`)}
        >
          {imageLoading ? (
            <View style={[styles.petImage, styles.petImageLoading]}>
              <PulsingPaw size={24} backgroundColor="transparent" />
            </View>
          ) : imageError ? (
            <View style={[styles.petImage, styles.petImageError]}>
              <Ionicons name="image-outline" size={24} color="#666" />
            </View>
          ) : (
            <Image 
              source={{ uri: petImage || undefined }}
              style={styles.petImage}
            />
          )}
          <View style={styles.headerText}>
            <Text style={styles.petName}>{params.petName as string}</Text>
            <Text style={styles.ownerName}>{params.ownerName as string}</Text>
          </View>
        </Pressable>
        <Pressable 
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
        >
          <Ionicons 
            name={isFavorited ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorited ? "#FF2D55" : Colors[theme].text} 
          />
        </Pressable>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons 
              name="chatbubble-outline" 
              size={32} 
              color={Colors.light.primary}
              style={styles.emptyIconBubble}
            />
            <Ionicons 
              name="chatbubble-outline" 
              size={24} 
              color={Colors.light.primary + '80'}
              style={[styles.emptyIconBubble, styles.emptyIconBubbleSmall]}
            />
          </View>
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start the conversation by sending a message!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <Pressable
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim()}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color="#fff"
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  petImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
  },
  ownerName: {
    fontSize: 14,
    color: '#666',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#123524',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    marginBottom: 24,
    position: 'relative',
  },
  emptyIconBubble: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    transform: [{ rotate: '10deg' }],
    backgroundColor: Colors.light.primary + '10',
    padding: 12,
    borderRadius: 20,
  },
  emptyIconBubbleSmall: {
    left: 0,
    top: 0,
    transform: [{ rotate: '-10deg' }],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  typingBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 52,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#123524',
    marginHorizontal: 1,
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 8,
  },
  petImageLoading: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petImageError: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 