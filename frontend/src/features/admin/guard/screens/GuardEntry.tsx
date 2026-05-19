import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, StyleSheet, Alert, ActivityIndicator, Text, TextInput, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X, ShieldCheck, Car, UserCheck, ArrowRightCircle, ArrowLeftCircle } from 'lucide-react-native';

type EntryStatus = 'entry' | 'exit';

type GateEntry = {
  id: string;
  name: string;
  vehicle: string;
  host: string;
  status: EntryStatus;
  time: string;
};

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';


import { getApiBaseUrl } from '../../../../utils/apiConfig';

const GuardEntry = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [host, setHost] = useState('');
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [token, setToken] = useState('');

  const fetchEntries = async (t: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/gate/logs`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (e) {
      console.log("Fetch logs error:", e);
    }
  };

  React.useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.token) {
          setToken(parsed.token);
          fetchEntries(parsed.token);
        }
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      e.name?.toLowerCase().includes(q) ||
      e.vehicle_number?.toLowerCase().includes(q) ||
      e.unit_to_visit?.toLowerCase().includes(q)
    );
  }, [entries, query]);

  const openCreate = () => {
    setName('');
    setVehicle('');
    setHost('');
    setIsModalVisible(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalVisible(false);
  };

  const addEntry = async () => {
    const n = name.trim();
    const h = host.trim();
    const v = vehicle.trim();
    if (!n || !h) {
      Alert.alert('Missing Fields', 'Please enter visitor name and unit.');
      return;
    }

    setIsSaving(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/gate/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: n,
          vehicle_number: v || 'Walk-in',
          unit_to_visit: h,
          type: 'Visitor'
        })
      });

      if (res.ok) {
        fetchEntries(token);
        setIsModalVisible(false);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to save entry');
      }
    } catch (e) {
      Alert.alert('Error', 'Check your connection');
    } finally {
      setIsSaving(false);
    }
  };

  const markExit = async (id: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/gate/exit/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchEntries(token);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to mark exit');
    }
  };

  const formatTime = (d: string) => {
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          className="w-11 h-11 bg-white dark:bg-zinc-900 rounded-2xl items-center justify-center border border-gray-100 dark:border-zinc-800 shadow-sm"
        >
          <ArrowLeft size={22} color={colorScheme === 'dark' ? '#F4F4F5' : "#111827"} />
        </TouchableOpacity>
        <Text className="text-lg font-satoshi-bold text-gray-900 dark:text-zinc-50 tracking-tight">Guard Entry</Text>
        <TouchableOpacity
          onPress={openCreate}
          activeOpacity={0.85}
          className="w-11 h-11 bg-white dark:bg-zinc-900 rounded-2xl items-center justify-center border border-gray-100 dark:border-zinc-800 shadow-sm"
        >
          <Plus size={22} color={PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>

      <View className="px-5">
        <View className="bg-white dark:bg-zinc-900 rounded-[24px] border border-gray-100 dark:border-zinc-800 shadow-sm px-4 py-3 flex-row items-center">
          <ShieldCheck size={18} color={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search visitor, vehicle, unit..."
            placeholderTextColor={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"}
            className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View className="px-5 pt-4">
          {filtered.map((item) => {
            const isExited = item.status === 'exited';
            return (
              <View key={item._id} className="bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 p-5 mb-4 shadow-sm">
                <View className="flex-row items-center">
                  <View className={`w-11 h-11 rounded-2xl items-center justify-center border ${isExited ? 'bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800'}`}>
                    <UserCheck size={20} color={isExited ? (colorScheme === 'dark' ? '#52525B' : '#6B7280') : PRIMARY_COLOR} />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base leading-tight">{item.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <Car size={14} color={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"} />
                      <Text className="text-gray-500 dark:text-zinc-500 text-xs font-satoshi-medium ml-2">{item.vehicle_number || 'Walk-in'} ��� {item.unit_to_visit}</Text>
                    </View>
                  </View>
                  <View className={`px-2.5 py-1 rounded-full flex-row items-center ${isExited ? 'bg-gray-100 dark:bg-zinc-800' : 'bg-green-100 dark:bg-green-900/40'}`}>
                    <Text className={`text-[10px] font-satoshi-bold uppercase tracking-wider ${isExited ? 'text-gray-600 dark:text-zinc-400' : 'text-green-700 dark:text-green-400'}`}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-800 flex-row items-center justify-between">
                  <Text className="text-gray-400 dark:text-zinc-500 text-xs font-satoshi-medium">{formatTime(item.entry_time)}</Text>
                  {!isExited ? (
                    <TouchableOpacity
                      onPress={() => markExit(item._id)}
                      activeOpacity={0.85}
                      className="bg-gray-900 dark:bg-zinc-800 rounded-2xl px-5 py-2"
                    >
                      <Text className="text-white dark:text-zinc-50 text-[10px] font-satoshi-bold tracking-[1.5px] uppercase">Mark Exit</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text className="text-gray-300 dark:text-zinc-500 text-[10px] font-satoshi-bold uppercase tracking-widest">Session Closed ��� {formatTime(item.exit_time)}</Text>
                  )}
                </View>
              </View>
            );
          })}

          {filtered.length === 0 ? (
            <View className="bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 p-8 items-center">
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base">No entries found</Text>
              <Text className="text-gray-500 dark:text-zinc-500 text-xs font-satoshi mt-2 text-center">
                Use the + button to register a new visitor.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, colorScheme === 'dark' && { backgroundColor: '#09090b' }]}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50">New Visitor Entry</Text>
              <TouchableOpacity
                onPress={closeModal}
                disabled={isSaving}
                className="w-10 h-10 rounded-full items-center justify-center bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700"
              >
                <X size={18} color={colorScheme === 'dark' ? '#F4F4F5' : "#111827"} />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[2px] ml-1">Visitor Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                  className="mt-2 bg-[#FAFAFA] dark:bg-zinc-900/50 px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                />
              </View>

              <View className="mt-4">
                <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[2px] ml-1">Vehicle Details</Text>
                <TextInput
                  value={vehicle}
                  onChangeText={setVehicle}
                  placeholder="Car # or 'Walk-in'"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                  className="mt-2 bg-[#FAFAFA] dark:bg-zinc-900/50 px-4 py-3 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                />
              </View>

              <View className="mt-4">
                <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[2px] ml-1">Host / Flat Unit</Text>
                <TextInput
                  value={host}
                  onChangeText={setHost}
                  placeholder="D-321"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                  className="mt-2 bg-[#FAFAFA] dark:bg-zinc-900/50 px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={addEntry}
              disabled={isSaving}
              activeOpacity={0.85}
              className="mt-8 bg-[#2563EB] rounded-2xl py-4 items-center shadow-lg shadow-blue-500/30"
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-satoshi-bold text-base tracking-widest uppercase">Register Entry</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
});

export default GuardEntry;
