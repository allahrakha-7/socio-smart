import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Platform, NativeModules, Alert as RNAlert, StatusBar, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronRight, Megaphone, AlertOctagon, ArrowLeft, Send, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import BottomTab from '../../../components/bottom-tab/BottomTab';

const PRIMARY_COLOR = '#2563EB';

import { getApiBaseUrl } from '../../../utils/apiConfig';

const SESSION_KEY = '@sociosmart/session_v1';

const formatTime = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return `Today ��� ${timeStr}`;
  return `${date.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })} ��� ${timeStr}`;
};

const StatTile = ({
  label,
  value,
  total,
  onPress,
  color,
}: {
  label: string;
  value: number;
  total: number;
  onPress: () => void;
  color: string;
}) => {
  const { colorScheme } = useColorScheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="w-[48%] bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm p-4 mb-4"
    >
      <Text className="text-gray-900 dark:text-zinc-50 text-2xl font-satoshi-bold tracking-tight">{value}</Text>
      <Text className="text-gray-500 dark:text-zinc-500 text-xs font-satoshi-bold mt-1 uppercase tracking-widest">{label}</Text>
      <View className="mt-3 w-full h-[3px] bg-gray-50 dark:bg-zinc-800 rounded-full overflow-hidden">
        <View
          className="h-[3px] rounded-full"
          style={{ width: `${Math.min(100, (value / Math.max(1, total)) * 100)}%`, backgroundColor: color }}
        />
      </View>
    </TouchableOpacity>
  );
};

