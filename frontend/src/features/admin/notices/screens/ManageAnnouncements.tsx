import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePicker from 'react-native-image-crop-picker';
import { useColorScheme } from 'nativewind';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Megaphone,
  Clock,
  User,
  ShieldCheck,
  ChevronRight,
  Pin,
  Image as ImageIcon,
  X
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl, default as api } from '../../../../utils/apiConfig';

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';

const ManageAnnouncements = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Creating Announcement
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', priority: 'medium', image: '' });
  const [isCreating, setIsCreating] = useState(false);

  const handlePickImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 800,
        height: 600,
        cropping: true,
        includeBase64: true,
        mediaType: 'photo',
      });
      if (image && image.data) {
        setNewAnnouncement(prev => ({ ...prev, image: `data:${image.mime};base64,${image.data}` }));
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled image selection') {
        Alert.alert('Error', 'Failed to pick image');
      }
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/announcements');
      setAnnouncements(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      Alert.alert('Error', 'Please enter both title and content');
      return;
    }

    setIsCreating(true);
    try {
      await api.post('/api/announcements', newAnnouncement);
      setIsModalVisible(false);
      setNewAnnouncement({ title: '', content: '', priority: 'medium', image: '' });
      fetchAnnouncements();
      Alert.alert('Success', 'Announcement posted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to post announcement');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to remove this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/announcements/${id}`);
              fetchAnnouncements();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete announcement');
            }
          }
        }
      ]
    );
  };

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
          </TouchableOpacity>
          <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Announcements</Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.7}
          className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center shadow-md shadow-blue-500/20"
        >
          <Plus size={20} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View className="bg-gray-50 dark:bg-zinc-900 rounded-full px-5 py-1.5 flex-row items-center border border-gray-100 dark:border-zinc-800 mb-8">
          <Search size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search news & updates..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
          />
        </View>

        {isLoading ? (
          <ActivityIndicator color={PRIMARY_COLOR} className="mt-10" />
        ) : (
          <View className="pb-20">
            {filteredAnnouncements.map((item) => (
              <View key={item._id} className="bg-white dark:bg-zinc-900 rounded-lg p-6 mb-3 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-blue-50 dark:bg-zinc-800 rounded-full items-center justify-center mr-4">
                      <Megaphone size={22} color={PRIMARY_COLOR} />
                    </View>
                    <View>
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base leading-tight pr-10">{item.title}</Text>
                      <View className="flex-row items-center mt-1">
                        <Clock size={12} color="#94A3B8" />
                        <Text className="text-gray-400 text-[10px] font-satoshi-bold ml-1 uppercase tracking-wider">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-2">
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View className="h-[1px] bg-gray-200 dark:bg-zinc-800 mb-3" />

                <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-sm leading-relaxed mb-4">
                  {item.content}
                </Text>

                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 16 }}
                    resizeMode="cover"
                  />
                ) : null}

                <View className="flex-row items-center pt-4 border-t border-gray-50 dark:border-zinc-800/50">
                  <User size={14} color="#94A3B8" />
                  <Text className="text-gray-400 text-[10px] font-satoshi-bold ml-2 uppercase tracking-widest">
                    Posted by {item.createdBy?.full_name || 'Admin'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Announcement Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-zinc-900 rounded-t-[40px] p-8">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-satoshi-black text-gray-900 dark:text-zinc-50">Post New Update</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full">
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View className="space-y-6">
              <View>
                <Text className="text-gray-400 font-satoshi-bold text-xs uppercase tracking-widest mb-2 ml-1">Announcement Title</Text>
                <TextInput
                  placeholder="e.g. Community Festival 2026"
                  placeholderTextColor="#94A3B8"
                  value={newAnnouncement.title}
                  onChangeText={(val) => setNewAnnouncement(prev => ({ ...prev, title: val }))}
                  className="bg-gray-50 dark:bg-zinc-950 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-bold"
                />
              </View>

              <View>
                <Text className="text-gray-400 font-satoshi-bold text-xs uppercase tracking-widest mb-2 mt-2 ml-1">Content / Message</Text>
                <TextInput
                  placeholder="Describe the update for residents..."
                  placeholderTextColor="#94A3B8"
                  value={newAnnouncement.content}
                  onChangeText={(val) => setNewAnnouncement(prev => ({ ...prev, content: val }))}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-gray-50 dark:bg-zinc-950 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium h-32"
                />
              </View>

              <View>
                <Text className="text-gray-400 font-satoshi-bold text-xs uppercase tracking-widest mb-2 mt-2 ml-1">Attachment (Optional)</Text>
                {newAnnouncement.image ? (
                  <View className="relative">
                    <Image
                      source={{ uri: newAnnouncement.image }}
                      style={{ width: '100%', height: 160, borderRadius: 16 }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => setNewAnnouncement(prev => ({ ...prev, image: '' }))}
                      className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"
                    >
                      <X size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handlePickImage}
                    className="flex-row items-center justify-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 border-dashed"
                  >
                    <ImageIcon size={20} color={PRIMARY_COLOR} />
                    <Text className="text-blue-600 dark:text-blue-400 font-satoshi-bold ml-2">Upload Image</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={handleCreate}
                disabled={isCreating}
                className="bg-blue-600 py-4 rounded-full items-center shadow-lg shadow-blue-500/30 mt-6"
              >
                {isCreating ? <ActivityIndicator color="white" /> : <Text className="text-white font-satoshi-bold text-lg tracking-wider uppercase">Post Announcement</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageAnnouncements;
