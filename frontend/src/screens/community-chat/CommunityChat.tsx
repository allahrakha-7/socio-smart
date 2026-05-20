import React, { useState, memo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  NativeModules,
  Alert,
  Image,
  TouchableWithoutFeedback,
  StatusBar,
  Modal,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { io, Socket } from 'socket.io-client';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiBaseUrl } from '../../utils/apiConfig';
import ImagePicker from 'react-native-image-crop-picker';
import StatusModal, { ModalType } from '../../components/modals/StatusModal';
import {
  MoreVertical,
  Image as ImageIcon,
  Send,
  Heart,
  MessageSquare,
  User,
  ShieldCheck,
  Siren,
  Paperclip,
  Smile,
  ArrowLeft,
  X,
  CheckCircle2,
  Camera,
  FileText,
  Music,
  BarChart2,
  Calendar,
  Download,
  MapPin,
  Plus,
  Users,
  MessageCircle,
  Pencil,
  Trash2,
  Flag,
  Check,
  CheckCheck
} from 'lucide-react-native';

// --- Types ---
type UserRole = 'resident' | 'admin' | 'guard';

interface PostData {
  id: string;
  ownerId?: string;
  createdAt?: string;
  userName: string;
  profileImage?: string | null;
  role: UserRole;
  time: string;
  content: string;
  imageUri?: string;
  likes: number;
  comments: number;
  isVerified?: boolean;
  type?: 'text' | 'image' | 'poll' | 'event' | 'file';
  poll?: {
    question: string;
    options: { _id: string, text: string, votes: string[] }[];
  };
  event?: {
    title: string;
    date: string;
    location: string;
    description: string;
  };
  file?: {
    name: string;
    url: string;
    fileType: string;
  };
}

// --- Constants & Data ---
const EMOJIS = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
  gestures: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦶', '🦵', '🦿', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄'],
  nature: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🪰', '🪲', '🪳', '🦂', '🕷', '🕸', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦣', '🦏', '🦛', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔', '🐾', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🪴', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🪨', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐️', '🌟', '✨', '⚡️', '☄️', '💥', '🔥', '🌪', '🌈', '☀️', '🌤', '⛅️', '🌥', '☁️', '🌦', '🌧', '⛈', '🌩', '🌨', '❄️', '☃️', '⛄️', '🌬', '💨', '💧', '💦', '☔️', '🌊', '🌫'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥣', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🧂', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '☕️', '🫖', '🍵', '🍶', '🍼', '🥤', '🧋', '🧃', '🧉', '🧊', '🥢', '🍽', '🏺'],
  activities: ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳️', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '⛸', '🎿', '🛷', '🎯', '🎮', '🕹'],
  travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍', '🛺', '🚞', '⛴', '⛰', '🏔', '🗻', '🏕', '⛺️', '🏠', '🏡', '🏢', '🏗', '🏘', '🏙', '🏚', '⛪️', '🕌', '🕍', '🕋', '⛩', '🛤', '🛣', '🗾', '🎑', '🏞', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🌃', '🌌', '🌉', '🌁'],
  objects: ['⌚️', '📱', '📲', '💻', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛️', '⏳', '📡', '🔋', '🔌', '💡', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒', '🛠', '⛏', '🪓', '🔩', '⚙️', '🪤', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪚', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🧼', '🪥', '🪒', '🧽', '🪣', '💄', '🔔', '🗝', '🔑', '🚪', '🪑', '🛋', '🛏', '🛌', '🧸', '🪆', '🖼', '🪞', '🪄', '🏮', '🛍', '🛒', '🎁', '🎈', '🪁', '🎀', '🪄', '🎊', '🎉'],
  symbols: ['💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛️', '⬜️', '💯', '💢', '💥', '💫', '💦', '💨', '🕳', '💣', '💬', '👁‍🗨', '🗨', '🗯', '💭', '💤', '♨️', '🛑', '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦', '🌀', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄️', '🎴', '🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '🎼', '🎵', '🎶', '✳️', '✴️', '❇️', '‼️', '⁉️', '❓', '❔', '❕', '❗️', '〰️', '➰', '➿', '♻️', '♿️', '🚮', '🚰', '🚹', '🚺', '🚻', '🚼', '🚾', '⚠️', '🚸', '⛔️', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '🔞', '☢️', '☣️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '☯️', '🕉', '☸️', '☮️', '🕎', '🔯', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '⛎'],
  flags: ['🇦🇪', '🇵🇰', '🇸🇦', '🇹🇷', '🇺🇸', '🇬🇧', '🇨🇦', '🇧🇷', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇯🇵', '🇰🇷', '🇮🇳', '🇨🇳', '🇷🇺', '🇮🇩', '🇦🇺', '🇿🇦', '🇦🇫', '🇧🇩', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇹', '🇧🇴', '🇧🇦', '🇧🇼', '🇧🇳', '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇻', '🇹🇩', '🇨🇱', '🇨🇴', '🇰🇲', '🇨🇬', '🇨🇩', '🇨🇷', '🇨🇮', '🇭🇷', '🇨🇺', '🇨🇾', '🇨🇿', '🇩🇰', '🇩🇮', '🇩🇲', '🇩🇴', '🇪🇨', '🇪🇬', '🇸🇻', '🇬🇶', '🇪🇷', '🇪🇪', '🇪🇹', '🇫🇮', '🇬🇦', '🇬🇲', '🇬🇪', '🇬🇭', '🇬🇮', '🇬🇷', '🇬🇱', '🇬🇩', '🇬🇺', '🇬🇹', '🇬🇳', '🇬🇾', '🇭🇹', '🇭🇳', '🇭🇰', '🇭🇺', '🇮🇸', '🇮🇷', '🇮🇶', '🇮🇪', '🇮🇱', '🇯🇲', '🇯🇴', '🇰🇪', '🇰🇼', '🇰🇬', '🇱🇦', '🇱🇻', '🇱🇧', '🇱🇾', '🇱🇮', '🇱🇹', '🇱🇺', '🇲🇰', '🇲🇬', '🇲🇾', '🇲🇻', '🇲🇱', '🇲🇹', '🇲🇦', '🇳🇵', '🇳🇱', '🇳🇿', '🇳🇮', '🇳🇪', '🇳🇬', '🇵🇸', '🇵🇦', '🇵🇾', '🇵🇪', '🇵🇭', '🇵🇱', '🇵🇹', '🇵🇷', '🇶🇦', '🇷🇴', '🇷🇼', '🇸🇲', '🇸🇳', '🇷🇸', '🇸🇬', '🇸🇰', '🇸🇮', '🇱🇰', '🇸🇩', '🇸🇪', '🇨🇭', '🇸🇾', '🇹🇼', '🇹🇯', '🇹🇿', '🇹🇭', '🇹🇳', '🇺🇦', '🇺🇾', '🇺🇿', '🇻🇪', '🇻🇳', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿']
};

// --- Config & Auth ---
const SESSION_KEY = '@sociosmart/session_v1';

const formatLastSeen = (dateStr: string) => {
  if (!dateStr) return 'Offline';
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (d.toDateString() === today.toDateString()) return `last seen today at ${time}`;

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `last seen yesterday at ${time}`;

    const day = d.toLocaleDateString([], { weekday: 'short' });
    return `last seen ${day.toLowerCase()} at ${time}`;
  } catch (e) {
    return 'Offline';
  }
};


