import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, Pressable, TouchableOpacity, ScrollView, StyleSheet, Platform, NativeModules, ActivityIndicator, StatusBar, Image, Modal, Alert as RNAlert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import BottomTab from '../../../../components/bottom-tab/BottomTab';
import { io, Socket } from 'socket.io-client';
import DEFAULT_PROFILE from '../../../../assets/images/default_profile.jpg';
import {
  Bell,
  TriangleAlert,
  ShieldUser,
  Clock,
  Activity,
  MessageSquareWarning,
  Car,
  Search,
  Megaphone,
  UserPlus,
  Users,
  ShieldAlert,
  Camera,
  AlertOctagon,
  FileText,
  ReceiptText,
  ClipboardList,
  PlusCircle,
  Logs
} from 'lucide-react-native';

import api, { getApiBaseUrl } from '../../../../utils/apiConfig';

type Role = 'admin' | 'resident' | 'guard';

type Session = {
  token: string;
  role: Role;
  expiresAt: number;
  email?: string;
  full_name?: string;
  profile_image?: string;
};

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';
const LEGACY_ADMIN_SESSION_KEY = '@sociosmart/admin_session_v1';

const ActionCard = ({ label, icon: Icon, color, onPress, fullWidth = false }: any) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className={`bg-white dark:bg-zinc-900 rounded-xl py-5 px-4 items-center mb-4 border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden ${fullWidth ? 'w-full' : 'w-[48%]'}`}
    >
      <View className="w-14 h-14 items-center justify-center mb-2">
        <Icon size={28} color={color} strokeWidth={2} />
      </View>
      <Text className="text-gray-900 dark:text-zinc-50 text-sm font-satoshi-bold text-center leading-tight">
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const StatCard = ({ value, label, color, icon: Icon }: any) => {
  const { colorScheme } = useColorScheme();
  return (
    <View className="w-[48%] bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm shadow-gray-200 dark:shadow-none">
      <View className="flex-row justify-between items-start mb-2">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colorScheme === 'dark' ? `${color}40` : `${color}15` }}
        >
          <Icon size={20} color={color} strokeWidth={2.5} />
        </View>
        <Text className="text-[22px] font-satoshi-black text-gray-900 dark:text-zinc-50">{value}</Text>
      </View>
      <Text className="text-gray-500 dark:text-zinc-500 text-xs font-satoshi-bold uppercase tracking-wider mt-1">{label}</Text>
    </View>
  );
};

