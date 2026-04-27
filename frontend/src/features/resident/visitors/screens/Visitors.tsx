import React, { useState, useMemo, useEffect } from 'react';
import { Text, TextInput, View, ScrollView, TouchableOpacity, Modal, StyleSheet, Alert, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X, UserCheck, Car, CalendarClock, Phone, Hash, Trash2, ShieldCheck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../../../../utils/apiConfig';

type Visitor = {
  _id: string;
  name: string;
  phone: string;
  type: string;
  expected_date: string;
  pass_code: string;
  status: string;
  plate_number?: string;
};

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';
const API_PORT = 5000;



const Visitors = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('Visitor');
  const [expectedDate, setExpectedDate] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [otherDetails, setOtherDetails] = useState('');

  const [query, setQuery] = useState('');
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const rawSession = await AsyncStorage.getItem(SESSION_KEY);
      if (!rawSession) return;
      const { token } = JSON.parse(rawSession);

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/visitors/my-visitors`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setVisitors(data);
      }
    } catch (error) {
      console.error('Fetch visitors error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      v.phone.toLowerCase().includes(q) ||
      v.pass_code.toLowerCase().includes(q) ||
      (v.plate_number && v.plate_number.toLowerCase().includes(q))
    );
  }, [query, visitors]);

  const openCreate = () => {
    setName('');
    setPhone('');
    setType('Visitor');
    setExpectedDate('');
    setPlateNumber('');
    setOtherDetails('');
    setIsModalVisible(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalVisible(false);
  };

  const formatPlate = (text: string) => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleaned.length > 3) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
    }
    return cleaned;
  };

  const addVisitor = async () => {
    if (!name.trim() || !phone.trim() || !expectedDate.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsSaving(true);
    try {
      const rawSession = await AsyncStorage.getItem(SESSION_KEY);
      if (!rawSession) return;
      const { token } = JSON.parse(rawSession);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/visitors/pre-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: type === 'Others' && otherDetails.trim() ? `${name.trim()} (${otherDetails.trim()})` : name.trim(),
          phone: phone.trim(),
          type,
          expected_date: expectedDate,
          plate_number: plateNumber.trim()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const newVisitor = await response.json();
        setVisitors([newVisitor, ...visitors]);
        setIsModalVisible(false);
        Alert.alert('Success', `Visitor pre-approved.\nPass Code: ${newVisitor.pass_code}`);
      } else {
        const err = await response.json();
        Alert.alert('Error', err.message || 'Failed to pre-approve');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelVisitor = async (id: string) => {
    Alert.alert('Cancel Pre-approval', 'Are you sure you want to cancel this?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            const rawSession = await AsyncStorage.getItem(SESSION_KEY);
            if (!rawSession) return;
            const { token } = JSON.parse(rawSession);

            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/visitors/cancel/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
              setVisitors(visitors.filter(v => v._id !== id));
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel');
          }
        }
      }
    ]);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          className="w-11 h-11 items-center justify-center"
        >
          <ArrowLeft size={22} color={colorScheme === 'dark' ? '#F4F4F5' : "#111827"} />
        </TouchableOpacity>
        <Text className="text-lg font-satoshi-bold text-gray-900 dark:text-zinc-50 tracking-tight">Pre-Approve Visitors</Text>
        <TouchableOpacity
          onPress={openCreate}
          activeOpacity={0.85}
          className="w-11 h-11 bg-[#2563EB] dark:bg-zinc-900 items-center justify-center border border-gray-100 dark:border-zinc-800 shadow-sm rounded-full"
        >
          <Plus size={22} color="white" />
        </TouchableOpacity>
      </View>

      <View className="px-5 mb-2">
        <View className="bg-white dark:bg-zinc-900 rounded-full border border-gray-100 dark:border-zinc-800 shadow-sm px-4 py-3 flex-row items-center">
          <UserCheck size={18} color={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or code..."
            placeholderTextColor={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"}
            className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View className="px-5 pt-4">
          {isLoading ? (
            <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            </View>
          ) : (
            filtered.map((item) => (
              <View key={item._id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-5 mb-4 shadow-sm">
                <View className="flex-row justify-between items-start">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 items-center justify-center border border-blue-100 dark:border-blue-800">
                      <UserCheck size={24} color={PRIMARY_COLOR} />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[17px]">{item.name}</Text>
                      <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium mt-0.5">{item.type} ��� {item.phone}</Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Pass Code</Text>
                    <View className="bg-blue-600 px-3 py-1 rounded-lg">
                      <Text className="text-white font-satoshi-black text-sm tracking-widest">{item.pass_code}</Text>
                    </View>
                  </View>
                </View>

                <View className="mt-5 pt-4 border-t border-gray-50 dark:border-zinc-800/50 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <CalendarClock size={16} color={PRIMARY_COLOR} />
                    <Text className="text-gray-600 dark:text-zinc-400 text-[13px] font-satoshi-medium ml-2">Expected: {formatDate(item.expected_date)}</Text>
                  </View>

                  {item.status === 'pending' && (
                    <TouchableOpacity onPress={() => cancelVisitor(item._id)}>
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}

          {!isLoading && filtered.length === 0 ? (
            <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-10 items-center">
              <View className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full items-center justify-center mb-4">
                <ShieldCheck size={40} color="#CBD5E1" />
              </View>
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg text-center">No Pre-Approvals</Text>
              <Text className="text-gray-500 dark:text-zinc-500 text-sm font-satoshi-medium mt-2 text-center px-4">
                Add frequent visitors, deliveries or guests to ensure quick entry at the gate.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View className="bg-white dark:bg-zinc-900 rounded-t-[40px] p-8 pb-10 shadow-2xl absolute bottom-0 left-0 right-0">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-2xl font-satoshi-black text-gray-900 dark:text-zinc-50">Pre-Approve</Text>
                <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-sm">Guest details for direct entry</Text>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                disabled={isSaving}
                className="w-12 h-12 rounded-full items-center justify-center bg-gray-100 dark:bg-zinc-800"
              >
                <X size={22} color={colorScheme === 'dark' ? '#F4F4F5' : "#111827"} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-5">
                <View>
                  <Text className="text-xs font-satoshi-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">Category</Text>
                  <View className="flex-row space-x-6 gap-2">
                    {['Visitor', 'Delivery', 'Cab', 'Others'].map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setType(t)}
                        className={`px-4 py-2.5 rounded-xl border ${type === t ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-200 dark:border-zinc-800'}`}
                      >
                        <Text className={`font-satoshi-bold text-xs ${type === t ? 'text-white' : 'text-gray-600 dark:text-zinc-400'}`}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {type === 'Others' && (
                  <View className="mt-4">
                    <Text className="text-xs font-satoshi-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">More Information</Text>
                    <TextInput
                      value={otherDetails}
                      onChangeText={setOtherDetails}
                      placeholder="Please specify additional details..."
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                      className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-50 font-satoshi-medium h-24"
                    />
                  </View>
                )}

                <View className="mt-4">
                  <Text className="text-xs font-satoshi-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">Full Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter guest name"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                    className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                  />
                </View>

                <View className="mt-4">
                  <Text className="text-xs font-satoshi-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">Phone Number</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+92 301 2345678"
                    keyboardType="phone-pad"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                    className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                  />
                </View>

                <View className="mt-4">
                  <Text className="text-xs font-satoshi-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">Expected Date (DD-MM-YYYY)</Text>
                  <TextInput
                    value={expectedDate}
                    onChangeText={setExpectedDate}
                    placeholder="DD-MM-YYYY"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                    className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                  />
                </View>

                <View className="mt-4">
                  <View className="flex-row items-center mb-2 ml-1">
                    <Text className="text-xs font-satoshi-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest">Expected Vehicle Plate</Text>
                    <View className="ml-2 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full"><Text className="text-[9px] font-satoshi-black text-blue-600 uppercase tracking-widest">Fast Track</Text></View>
                  </View>
                  <TextInput
                    value={plateNumber}
                    onChangeText={(t) => setPlateNumber(formatPlate(t))}
                    placeholder="e.g. LEA-1234 (Optional)"
                    autoCapitalize="characters"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                    className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-50 font-satoshi-medium tracking-widest"
                  />
                  <Text className="text-gray-400 text-[10px] font-satoshi-medium mt-2 px-1">Adding a plate skips manual guard verification at the gate via the NPR Camera.</Text>
                </View>

                <TouchableOpacity
                  onPress={addVisitor}
                  disabled={isSaving}
                  activeOpacity={0.85}
                  className="mt-8 bg-[#2563EB] rounded-full py-5 shadow-lg shadow-blue-500/30 items-center"
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-satoshi-black text-base tracking-widest">GENERATE PASS CODE</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    backgroundColor: 'rgba(9, 9, 11, 0.7)',
    justifyContent: 'flex-end',
  },
});

export default Visitors;