const CommunityChat = () => {
  const navigation = useNavigation<any>();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'residents' | 'chat'>('posts');
  const [residents, setResidents] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [statusModal, setStatusModal] = useState<{ visible: boolean; type: ModalType; title: string; message: string }>({ visible: false, type: 'error', title: '', message: '' });

  const showError = (title: string, message: string, type: ModalType = 'error') => {
    setStatusModal({ visible: true, title, message, type });
  };

  // Creation Modals
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  // UI States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [activeEmojiCat, setActiveEmojiCat] = useState<keyof typeof EMOJIS>('smileys');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [showPrivateChat, setShowPrivateChat] = useState(false);

  const [socket, setSocket] = useState<Socket | null>(null);
  const inputRef = useRef<TextInput>(null);
  const chatVisibleRef = useRef(false);
  const selectedResidentRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);

  // Keep refs in sync with state
  useEffect(() => { chatVisibleRef.current = showPrivateChat; }, [showPrivateChat]);
  useEffect(() => { selectedResidentRef.current = selectedResident; }, [selectedResident]);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // --- Logic: Data Fetching ---
  const fetchData = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');
      setSession(parsed);

      const fetchWithTimeout = (url: string, options: any) => {
        return Promise.race([
          fetch(url, options),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]) as Promise<Response>;
      };

      const headers = { Authorization: `Bearer ${parsed.token}` };

      // Fetch all required data concurrently and safely
      await Promise.allSettled([
        fetchWithTimeout(`${baseUrl}/api/community/posts`, { headers })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              setPosts(data || []);
            }
          }),
        fetchWithTimeout(`${baseUrl}/api/community/residents`, { headers })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              setResidents(data || []);
            }
          }),
        fetchWithTimeout(`${baseUrl}/api/community/chats`, { headers })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              setChatHistory(data || []);
            }
          })
      ]);

    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!session?.token) return;

    // Socket.io securely authenticates with JWT
    const baseUrl = getApiBaseUrl();
    const socketInst = io(baseUrl, {
      transports: ['websocket'],
      reconnection: true,
      auth: { token: session.token }
    });
    setSocket(socketInst);

    socketInst.on('connect', () => {
      console.log('[Socket] Connected Securely:', socketInst.id);
      socketInst.emit('join_community');
    });

    socketInst.on('receive_new_post', (newPost: any) => {
      console.log('[Socket] New post received:', newPost._id);
      setPosts(prev => {
        const exists = prev.some(p => p._id === newPost._id);
        return exists ? prev : [newPost, ...prev];
      });
    });

    socketInst.on('update_online_users', (users: string[]) => {
      console.log('[Socket] Online users updated:', users.length);
      setOnlineUsers(users);
    });

    socketInst.on('receive_message', (newChat: any) => {
      console.log('[Socket] New message received:', newChat._id, 'isPrivate:', newChat.isPrivate);
      setChatHistory(prev => {
        const exists = prev.some(c => c._id === newChat._id);
        return exists ? prev : [...prev, newChat];
      });

      // Increment unread count if chat modal is not open for this resident
      if (newChat.isPrivate) {
        const senderId = (newChat.sender?._id || newChat.sender)?.toString();
        const isCurrentChatOpen = chatVisibleRef.current && selectedResidentRef.current?._id?.toString() === senderId;
        const isMyOwnMessage = senderId === sessionRef.current?._id?.toString();

        if (!isCurrentChatOpen && !isMyOwnMessage) {
          setUnreadCounts(prev => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1
          }));
        }
      }
    });

    socketInst.on('message_deleted', (data: any) => {
      console.log('[Socket] Message deleted:', data.messageId);
      setChatHistory(prev => {
        if (data.isDeletedForMe) {
          return prev.filter(c => c._id !== data.messageId);
        }
        if (data.isDeleted) {
          return prev.map(c => c._id === data.messageId ? { ...c, isDeleted: true, content: data.content, image: null, video: null, file: null } : c);
        }
        return prev;
      });
    });

    socketInst.on('receive_post_update', (updatedPost: any) => {
      setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    });

    socketInst.on('receive_post_delete', (deletedPostId: string) => {
      setPosts(prev => prev.filter(p => p._id !== deletedPostId));
    });

    socketInst.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    return () => {
      socketInst.disconnect();
    };
  }, [session?.token]);


  // --- Logic: Post Submission ---
  const handlePost = async (type: string = 'text', additionalData: any = {}) => {
    if (!inputText.trim() && !selectedImage && type === 'text') return;

    try {
      const baseUrl = getApiBaseUrl();
      const actualType = selectedImage ? 'image' : type;
      const payload: any = {
        content: inputText.trim() || (type === 'text' ? '' : ''), // Empty string if no text provided
        type: actualType,
        image: selectedImage,
        ...additionalData
      };

      const url = editingPostId ? `${baseUrl}/api/community/posts/${editingPostId}` : `${baseUrl}/api/community/posts`;
      const method = editingPostId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resultPost = await response.json();
        setPosts(prev => {
          if (editingPostId) {
            return prev.map(p => p._id === resultPost._id ? resultPost : p);
          }
          const exists = prev.some(p => p._id === resultPost._id);
          return exists ? prev : [resultPost, ...prev];
        });
        setInputText('');
        setSelectedImage(null);
        setEditingPostId(null);
        setShowPollModal(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        setShowEventModal(false);
        setEventName('');
        setEventDate('');
        setEventLocation('');
        setEventDescription('');
        Keyboard.dismiss();
      }
    } catch (error) {
      showError('Error', 'Could not share your update.');
    }
  };

  const handleInitEdit = (post: any) => {
    if (post.type !== 'text' && post.type !== 'image') {
      showError('Notice', 'Only standard posts can be edited. Polls and events cannot be modified once fully committed.', 'warning');
      return;
    }
    setEditingPostId(post.id);
    setInputText(post.content);
    if (post.imageUri) setSelectedImage(post.imageUri);
    setShowComposeModal(true);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (response.ok) {
        setPosts(prev => prev.filter(p => p._id !== postId));
      } else {
        const data = await response.json();
        showError('Error', data.message || 'Could not delete post.');
      }
    } catch (e) { }
  };

  const handleVote = async (postId: string, optionId: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/community/posts/${postId}/vote`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ optionId })
      });
      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
      }
    } catch (e) { }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/community/posts/${postId}/like`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
      }
    } catch (e) { }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!text.trim()) return;
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ text })
      });
      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
      }
    } catch (e) { }
  };


  // --- Logic: Media Picking ---
  const handlePickImage = async () => {
    try {
      const response: any = await ImagePicker.openPicker({
        width: 1200, height: 1200, cropping: true, compressImageQuality: 0.7,
        includeBase64: true
      });
      setSelectedImage(`data:${response.mime};base64,${response.data}`);
      setShowAttachMenu(false);
    } catch (e) { console.log("Picker Cancelled"); }
  };



  const handleCamera = async () => {
    try {
      const response: any = await ImagePicker.openCamera({
        width: 1200,
        height: 1200,
        cropping: true,
        compressImageQuality: 0.7,
        includeBase64: true,
        mediaType: 'photo'
      });
      if (response && response.data && response.mime) {
        setSelectedImage(`data:${response.mime};base64,${response.data}`);
        setShowAttachMenu(false);
      }
    } catch (e: any) {
      console.log("Camera Cancelled/Error", e);
      if (e?.code !== 'E_PICKER_CANCELLED') {
        showError('Camera Error', 'Could not open camera. Please ensure permissions are granted.');
      }
    }
  };



  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#1877F2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#FFFFFF"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* --- Header --- */}
        <View className="flex-row items-center px-6 py-2 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
          <TouchableOpacity
            onPress={() => { }} // Handle back navigation if needed, or omit if not applicable
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Community Chat</Text>
            {(() => {
              const uniqueProfiles = Object.keys(unreadCounts).filter(id => unreadCounts[id] > 0).length;
              return uniqueProfiles > 0 ? (
                <View className="ml-2 bg-red-500 px-2 py-0.5 rounded-full shadow-sm">
                  <Text className="text-white text-[10px] font-black">{uniqueProfiles}</Text>
                </View>
              ) : null;
            })()}
          </View>
        </View>

        <View className="flex-row items-center px-4 pt-4 bg-white dark:bg-zinc-950">
          {(['posts', 'chat'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 items-center pb-3 relative"
            >
              <View className="flex-row items-center">
                <Text className={`text-[12px] font-satoshi-bold uppercase tracking-[2px] ${activeTab === tab ? 'text-primary' : 'text-neutral-medium dark:text-zinc-500'}`}>
                  {tab === 'posts' ? 'Community' : 'Chat'}
                </Text>
                {tab === 'chat' && (() => {
                  const uniqueProfiles = Object.keys(unreadCounts).filter(id => unreadCounts[id] > 0).length;
                  return uniqueProfiles > 0 ? (
                    <View className="ml-1.5 bg-red-500 px-1.5 py-0.5 rounded-full">
                      <Text className="text-white text-[9px] font-black">{uniqueProfiles}</Text>
                    </View>
                  ) : null;
                })()}
              </View>
              {activeTab === tab && <View className="absolute bottom-0 left-[25%] right-[25%] h-[3px] bg-primary rounded-full" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* --- Main Content --- */}
        <View className="flex-1">
          {activeTab === 'posts' && (
            <ScrollView className="flex-1 px-4 pt-4">
              {posts.length === 0 ? (
                <View className="flex-1 items-center justify-center py-20">
                  <View className="w-20 h-20 bg-neutral-50 dark:bg-zinc-900 rounded-full items-center justify-center mb-4">
                    <MessageSquare size={32} color={colorScheme === 'dark' ? '#3F3F46' : "#ADB5BD"} />
                  </View>
                  <Text className="text-neutral-medium dark:text-zinc-500 font-bold text-center px-10">No updates yet. Be the first to share something with the community!</Text>
                </View>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post._id}
                    sessionUserId={session?._id}
                    sessionRole={session?.role}
                    onInitEdit={handleInitEdit}
                    onDeletePost={handleDeletePost}
                    post={{
                      id: post._id,
                      ownerId: post.user?._id,
                      createdAt: post.createdAt,
                      userName: post.user?.full_name || post.user?.name || 'Member',
                      profileImage: post.user?.profile_image || null,
                      role: post.user?.role || 'resident',
                      house: post.user?.house_number || 'A-101',
                      time: new Date(post.createdAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                      content: post.content,
                      imageUri: post.image,
                      likes: post.likes?.length || 0,
                      comments: post.comments?.length || 0,
                      isVerified: post.user?.role === 'admin',
                      rawLikes: post.likes,
                      type: post.type,
                      poll: post.poll,
                      event: post.event,
                      file: post.file
                    }}

                    onLike={() => handleToggleLike(post._id)}
                    onVote={(optId: string) => handleVote(post._id, optId)}
                    onAddComment={(text: string) => handleAddComment(post._id, text)}
                    commentsData={post.comments || []}
                  />
                ))
              )}
              <View className="h-24" />
            </ScrollView>
          )}

          {activeTab === 'chat' && (
            <ScrollView className="flex-1 px-4 pt-4">
              <View className="mb-6">
                {residents.length === 0 ? (
                  <Text className="text-xs text-neutral-medium dark:text-zinc-500 italic ml-2">No residents available.</Text>
                ) : (
                  <ResidentDirectory
                    residents={residents.filter(r => r._id !== session?._id)}
                    onMessage={(res) => {
                      setSelectedResident(res);
                      setShowPrivateChat(true);
                      // Clear unread count when opening chat
                      setUnreadCounts(prev => ({ ...prev, [res._id]: 0 }));
                    }}
                    onlineUsers={onlineUsers}
                    unreadCounts={unreadCounts}
                  />
                )}
              </View>
              <View className="h-24" />
            </ScrollView>
          )}
        </View>

        <PrivateChatModal
          visible={showPrivateChat}
          onClose={() => setShowPrivateChat(false)}
          resident={selectedResident}
          socket={socket}
          session={session}
          history={chatHistory}
          onlineUsers={onlineUsers}
        />

        {/* --- Floating Action Button --- */}
        {activeTab === 'posts' && (
          <TouchableOpacity
            onPress={() => setShowComposeModal(true)}
            className="absolute bottom-8 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-2xl elevation-8"
          >
            <Plus size={28} color="white" />
          </TouchableOpacity>
        )}



        {showComposeModal && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110 }} pointerEvents="box-none">
            <TouchableWithoutFeedback
              onPress={() => {
                if (showEmojiPicker || showAttachMenu) {
                  setShowEmojiPicker(false);
                  setShowAttachMenu(false);
                  inputRef.current?.focus();
                } else {
                  setShowComposeModal(false);
                  Keyboard.dismiss();
                }
              }}
            >
              <View className="absolute inset-0" />
            </TouchableWithoutFeedback>
            <View className="absolute inset-x-0 bottom-0" pointerEvents="box-none">
              <View className="bg-white dark:bg-zinc-900 p-3 border-t border-neutral-100 dark:border-zinc-800 shadow-xl rounded-t-[40px]">

                {/* Selected Preview Area */}
                {selectedImage && (
                  <View className="px-2 py-2">
                    <View className="relative w-20 h-20">
                      <Image source={{ uri: selectedImage }} className="w-full h-full rounded-xl border border-gray-100 dark:border-zinc-700" />
                      <TouchableOpacity
                        onPress={() => { setSelectedImage(null); }}
                        className="absolute -top-1 -right-1 bg-black/50 rounded-full p-1"
                      >
                        <X size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View className="flex-row items-end gap-x-2 pb-4">
                  <View className="flex-1 bg-neutral-offWhite dark:bg-zinc-800/50 rounded-[24px] px-4 py-2 flex-row items-center border border-neutral-200/50 dark:border-zinc-700/50">
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowAttachMenu(false);
                        setShowEmojiPicker(!showEmojiPicker);
                      }}
                      className="mr-2"
                    >
                      <Smile size={22} color={showEmojiPicker ? "#1877F2" : (colorScheme === 'dark' ? '#94A3B8' : "#6C757D")} />
                    </TouchableOpacity>
                    <TextInput
                      ref={inputRef}
                      placeholder="Post an update..."
                      placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#ADB5BD'}
                      className="flex-1 text-neutral-dark dark:text-zinc-50 py-2 max-h-32"
                      multiline
                      value={inputText}
                      onChangeText={setInputText}
                      onFocus={() => {
                        setShowEmojiPicker(false);
                        setShowAttachMenu(false);
                      }}
                    />
                    <TouchableOpacity onPress={handlePickImage} className="ml-2">
                      <ImageIcon size={22} color={selectedImage ? "#1877F2" : (colorScheme === 'dark' ? '#94A3B8' : "#6C757D")} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowEmojiPicker(false);
                        setShowAttachMenu(!showAttachMenu);
                      }}
                      className="ml-3"
                    >
                      <Paperclip size={20} color={showAttachMenu ? "#1877F2" : (colorScheme === 'dark' ? '#94A3B8' : "#6C757D")} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={async () => {
                      await handlePost();
                      setShowComposeModal(false);
                    }}
                    className={`w-12 h-12 rounded-full items-center justify-center shadow-md ${(!inputText && !selectedImage) ? 'bg-neutral-200 dark:bg-zinc-800' : 'bg-primary'}`}
                  >
                    <Send size={20} color={(!inputText && !selectedImage) ? (colorScheme === 'dark' ? '#3F3F46' : 'white') : "white"} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* WhatsApp Style Attachment Menu */}
                {showAttachMenu && (
                  <View className="absolute bottom-[110%] left-4 right-4 bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-2xl border border-neutral-100 dark:border-zinc-800 flex-row flex-wrap justify-start gap-y-4">
                    <AttachmentItem icon={Camera} label="Camera" color="bg-pink-500" onPress={handleCamera} />
                    <AttachmentItem icon={ImageIcon} label="Gallery" color="bg-purple-500" onPress={handlePickImage} />
                    <AttachmentItem icon={BarChart2} label="Poll" color="bg-teal-500" onPress={() => { setShowAttachMenu(false); setShowPollModal(true); }} />
                    <AttachmentItem icon={Calendar} label="Event" color="bg-blue-500" onPress={() => { setShowAttachMenu(false); setShowEventModal(true); }} />
                  </View>
                )}

                {/* Close Handle */}
                <TouchableOpacity
                  onPress={() => {
                    setShowComposeModal(false);
                    setEditingPostId(null);
                    setInputText('');
                  }}
                  className="absolute top-2 self-center w-12 h-1.5 bg-neutral-200 dark:bg-zinc-800 rounded-full"
                />
              </View>
            </View>
          </View>
        )}

        {/* --- Emoji Picker (Separate from compose for layout) --- */}
        {showEmojiPicker && showComposeModal && (
          <View className="h-[320px] bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800 pb-8 absolute bottom-0 inset-x-0 z-[120]">
            {/* Category Browser */}
            <View className="flex-row justify-evenly py-3 border-b border-neutral-50 dark:border-zinc-800 bg-neutral-offWhite dark:bg-zinc-950">
              {Object.keys(EMOJIS).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveEmojiCat(cat as any)}
                  className={`px-2 py-1.5 rounded-full ${activeEmojiCat === cat ? 'bg-primary/10' : ''}`}
                >
                  <Text className={`text-[19px] ${activeEmojiCat === cat ? 'opacity-100' : 'opacity-40'}`}>
                    {cat === 'smileys' ? '😀' :
                      cat === 'gestures' ? '👋' :
                        cat === 'nature' ? '🌿' :
                          cat === 'food' ? '🍕' :
                            cat === 'activities' ? '⚽️' :
                              cat === 'travel' ? '🚗' :
                                cat === 'objects' ? '💡' :
                                  cat === 'symbols' ? '🔣' :
                                    cat === 'flags' ? '🚩' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {EMOJIS[activeEmojiCat].map((emoji, i) => (
                <TouchableOpacity
                  key={i}
                  className="w-[12.5%] h-10 items-center justify-center"
                  onPress={() => setInputText(prev => prev + emoji)}
                >
                  <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {/* Creation Overlay: Poll */}
        {showPollModal && (
          <View className="absolute inset-0 bg-black/50 z-[100] items-center justify-center px-4">
            <View className="bg-white dark:bg-zinc-900 w-full rounded-[32px] p-6 max-h-[80%] overflow-hidden">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-neutral-dark dark:text-zinc-50">Create Poll</Text>
                <TouchableOpacity onPress={() => setShowPollModal(false)}><X size={24} color={colorScheme === 'dark' ? '#94A3B8' : "#6C757D"} /></TouchableOpacity>
              </View>
              <TextInput
                placeholder="Ask a question..."
                placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#ADB5BD'}
                className="bg-neutral-offWhite dark:bg-zinc-800 rounded-2xl px-4 py-3 mb-4 text-neutral-dark dark:text-zinc-50 font-medium"
                value={pollQuestion}
                onChangeText={setPollQuestion}
              />
              <ScrollView className="mb-4">
                {pollOptions.map((opt, idx) => (
                  <View key={idx} className="flex-row items-center gap-x-2 mb-3">
                    <TextInput
                      placeholder={`Option ${idx + 1}`}
                      placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#ADB5BD'}
                      className="flex-1 bg-neutral-offWhite dark:bg-zinc-800 rounded-xl px-4 py-2 text-neutral-dark dark:text-zinc-50"
                      value={opt}
                      onChangeText={(val) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = val;
                        setPollOptions(newOpts);
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <TouchableOpacity onPress={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}>
                        <X size={18} color="#DC3545" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {pollOptions.length < 5 && (
                  <TouchableOpacity
                    onPress={() => setPollOptions([...pollOptions, ''])}
                    className="flex-row items-center gap-x-2 py-2"
                  >
                    <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                      <Text className="text-primary font-bold">+</Text>
                    </View>
                    <Text className="text-primary font-bold text-sm">Add Option</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
              <TouchableOpacity
                onPress={() => handlePost('poll', { poll: { question: pollQuestion, options: pollOptions.filter(o => o.trim()).map(o => ({ text: o })) } })}
                disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                className="bg-primary rounded-2xl py-4 items-center shadow-lg"
              >
                <Text className="text-white font-bold text-base">Create Poll</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Creation Overlay: Event */}
        {showEventModal && (
          <View className="absolute inset-0 bg-black/50 z-[100] items-center justify-center px-4">
            <View className="bg-white dark:bg-zinc-900 w-full rounded-[32px] p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-neutral-dark dark:text-zinc-50">Schedule Event</Text>
                <TouchableOpacity onPress={() => setShowEventModal(false)}><X size={24} color={colorScheme === 'dark' ? '#94A3B8' : "#6C757D"} /></TouchableOpacity>
              </View>
              <TextInput
                placeholder="Event Title"
                placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#ADB5BD'}
                className="bg-neutral-offWhite dark:bg-zinc-800 rounded-2xl px-4 py-3 mb-4 text-neutral-dark dark:text-zinc-50"
                value={eventName}
                onChangeText={setEventName}
              />
              <TextInput
                placeholder="Date (e.g. June 24, 6:00 PM)"
                placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#ADB5BD'}
                className="bg-neutral-offWhite dark:bg-zinc-800 rounded-2xl px-4 py-3 mb-4 text-neutral-dark dark:text-zinc-50"
                value={eventDate}
                onChangeText={setEventDate}
              />
              <TextInput
                placeholder="Location"
                placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#ADB5BD'}
                className="bg-neutral-offWhite dark:bg-zinc-800 rounded-2xl px-4 py-3 mb-4 text-neutral-dark dark:text-zinc-50"
                value={eventLocation}
                onChangeText={setEventLocation}
              />
              <TextInput
                placeholder="Short Description"
                placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#ADB5BD'}
                className="bg-neutral-offWhite dark:bg-zinc-800 rounded-2xl px-4 py-3 mb-6 text-neutral-dark dark:text-zinc-50"
                multiline
                numberOfLines={3}
                value={eventDescription}
                onChangeText={setEventDescription}
              />
              <TouchableOpacity
                onPress={() => handlePost('event', { event: { title: eventName, date: eventDate, location: eventLocation, description: eventDescription } })}
                disabled={!eventName.trim() || !eventDate.trim()}
                className="bg-primary rounded-2xl py-4 items-center shadow-lg"
              >
                <Text className="text-white font-bold text-base">Create Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <StatusModal
          visible={statusModal.visible}
          onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Sub-Components ---

const EmptyTab = ({ icon: Icon, message }: { icon: any, message: string }) => (
  <View className="flex-1 items-center justify-center py-20">
    <View className="w-20 h-20 bg-neutral-50 dark:bg-zinc-900 rounded-full items-center justify-center mb-4">
      <Icon size={32} color="#ADB5BD" />
    </View>
    <Text className="text-neutral-medium dark:text-zinc-500 font-bold text-center px-10">{message}</Text>
  </View>
);

const PostCard = memo(({ post, onLike, onVote, onAddComment, sessionUserId, sessionRole, onInitEdit, onDeletePost, commentsData }: {
  post: PostData & { rawLikes: string[], house?: string },
  onLike: () => void,
  onVote: (optId: string) => void,
  onAddComment: (text: string) => void,
  sessionUserId?: string,
  sessionRole?: string,
  onInitEdit: (p: any) => void,
  onDeletePost: (id: string) => void,
  commentsData: any[]
}) => {
  const { colorScheme } = useColorScheme();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const isLiked = post.rawLikes?.includes(sessionUserId || '');

  const [showOptions, setShowOptions] = useState(false);
  const isWithinFive = (Date.now() - new Date(post.createdAt || 0).getTime() < 5 * 60 * 1000);
  const isOwner = String(sessionUserId) === String(post.ownerId);
  const isAdmin = sessionRole?.toLowerCase() === 'admin';

  return (
    <View className="bg-white dark:bg-zinc-900 rounded-xl p-5 mb-8 shadow-sm border border-neutral-50 dark:border-zinc-800">
      <PostOptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        isOwner={isOwner}
        isAdmin={isAdmin}
        isWithinFive={isWithinFive}
        onEdit={() => {
          setShowOptions(false);
          onInitEdit(post);
        }}
        onDelete={() => {
          setShowOptions(false);
          onDeletePost(post.id);
        }}
      />
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center gap-x-3">
          <Avatar role={post.role} profileImage={post.profileImage} />
          <View>
            <View className="flex-row items-center gap-x-1.5">
              <Text className="font-bold text-gray-900 dark:text-zinc-50 text-[17px]">{post.userName}</Text>
              {post.isVerified && <CheckCircle2 size={14} color="#1877F2" fill="#1877F2" fillOpacity={0.1} />}
            </View>
            <Text className="text-[12px] text-gray-400 dark:text-zinc-500 font-medium">{post.role === 'resident' ? post.house : post.role}</Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium mb-1">{post.time}</Text>
          {(isOwner || isAdmin) && (
            <TouchableOpacity onPress={() => setShowOptions(true)}>
              <MoreVertical size={18} color={colorScheme === 'dark' ? '#3F3F46' : "#ADB5BD"} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Body Content */}
      {post.type === 'poll' && post.poll ? (
        <View className="mb-5 bg-neutral-offWhite dark:bg-zinc-800/50 rounded-[28px] p-6 border border-neutral-100 dark:border-zinc-800">
          <View className="flex-row items-center gap-x-2 mb-4">
            <BarChart2 size={22} color="#1877F2" />
            <Text className="text-lg font-bold text-neutral-dark dark:text-zinc-50 leading-tight">{post.poll.question}</Text>
          </View>
          {post.poll.options.map((opt: any) => {
            const voteCount = opt.votes?.length || 0;
            const totalVotes = post.poll?.options.reduce((acc: number, o: any) => acc + (o.votes?.length || 0), 0) || 1;
            const percent = Math.round((voteCount / totalVotes) * 100);
            const hasVoted = opt.votes?.includes(sessionUserId || '');

            return (
              <TouchableOpacity
                key={opt._id}
                onPress={() => onVote(opt._id)}
                className="mb-3 overflow-hidden relative"
              >
                <View className="bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-2xl h-14 flex-row items-center px-5 overflow-hidden">
                  <View
                    className={`absolute left-0 top-0 bottom-0 ${hasVoted ? 'bg-primary/20 dark:bg-primary/10' : 'bg-neutral-50 dark:bg-zinc-900/50'}`}
                    style={{ width: `${percent}%` }}
                  />
                  <Text className={`flex-1 font-bold ${hasVoted ? 'text-primary' : 'text-neutral-dark dark:text-zinc-50'}`}>{opt.text}</Text>
                  <Text className="text-xs font-black text-neutral-medium dark:text-zinc-500">{percent}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : post.type === 'event' && post.event ? (
        <View className="mb-5 bg-blue-50/40 dark:bg-blue-900/10 rounded-[28px] p-6 border border-blue-100 dark:border-blue-900/30">
          <View className="flex-row items-center gap-x-2 mb-4">
            <Calendar size={22} color="#007AFF" />
            <Text className="text-lg font-bold text-neutral-dark dark:text-zinc-50">{post.event.title}</Text>
          </View>
          <View className="gap-y-3 mb-5">
            <View className="flex-row items-center gap-x-3">
              <View className="bg-blue-100/50 dark:bg-blue-900/40 p-2 rounded-lg"><Calendar size={14} color="#007AFF" /></View>
              <Text className="text-[14px] text-neutral-dark dark:text-zinc-200 font-semibold">{post.event.date}</Text>
            </View>
            <View className="flex-row items-center gap-x-3">
              <View className="bg-blue-100/50 dark:bg-blue-900/40 p-2 rounded-lg"><MapPin size={14} color="#007AFF" /></View>
              <Text className="text-[14px] text-neutral-dark dark:text-zinc-200 font-semibold">{post.event.location}</Text>
            </View>
          </View>
          <Text className="text-neutral-medium dark:text-zinc-400 text-[13px] leading-5 italic bg-white/50 dark:bg-zinc-900/40 p-3 rounded-xl">"{post.event.description}"</Text>
          <TouchableOpacity className="bg-primary rounded-2xl py-4 mt-5 items-center shadow-lg shadow-primary/20">
            <Text className="text-white font-bold text-base">R.S.V.P</Text>
          </TouchableOpacity>
        </View>
      ) : post.type === 'file' && post.file ? (
        <TouchableOpacity
          onPress={() => post.file && Linking.openURL(post.file.url)}
          className="mb-5 bg-neutral-offWhite dark:bg-zinc-800/50 rounded-2xl p-5 border border-neutral-200/50 dark:border-zinc-800 flex-row items-center gap-x-4"
        >
          <View className={`w-14 h-14 rounded-2xl items-center justify-center ${post.file?.fileType === 'Audio' ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-indigo-100 dark:bg-indigo-900/40'}`}>
            {post.file?.fileType === 'Audio' ? <Music size={28} color="#FF9F0A" /> : <FileText size={28} color="#6610f2" />}
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-neutral-dark dark:text-zinc-50" numberOfLines={1}>{post.file?.name}</Text>
            <Text className="text-xs text-neutral-medium dark:text-zinc-500 font-bold uppercase tracking-wider">{post.file?.fileType || 'Document'}</Text>
          </View>
          <View className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-neutral-100 dark:border-zinc-700 items-center justify-center">
            <Download size={20} color={colorScheme === 'dark' ? '#94A3B8' : "#6C757D"} />
          </View>
        </TouchableOpacity>
      ) : (
        <View className="mb-5">
          {post.content && post.type !== 'poll' && post.type !== 'event' && (
            <Text className="text-neutral-dark dark:text-zinc-200 text-[15px] leading-relaxed font-medium mb-4">{post.content}</Text>
          )}

          {post.imageUri && (
            <View className="rounded-[28px] overflow-hidden border border-neutral-100 dark:border-zinc-800 shadow-sm bg-neutral-50 dark:bg-zinc-800">
              <Image
                source={{ uri: post.imageUri }}
                className="w-full aspect-[4/3]"
                resizeMode="cover"
              />
            </View>
          )}


        </View>
      )}

      <View className="flex-row items-center justify-between pt-4 border-t border-neutral-50 dark:border-zinc-800">
        <TouchableOpacity onPress={onLike} className="flex-row items-center gap-x-2">
          <Heart size={20} color={isLiked ? "#FF4D4D" : (colorScheme === 'dark' ? '#94A3B8' : "#4A5568")} fill={isLiked ? "#FF4D4D" : "transparent"} strokeWidth={2.5} />
          <Text className={`text-[14px] font-bold ${isLiked ? 'text-[#FF4D4D]' : 'text-gray-700 dark:text-zinc-400'}`}>
            Like{post.likes > 0 ? ` (${post.likes})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowComments(!showComments)} className="flex-row items-center gap-x-2">
          <MessageSquare size={20} color={colorScheme === 'dark' ? '#94A3B8' : "#4A5568"} strokeWidth={2.5} />
          <Text className="text-[14px] font-bold text-gray-700 dark:text-zinc-400">
            Comment{commentsData.length > 0 ? ` (${commentsData.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      <TouchableOpacity
        onPress={() => setShowComments(!showComments)}
        className="mt-4 flex-row items-center"
      >
        <Text className="text-xs font-bold text-primary">
          {showComments ? 'Hide Comments' : `View all comments`}
        </Text>
      </TouchableOpacity>

      {showComments && (
        <View className="mt-4 border-t border-neutral-50 dark:border-zinc-800 pt-4">
          {commentsData.length === 0 ? (
            <Text className="text-xs text-neutral-medium dark:text-zinc-500 italic">No comments yet.</Text>
          ) : (
            commentsData.map((comment, i) => (
              <View key={comment._id || i} className="mb-3 bg-neutral-50 dark:bg-zinc-800/80 p-3 rounded-2xl">
                <Text className="text-[13px] font-bold text-neutral-dark dark:text-zinc-50 mb-1">
                  {comment.user?.full_name || 'Member'}
                </Text>
                <Text className="text-[13px] text-neutral-medium dark:text-zinc-400">{comment.text}</Text>
              </View>
            ))
          )}

          <View className="flex-row items-center gap-x-2 mt-4">
            <TextInput
              placeholder="Add a comment..."
              placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#ADB5BD'}
              className="flex-1 bg-neutral-offWhite dark:bg-zinc-800 rounded-xl px-4 py-2 text-sm text-neutral-dark dark:text-zinc-50"
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              onPress={() => {
                onAddComment(commentText);
                setCommentText('');
              }}
              className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full items-center justify-center"
            >
              <Send size={16} color="#1877F2" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

const ResidentDirectory = ({ residents, onMessage, onlineUsers, unreadCounts }: { residents: any[], onMessage: (res: any) => void, onlineUsers: string[], unreadCounts: { [key: string]: number } }) => {
  if (!residents) return null;

  // Group by block
  const groups = (residents || []).reduce((acc, res) => {
    if (!res) return acc;
    const block = res.house_number?.charAt(0) || 'Others';
    if (!acc[block]) acc[block] = [];
    acc[block].push(res);
    return acc;
  }, {} as any);

  return (
    <View>
      {Object.keys(groups).sort().map(block => (
        <View key={block} className="mb-8">
          <Text className="text-neutral-medium dark:text-zinc-500 font-black text-xs uppercase tracking-[2px] mb-4 ml-2">
            {block} Block
          </Text>
          {groups[block].map((res: any) => (
            <View key={res._id || Math.random()} className="flex-row items-center justify-between mb-5 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-transparent dark:border-zinc-800">
              <View className="flex-row items-center gap-x-4">
                <Avatar role="resident" profileImage={res.profile_image} isOnline={onlineUsers.includes(res._id)} />
                <View>
                  <Text className="font-bold text-neutral-dark dark:text-zinc-50 text-base">{res.full_name}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-xs text-neutral-medium dark:text-zinc-500 font-bold">{res.house_number}</Text>
                    <Text className="text-[9px] text-gray-400 font-medium ml-2 uppercase tracking-tighter">
                      • {onlineUsers.includes(res._id) ? 'Online' : (res.updatedAt ? formatLastSeen(res.updatedAt) : 'Offline')}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => onMessage(res)}
                  className="flex-row items-center justify-center"
                  style={{ minWidth: 48, height: 48 }}
                >
                  <MessageSquare size={20} color="#1877F2" />
                  {unreadCounts[res._id] > 0 && (
                    <View className="ml-1 bg-red-500 px-1.5 py-0.5 rounded-full">
                      <Text className="text-white text-[9px] font-black">{unreadCounts[res._id]}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};


const Avatar = ({ role, profileImage, isOnline }: { role: UserRole; profileImage?: string | null; isOnline?: boolean }) => {
  const configs = {
    admin: { bg: 'bg-primary/10 dark:bg-primary/20', icon: ShieldCheck, color: '#1877F2' },
    guard: { bg: 'bg-orange-100 dark:bg-orange-900/40', icon: Siren, color: '#FFC107' },
    resident: { bg: 'bg-neutral-100 dark:bg-zinc-800', icon: User, color: '#6C757D' },
  };
  const { bg, icon: Icon, color } = configs[role] || configs.resident;

  const isValidImage = profileImage && !profileImage.includes('default_avatar.png');

  return (
    <View className="relative">
      {isValidImage ? (
        <Image
          source={{ uri: profileImage! }}
          className="w-11 h-11 rounded-full border border-neutral-100 dark:border-zinc-800"
          resizeMode="cover"
        />
      ) : (
        <View className={`w-11 h-11 rounded-full items-center justify-center ${bg}`}>
          <Icon size={22} color={color} strokeWidth={2} />
        </View>
      )}
      {isOnline && (
        <View className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />
      )}
    </View>
  );
};

const RoleBadge = ({ role }: { role: UserRole }) => {
  if (role === 'resident') return null;
  return (
    <View className={`${role === 'admin' ? 'bg-primary' : 'bg-warning'} px-1.5 py-0.5 rounded`}>
      <Text className="text-[7px] text-white font-black tracking-widest uppercase">{role}</Text>
    </View>
  );
};

const AttachmentItem = ({ icon: Icon, label, color, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="items-center justify-center w-1/4"
  >
    <View className={`w-14 h-14 rounded-full items-center justify-center mb-1.5 shadow-sm ${color}`}>
      <Icon size={26} color="white" strokeWidth={2} />
    </View>
    <Text className="text-[12px] text-neutral-dark dark:text-zinc-50 font-semibold">{label}</Text>
  </TouchableOpacity>
);

const PostOptionsModal = ({ visible, onClose, onEdit, onDelete, isOwner, isAdmin, isWithinFive }: any) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/40 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-white dark:bg-zinc-900 rounded-t-[40px] p-6 pb-10 border-t border-neutral-100 dark:border-zinc-800">
              <View className="w-12 h-1.5 bg-neutral-100 dark:bg-zinc-800 rounded-full self-center mb-8" />

              <Text className="text-[13px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[2px] mb-6 text-center">
                Message Options
              </Text>

              <View className="gap-y-2">
                {isOwner && (
                  <TouchableOpacity
                    onPress={() => {
                      if (isWithinFive) {
                        onEdit();
                      } else {
                        Alert.alert('Locked', 'Messages can only be edited within 5 minutes.');
                      }
                    }}
                    className="flex-row items-center bg-neutral-50 dark:bg-zinc-800/50 p-4 rounded-2xl"
                  >
                    <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mr-4">
                      <Pencil size={18} color="#2563EB" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900 dark:text-zinc-50">Edit Message</Text>
                      {!isWithinFive && <Text className="text-[11px] text-red-400 font-medium mt-0.5">Time limit exceeded</Text>}
                    </View>
                  </TouchableOpacity>
                )}

                {(isOwner || isAdmin) && (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Delete for Everyone?',
                        'This message will be removed for everyone in the community.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: onDelete }
                        ]
                      );
                    }}
                    className="flex-row items-center bg-neutral-50 dark:bg-zinc-800/50 p-4 rounded-2xl"
                  >
                    <View className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center mr-4">
                      <Trash2 size={18} color="#EF4444" />
                    </View>
                    <Text className="text-base font-bold text-red-500">Delete for Everyone</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={onClose}
                  className="flex-row items-center bg-neutral-50 dark:bg-zinc-800/50 p-4 rounded-2xl mt-4"
                >
                  <View className="w-10 h-10 bg-gray-100 dark:bg-zinc-700 rounded-full items-center justify-center mr-4">
                    <X size={18} color={isDark ? '#F4F4F5' : '#64748B'} />
                  </View>
                  <Text className="text-base font-bold text-gray-600 dark:text-zinc-400">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const PrivateChatModal = ({ visible, onClose, resident, socket, session, history, onlineUsers }: any) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [msg, setMsg] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [activeEmojiCat, setActiveEmojiCat] = useState<keyof typeof EMOJIS>('smileys');
  const [isSending, setIsSending] = useState(false);
  const [statusModal, setStatusModal] = useState<{ visible: boolean; type: ModalType; title: string; message: string }>({ visible: false, type: 'error', title: '', message: '' });

  const showError = (title: string, message: string, type: ModalType = 'error') => {
    setStatusModal({ visible: true, title, message, type });
  };


  if (!resident) return null;

  // Filter messages for this conversation
  const myMessages = (history || []).filter((chat: any) => {
    // Allow older private messages that might not have the isPrivate flag set
    if (!chat.isPrivate && !chat.receiver) return false;

    // Handle both populated objects and raw ID strings
    const chatSenderId = chat.sender?._id || chat.sender;
    const chatReceiverId = chat.receiver?._id || chat.receiver;
    const currentUserId = session?._id;
    const residentId = resident._id;

    const isDeletedForMe = chat.deletedFor?.includes(currentUserId?.toString());
    if (isDeletedForMe) return false;

    const isMine = chatSenderId?.toString() === currentUserId?.toString() && chatReceiverId?.toString() === residentId?.toString();
    const isTheirs = chatSenderId?.toString() === residentId?.toString() && chatReceiverId?.toString() === currentUserId?.toString();

    return isMine || isTheirs;
  });

  const handleLongPress = (chat: any) => {
    const chatSenderId = chat.sender?._id || chat.sender;
    const isMine = chatSenderId?.toString() === session?._id?.toString();

    const options: any[] = [
      {
        text: 'Delete for me',
        onPress: () => {
          socket?.emit('delete_message', { messageId: chat._id, userId: session?._id, deleteForEveryone: false });
        }
      },
      {
        text: 'Cancel',
        style: 'cancel'
      }
    ];

    if (isMine) {
      options.unshift({
        text: 'Delete for everyone',
        onPress: () => {
          socket?.emit('delete_message', { messageId: chat._id, userId: session?._id, deleteForEveryone: true });
        },
        style: 'destructive'
      });
    }

    Alert.alert('Message Options', 'What would you like to do?', options);
  };

  const handlePickImage = async () => {
    try {
      const response: any = await ImagePicker.openPicker({
        width: 1200, height: 1200, cropping: true, compressImageQuality: 0.7,
        includeBase64: true
      });
      setSelectedImage(`data:${response.mime};base64,${response.data}`);
      setShowAttachMenu(false);
    } catch (e) { }
  };



  const handleCamera = async () => {
    try {
      const response: any = await ImagePicker.openCamera({
        width: 1200,
        height: 1200,
        cropping: true,
        compressImageQuality: 0.7,
        includeBase64: true,
        mediaType: 'photo'
      });
      if (response && response.data && response.mime) {
        setSelectedImage(`data:${response.mime};base64,${response.data}`);
        setShowAttachMenu(false);
      }
    } catch (e: any) {
      console.log("Camera Cancelled/Error", e);
      if (e?.code !== 'E_PICKER_CANCELLED') {
        showError('Camera Error', 'Could not open camera. Please ensure permissions are granted.');
      }
    }
  };


  const handleSend = (type: string = 'text', additionalData: any = {}) => {
    if (!msg.trim() && !selectedImage && type === 'text') return;
    if (!socket || !session) return;

    setIsSending(true);
    const roleCapitalized = (session?.role || 'resident').charAt(0).toUpperCase() + (session?.role || 'resident').slice(1);

    const actualType = selectedImage ? 'image' : type;

    socket.emit('send_message', {
      sender: session._id,
      senderType: roleCapitalized,
      receiver: resident._id,
      receiverType: 'Resident',
      content: msg.trim(), // Send empty if no caption
      type: actualType,
      image: selectedImage,
      isPrivate: true,
      ...additionalData
    });

    setMsg('');
    setSelectedImage(null);
    setIsSending(false);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm z-10">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onClose} className="mr-4">
              <ArrowLeft size={24} color={isDark ? '#F4F4F5' : '#111827'} />
            </TouchableOpacity>
            <Avatar role="resident" profileImage={resident.profile_image} isOnline={onlineUsers?.includes(resident._id)} />
            <View className="ml-3">
              <View className="flex-row items-center">
                <Text className="font-satoshi-bold text-gray-900 dark:text-zinc-50 text-base">{resident.full_name}</Text>
                <View className={`ml-2 w-2 h-2 rounded-full ${onlineUsers?.includes(resident._id) ? 'bg-green-500' : 'bg-gray-300'}`} />
              </View>
              <Text className="text-[9px] text-gray-400 font-satoshi-bold uppercase tracking-[1px]">
                {onlineUsers?.includes(resident._id) ? 'Online Now' : formatLastSeen(resident.updatedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Chat Area */}
        <ScrollView
          className="flex-1 bg-offWhite dark:bg-zinc-950"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ref={(ref) => ref?.scrollToEnd({ animated: true })}
        >
          {myMessages.length === 0 ? (
            <View className="flex-1 items-center justify-center pt-20 px-10">
              <View className="flex-row items-center justify-center mb-4 gap-x-3">
                <ShieldCheck size={30} color="#1877F2" strokeWidth={1} />
                <Text className="text-neutral-dark dark:text-zinc-50 font-satoshi-black text-lg text-center">End-to-End Encrypted</Text>
              </View>
              <Text className="text-gray-400 dark:text-zinc-500 text-xs font-satoshi-medium text-center leading-relaxed mb-10">
                Messages in this chat are secure. Nobody outside this chat can read them.
              </Text>
            </View>
          ) : (
            <View className="px-4 pt-6">
              {myMessages.map((chat: any, index: number) => {
                const isMine = (chat.sender?._id || chat.sender)?.toString() === session?._id?.toString();

                // Date Separator Logic
                const chatDate = new Date(chat.createdAt).toLocaleDateString();
                const prevChatDate = index > 0 ? new Date(myMessages[index - 1].createdAt).toLocaleDateString() : null;
                const showDateSeparator = chatDate !== prevChatDate;

                const formatDateLabel = (dateStr: string) => {
                  const d = new Date(chat.createdAt);
                  const today = new Date();
                  const yesterday = new Date();
                  yesterday.setDate(today.getDate() - 1);

                  if (d.toDateString() === today.toDateString()) return 'Today';
                  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
                  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
                };

                return (
                  <View key={chat._id}>
                    {showDateSeparator && (
                      <View className="items-center my-6">
                        <View className="bg-neutral-100 dark:bg-zinc-900 px-4 py-1.5 rounded-full">
                          <Text className="text-[10px] font-satoshi-bold text-gray-400 uppercase tracking-[1px]">
                            {formatDateLabel(chatDate)}
                          </Text>
                        </View>
                      </View>
                    )}
                    <TouchableOpacity
                      onLongPress={() => !chat.isDeleted && handleLongPress(chat)}
                      delayLongPress={500}
                      activeOpacity={0.9}
                      className={`mb-4 max-w-[85%] ${isMine ? 'self-end' : 'self-start'}`}
                    >
                      <View className={`rounded-[24px] overflow-hidden ${isMine ? 'bg-primary' : 'bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800'}`}>
                        {chat.isDeleted ? (
                          <View className="p-4">
                            <Text className={`text-[14px] italic ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                              This message was deleted
                            </Text>
                          </View>
                        ) : (
                          <>
                            {chat.type === 'image' && chat.image && (
                              <Image source={{ uri: chat.image }} className="w-[280px] h-[210px]" resizeMode="cover" />
                            )}


                            <View className="p-3">
                              {chat.type === 'file' && chat.file && (
                                <TouchableOpacity
                                  onPress={() => Linking.openURL(chat.file.url)}
                                  className={`flex-row items-center gap-x-3 mb-2 p-3 rounded-2xl ${isMine ? 'bg-white/10' : 'bg-neutral-50 dark:bg-zinc-800'}`}
                                >
                                  <View className={`w-10 h-10 items-center justify-center rounded-xl ${isMine ? 'bg-white/20' : 'bg-primary/10'}`}>
                                    <FileText size={20} color={isMine ? 'white' : '#1877F2'} />
                                  </View>
                                  <View className="flex-1">
                                    <Text className={`text-sm font-bold ${isMine ? 'text-white' : 'text-neutral-dark dark:text-zinc-50'}`} numberOfLines={1}>
                                      {chat.file.name}
                                    </Text>
                                    <Text className={`text-[10px] ${isMine ? 'text-white/60' : 'text-neutral-medium'}`}>
                                      {chat.file.fileType || 'Document'}
                                    </Text>
                                  </View>
                                  <Download size={18} color={isMine ? 'white' : '#1877F2'} />
                                </TouchableOpacity>
                              )}

                              {chat.content ? (
                                <Text className={`text-[15px] ${isMine ? 'text-white' : 'text-neutral-dark dark:text-zinc-50'}`}>
                                  {chat.content}
                                </Text>
                              ) : null}

                              <View className="flex-row items-center justify-end mt-1 gap-x-1">
                                <Text className={`text-[10px] ${isMine ? 'text-white/60' : 'text-neutral-medium'}`}>
                                  {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                {isMine && <CheckCheck size={12} color="rgba(255,255,255,0.6)" />}
                              </View>
                            </View>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800"
        >
          <View className="p-3 pb-6">
            {/* Media Preview Area */}
            {selectedImage && (
              <View className="mb-4 flex-row items-center">
                <View className="relative w-24 h-24 rounded-2xl overflow-hidden border border-neutral-200 dark:border-zinc-800 shadow-sm bg-neutral-100 dark:bg-zinc-800">
                  <Image source={{ uri: selectedImage }} className="w-full h-full" />
                  <TouchableOpacity
                    onPress={() => { setSelectedImage(null); }}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1.5"
                  >
                    <X size={12} color="white" />
                  </TouchableOpacity>
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-neutral-medium dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    Image Selected
                  </Text>
                  <Text className="text-neutral-dark dark:text-zinc-400 text-[10px] mt-1">
                    Press send to share with {resident.full_name.split(' ')[0]}
                  </Text>
                </View>
              </View>
            )}

            <View className="flex-row items-end gap-x-3">
              <View className="flex-1 bg-neutral-offWhite dark:bg-zinc-800/50 rounded-[28px] px-2 py-2 flex-row items-center border border-neutral-200/50 dark:border-zinc-700/50">
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowAttachMenu(false);
                    setShowEmojiPicker(!showEmojiPicker);
                  }}
                  className="mr-2"
                >
                  <Smile size={24} color={showEmojiPicker ? "#1877F2" : (isDark ? '#94A3B8' : "#6C757D")} />
                </TouchableOpacity>

                <TextInput
                  placeholder={`Message ${resident.full_name.split(' ')[0]}...`}
                  placeholderTextColor={isDark ? '#52525B' : '#ADB5BD'}
                  className="flex-1 text-neutral-dark dark:text-zinc-50 py-2 text-[15px]"
                  value={msg}
                  onChangeText={setMsg}
                  multiline
                  onFocus={() => {
                    setShowEmojiPicker(false);
                    setShowAttachMenu(false);
                  }}
                />

                <TouchableOpacity onPress={handleCamera} className="ml-2">
                  <Camera size={22} color={isDark ? '#94A3B8' : "#6C757D"} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePickImage} className="ml-3">
                  <ImageIcon size={22} color={selectedImage ? "#1877F2" : (isDark ? '#94A3B8' : "#6C757D")} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => handleSend('text')}
                disabled={isSending || (!msg.trim() && !selectedImage)}
                className={`w-12 h-12 rounded-full items-center justify-center shadow-lg ${(!msg.trim() && !selectedImage) ? 'bg-neutral-100 dark:bg-zinc-800' : 'bg-primary shadow-primary/30'}`}
              >
                {isSending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Send size={22} color="white" strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>


          </View>
        </KeyboardAvoidingView>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <View className="h-[320px] bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800">
            <View className="flex-row justify-evenly py-3 border-b border-neutral-50 dark:border-zinc-800 bg-neutral-offWhite dark:bg-zinc-950">
              {Object.keys(EMOJIS).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveEmojiCat(cat as any)}
                  className={`px-2 py-1 rounded-full ${activeEmojiCat === cat ? 'bg-primary/10' : ''}`}
                >
                  <Text className={`text-[18px] ${activeEmojiCat === cat ? 'opacity-100' : 'opacity-40'}`}>
                    {cat === 'smileys' ? '😀' :
                      cat === 'gestures' ? '👋' :
                        cat === 'nature' ? '🌿' :
                          cat === 'food' ? '🍕' :
                            cat === 'activities' ? '⚽️' :
                              cat === 'travel' ? '🚗' :
                                cat === 'objects' ? '💡' :
                                  cat === 'symbols' ? '🔣' :
                                    cat === 'flags' ? '🚩' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {EMOJIS[activeEmojiCat].map((emoji, i) => (
                <TouchableOpacity
                  key={i}
                  className="w-[12.5%] h-10 items-center justify-center"
                  onPress={() => setMsg(prev => prev + emoji)}
                >
                  <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <StatusModal
          visible={statusModal.visible}
          onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default CommunityChat;
