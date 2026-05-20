import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Text,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
  NativeModules,
  Alert as RNAlert,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Pressable,
  StatusBar,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  ArrowLeft,
  Filter,
  Plus,
  Phone,
  Shield,
  Wrench,
  Sparkles,
  Clock,
  Briefcase,
  Trash2,
  User,
  Edit2,
  X,
  Star,
  Check,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeInDown,
  FadeInRight,
  Layout,
  SlideInUp
} from 'react-native-reanimated';

const PRIMARY_COLOR = '#2563EB';
const SECONDARY_COLOR = '#0B3BBE';

import { getApiBaseUrl } from '../../../utils/apiConfig';

const SESSION_KEY = '@sociosmart/session_v1';

const ROLES = ['Security', 'Maintenance', 'Electrician', 'Plumber', 'Cleaner', 'Manager', 'Gardener', 'Housekeeping'];

const ManageStaff = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'on-leave'>('all');
  const [pendingComplaints, setPendingComplaints] = useState<any[]>([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedStaffForAssignment, setSelectedStaffForAssignment] = useState<any>(null);

  const [isModalVisible, setModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'Maintenance',
    phone: '',
    shift: '09:00 AM - 06:00 PM',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');
      const response = await fetch(`${baseUrl}/api/staff/directory`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setAllStaff(data);
      } else {
        setAllStaff([]);
      }

      const compResponse = await fetch(`${baseUrl}/api/complaints`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });
      const compData = await compResponse.json();
      if (compResponse.ok && Array.isArray(compData)) {
        setPendingComplaints(compData.filter((c: any) => c.status !== 'resolved' && !c.assignedTo));
      }
    } catch (error) {
      console.error('Fetch Staff Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStaff();
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.phone) {
      RNAlert.alert('Incomplete Form', 'Full name and phone number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');

      const url = editingStaff
        ? `${baseUrl}/api/staff/${editingStaff._id}`
        : `${baseUrl}/api/staff/add`;

      const response = await fetch(url, {
        method: editingStaff ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsed.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchStaff();
        RNAlert.alert('Success', `Staff member ${editingStaff ? 'updated' : 'registered'} successfully.`);
      } else {
        const d = await response.json();
        RNAlert.alert('Error', d.message || 'Action failed.');
      }
    } catch (error) {
      RNAlert.alert('Error', 'Communication with server failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTask = async (complaintId: string) => {
    if (!selectedStaffForAssignment) return;
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');

      const response = await fetch(`${baseUrl}/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsed.token}`,
        },
        body: JSON.stringify({ assignedTo: selectedStaffForAssignment._id, status: 'in-progress' }),
      });

      if (response.ok) {
        setAssignModalVisible(false);
        fetchStaff();
        RNAlert.alert('Success', 'Task assigned to staff member.');
      }
    } catch (error) {
      RNAlert.alert('Error', 'Failed to assign task.');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');

      const response = await fetch(`${baseUrl}/api/staff/status/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsed.token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) fetchStaff();
    } catch (error) {
      console.error('Status Update Error:', error);
    }
  };

  const toggleStatusFilter = (filter: typeof statusFilter) => {
    setStatusFilter(prev => (prev === filter ? 'all' : filter));
  };

  const removeStaff = async (id: string, isGuard: boolean) => {
    if (isGuard) {
      RNAlert.alert('Restricted', 'Security Guards must be managed through the User Directory for safety and authentication monitoring.');
      return;
    }

    RNAlert.alert('Remove Personnel', 'Permanently remove this staff member from the society registry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const baseUrl = getApiBaseUrl();
            const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
            const parsed = JSON.parse(sessionRaw || '{}');
            const res = await fetch(`${baseUrl}/api/staff/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${parsed.token}` }
            });
            if (res.ok) fetchStaff();
          } catch (error) {
            RNAlert.alert('Error', 'Deactivation failed.');
          }
        }
      }
    ]);
  };

  const handleCall = (name: string, phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      RNAlert.alert('Dialing', `Establishing secure line to ${name}...`);
    });
  };

  const getCategoryDetails = (role: string) => {
    switch (role) {
      case 'Security': return { icon: Shield, color: '#2563EB', bg: colorScheme === 'dark' ? 'bg-blue-900/40' : 'bg-blue-50' };
      case 'Maintenance':
      case 'Electrician':
      case 'Plumber': return { icon: Wrench, color: '#EA580C', bg: colorScheme === 'dark' ? 'bg-orange-900/40' : 'bg-orange-50' };
      case 'Cleaner':
      case 'Housekeeping': return { icon: Sparkles, color: '#9333EA', bg: colorScheme === 'dark' ? 'bg-purple-900/40' : 'bg-purple-50' };
      case 'Gardener': return { icon: Briefcase, color: '#16A34A', bg: colorScheme === 'dark' ? 'bg-green-900/40' : 'bg-green-50' };
      default: return { icon: User, color: colorScheme === 'dark' ? '#94A3B8' : '#4B5563', bg: colorScheme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100' };
    }
  };

  // Filtered logic
  const filteredStaff = useMemo(() => {
    if (!Array.isArray(allStaff)) return [];
    return allStaff.filter((item) => {
      if (!item) return false;
      const name = item.full_name?.toLowerCase() || '';
      const role = item.role?.toLowerCase() || '';
      const search = searchQuery.toLowerCase();

      const matchesSearch = name.includes(search) || role.includes(search);
      const matchesTab = activeTab === 'All' ? true : item.role === activeTab;
      const matchesStats = statusFilter === 'all' ? true : item.status === statusFilter;

      return matchesSearch && matchesTab && matchesStats;
    });
  }, [allStaff, searchQuery, activeTab, statusFilter]);

  const totals = {
    all: allStaff.length,
    online: allStaff.filter(s => s.status === 'online').length,
    offline: allStaff.filter(s => s.status === 'offline').length,
    leave: allStaff.filter(s => s.status === 'on-leave').length,
  };

  const renderStaffCard = ({ item, index }: any) => {
    const { icon: Icon, color, bg } = getCategoryDetails(item.role);
    const isOnDuty = item.status === 'online';

    return (
      <Animated.View
        className="bg-white dark:bg-zinc-900 rounded-xl p-5 mb-4 border border-gray-100 dark:border-zinc-800 shadow-sm"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <View className={`w-14 h-14 rounded-full items-center justify-center mr-4 ${bg}`}>
              <Icon size={26} color={color} />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg leading-tight">{item.full_name}</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-gray-500 dark:text-zinc-500 text-xs font-satoshi-medium">{item.role}</Text>
                <View className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700 mx-2" />
                <Star size={10} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-gray-700 dark:text-zinc-300 text-[10px] font-satoshi-bold ml-1">{item.rating || '4.5'}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              const next = item.status === 'online' ? 'offline' : (item.status === 'offline' ? 'on-leave' : 'online');
              handleStatusUpdate(item._id, next);
            }}
            className={`px-3 py-1.5 rounded-full flex-row items-center border ${isOnDuty ? 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-900/20' : item.status === 'offline' ? 'bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700' : 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900/20'}`}>
            <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnDuty ? 'bg-green-500' : item.status === 'offline' ? 'bg-gray-400 dark:bg-zinc-500' : 'bg-red-500'}`} />
            <Text className={`text-[9px] font-satoshi-bold uppercase tracking-widest ${isOnDuty ? 'text-green-700 dark:text-green-400' : item.status === 'offline' ? 'text-gray-600 dark:text-zinc-400' : 'text-red-700 dark:text-red-400'}`}>
              {item.status}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-gray-50/50 dark:bg-zinc-900/50 p-3 rounded-2xl mb-5 gap-x-4">
          <View className="flex-row items-center flex-1">
            <Clock size={12} color={colorScheme === 'dark' ? '#71717A' : "#6B7280"} />
            <Text className="text-gray-600 dark:text-zinc-500 text-[10px] font-satoshi-medium ml-1.5" numberOfLines={1}>{item.shift}</Text>
          </View>
          <View className="flex-row items-center">
            <Phone size={12} color={colorScheme === 'dark' ? '#71717A' : "#6B7280"} />
            <Text className="text-gray-600 dark:text-zinc-500 text-[10px] font-satoshi-medium ml-1.5">{item.phone}</Text>
          </View>
        </View>

        {item.assignedTasks && item.assignedTasks.length > 0 && (
          <View className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl mb-4 border border-blue-100 dark:border-blue-900/30">
            <View className="flex-row items-center mb-1">
              <AlertTriangle size={14} color="#2563EB" />
              <Text className="text-blue-700 dark:text-blue-400 text-xs font-satoshi-bold ml-1.5 uppercase tracking-wider">Assigned Tasks ({item.assignedTasks.length})</Text>
            </View>
            {item.assignedTasks.slice(0, 2).map((task: any, i: number) => (
              <Text key={i} className="text-blue-900 dark:text-blue-300 font-satoshi-medium text-xs mt-1" numberOfLines={1}>
                ⚡ {task.title} (Unit {task.resident?.house_number || 'Unknown'})
              </Text>
            ))}
          </View>
        )}

        <View className="flex-row items-center gap-x-3">
          <TouchableOpacity
            onPress={() => handleCall(item.full_name, item.phone)}
            className="flex-1 flex-row items-center justify-center bg-blue-600 h-12 rounded-full"
          >
            <Phone size={14} color="white" />
            <Text className="text-white text-xs font-satoshi-bold ml-2 uppercase tracking-widest">Connect</Text>
          </TouchableOpacity>

          {!item.isGuard && (
            <TouchableOpacity
              onPress={() => { setSelectedStaffForAssignment(item); setAssignModalVisible(true); }}
              className="flex-1 flex-row items-center justify-center bg-gray-100 dark:bg-zinc-800 h-12 rounded-full border border-gray-200 dark:border-zinc-700"
            >
              <ClipboardList size={14} color={colorScheme === 'dark' ? '#D4D4D8' : '#18181B'} />
              <Text className="text-gray-900 dark:text-zinc-300 text-xs font-satoshi-bold ml-2 uppercase tracking-widest">Assign</Text>
            </TouchableOpacity>
          )}

          {!item.isGuard && (
            <>
              <TouchableOpacity onPress={() => { setEditingStaff(item); setFormData({ full_name: item.full_name, role: item.role, phone: item.phone, shift: item.shift }); setModalVisible(true); }} className="w-12 h-12 items-center justify-center">
                <Edit2 size={18} color={colorScheme === 'dark' ? '#71717A' : "#4B5563"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeStaff(item._id, false)} className="w-12 h-12 rounded-full items-center justify-center">
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#000000ff'} />
          </TouchableOpacity>
          <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Staff Directory</Text>
        </View>

        <TouchableOpacity
          onPress={() => { setEditingStaff(null); setFormData({ full_name: '', role: 'Maintenance', phone: '', shift: '09:00 AM - 06:00 PM' }); setModalVisible(true); }}
          activeOpacity={0.7}
          className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center shadow-md shadow-blue-500/20"
        >
          <Plus size={20} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Workforce Summary Board - Styled like GateLogs */}
        <View className="px-3 mt-2">
          <View className="bg-[#0B3BBE] rounded-lg p-5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-satoshi-bold text-base">Workforce Stats</Text>
                <Text className="text-blue-100 text-xs font-satoshi-medium mt-1">{totals.all} personnel total</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleStatusFilter('on-leave')}
                className={`rounded-2xl px-3 py-2 border ${statusFilter === 'on-leave' ? 'bg-white' : 'bg-white/15 border-transparent'}`}
              >
                <Text className={`text-[10px] font-satoshi-bold tracking-widest uppercase ${statusFilter === 'on-leave' ? 'text-blue-700' : 'text-white'}`}>{totals.leave} ON LEAVE</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row mt-4">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleStatusFilter('online')}
                className={`flex-1 rounded-2xl px-4 py-3 mr-3 border ${statusFilter === 'online' ? 'bg-white' : 'bg-white/15 border-transparent'}`}
              >
                <Text className={`text-sm font-satoshi-bold ${statusFilter === 'online' ? 'text-blue-700' : 'text-white'}`}>{totals.online}</Text>
                <Text className={`text-[10px] font-satoshi-bold mt-1 uppercase ${statusFilter === 'online' ? 'text-blue-700/60' : 'text-blue-100'}`}>On Duty</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleStatusFilter('offline')}
                className={`flex-1 rounded-2xl px-4 py-3 border ${statusFilter === 'offline' ? 'bg-white' : 'bg-white/15 border-transparent'}`}
              >
                <Text className={`text-sm font-satoshi-bold ${statusFilter === 'offline' ? 'text-blue-700' : 'text-white'}`}>{totals.offline}</Text>
                <Text className={`text-[10px] font-satoshi-bold mt-1 uppercase ${statusFilter === 'offline' ? 'text-blue-700/60' : 'text-blue-100'}`}>Offline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search */}
        <View className="px-5 mt-4">
          <View className="flex-row items-center bg-white dark:bg-zinc-900 rounded-full px-5 py-1.5 border border-gray-100 dark:border-zinc-800 shadow-sm">
            <Search size={20} color={colorScheme === 'dark' ? '#71717A' : "#94A3B8"} />
            <TextInput
              placeholder="Search directory..."
              placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#94A3B8"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
            />
            {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={16} color={colorScheme === 'dark' ? '#52525B' : "#94A3B8"} /></TouchableOpacity>}
          </View>
        </View>

        {/* Categories */}
        <View className="mt-6 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {['All', ...ROLES].map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveTab(cat)}
                className={`mr-1.5 px-4 py-2 rounded-full border ${activeTab === cat ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'}`}
              >
                <Text className={`font-satoshi-bold text-sm ${activeTab === cat ? 'text-white' : 'text-gray-600 dark:text-zinc-400'}`}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List */}
        {loading ? (
          <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>
        ) : (
          <View className="px-5 pb-32">
            {filteredStaff.length === 0 ? (
              <View className="items-center justify-center mt-20">
                <View className="bg-gray-100 dark:bg-zinc-900 p-8 rounded-full mb-4"><Filter size={40} color={colorScheme === 'dark' ? '#27272A' : "#CBD5E1"} /></View>
                <Text className="text-gray-900 dark:text-zinc-50 text-lg font-satoshi-bold">No results found</Text>
                <Text className="text-gray-400 dark:text-zinc-500 text-sm font-satoshi-medium mt-1 text-center px-10">Adjust your filters or search keywords to find staff.</Text>
              </View>
            ) : (
              filteredStaff.map((item, idx) => (
                <View key={item._id || `staff-${idx}`}>
                  {renderStaffCard({ item, index: idx })}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Overlay */}
      <Modal visible={isModalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 justify-end">
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={() => setModalVisible(false)}
          />
          <Animated.View entering={SlideInUp.springify()} className="bg-white dark:bg-zinc-900 rounded-t-[44px] p-8 pb-12 shadow-2xl">
            <View className="flex-row items-center justify-between mb-8">
              <View>
                <Text className="text-2xl font-satoshi-black text-gray-900 dark:text-zinc-50">{editingStaff ? 'Update Details' : 'New Personnel'}</Text>
                <Text className="text-gray-500 dark:text-zinc-500 font-satoshi-medium mt-1">Personnel Information Registry</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-gray-100 dark:bg-zinc-800 p-2.5 rounded-full"><X size={24} color={colorScheme === 'dark' ? '#71717A' : "#64748B"} /></TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <ScrollView showsVerticalScrollIndicator={false} className="space-y-6">
                <View>
                  <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-bold mb-2 ml-1">Full Name</Text>
                  <View className="flex-row items-center bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-2 border border-gray-100 dark:border-zinc-800">
                    <User size={18} color={colorScheme === 'dark' ? '#71717A' : "#94A3B8"} />
                    <TextInput className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium" value={formData.full_name} onChangeText={t => setFormData({ ...formData, full_name: t })} placeholder="Name" placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#94A3B8"} />
                  </View>
                </View>

                <View>
                  <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-bold mb-2 ml-1 mt-2">Contact Phone</Text>
                  <View className="flex-row items-center bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-2 border border-gray-100 dark:border-zinc-800">
                    <Phone size={18} color={colorScheme === 'dark' ? '#71717A' : "#94A3B8"} />
                    <TextInput className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium" value={formData.phone} onChangeText={t => setFormData({ ...formData, phone: t })} keyboardType="phone-pad" placeholder="Phone" placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#94A3B8"} />
                  </View>
                </View>

                <View>
                  <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-bold mb-2 ml-1 mt-2">Work Role</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {ROLES.map(r => (
                      <TouchableOpacity key={r} onPress={() => setFormData({ ...formData, role: r })} className={`mr-2 px-5 py-3 rounded-xl border ${formData.role === r ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'}`}>
                        <Text className={`text-[10px] font-satoshi-bold ${formData.role === r ? 'text-white' : 'text-gray-500 dark:text-zinc-400'}`}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View>
                  <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-bold mb-2 ml-1 mt-2">Daily Shift</Text>
                  <View className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-2 border border-gray-100 dark:border-zinc-800 flex-row items-center">
                    <Clock size={18} color={colorScheme === 'dark' ? '#71717A' : "#94A3B8"} />
                    <TextInput className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium" value={formData.shift} onChangeText={t => setFormData({ ...formData, shift: t })} placeholder="e.g. 09:00 AM - 06:00 PM" placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#94A3B8"} />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  className="bg-blue-600 h-16 rounded-full items-center justify-center shadow-xl shadow-blue-500/40 mt-6 flex-row"
                >
                  {submitting ? <ActivityIndicator color="white" /> : (
                    <>
                      <Check size={20} color="white" />
                      <Text className="text-white font-satoshi-black text-lg ml-2 uppercase tracking-widest">{editingStaff ? 'Save Changes' : 'Register'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      {/* Task Assignment Modal */}
      <Modal visible={assignModalVisible} animationType="slide" transparent onRequestClose={() => setAssignModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white dark:bg-zinc-900 rounded-t-[44px] p-6 pb-12 shadow-2xl h-[70%]">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-xl font-satoshi-black text-gray-900 dark:text-zinc-50">Assign Task</Text>
                <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-sm mt-1">
                  Assigning to {selectedStaffForAssignment?.full_name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)} className="bg-gray-100 dark:bg-zinc-800 p-2.5 rounded-full">
                <X size={20} color={colorScheme === 'dark' ? '#71717A' : "#64748B"} />
              </TouchableOpacity>
            </View>

            {pendingComplaints.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <ClipboardList size={40} color="#CBD5E1" />
                <Text className="text-gray-400 font-satoshi-medium mt-4">No unassigned complaints found.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {pendingComplaints.map((complaint) => (
                  <TouchableOpacity
                    key={complaint._id}
                    onPress={() => handleAssignTask(complaint._id)}
                    className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-zinc-700 flex-row justify-between items-center"
                  >
                    <View className="flex-1">
                      <Text className="font-satoshi-bold text-gray-900 dark:text-zinc-50 text-base">{complaint.title}</Text>
                      <Text className="font-satoshi-medium text-gray-500 dark:text-zinc-400 text-xs mt-1">
                        {complaint.category} • Unit {complaint.resident?.house_number || 'Unknown'}
                      </Text>
                    </View>
                    <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                      <Plus size={16} color="#2563EB" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default ManageStaff;
