import { View, StyleSheet, FlatList, Pressable, Image, Alert, Animated } from 'react-native';
import { Text } from '@/components/themed';
import { Colors } from '@/constants/colors-theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth';
import { formatDistanceToNow } from 'date-fns';
import { usePets } from '@/hooks/usePets';
import { db } from '@/configs/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';
import { PulsingPaw } from '@/components/ui/PulsingPaw';

type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isRead: boolean;
  chatId: string;
};

type Chat = {
  petId: string;
  petName: string;
  petImage: string;
  ownerId: string;
  ownerName: string;
  lastMessage: Message;
};

export default function ChatScreen() {
  console.log('[ChatList] Screen mounted');
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const router = useRouter();
  const { user } = useAuth();
  const { pets } = usePets();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pressedChatId, setPressedChatId] = useState<string | null>(null);
  const longPressProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) return;

    console.log('[ChatList] Setting up messages listener');
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      // Group messages by chatId to get latest message for each chat
      const chatMessages = new Map<string, Message>();
      snapshot.docs.forEach(doc => {
        const message = {
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        } as Message;

        // Only keep the latest message for each chat
        const existingMessage = chatMessages.get(message.chatId);
        if (!existingMessage || message.timestamp > existingMessage.timestamp) {
          chatMessages.set(message.chatId, message);
        }
      });

      // Convert messages to chat objects
      const chatList = Array.from(chatMessages.values()).map(message => {
        const pet = pets.find(p => p.id === message.chatId);
        if (!pet) return null;

        return {
          petId: pet.id,
          petName: pet.name,
          petImage: pet.photos[0] || pet.videoUrl,
          ownerId: pet.owner.id,
          ownerName: pet.owner.name,
          lastMessage: message,
        };
      }).filter((chat): chat is Chat => chat !== null);

      console.log('[ChatList] Updated chats:', { count: chatList.length });
      setChats(chatList);
      setIsLoading(false);
    }, (error) => {
      console.error('[ChatList] Error subscribing to messages:', error);
      setIsLoading(false);
    });

    return () => {
      console.log('[ChatList] Cleaning up messages listener');
      unsubscribe();
    };
  }, [user, pets]);

  const handleDeleteChat = async (chatId: string, petName: string) => {
    Alert.alert(
      "Delete Chat",
      `Are you sure you want to delete your chat with ${petName}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Send final message
              const finalMessage = {
                text: "User has left the chat",
                senderId: user?.uid,
                timestamp: serverTimestamp(),
                isRead: false,
                chatId,
                participants: [user?.uid || '', 'mock-owner-id'],
              };
              await addDoc(collection(db, 'messages'), finalMessage);

              // Delete all messages for this chat
              const messagesRef = collection(db, 'messages');
              const q = query(messagesRef, where('chatId', '==', chatId));
              const snapshot = await getDocs(q);
              
              // Delete each message
              const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
              await Promise.all(deletePromises);

              console.log('[ChatList] Successfully deleted chat:', chatId);
            } catch (error) {
              console.error('[ChatList] Error deleting chat:', error);
              Alert.alert('Error', 'Failed to delete chat. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handlePressIn = (chatId: string) => {
    setPressedChatId(chatId);
    Animated.timing(longPressProgress, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setPressedChatId(null);
        longPressProgress.setValue(0);
      }
    });
  };

  const handlePressOut = () => {
    setPressedChatId(null);
    Animated.timing(longPressProgress, {
      toValue: 0,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const isPressed = pressedChatId === item.petId;

    const handlePress = () => {
      console.log('[ChatList] Chat item pressed:', {
        petId: item.petId,
        petName: item.petName
      });

      router.push({
        pathname: "/(app)/chat/[chatId]",
        params: {
          chatId: item.petId,
          petName: item.petName,
          petImage: item.petImage,
          ownerName: item.ownerName
        }
      });
    };

    return (
      <Pressable 
        style={styles.chatItem} 
        onPress={handlePress}
        onLongPress={() => handleDeleteChat(item.petId, item.petName)}
        onPressIn={() => handlePressIn(item.petId)}
        onPressOut={handlePressOut}
        delayLongPress={500}
      >
        {isPressed && (
          <Animated.View style={[
            styles.deleteOverlay,
            {
              backgroundColor: longPressProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(255, 59, 48, 0)', 'rgba(255, 59, 48, 0.2)']
              })
            }
          ]}>
            <Animated.View style={[
              styles.trashIconContainer,
              {
                opacity: longPressProgress,
                transform: [{
                  scale: longPressProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1]
                  })
                }]
              }
            ]}>
              <Ionicons name="trash-outline" size={20} color="#ff3b30" />
            </Animated.View>
          </Animated.View>
        )}

        <Image 
          source={{ uri: item.petImage }}
          style={styles.petImage}
        />
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.petName}>{item.petName}</Text>
            <Text style={styles.timestamp}>
              {formatDistanceToNow(item.lastMessage.timestamp, { addSuffix: true })}
            </Text>
          </View>
          <Text style={styles.ownerName}>Owner: {item.ownerName}</Text>
          <Text 
            style={styles.lastMessage}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.lastMessage.senderId === user?.uid ? 'You: ' : ''}
            {item.lastMessage.text}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyTitle}>Please Sign In</Text>
        <Text style={styles.emptySubtitle}>Sign in to view your conversations</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <PulsingPaw size={60} backgroundColor="transparent" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {chats.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="chatbubbles-outline" size={48} color={Colors[theme].text} />
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation by favoriting a pet!
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.petId}
          contentContainerStyle={styles.chatList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  chatList: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  ownerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#444',
  },
  deleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    zIndex: 1,
  },
  trashIconContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
});