const AlertRow = ({ alert, onPress }: any) => {
  const { colorScheme } = useColorScheme();
  const isCritical = alert.type === 'Emergency' || alert.type === 'SOS' || alert.type === 'Fire' || alert.type === 'Medical';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      className={`bg-white dark:bg-zinc-900 rounded-3xl border px-5 py-4 mb-4 shadow-sm ${isCritical ? 'border-red-100 dark:border-red-900/40' : 'border-gray-100 dark:border-zinc-800'}`}
      onPress={() => onPress(alert)}
    >
      <View className="flex-row items-center">
        <View className={`w-10 h-10 rounded-2xl items-center justify-center ${isCritical ? 'bg-red-50 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
          {isCritical ? (
            <AlertOctagon size={18} color="#EF4444" />
          ) : (
            <Megaphone size={18} color="#2563EB" />
          )}
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base">{alert.title}</Text>
          <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium mt-1">{alert.location}</Text>
          <Text className="text-gray-400 dark:text-zinc-500 text-[10px] font-satoshi-bold mt-2 uppercase tracking-widest">{formatTime(alert.createdAt)}</Text>
        </View>
        <ChevronRight size={18} color={colorScheme === 'dark' ? '#3F3F46' : "#9CA3AF"} />
      </View>
    </TouchableOpacity>
  );
};

const AdminAlerts = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Critical' | 'Security'>('All');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const fetchAlerts = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');
      const response = await fetch(`${baseUrl}/api/alerts/active`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAlerts(data);
      }
    } catch (error) {
      console.error('Fetch Alerts Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const resolveAlert = async (id: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');
      const response = await fetch(`${baseUrl}/api/alerts/resolve/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${parsed.token}` }
      });
      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      RNAlert.alert('Error', 'Failed to resolve alert.');
    }
  };

  const totalCount = alerts.length;
  const criticalCount = alerts.filter((a) => a.type === 'Emergency' || a.type === 'SOS' || a.type === 'Fire' || a.type === 'Medical').length;
  const infoCount = totalCount - criticalCount;

  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'All') return alerts;
    if (activeFilter === 'Critical') return alerts.filter((a) => a.type === 'Emergency' || a.type === 'SOS' || a.type === 'Fire' || a.type === 'Medical');
    return alerts.filter((a) => a.type === 'Security');
  }, [activeFilter, alerts]);

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
      {/* Header */}
      <View className="flex-row items-center px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard')}
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center mr-4"
        >
          <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#000000ff'} />
        </TouchableOpacity>
        <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Alerts Console</Text>
      </View>

      {/* Blue Overview Card */}
      <View className="px-5 mb-4">
        <View className="bg-[#0B3BBE] rounded-[32px] p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-satoshi-bold text-base">Alerts Overview</Text>
              <Text className="text-blue-100 text-xs font-satoshi-medium mt-1">{totalCount} alerts</Text>
            </View>
            <View className="bg-white/15 rounded-2xl px-3 py-2">
              <Text className="text-white text-[10px] font-satoshi-bold tracking-widest uppercase">{criticalCount} CRITICAL</Text>
            </View>
          </View>

          <View className="flex-row mt-4">
            <TouchableOpacity
              onPress={() => setActiveFilter('Critical')}
              activeOpacity={0.85}
              className="flex-1 bg-white/15 rounded-2xl px-4 py-3 mr-3"
            >
              <Text className="text-white text-sm font-satoshi-bold">{criticalCount}</Text>
              <Text className="text-blue-100 text-[10px] font-satoshi-bold mt-1">CRITICAL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveFilter('Security')}
              activeOpacity={0.85}
              className="flex-1 bg-white/15 rounded-2xl px-4 py-3"
            >
              <Text className="text-white text-sm font-satoshi-bold">{infoCount}</Text>
              <Text className="text-blue-100 text-[10px] font-satoshi-bold mt-1">SECURITY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Horizontal Filter Chips */}
      <View className="pl-5 mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row pb-4">
            {(['All', 'Critical', 'Security'] as const).map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter as any)}
                  activeOpacity={0.8}
                  className={`mr-3 px-5 py-2.5 rounded-full border ${isActive ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'
                    }`}
                >
                  <Text className={`font-satoshi-bold text-sm ${isActive ? 'text-white' : 'text-gray-600 dark:text-zinc-400'}`}>{filter}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Alerts List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-5 pt-2">
          {loading ? (
            <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            </View>
          ) : filteredAlerts.length === 0 ? (
            <View className="items-center justify-center mt-20">
              <Megaphone size={48} color={colorScheme === 'dark' ? '#27272A' : "#D1D5DB"} />
              <Text className="text-gray-400 dark:text-zinc-500 text-lg font-satoshi-bold mt-4">No active alerts</Text>
            </View>
          ) : (
            filteredAlerts.map((item) => (
              <AlertRow
                key={item._id}
                alert={item}
                onPress={setSelectedAlert}
              />
            ))
          )}
        </View>
      </ScrollView>

      <BottomTab activeTab="alerts" navigation={navigation} />

      {/* Alert Details Modal */}
      <Modal visible={!!selectedAlert} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedAlert(null)}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-white dark:bg-zinc-900 rounded-t-[32px] p-6 pb-10 shadow-2xl">
                <View className="items-center mb-6">
                  <View className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mb-4" />
                  <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${
                    selectedAlert?.type === 'Emergency' || selectedAlert?.type === 'SOS' || selectedAlert?.type === 'Fire' || selectedAlert?.type === 'Medical' 
                    ? 'bg-red-50 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                    {selectedAlert?.type === 'Emergency' || selectedAlert?.type === 'SOS' || selectedAlert?.type === 'Fire' || selectedAlert?.type === 'Medical' ? (
                      <AlertOctagon size={32} color="#EF4444" />
                    ) : (
                      <Megaphone size={32} color="#2563EB" />
                    )}
                  </View>
                  <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 text-center px-4">{selectedAlert?.title}</Text>
                  <Text className="text-sm font-satoshi-medium text-gray-500 dark:text-zinc-400 mt-1">
                    {selectedAlert?.location} ��� {selectedAlert?.sender?.full_name || 'System'}
                  </Text>
                  <View className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/40 rounded-md">
                    <Text className="text-red-600 dark:text-red-400 font-satoshi-bold text-xs uppercase tracking-widest">{selectedAlert?.type}</Text>
                  </View>
                </View>

                <View className="mt-2">
                  <View className="items-center mb-2 px-2">
                    <Text className="text-gray-600 dark:text-zinc-400 font-satoshi-medium text-sm leading-relaxed text-center mb-4">
                      {selectedAlert?.description}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      resolveAlert(selectedAlert._id);
                      setSelectedAlert(null);
                    }}
                    className="flex-row items-center justify-center bg-green-50 dark:bg-green-900/20 py-3.5 rounded-full border border-green-200 dark:border-green-900/30"
                  >
                    <CheckCircle size={18} color="#16A34A" />
                    <Text className="text-green-700 dark:text-green-400 font-satoshi-bold text-sm ml-2">Mark as Resolved</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedAlert(null)}
                    className="items-center justify-center bg-gray-100 dark:bg-zinc-800 py-3.5 rounded-full mt-3 border border-gray-200 dark:border-zinc-700"
                  >
                    <Text className="text-gray-900 dark:text-zinc-300 font-satoshi-bold text-sm">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 160,
  },
});

export default AdminAlerts;
