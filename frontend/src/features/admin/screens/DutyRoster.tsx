import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Pressable,
  Text,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
  NativeModules,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import {
  Search,
  ArrowLeft,
  Plus,
  Clock,
  MapPin,
  ClipboardList,
  Trash2,
  Calendar,
  User,
  X,
  Check,
  AlertOctagon,
  Megaphone,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, Layout, SlideInUp } from 'react-native-reanimated';

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';
import { getApiBaseUrl } from '../../../utils/apiConfig';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const StatTile = ({ label, value, total, onPress, color }: { label: string; value: number; total: number; onPress: () => void; color: string; }) => {
  const { colorScheme } = useColorScheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} className="w-[48%] bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm p-4 mb-4">
      <Text className="text-gray-900 dark:text-zinc-50 text-2xl font-satoshi-bold tracking-tight">{value}</Text>
      <Text className="text-gray-500 dark:text-zinc-500 text-xs font-satoshi-bold mt-1 uppercase tracking-widest">{label}</Text>
      <View className="mt-3 w-full h-[3px] bg-gray-50 dark:bg-zinc-800 rounded-full overflow-hidden">
        <View className="h-[3px] rounded-full" style={{ width: `${Math.min(100, (value / Math.max(1, total)) * 100)}%`, backgroundColor: color }} />
      </View>
    </TouchableOpacity>
  );
};