const Dashboard = ({ navigation }: any) => {
  const [session, setSession] = useState<Session | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [complaintCount, setComplaintCount] = useState<number>(0);
  const [entriesCount, setEntriesCount] = useState<number>(0);
  const [alertsCount, setAlertsCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // High-Priority SOS State
  const [emergency, setEmergency] = useState<any>(null);
  const socketRef = React.useRef<Socket | null>(null);

  const stackNavigation = navigation?.getParent?.() ?? navigation;

  const fetchPendingData = useCallback(async () => {
    // Only fetch if we have an admin session
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.role !== 'admin') return;

      setLoading(true);
      const [uRes, cRes, gRes, aRes] = await Promise.all([
        api.get('/api/auth/all'),
        api.get('/api/complaints/all'),
        api.get('/api/gate/stats'),
        api.get('/api/alerts/active')
      ]);

      if (uRes.status === 200 && Array.isArray(uRes.data)) {
        setPendingCount(uRes.data.filter((u: any) => u.status === 'pending').length);
      }
      if (cRes.status === 200 && Array.isArray(cRes.data)) {
        setComplaintCount(cRes.data.filter((c: any) => c.status !== 'resolved').length);
      }
      if (gRes.status === 200) {
        setEntriesCount(gRes.data.totalToday || 0);
      }
      if (aRes.status === 200 && Array.isArray(aRes.data)) {
        setAlertsCount(aRes.data.length || 0);
      }
    } catch (error) {
      console.error('Fetch Pending Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    const socket = io(baseUrl);
    socketRef.current = socket;

    socket.on('emergency_alert', (data) => {
      console.log('[Universal Emergency Hub] SOS Signal Received:', data);
      setEmergency(data);
      setAlertsCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPendingData();
    });
    return unsubscribe;
  }, [navigation, fetchPendingData]);

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Session;
          if (parsed?.token && parsed?.role && parsed?.expiresAt && parsed.expiresAt > Date.now()) {
            setSession(parsed);
            return;
          }
        } catch { }
      }

      const legacy = await AsyncStorage.getItem(LEGACY_ADMIN_SESSION_KEY);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy) as { token?: string; expiresAt?: number };
          if (parsed?.token && parsed?.expiresAt && parsed.expiresAt > Date.now()) {
            const migrated: Session = {
              token: parsed.token,
              expiresAt: parsed.expiresAt,
              role: 'admin',
            };
            await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(migrated));
            setSession(migrated);
            return;
          }
        } catch { }
      }

      stackNavigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    load().catch(() => {
      stackNavigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    });
  }, [stackNavigation]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const role = session?.role ?? 'resident';

  const goToNotifications = () => {
    if (role === 'admin' || role === 'guard') {
      stackNavigation.navigate('AdminAlerts');
      return;
    }
  };

  const { colorScheme } = useColorScheme();

  return (
    <SafeAreaView className="flex-1 bg-[#2563EB] dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'light-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#2563EB"} />

      {/* 1. Admin Header (SocioSmart Blue Theme) */}
      <View className="px-6 pt-5 pb-6 bg-[#2563EB] dark:bg-zinc-950">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            {/* Profile Photo */}
            <View className="mr-4">
              <View className="relative">
                <View className="w-16 h-16 rounded-full border-2 border-white/30 overflow-hidden bg-white/10">
                  <Image
                    source={session?.profile_image ? { uri: session.profile_image } : DEFAULT_PROFILE}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#2563EB] dark:border-zinc-950" />
              </View>
            </View>

            <View>
              <View className="flex-row items-center mb-0.5">
                <Text className="text-white/70 dark:text-blue-200 text-[10px] font-satoshi-bold uppercase tracking-widest">{getGreeting()}</Text>
              </View>
              <Text className="text-[22px] font-satoshi-black text-white dark:text-zinc-50">{session?.full_name ?? 'SocioSmart Admin'}</Text>
              <Text className="text-blue-100 dark:text-zinc-400 text-[11px] font-satoshi-medium mt-0.5">Society Control Center</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={goToNotifications}
            activeOpacity={0.8}
            className="w-11 h-11 bg-white/15 dark:bg-zinc-900 rounded-full items-center justify-center border border-white/20 dark:border-zinc-800 relative"
          >
            {alertsCount > 0 && <View className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#2563EB] dark:border-zinc-950 z-10" />}
            <Bell size={21} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

      </View>

      <ScrollView
        className="flex-1 bg-offWhite dark:bg-zinc-950 rounded-t-[32px] overflow-hidden"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View className="px-6 pt-6">

          {role === 'admin' ? (
            <View>
              {/* Operations Overview Grid */}
              <View className="mb-6">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[20px] mb-4">Operations Overview</Text>
                <View className="flex-row flex-wrap justify-between">
                  <View className="w-[48%] bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 border border-gray-100 dark:border-zinc-800 shadow-sm flex-row items-center">
                    <View className="w-10 h-10 items-center justify-center mr-3">
                      <MessageSquareWarning size={22} color="#3B82F6" />
                    </View>
                    <View>
                      <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[10px] uppercase">Complaints</Text>
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg">{complaintCount}</Text>
                    </View>
                  </View>

                  <View className="w-[48%] bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 border border-gray-100 dark:border-zinc-800 shadow-sm flex-row items-center">
                    <View className="w-10 h-10 items-center justify-center mr-3">
                      <Car size={26} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[10px] uppercase">Entries</Text>
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg">{entriesCount}</Text>
                    </View>
                  </View>

                  <View className="w-[48%] bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 border border-gray-100 dark:border-zinc-800 shadow-sm flex-row items-center">
                    <View className="w-10 h-10 items-center justify-center mr-3">
                      <Users size={22} color="#F59E0B" />
                    </View>
                    <View>
                      <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[10px] uppercase">Pending</Text>
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg">{pendingCount}</Text>
                    </View>
                  </View>

                  <View className="w-[48%] bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 border border-gray-100 dark:border-zinc-800 shadow-sm flex-row items-center">
                    <View className="w-10 h-10 items-center justify-center mr-3">
                      <AlertOctagon size={22} color="#EF4444" />
                    </View>
                    <View>
                      <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[10px] uppercase">Alerts</Text>
                      <Text className="text-red-600 dark:text-red-500 font-satoshi-black text-lg">{alertsCount}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 2. Core Management Tools */}
              <View className="mb-6">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[20px] mb-4">Core Management Tools</Text>
                <View className="flex-row flex-wrap justify-between">
                  <ActionCard label="User Management" icon={UserPlus} color="#2563EB" onPress={() => stackNavigation.navigate('ManageUsers')} />
                  <ActionCard label="Vehicle Registry" icon={Car} color="#2563EB" onPress={() => stackNavigation.navigate('VehicleRegistry')} />
                  <ActionCard label="Digital Notice Board" icon={FileText} color="#2563EB" onPress={() => stackNavigation.navigate('NoticeBoard')} />
                  <ActionCard label="Announcements" icon={Megaphone} color="#2563EB" onPress={() => stackNavigation.navigate('ManageAnnouncements')} />
                  <ActionCard label="Complaint Desk" icon={MessageSquareWarning} color="#2563EB" fullWidth onPress={() => stackNavigation.navigate('ManageComplaints')} />
                </View>
              </View>

              {/* 3. Security & IoT Integration */}
              <View className="mb-8">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[20px] mb-4">Security & IoT Integration</Text>
                <View className="flex-row flex-wrap justify-between">
                  <ActionCard label="Gate Logs Review" icon={Logs} color="#16A34A" onPress={() => stackNavigation.navigate('GateLogs')} />
                  <ActionCard label="Search Vehicle" icon={Search} color="#16A34A" onPress={() => stackNavigation.navigate('SearchVehicle')} />
                  <ActionCard label="Alert Notifications" icon={TriangleAlert} color="#EF4444" onPress={() => stackNavigation.navigate('AdminAlerts')} fullWidth />
                </View>
              </View>

              {/* 4. Staff & Maintenance Oversight */}
              <View className="mb-8">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[20px] mb-4">Staff & Maintenance</Text>
                <View className="flex-row flex-wrap justify-between">
                  <ActionCard label="Staff Directory" icon={ShieldUser} color="#8B5CF6" onPress={() => stackNavigation.navigate('ManageStaff')} />
                  <ActionCard label="Duty Rosters" icon={Clock} color="#8B5CF6" onPress={() => stackNavigation.navigate('DutyRoster')} />
                </View>
              </View>

              {/* 5. Reporting & Financials */}
              <View className="mb-4">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[20px] mb-4">Reporting & Financials</Text>
                <View className="flex-row flex-wrap justify-between">
                  <ActionCard label="Ops Summary Reports" icon={FileText} color="#0F766E" onPress={() => stackNavigation.navigate('ReportDetails')} />
                  <ActionCard label="Bill Status Display" icon={ReceiptText} color="#0F766E" onPress={() => stackNavigation.navigate('AdminPayments')} />
                </View>
              </View>

            </View>
          ) : null}

        </View>
      </ScrollView>

      {role === 'admin' ? <BottomTab activeTab="home" navigation={stackNavigation} /> : null}

      {/* Universal SOS Override Modal */}
      <Modal visible={!!emergency} transparent animationType="fade">
        <View className="flex-1 bg-red-600 justify-center items-center px-8">
          <View className="items-center mb-8">
            <View className="w-32 h-32 bg-white/20 rounded-full items-center justify-center mb-6 animate-pulse">
              <ShieldAlert size={64} color="white" />
            </View>
            <Text className="text-white font-satoshi-black text-4xl text-center mb-2 uppercase">SOS ACTIVE</Text>
            <View className="bg-white/20 px-6 py-2 rounded-full border border-white/30">
              <Text className="text-white font-satoshi-bold text-lg uppercase tracking-widest">{emergency?.location}</Text>
            </View>
          </View>

          <View className="bg-white rounded-[40px] p-8 w-full shadow-2xl items-center">
            <Text className="text-gray-400 font-satoshi-bold text-xs uppercase tracking-widest mb-1">Signal From Resident</Text>
            <Text className="text-gray-900 font-satoshi-black text-2xl text-center mb-2">{emergency?.sender}</Text>
            <Text className="text-gray-500 font-satoshi-medium text-center text-sm leading-5 mb-8">
              Emergency panic alarm triggered. The manual IoT siren has been activated. Please coordinate response immediately.
            </Text>

            <TouchableOpacity
              onPress={() => {
                RNAlert.alert("Dispatch Initiated", "Security Team has been notified to proceed to location.");
                setEmergency(null);
              }}
              className="w-full py-5 bg-red-600 rounded-3xl items-center shadow-lg shadow-red-500/40"
            >
              <Text className="text-white font-satoshi-black text-lg tracking-widest">DISPATCH RESPONSE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEmergency(null)}
              className="mt-4 px-6 py-2"
            >
              <Text className="text-gray-400 font-satoshi-bold text-xs uppercase">Dismiss Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 140,
  },
});

export default Dashboard;
