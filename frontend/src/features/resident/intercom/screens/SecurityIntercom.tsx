import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, StatusBar, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { ArrowLeft, PhoneCall, ShieldAlert, History, Clock, CheckCircle, HeartPulse, XCircle } from 'lucide-react-native';
import { getApiBaseUrl, default as api } from '../../../../utils/apiConfig';

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';



const SecurityIntercom = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [isCalling, setIsCalling] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSOSActive, setIsSOSActive] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);



  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/communications/history');
      setHistory(response.data);
    } catch (error) {
      console.log("Fetch history error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallSecurity = async () => {
    setIsCalling(true);
    try {
      const response = await api.post('/api/communications/ping', {
        type: 'Urgent',
        subject: 'Digital Intercom Call'
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Ping Sent", "Security has been notified. Please stay near your phone.");
        fetchHistory();
      }
    } catch (error) {
      Alert.alert("Error", "Call failed. Please use Emergency SOS if urgent.");
    } finally {
      setIsCalling(false);
    }
  };

  const triggerPanicAlert = () => {
    Alert.alert(
      "EMERGENCY SOS",
      "This will immediately dispatch an emergency alert to Society Security and Administrators. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "DISPATCH NOW",
          style: "destructive",
          onPress: async () => {
            try {
              setIsSOSActive(true);
              const response = await api.post('/api/alerts/sos');
              if (response.status !== 200 && response.status !== 201) {
                setIsSOSActive(false);
                Alert.alert("Error", "Failed to reach security. Call immediately.");
              }
            } catch (error) {
              setIsSOSActive(false);
              Alert.alert("Error", "Check your connection and call security.");
            }
          }
        }
      ]
    );
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="flex-row items-center px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center mr-4"
        >
          <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
        </TouchableOpacity>
        <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Security Intercom</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Quick Actions Row (Migrated from Dashboard) */}
        <View className="mt-6">
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-xs uppercase tracking-widest opacity-50 mb-4 px-1">Security Actions</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={handleCallSecurity}
              activeOpacity={0.8}
              className="w-[48%] bg-white dark:bg-zinc-900 rounded-full p-5 flex-row items-center border border-gray-100 dark:border-zinc-800 shadow-sm"
            >
              <View className="w-10 h-10 items-center justify-center mr-1">
                <PhoneCall size={19} color="#2563EB" />
              </View>
              <View>
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[13px]">Call Security</Text>
                <Text className="text-gray-400 dark:text-zinc-500 text-[9px] font-satoshi-medium">Instant Ping</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={triggerPanicAlert}
              activeOpacity={0.8}
              className="w-[48%] bg-rose-50 dark:bg-rose-900/10 rounded-full p-5 flex-row items-center border border-rose-100 dark:border-rose-900/20 shadow-sm"
            >
              <View className="w-10 h-10 items-center justify-center mr-3">
                <ShieldAlert size={22} color="#E11D48" />
              </View>
              <View>
                <Text className="text-rose-600 dark:text-rose-400 font-satoshi-bold text-[13px]">Emergency</Text>
                <Text className="text-rose-400 dark:text-rose-500 text-[9px] font-satoshi-medium">SOS Alarm</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>



        {/* Call History */}
        <View className="mt-10 mb-10">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg">Call History</Text>
            <History size={20} color="#64748B" />
          </View>

          {isLoading ? (
            <ActivityIndicator color={PRIMARY_COLOR} />
          ) : history.length > 0 ? (
            <View className="gap-y-4">
              {history.map((log) => (
                <View key={log._id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${log.status === 'handled' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                      {log.status === 'handled' ? <CheckCircle size={18} color="#16A34A" /> : <Clock size={18} color="#EA580C" />}
                    </View>
                    <View className="ml-4">
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[15px]">{log.subject}</Text>
                      <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium">{formatDateTime(log.createdAt)}</Text>
                    </View>
                  </View>
                  <View className="bg-gray-50 dark:bg-zinc-800 px-3 py-1 rounded-full border border-gray-100 dark:border-zinc-700">
                    <Text className={`text-[10px] font-satoshi-bold uppercase ${log.status === 'handled' ? 'text-green-600' : 'text-orange-600'}`}>{log.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center py-10">
              <Text className="text-gray-400 font-satoshi-medium">No recent call records</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* EMERGENCY SAFEMODE MODAL */}
      <Modal visible={isSOSActive} animationType="fade" transparent>
        <View className="flex-1 bg-rose-600 justify-center items-center px-8">
          <StatusBar barStyle="light-content" backgroundColor="#E11D48" />

          <View className="items-center mb-10">
            <View className="w-32 h-32 bg-white/20 rounded-full items-center justify-center mb-6">
              <ShieldAlert size={64} color="white" />
            </View>
            <Text className="text-white font-satoshi-black text-4xl text-center mb-4 uppercase">SOS Dispatch active</Text>
            <Text className="text-rose-100 font-satoshi-medium text-center text-lg leading-6">
              Security and Administrators have been notified of your location. Help is on the way.
            </Text>
          </View>

          {/* Pulse Animation Placeholder */}
          <View className="w-full flex-row items-center justify-center h-20 mb-10">
            <HeartPulse size={48} color="white" className="opacity-50" />
            <View className="ml-4 h-1 w-24 bg-white/20 rounded-full overflow-hidden">
              <View className="h-full w-1/2 bg-white" />
            </View>
          </View>

          <View className="w-full gap-y-4">
            <TouchableOpacity
              onPress={() => Alert.alert("Calling Security", "Connecting to Main Gate Security...")}
              className="w-full h-16 bg-white rounded-3xl flex-row items-center justify-center shadow-2xl"
            >
              <PhoneCall size={20} color="#E11D48" />
              <Text className="text-rose-600 font-satoshi-black text-lg ml-3">CALL SECURITY DIRECTLY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSOSActive(false)}
              className="w-full h-16 bg-rose-800 rounded-3xl flex-row items-center justify-center"
            >
              <XCircle size={20} color="white" />
              <Text className="text-white font-satoshi-black text-lg ml-3">I AM SAFE (CANCEL SOS)</Text>
            </TouchableOpacity>
          </View>

          <View className="absolute bottom-12 items-center">
            <Text className="text-rose-200 font-satoshi-bold text-xs uppercase tracking-[3px]">SocioSmart Emergency Protocol</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SecurityIntercom;