const AlertRow = ({ alert, onResolve }: any) => {
  const { colorScheme } = useColorScheme();
  const isCritical = alert.type === 'Emergency' || alert.type === 'SOS' || alert.type === 'Fire' || alert.type === 'Medical';
  return (
    <TouchableOpacity activeOpacity={0.75} className={`bg-white dark:bg-zinc-900 rounded-3xl border px-5 py-4 mb-4 shadow-sm ${isCritical ? 'border-red-100 dark:border-red-900/40' : 'border-gray-100 dark:border-zinc-800'}`}>
      <View className="flex-row items-center">
        <View className={`w-10 h-10 rounded-2xl items-center justify-center ${isCritical ? 'bg-red-50 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
          {isCritical ? <AlertOctagon size={18} color="#EF4444" /> : <User size={18} color="#2563EB" />}
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold">{alert.type}</Text>
          <Text className="text-gray-500 dark:text-zinc-500 text-xs">{alert.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const DutyRoster = () => {
  const { colorScheme } = useColorScheme();
  const navigation = useNavigation<any>();
  const [rosters, setRosters] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [isModalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    staff: '',
    staffType: 'Staff',
    day: 'Monday',
    shift_start: '09:00 AM',
    shift_end: '06:00 PM',
    location: '',
    task: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');
      const headers = { Authorization: `Bearer ${parsed.token}` };

      const [rRes, sRes] = await Promise.all([
        fetch(`${baseUrl}/api/rosters/all`, { headers }),
        fetch(`${baseUrl}/api/staff/directory`, { headers }),
      ]);

      const rData = await rRes.json();
      const sData = await sRes.json();

      if (rRes.ok && Array.isArray(rData)) setRosters(rData);
      else setRosters([]);

      if (sRes.ok && Array.isArray(sData)) setStaffList(sData);
      else setStaffList([]);
    } catch (error) {
      console.error('Fetch Roster Error:', error);
      setRosters([]);
      setStaffList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCreateEntry = async () => {
    if (!formData.staff || !formData.location) {
      RNAlert.alert('Incomplete', 'Please select a staff member and location.');
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');

      const response = await fetch(`${baseUrl}/api/rosters/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsed.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchData();
        RNAlert.alert('Success', 'Shift assigned successfully.');
      }
    } catch (error) {
      RNAlert.alert('Error', 'Failed to assign shift.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    RNAlert.alert('Remove Shift', 'Remove this assignment from the roster?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const baseUrl = getApiBaseUrl();
            const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
            const parsed = JSON.parse(sessionRaw || '{}');
            const res = await fetch(`${baseUrl}/api/rosters/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${parsed.token}` },
            });
            if (res.ok) fetchData();
          } catch {
            RNAlert.alert('Error', 'Failed to remove entry.');
          }
        },
      },
    ]);
  };

  const filteredRosters = useMemo(() =>
    Array.isArray(rosters) ? rosters.filter((r) => r.day === selectedDay) : [],
    [rosters, selectedDay]);

  const dayStats = useMemo(() => ({
    total: filteredRosters.length,
    security: filteredRosters.filter((r) => r.staff?.role === 'Security').length,
    maintenance: filteredRosters.filter((r) => r.staff?.role !== 'Security').length,
  }), [filteredRosters]);

  const renderRosterCard = ({ item, index }: any) => (
    <Animated.View className="bg-white dark:bg-zinc-900 rounded-[32px] p-5 mb-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1">
          <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${item.staff?.role === 'Security' ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <User size={22} color={item.staff?.role === 'Security' ? '#2563EB' : '#EA580C'} />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg leading-tight">{item.staff?.full_name || 'Staff Member'}</Text>
            <Text className="text-gray-500 dark:text-zinc-500 text-xs font-satoshi-medium mt-0.5">{item.staff?.role || 'Personnel'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl">
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center bg-gray-50/50 dark:bg-zinc-800/50 p-4 rounded-2xl space-x-4">
        <View className="flex-row items-center flex-1">
          <MapPin size={14} color={colorScheme === 'dark' ? '#71717A' : "#6B7280"} />
          <Text className="text-gray-700 dark:text-zinc-300 text-xs font-satoshi-bold ml-2">{item.location}</Text>
        </View>
        <View className="flex-row items-center">
          <Clock size={14} color={colorScheme === 'dark' ? '#71717A' : "#6B7280"} />
          <Text className="text-gray-600 dark:text-zinc-400 text-[10px] font-satoshi-medium ml-2">{item.shift_start} - {item.shift_end}</Text>
        </View>
      </View>

      {item.task && (
        <View className="mt-3 px-1 flex-row items-center">
          <ClipboardList size={12} color="#94A3B8" />
          <Text className="text-gray-400 text-[10px] font-satoshi-medium ml-2 italic">Assignment: {item.task}</Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} className="p-3 mr-2">
            <ArrowLeft size={22} color={colorScheme === 'dark' ? '#F4F4F5' : "#000000ff"} />
          </TouchableOpacity>
          <Text className="text-2xl font-satoshi-bold text-gray-900 dark:text-zinc-50">Duty Roster</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setFormData({ staff: '', staffType: 'Staff', day: selectedDay, shift_start: '09:00 AM', shift_end: '06:00 PM', location: '', task: '' });
            setModalVisible(true);
          }}
          className="bg-blue-600 w-11 h-11 rounded-full items-center justify-center shadow-lg shadow-blue-500/40"
        >
          <Plus size={22} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="px-5">
          <View className="bg-[#0B3BBE] rounded-[32px] p-5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-satoshi-bold text-base">{selectedDay}</Text>
                <Text className="text-blue-100 text-xs font-satoshi-medium mt-1">{dayStats.total} total shifts</Text>
              </View>
              <View className="bg-white/15 rounded-2xl px-3 py-2">
                <Text className="text-white text-[10px] font-satoshi-black tracking-widest uppercase">Active</Text>
              </View>
            </View>
            <View className="flex-row mt-4">
              <View className="flex-1 bg-white/15 rounded-2xl px-4 py-3 mr-3">
                <Text className="text-white text-sm font-satoshi-bold">{dayStats.security}</Text>
                <Text className="text-blue-100 text-[10px] font-satoshi-bold mt-1 uppercase">Security</Text>
              </View>
              <View className="flex-1 bg-white/15 rounded-2xl px-4 py-3">
                <Text className="text-white text-sm font-satoshi-bold">{dayStats.maintenance}</Text>
                <Text className="text-blue-100 text-[10px] font-satoshi-bold mt-1 uppercase">Support</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-6 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {DAYS.map((day) => (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                className={`mr-3 px-6 py-2.5 rounded-full border ${selectedDay === day ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'}`}
              >
                <Text className={`font-satoshi-bold text-xs ${selectedDay === day ? 'text-white' : 'text-gray-600 dark:text-zinc-400'}`}>{day.slice(0, 3)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>
        ) : (
          <View className="px-5 pb-32">
            {filteredRosters.length === 0 ? (
              <View className="items-center justify-center mt-20">
                <View className="bg-gray-100 dark:bg-zinc-900 p-8 rounded-full mb-4"><Calendar size={40} color={colorScheme === 'dark' ? '#3F3F46' : "#CBD5E1"} /></View>
                <Text className="text-gray-900 dark:text-zinc-50 text-lg font-satoshi-bold">No shifts assigned</Text>
                <Text className="text-gray-400 dark:text-zinc-500 text-sm font-satoshi-medium mt-1 text-center px-10">Tap + to assign staff.</Text>
              </View>
            ) : (
              filteredRosters.map((item, idx) => (
                <View key={item._id}>{renderRosterCard({ item, index: idx })}</View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={isModalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/60" onPress={() => setModalVisible(false)} />
          <Animated.View entering={SlideInUp.springify()} className="bg-white dark:bg-zinc-900 rounded-t-[44px] p-8 pb-12 shadow-2xl">
            <View className="flex-row items-center justify-between mb-8">
              <View>
                <Text className="text-2xl font-satoshi-black text-gray-900 dark:text-zinc-50">Assign Shift</Text>
                <Text className="text-gray-500 dark:text-zinc-500 font-satoshi-medium mt-1">Schedule for {selectedDay}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-gray-100 dark:bg-zinc-800 p-2.5 rounded-full"><X size={24} color={colorScheme === 'dark' ? '#94A3B8' : "#64748B"} /></TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <ScrollView showsVerticalScrollIndicator={false} className="space-y-6">
                <View>
                  <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-bold mb-2 ml-1">Select Personnel</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {staffList.map((s) => (
                      <TouchableOpacity
                        key={s._id}
                        onPress={() => setFormData({ ...formData, staff: s._id, staffType: s.isGuard ? 'Guard' : 'Staff' })}
                        className={`mr-3 p-3 rounded-2xl border ${formData.staff === s._id ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'}`}
                      >
                        <Text className={`font-satoshi-bold text-[10px] ${formData.staff === s._id ? 'text-white' : 'text-gray-600 dark:text-zinc-400'}`}>{s.full_name}</Text>
                        <Text className={`text-[8px] font-satoshi-medium mt-0.5 ${formData.staff === s._id ? 'text-blue-100' : 'text-gray-400 dark:text-zinc-600'}`}>{s.role}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View className="flex-row gap-2 mt-2">
                  <View className="flex-1">
                    <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-bold mb-2 ml-1">Shift Start</Text>
                    <View className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-2 border border-gray-100 dark:border-zinc-800">
                      <TextInput className="text-gray-900 dark:text-zinc-50 font-satoshi-medium" value={formData.shift_start} onChangeText={t => setFormData({ ...formData, shift_start: t })} placeholder="09:00 AM" placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'} />
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-bold mb-2 ml-1">Shift End</Text>
                    <View className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-2 border border-gray-100 dark:border-zinc-800">
                      <TextInput className="text-gray-900 dark:text-zinc-50 font-satoshi-medium" value={formData.shift_end} onChangeText={t => setFormData({ ...formData, shift_end: t })} placeholder="06:00 PM" placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'} />
                    </View>
                  </View>
                </View>

                <View>
                  <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-bold mb-2 ml-1 mt-2">Location</Text>
                  <View className="flex-row items-center bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-2 border border-gray-100 dark:border-zinc-800">
                    <MapPin size={18} color={colorScheme === 'dark' ? '#71717A' : "#94A3B8"} />
                    <TextInput className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium" value={formData.location} onChangeText={t => setFormData({ ...formData, location: t })} placeholder="e.g. Block C" placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'} />
                  </View>
                </View>

                <View>
                  <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-bold mb-2 ml-1 mt-2">Task</Text>
                  <View className="flex-row items-center bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-2 border border-gray-100 dark:border-zinc-800">
                    <ClipboardList size={18} color={colorScheme === 'dark' ? '#71717A' : "#94A3B8"} />
                    <TextInput className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium" value={formData.task} onChangeText={t => setFormData({ ...formData, task: t })} placeholder="Task" placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'} />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCreateEntry}
                  disabled={submitting}
                  className="bg-blue-600 h-16 rounded-full items-center justify-center shadow-xl shadow-blue-500/40 mt-6 flex-row"
                >
                  {submitting ? <ActivityIndicator color="white" /> : (
                    <>
                      <Check size={20} color="white" />
                      <Text className="text-white font-satoshi-black text-lg ml-2 uppercase tracking-widest">Confirm</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DutyRoster;
