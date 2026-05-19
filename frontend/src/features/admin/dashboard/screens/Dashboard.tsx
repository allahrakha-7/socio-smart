import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, Pressable, TouchableOpacity, ScrollView, StyleSheet, Platform, NativeModules, ActivityIndicator, StatusBar, Image, Modal, Alert as RNAlert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Circle } from 'react-native-svg';
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
  Logs,
  X,
  ChevronRight,
  User,
  UserCheck,
  CheckCheck,
  Trash2
} from 'lucide-react-native';

const ALL_SHORTCUTS = [
  { label: 'User Management', screen: 'ManageUsers', category: 'Core Tools', description: 'Approve, suspend, or manage resident profiles.' },
  { label: 'Vehicle Registry', screen: 'VehicleRegistry', category: 'Core Tools', description: 'View and manage all registered resident vehicles.' },
  { label: 'Digital Notice Board', screen: 'NoticeBoard', category: 'Core Tools', description: 'Publish or modify announcements and notices.' },
  { label: 'Announcements', screen: 'ManageAnnouncements', category: 'Core Tools', description: 'Manage push announcements in the community.' },
  { label: 'Complaint Desk', screen: 'ManageComplaints', category: 'Core Tools', description: 'Resolve, review, and track resident complaints.' },
  { label: 'Gate Logs Review', screen: 'GateLogs', category: 'Security & IoT', description: 'Real-time monitoring of gate access entries.' },
  { label: 'Search Vehicle', screen: 'SearchVehicle', category: 'Security & IoT', description: 'Verify resident and visitor vehicles instantly.' },
  { label: 'Alert Notifications', screen: 'AdminAlerts', category: 'Security & IoT', description: 'Configure system alerts and push alerts.' },
  { label: 'Staff Directory', screen: 'ManageStaff', category: 'Staff & Maintenance', description: 'Manage security guard and maintenance roster.' },
  { label: 'Duty Rosters', screen: 'DutyRoster', category: 'Staff & Maintenance', description: 'View shifts, assignments, and calendar duty rosters.' },
];

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
      className={`bg-white dark:bg-zinc-900 rounded-lg py-5 px-4 items-center mb-4 relative overflow-hidden ${fullWidth ? 'w-full' : 'w-[48%]'}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
      }}
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

  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({ tools: [], residents: [] });
  const [allResidents, setAllResidents] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Notifications State & Logic
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsFilter, setNotificationsFilter] = useState<'All' | 'SOS' | 'Visitor' | 'Notice' | 'Complaint' | 'Payment'>('All');

  const checkNotifications = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionRaw) return;
      const parsed = JSON.parse(sessionRaw);

      const res = await fetch(`${baseUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
          const hasUnread = data.some((n: any) => !n.isRead);
          setHasUnreadNotifications(hasUnread);
        }
      }
    } catch (e) {
      console.log('Check notifications error:', e);
    }
  };

  const handleOpenNotifications = async () => {
    setShowNotifications(true);
    await checkNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionRaw) return;
      const parsed = JSON.parse(sessionRaw);

      const res = await fetch(`${baseUrl}/api/notifications/mark-read`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsed.token}` 
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setHasUnreadNotifications(false);
      }
    } catch (e) {
      console.log('Mark all read error:', e);
    }
  };

  const handleClearAll = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionRaw) return;
      const parsed = JSON.parse(sessionRaw);

      const res = await fetch(`${baseUrl}/api/notifications/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${parsed.token}` }
      });
      if (res.ok) {
        setNotifications([]);
        setHasUnreadNotifications(false);
      }
    } catch (e) {
      console.log('Clear notifications error:', e);
    }
  };

  // Fetch residents when search is opened
  const handleOpenSearch = async () => {
    setShowSearch(true);
    setSearchQuery('');
    setSearching(true);
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        const res = await fetch(`${baseUrl}/api/community/residents`, {
          headers: { Authorization: `Bearer ${parsed.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAllResidents(data || []);
        }
      }
    } catch (e) {
      console.log('Search fetch error:', e);
    } finally {
      setSearching(false);
    }
  };

  // Perform search locally
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({
        tools: ALL_SHORTCUTS,
        residents: []
      });
      return;
    }

    const query = searchQuery.toLowerCase();
    const filteredTools = ALL_SHORTCUTS.filter(
      tool => tool.label.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query)
    );
    const filteredResidents = allResidents.filter(
      r => r.full_name?.toLowerCase().includes(query) || r.house_number?.toLowerCase().includes(query)
    );

    setSearchResults({
      tools: filteredTools,
      residents: filteredResidents
    });
  }, [searchQuery, allResidents]);

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

    socket.on('new_notice', (data) => {
      console.log('[Socket] New notice received:', data);
      setHasUnreadNotifications(true);
    });

    socket.on('new_announcement', (data) => {
      console.log('[Socket] New announcement received:', data);
      setHasUnreadNotifications(true);
    });

    socket.on('new_notification', (data) => {
      console.log('[Socket] New system notification received:', data);
      setNotifications(prev => [data, ...prev]);
      setHasUnreadNotifications(true);
    });

    checkNotifications();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPendingData();
      checkNotifications();
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
    <View className="flex-1 bg-[#F4F6F9] dark:bg-zinc-950 relative">
      <StatusBar barStyle="light-content" backgroundColor={colorScheme === 'dark' ? '#18181B' : '#2563EB'} />

      {/* Edged Card Header Block */}
      <SafeAreaView edges={['top']} className="bg-[#2563EB] rounded-b-[40px] overflow-hidden z-10 pb-3 shadow-sm relative">
        <View className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
          <Svg height="100%" width="100%">
            {/* Subtle Abstract Shapes */}
            <Circle cx="85%" cy="16%" r="135" fill="#FFFFFF" opacity="0.07" />
          </Svg>
        </View>

        {/* 1. Header Area */}
        <View className="px-6 py-2">
          <View className="flex-row items-center justify-between">
            {/* Left: Logo */}
            <View className="flex-row items-center">
              <Text className="text-white font-satoshi-black text-[24px] tracking-tight">SocioSmart</Text>
            </View>

            {/* Right: Actions */}
            <View className="flex-row items-center gap-x-5">
              <TouchableOpacity onPress={handleOpenSearch} activeOpacity={0.6}>
                <Search size={24} color="#FFFFFF" strokeWidth={1.5} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleOpenNotifications}
                activeOpacity={0.6}
                className="relative"
              >
                <Bell size={24} color="#FFFFFF" strokeWidth={1.5} />
                {hasUnreadNotifications && (
                  <View className="absolute top-0 right-0 w-[10px] h-[10px] bg-[#EF4444] rounded-full border-2 border-[#2563EB] dark:border-zinc-900" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Subtle Separator Line */}
        <View className="h-[2px] bg-white/15 mx-full mb-4" />

        {role === 'admin' ? (
          <View className="px-6 mb-1">
            {/* Operations Overview Grid */}
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-[20px] mb-4">Operations Overview</Text>
            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 flex-row items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: 'rgba(31, 124, 245, 0.02)' }}>
                <View className="w-10 h-10 items-center justify-center mr-3">
                  <MessageSquareWarning size={24} color="#3B82F6" />
                </View>
                <View>
                  <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[10px] uppercase">Complaints</Text>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg">{complaintCount}</Text>
                </View>
              </View>

              <View className="w-[48%] bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 flex-row items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' }}>
                <View className="w-10 h-10 items-center justify-center mr-3">
                  <Car size={26} color="#10B981" />
                </View>
                <View>
                  <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[10px] uppercase">Entries</Text>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg">{entriesCount}</Text>
                </View>
              </View>

              <View className="w-[48%] bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 flex-row items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' }}>
                <View className="w-10 h-10 items-center justify-center mr-3">
                  <Users size={24} color="#F59E0B" />
                </View>
                <View>
                  <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[10px] uppercase">Pending</Text>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg">{pendingCount}</Text>
                </View>
              </View>

              <View className="w-[48%] bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 flex-row items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' }}>
                <View className="w-10 h-10 items-center justify-center mr-3">
                  <AlertOctagon size={24} color="#EF4444" />
                </View>
                <View>
                  <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[10px] uppercase">Alerts</Text>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg">{alertsCount}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </SafeAreaView>

      <ScrollView
        className="flex-1 overflow-hidden"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View className="px-6 pt-4">

          {role === 'admin' ? (
            <View>
              {/* 2. Core Management Tools */}
              <View className="mb-4">
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
              <View className="mb-4">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[20px] mb-4">Security & IoT Integration</Text>
                <View className="flex-row flex-wrap justify-between">
                  <ActionCard label="Gate Logs Review" icon={Logs} color="#16A34A" onPress={() => stackNavigation.navigate('GateLogs')} />
                  <ActionCard label="Search Vehicle" icon={Search} color="#16A34A" onPress={() => stackNavigation.navigate('SearchVehicle')} />
                  <ActionCard label="Alert Notifications" icon={TriangleAlert} color="#EF4444" onPress={() => stackNavigation.navigate('AdminAlerts')} fullWidth />
                </View>
              </View>

              {/* 4. Staff & Maintenance Oversight */}
              <View className="mb-4">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[20px] mb-4">Staff & Maintenance</Text>
                <View className="flex-row flex-wrap justify-between">
                  <ActionCard label="Staff Directory" icon={ShieldUser} color="#8B5CF6" onPress={() => stackNavigation.navigate('ManageStaff')} />
                  <ActionCard label="Duty Rosters" icon={Clock} color="#8B5CF6" onPress={() => stackNavigation.navigate('DutyRoster')} />
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

      {/* OmniSearch Overlay Modal */}
      <Modal visible={showSearch} transparent animationType="slide" onRequestClose={() => setShowSearch(false)}>
        <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
          {/* Search Header Bar */}
          <View className="flex-row items-center px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm z-10">
            <View className="flex-1 flex-row items-center bg-gray-50 dark:bg-zinc-950 px-4 py-1.5 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm mr-4">
              <Search size={20} color={colorScheme === 'dark' ? '#94A3B8' : '#64748B'} strokeWidth={2} />
              <TextInput
                placeholder="Search tools, residents, shifts..."
                placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#94A3B8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                className="flex-1 h-10 text-left px-3 text-base font-satoshi-medium text-gray-900 dark:text-zinc-50"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                  <X size={16} color={colorScheme === 'dark' ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => setShowSearch(false)} className="py-2.5">
              <Text className="text-sm font-satoshi-bold text-primary">Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Search Content */}
          <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {searching && (
              <View className="items-center py-6">
                <ActivityIndicator color="#2563EB" />
              </View>
            )}

            {/* --- Category: Tools & Shortcuts --- */}
            {searchResults.tools.length > 0 && (
              <View className="mb-6">
                <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[11px] uppercase tracking-widest mb-3">Tools & Shortcuts</Text>
                {searchResults.tools.map((tool: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setShowSearch(false);
                      stackNavigation.navigate(tool.screen);
                    }}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-between p-4 mb-3 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800"
                  >
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base">{tool.label}</Text>
                      <Text className="text-gray-400 dark:text-zinc-500 text-[11px] font-satoshi-medium mt-1 leading-snug">{tool.description}</Text>
                    </View>
                    <ChevronRight size={18} color={colorScheme === 'dark' ? '#94A3B8' : '#94A3B8'} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* --- Category: Residents Directory --- */}
            {searchResults.residents.length > 0 && (
              <View className="mb-6">
                <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[11px] uppercase tracking-widest mb-3">Residents Directory</Text>
                {searchResults.residents.map((res: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setShowSearch(false);
                      stackNavigation.navigate('ManageUsers');
                    }}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-between p-4 mb-3 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mr-4">
                        <User size={20} color="#2563EB" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base">{res.full_name}</Text>
                        <Text className="text-gray-400 dark:text-zinc-500 text-[11px] font-satoshi-medium mt-0.5">Flat No: {res.house_number || 'N/A'}</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={colorScheme === 'dark' ? '#94A3B8' : '#94A3B8'} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* --- No Results State --- */}
            {searchResults.tools.length === 0 && searchResults.residents.length === 0 && !searching && (
              <View className="items-center justify-center py-20 px-8">
                <View className="w-16 h-16 bg-neutral-100 dark:bg-zinc-900 rounded-full items-center justify-center mb-4">
                  <Search size={28} color={colorScheme === 'dark' ? '#94A3B8' : '#94A3B8'} />
                </View>
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg text-center">No results found</Text>
                <Text className="text-gray-400 dark:text-zinc-500 text-xs font-satoshi-medium text-center mt-2 leading-relaxed">
                  We couldn't find anything matching "{searchQuery}". Try checking the spelling or searching for a different term.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      {/* Premium Real-Time Notifications Overlay Modal */}
      <Modal visible={showNotifications} transparent animationType="slide" onRequestClose={() => setShowNotifications(false)}>
        <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
          {/* Header Bar */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm z-10">
            <View className="flex-row items-center gap-x-2">
              <Text className="text-[22px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Notifications</Text>
              {notifications.some(n => !n.isRead) && (
                <View className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              )}
            </View>
            <View className="flex-row items-center gap-x-4">
              {notifications.some(n => !n.isRead) && (
                <TouchableOpacity onPress={handleMarkAllRead} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full flex-row items-center gap-x-1">
                  <CheckCheck size={14} color="#3B82F6" />
                  <Text className="text-xs font-satoshi-bold text-[#3B82F6] uppercase tracking-wide">Mark Read</Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity onPress={handleClearAll} className="p-2 bg-red-50 dark:bg-red-950/20 rounded-full">
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowNotifications(false)} className="w-9 h-9 items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-full">
                <X size={18} color={colorScheme === 'dark' ? '#F4F4F5' : '#111827'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Categories Horizontal Filter ScrollView */}
          <View className="px-6 py-3 border-b border-gray-50 dark:border-zinc-900">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {['All', 'SOS', 'Visitor', 'Notice', 'Complaint', 'Payment'].map((cat: any) => {
                const count = cat === 'All' ? notifications.length : notifications.filter(n => n.category === cat).length;
                const isSelected = notificationsFilter === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setNotificationsFilter(cat)}
                    className={`px-4 py-2 rounded-full flex-row items-center gap-x-1.5 border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 dark:bg-zinc-900 border-gray-150 dark:border-zinc-800'}`}
                  >
                    <Text className={`text-xs font-satoshi-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-500 dark:text-zinc-400'}`}>
                      {cat}
                    </Text>
                    {count > 0 && (
                      <View className={`px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-gray-200 dark:bg-zinc-800'}`}>
                        <Text className={`text-[10px] font-satoshi-bold ${isSelected ? 'text-white' : 'text-gray-600 dark:text-zinc-400'}`}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Notifications List ScrollView */}
          <ScrollView className="flex-1 px-6 bg-offWhite dark:bg-zinc-950 py-4" showsVerticalScrollIndicator={false}>
            {notifications.filter(n => notificationsFilter === 'All' || n.category === notificationsFilter).length === 0 ? (
              <View className="items-center justify-center py-24 px-8">
                <View className="w-20 h-20 bg-neutral-100 dark:bg-zinc-900 rounded-full items-center justify-center mb-5 border-2 border-dashed border-gray-300 dark:border-zinc-700">
                  <Bell size={32} color={colorScheme === 'dark' ? '#52525B' : '#9CA3AF'} />
                </View>
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg text-center">You're all caught up!</Text>
                <Text className="text-gray-400 dark:text-zinc-500 text-xs font-satoshi-medium text-center mt-2 px-10 leading-relaxed">
                  No new alerts or system notifications for category "{notificationsFilter}" right now.
                </Text>
              </View>
            ) : (
              notifications.filter(n => notificationsFilter === 'All' || n.category === notificationsFilter).map((item) => {
                // Category Styles
                let icon = <Bell size={20} color="#64748B" />;
                let badgeBg = 'bg-gray-100 dark:bg-zinc-800';
                let cardBorder = 'border-gray-100 dark:border-zinc-800';
                let glowDot = false;

                if (item.category === 'SOS') {
                  icon = <ShieldAlert size={20} color="#EF4444" />;
                  badgeBg = 'bg-red-50 dark:bg-red-950/30';
                  cardBorder = 'border-red-100 dark:border-red-950/50';
                } else if (item.category === 'Visitor') {
                  icon = <UserCheck size={20} color="#3B82F6" />;
                  badgeBg = 'bg-blue-50 dark:bg-blue-950/30';
                  cardBorder = 'border-blue-100 dark:border-blue-950/50';
                } else if (item.category === 'Notice') {
                  icon = <Megaphone size={20} color="#A855F7" />;
                  badgeBg = 'bg-purple-50 dark:bg-purple-950/30';
                  cardBorder = 'border-purple-100 dark:border-purple-950/50';
                } else if (item.category === 'Complaint') {
                  icon = <MessageSquareWarning size={20} color="#F59E0B" />;
                  badgeBg = 'bg-amber-50 dark:bg-amber-950/30';
                  cardBorder = 'border-amber-100 dark:border-amber-950/50';
                } else if (item.category === 'Payment') {
                  icon = <ReceiptText size={20} color="#10B981" />;
                  badgeBg = 'bg-emerald-50 dark:bg-emerald-950/30';
                  cardBorder = 'border-emerald-100 dark:border-emerald-950/50';
                }

                if (!item.isRead) {
                  glowDot = true;
                }

                return (
                  <View
                    key={item._id}
                    className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-4 border shadow-sm flex-row items-start ${cardBorder}`}
                  >
                    {glowDot && (
                      <View className="w-2 h-2 rounded-full bg-blue-500 absolute top-4 left-3" />
                    )}
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${badgeBg} ${glowDot ? 'pl-1' : ''}`}>
                      {icon}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className={`text-[10px] font-satoshi-bold uppercase tracking-widest ${item.category === 'SOS' ? 'text-red-500' : 'text-gray-400 dark:text-zinc-500'}`}>
                          {item.category}
                        </Text>
                        <Text className="text-gray-400 dark:text-zinc-500 text-[10px] font-satoshi-medium">
                          {new Date(item.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text className={`text-[15px] text-gray-900 dark:text-zinc-50 leading-snug mt-1 ${glowDot ? 'font-satoshi-bold' : 'font-satoshi-medium'}`}>
                        {item.title}
                      </Text>
                      <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium mt-1 leading-relaxed">
                        {item.message}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 140,
  },
});

export default Dashboard;
