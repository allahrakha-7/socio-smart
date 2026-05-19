import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, StatusBar, Platform, Modal, Alert, ActivityIndicator, RefreshControl, StyleSheet, NativeModules, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Bell, Calendar, Megaphone, Plus, Pencil, Trash2, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import api from '../../../../utils/apiConfig';

type Notice = {
  _id: string;
  title: string;
  description: string;
  publishDate: string;
  author?: string;
  isUrgent?: boolean;
};

const formatPublishDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const getNowIso = () => new Date().toISOString().split('T')[0];

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';

const NoticeBoard = () => {
  const { colorScheme } = useColorScheme();
  const navigation = useNavigation();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'urgent'>('all');
  const [role, setRole] = useState<'admin' | 'resident' | 'guard' | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedNotices, setExpandedNotices] = useState<Set<string>>(new Set());

  const toggleNoticeExpansion = (id: string) => {
    setExpandedNotices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredNotices = useMemo(() => {
    if (filter === 'urgent') {
      return notices.filter((n) => Boolean(n.isUrgent));
    }
    return notices;
  }, [filter, notices]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
        if (!sessionRaw) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
          return;
        }

        const parsed = JSON.parse(sessionRaw) as { role?: string };
        const r = parsed?.role === 'admin' || parsed?.role === 'resident' || parsed?.role === 'guard' ? parsed.role : null;
        setRole(r);

        const response = await api.get('/api/notices');
        const data = Array.isArray(response.data) ? response.data : [];
        setNotices(data);

        if (data.length > 0) {
          const newestTime = new Date(data[0].createdAt || data[0].publishDate).getTime();
          await AsyncStorage.setItem('@sociosmart/last_seen_notices_timestamp', String(newestTime));
        }
      } catch (error) {
        setNotices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await api.get('/api/notices');
      const data = Array.isArray(response.data) ? response.data : [];
      setNotices(data);
      if (data.length > 0) {
        const newestTime = new Date(data[0].createdAt || data[0].publishDate).getTime();
        await AsyncStorage.setItem('@sociosmart/last_seen_notices_timestamp', String(newestTime));
      }
    } catch {
      setNotices([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const openCreateModal = () => {
    setEditingNotice(null);
    setTitle('');
    setDescription('');
    setPublishDate('');
    setIsUrgent(false);
    setIsModalVisible(true);
  };

  const openEditModal = (notice: Notice) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setDescription(notice.description);
    setPublishDate(notice.publishDate ? notice.publishDate.split('T')[0] : '');
    setIsUrgent(Boolean(notice.isUrgent));
    setIsModalVisible(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalVisible(false);
  };

  const saveNotice = async () => {
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    if (!normalizedTitle || !normalizedDescription) {
      Alert.alert('Missing Fields', 'Please enter title and description.');
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = Boolean(editingNotice?._id);
      const payload: any = {
        title: normalizedTitle,
        description: normalizedDescription,
        isUrgent,
      };
      if (publishDate) {
        payload.publishDate = new Date(publishDate).toISOString();
      }

      if (isEdit) {
        await api.put(`/api/notices/${editingNotice?._id}`, payload);
      } else {
        await api.post('/api/notices', payload);
      }

      setIsModalVisible(false);
      onRefresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to save announcement.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNotice = (notice: Notice) => {
    Alert.alert('Delete Notice', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/notices/${notice._id}`);
            setNotices((prev) => prev.filter((n) => n._id !== notice._id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const renderNotice = ({ item }: { item: Notice }) => {
    const isExpanded = expandedNotices.has(item._id);

    return (
      <View className="bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 shadow-sm border border-gray-100 dark:border-zinc-800">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center flex-1 pr-4">
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${item.isUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
              {item.isUrgent ? (
                <Bell size={20} color="#EF4444" strokeWidth={2.5} />
              ) : (
                <Megaphone size={20} color={PRIMARY_COLOR} strokeWidth={2.5} />
              )}
            </View>
            <Text className="text-lg font-satoshi-bold text-gray-900 dark:text-zinc-50 leading-tight flex-shrink">{item.title}</Text>
          </View>

          {role === 'admin' && (
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => openEditModal(item)} className="w-9 h-9 items-center justify-center mr-2">
                <Pencil size={14} color={colorScheme === 'dark' ? '#F4F4F5' : "#111827"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteNotice(item)} className="w-9 h-9 items-center justify-center">
                <Trash2 size={15} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="h-[1px] bg-gray-200 dark:bg-zinc-800 mb-3" />

        <View>
          <Text className="text-gray-600 dark:text-zinc-400 text-[14px] font-satoshi-medium leading-relaxed mb-2" numberOfLines={isExpanded ? undefined : 4}>
            {item.description}
          </Text>
          <TouchableOpacity onPress={() => toggleNoticeExpansion(item._id)} activeOpacity={0.7} className="mb-4">
            <Text className="text-[#2563EB] font-satoshi-bold text-[13px]">
              {isExpanded ? 'Show Less' : 'Read More'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between pt-3 border-t border-gray-50 dark:border-zinc-800">
          <View className="flex-row items-center">
            <Calendar size={12} color={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"} />
            <Text className="text-gray-400 dark:text-zinc-500 text-[10px] font-satoshi-bold ml-1.5 uppercase tracking-wider">{formatPublishDate(item.publishDate)}</Text>
          </View>
          <Text className="text-gray-400 dark:text-zinc-500 text-[10px] font-satoshi-bold uppercase tracking-widest">By {item.author ?? 'Admin'}</Text>
        </View>
      </View>
    )
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />

      <View className="flex-row items-center justify-between px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
          </TouchableOpacity>
          <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Notice Board</Text>
        </View>

        {role === 'admin' && (
          <TouchableOpacity
            onPress={openCreateModal}
            className="w-10 h-10 bg-[#2563EB] rounded-full items-center justify-center shadow-md shadow-blue-500/20"
          >
            <Plus size={20} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredNotices}
          keyExtractor={(item) => item._id}
          renderItem={renderNotice}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View className="mb-4">
              <View className="flex-row bg-white dark:bg-zinc-900 rounded-full p-1.5 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-[20px] items-center ${filter === 'all' ? 'bg-[#2563EB]' : ''}`}
                  onPress={() => setFilter('all')}
                >
                  <Text className={`text-xs font-satoshi-bold uppercase tracking-widest ${filter === 'all' ? 'text-white' : 'text-gray-400 dark:text-zinc-500'}`}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-[20px] items-center ${filter === 'urgent' ? 'bg-[#EF4444]' : ''}`}
                  onPress={() => setFilter('urgent')}
                >
                  <Text className={`text-xs font-satoshi-bold uppercase tracking-widest ${filter === 'urgent' ? 'text-white' : 'text-gray-400 dark:text-zinc-500'}`}>Urgent</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <Megaphone size={48} color={colorScheme === 'dark' ? '#27272A' : "#D1D5DB"} />
              <Text className="text-gray-400 dark:text-zinc-500 text-lg font-satoshi-bold mt-4">No notices found</Text>
              <Text className="text-gray-400 dark:text-zinc-600 text-sm font-satoshi-medium mt-2 px-10 text-center">
                {role === 'admin' ? 'Publish your first society update using the + button.' : 'There are no active notices for your block.'}
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View className="bg-white dark:bg-zinc-900 rounded-t-[44px] p-8 pb-12 shadow-2xl">
            <View className="flex-row items-center justify-between mb-8">
              <Text className="text-2xl font-satoshi-black text-gray-900 dark:text-zinc-50">{editingNotice ? 'Edit Notice' : 'Create Notice'}</Text>
              <TouchableOpacity onPress={closeModal} className="w-10 h-10 rounded-full items-center justify-center bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
                <X size={18} color={colorScheme === 'dark' ? '#F4F4F5' : "#111827"} />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">Notice Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter title"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                className="bg-[#FAFAFA] dark:bg-zinc-900/50 px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
              />
            </View>

            <View className="mb-4">
              <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Details of announcement..."
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                multiline
                textAlignVertical="top"
                className="bg-[#FAFAFA] dark:bg-zinc-900/50 px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium h-24"
              />
            </View>

            <View className="mb-6">
              <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">Publish Date</Text>
              <TextInput
                value={publishDate}
                onChangeText={setPublishDate}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                className="bg-[#FAFAFA] dark:bg-zinc-900/50 px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
              />
            </View>

            <View className="flex-row items-center justify-between bg-gray-50 dark:bg-zinc-800 rounded-[24px] px-4 py-4 mb-8">
              <View className="flex-row items-center">
                <View className={`w-9 h-9 rounded-full items-center justify-center ${isUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                  <Bell size={18} color={isUrgent ? '#EF4444' : PRIMARY_COLOR} />
                </View>
                <View className="ml-3">
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm">Mark as Urgent</Text>
                  <Text className="text-gray-400 dark:text-zinc-500 text-[10px] font-satoshi-medium uppercase tracking-tighter">Residents get notified</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsUrgent(!isUrgent)}
                className={`px-4 py-2 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-gray-200 dark:bg-zinc-700'}`}
              >
                <Text className={`text-[10px] font-satoshi-bold ${isUrgent ? 'text-white' : 'text-gray-600 dark:text-zinc-300'}`}>{isUrgent ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={saveNotice} disabled={isSaving} className="bg-[#2563EB] rounded-full py-4 items-center shadow-lg shadow-blue-500/30">
              {isSaving ? <ActivityIndicator color="white" /> : (
                <Text className="text-white font-satoshi-bold text-base tracking-widest uppercase">{editingNotice ? 'Save Changes' : 'Publish Now'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: 24, paddingBottom: 60 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(9, 9, 11, 0.85)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: 'white', borderTopLeftRadius: 44, borderTopRightRadius: 44, padding: 32, paddingBottom: 40 },
});

export default NoticeBoard;
