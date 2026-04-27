import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Animated, Modal, ActivityIndicator, Alert } from 'react-native';
import { io } from 'socket.io-client';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { getApiBaseUrl, default as api } from '../../../../utils/apiConfig';
import BottomTab from '../../../../components/bottom-tab/BottomTab';
import {
  Bell, Clock, Pin, ArrowRight, CheckCircle, Activity, User, ShieldCheck, ShieldAlert, PhoneCall
} from 'lucide-react-native';

type Session = {
  token: string;
  role: 'admin' | 'resident' | 'guard';
  expiresAt: number;
  email?: string;
  full_name?: string;
  id?: string;
  _id?: string;
  house_number?: string;
  profile_image?: string;
};

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';
const API_PORT = 5000;


const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

const DUMMY_NOTICES = [
  {
    _id: 'n1',
    title: 'Water Supply Maintenance',
    description: 'Scheduled water supply maintenance will take place this Sunday from 10 AM to 2 PM. Please store water accordingly.',
    createdAt: new Date().toISOString(),
    isUrgent: true,
  },
  {
    _id: 'n2',
    title: 'New Gym Timings',
    description: 'Starting next week, the society gym will be open from 5 AM to 11 PM to accommodate early morning workouts.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

const DUMMY_VISITORS = [
  { _id: 'v1', name: 'Zeeshan Ali', type: 'Guest', status: 'inside' },
  { _id: 'v2', name: 'Arsalan Ahmed', type: 'Delivery', status: 'inside' },
  { _id: 'v3', name: 'Hussnain', type: 'Maintenance', status: 'inside' },
  { _id: 'v4', name: 'Ali Raza', type: 'Guest', status: 'inside' },
];

const DUMMY_COMPLAINTS = [
  { _id: 'c1', title: 'Leaking Faucet in Kitchen', status: 'pending', createdAt: new Date().toISOString() },
  { _id: 'c2', title: 'Elevator Not Working (Block B)', status: 'progress', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

type ComplaintStatus = 'pending' | 'progress' | 'resolved';
type ResidentComplaint = { id: string; title: string; unit: string; status: ComplaintStatus; time: string };


const AnnouncementCard = ({ title, date, description, isExpanded, onToggle }: any) => {
  return (
    <View className="mb-6 bg-white dark:bg-zinc-900/50 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
      <View className="flex-row items-center mb-3">
        <View className="w-12 h-12 items-center justify-center mr-4">
          <Pin size={22} color="#E11D48" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-[16px] mr-2">Notice</Text>
            <View className="bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-md">
              <Text className="text-rose-600 dark:text-rose-400 text-[10px] font-satoshi-bold uppercase">Admin</Text>
            </View>
          </View>
          <Text className="text-gray-400 dark:text-zinc-500 text-[12px] font-satoshi-medium mt-0.5">{date}</Text>
        </View>
      </View>
      <View className="h-[2px] bg-gray-100 dark:bg-zinc-800/60 mb-3" />
      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[15px] leading-tight mb-3 pr-2">{title}</Text>
      <Text className="text-gray-500 dark:text-zinc-400 text-[13px] font-satoshi-medium leading-relaxed" numberOfLines={isExpanded ? undefined : 3}>
        {description || "No description provided for this announcement."}
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-800 self-stretch items-center"
      >
        <Text className="text-gray-900 dark:text-zinc-200 font-satoshi-bold text-[13px]">
          {isExpanded ? "Show Less" : "Read More"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const ComplaintRow = ({ title, status, time, onPress }: any) => {
  const isResolved = status === 'resolved';
  const isProgress = status === 'progress';

  return (
    <TouchableOpacity
      className="flex-row items-center py-4 px-5 border-b border-gray-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900"
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className={`w-2 h-2 rounded-full mr-3.5 ${isResolved ? 'bg-[#16A34A]' : isProgress ? 'bg-[#2563EB]' : 'bg-orange-500'}`} />
      <View className="flex-1 pr-2">
        <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[15px] mb-0.5 leading-tight">{title}</Text>
        <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium">
          {time}
        </Text>
      </View>
      <View className={`flex-row items-center px-2.5 py-1.5 rounded-full ${isResolved ? 'bg-green-100 dark:bg-green-900/40' : isProgress ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-orange-100 dark:bg-orange-900/40'}`}>
        {isResolved ? <CheckCircle size={14} color="#16A34A" /> : isProgress ? <Activity size={14} color={PRIMARY_COLOR} /> : <Clock size={14} color="#EA580C" />}
        <Text className={`text-[10px] font-satoshi-bold ml-1.5 ${isResolved ? 'text-green-700 dark:text-green-400' : isProgress ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
          {status.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const PulsingDot = ({ color = '#4ADE80' }) => {
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: pulseAnim }}
      className="w-2 h-2 rounded-full mr-2"
    >
      <View style={{ backgroundColor: color }} className="w-full h-full rounded-full" />
    </Animated.View>
  );
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
};

const StatusCard = ({ title, onDuty, total, bgGradient }: any) => {
  return (
    <View className="w-[49%] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800">
      <View style={{ backgroundColor: bgGradient }} className="px-5 py-2.5">
        <Text className="text-white font-satoshi-bold text-[11px] uppercase tracking-widest">{title}</Text>
      </View>
      <View className="p-5 flex-row justify-between items-end">
        <View>
          <View className="flex-row items-center mb-1">
            <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-xl">{onDuty}</Text>
          </View>
          <Text className="text-gray-400 text-[10px] font-satoshi-medium uppercase tracking-tighter">On Duty</Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-xl">{total}</Text>
          <Text className="text-gray-400 text-[10px] font-satoshi-medium uppercase tracking-tighter">Total</Text>
        </View>
      </View>
    </View>
  );
};

const ResidentDashboard = ({ navigation }: any) => {
  const [session, setSession] = useState<Session | null>(null);
  const stackNavigation = navigation?.getParent?.() ?? navigation;
  const [notices, setNotices] = useState<any[]>(DUMMY_NOTICES);
  const [visitors, setVisitors] = useState<any[]>(DUMMY_VISITORS);
  const [complaints, setComplaints] = useState<any[]>(DUMMY_COMPLAINTS);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [entryRequest, setEntryRequest] = useState<any>(null);
  const [isHandlingApproval, setIsHandlingApproval] = useState(false);

  const handleEntryDecision = async (decision: 'approved' | 'denied') => {
    if (!entryRequest) return;
    setIsHandlingApproval(true);
    try {
      await api.patch(`/api/visitors/approval/${entryRequest.request_id}`, {
        status: decision
      });
      setEntryRequest(null);
      Alert.alert("Success", decision === 'approved' ? "Visitor approved and gate triggered." : "Visitor entry denied.");
    } catch (error) {
      Alert.alert("Error", "Failed to process entry request.");
    } finally {
      setIsHandlingApproval(false);
    }
  };
  const [expandedNotices, setExpandedNotices] = useState<Set<string>>(new Set());

  const viewAnnouncements = async () => {
    try {
      const response = await api.get('/api/notices');
      setNotices(response.data?.length > 0 ? response.data : DUMMY_NOTICES);
    } catch (e) {
      console.log("View announcements error:", e);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nRes, cRes, vRes, sRes] = await Promise.all([
        api.get('/api/notices'),
        api.get('/api/complaints/my'),
        api.get('/api/visitors/my-visitors'),
        api.get('/api/staff/stats'),
      ]);

      setNotices(nRes.data?.length > 0 ? nRes.data : DUMMY_NOTICES);
      setComplaints(cRes.data?.length > 0 ? cRes.data : DUMMY_COMPLAINTS);
      const filteredVisitors = vRes.data?.filter((v: any) => v.status === 'arrived' || v.status === 'inside') || [];
      setVisitors(filteredVisitors.length > 0 ? filteredVisitors : DUMMY_VISITORS);
      setStats(sRes.data);

      await viewAnnouncements();
    } catch (err) {
      console.log("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Session;
          if (parsed?.token && parsed?.role && parsed?.expiresAt && parsed.expiresAt > Date.now()) {
            setSession(parsed);
            fetchDashboardData();

            // Connect to Socket.io for Real-time Guest Approvals
            const socket = io(getApiBaseUrl());
            socket.on('connect', () => {
              console.log('[Socket] Connected to backend');
              socket.emit('join_community'); // For general notices
              socket.emit('join_user', { userId: parsed.id || parsed._id }); // Private room for approvals (Wait, check login data field)
            });

            socket.on('adhoc_entry_request', (data) => {
              console.log('[Socket] Guest Request Received:', data);
              setEntryRequest(data);
            });

            const interval = setInterval(() => {
              viewAnnouncements();
            }, 60000);

            return () => {
              clearInterval(interval);
              socket.disconnect();
            };
          }
        } catch { }
      }
      stackNavigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    load().catch(() => {
      stackNavigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    });
  }, [stackNavigation, fetchDashboardData]);

  const name = session?.full_name ?? 'Resident';

  const toggleNotice = (id: string) => {
    setExpandedNotices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const { colorScheme } = useColorScheme();

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA] dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8F9FA"} />

      {/* 1. Header Area */}
      <View className="px-6 pt-4 pb-1 bg-[#F8F9FA] dark:bg-zinc-950">
        <View className="flex-row items-center justify-between mb-1">
          <View>
            <Text className="text-gray-400 font-satoshi-bold text-xs uppercase tracking-widest mb-1">{getTimeGreeting()}</Text>
            <Text className="text-2xl font-satoshi-black text-gray-900 dark:text-zinc-50">{name}</Text>
          </View>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => stackNavigation.navigate('NoticeBoard')}
              activeOpacity={0.8}
              className="w-11 h-11 items-center justify-center"
            >
              <Bell size={22} color={PRIMARY_COLOR} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-offWhite dark:bg-zinc-950 overflow-hidden"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View className="h-[2px] bg-gray-200 dark:bg-zinc-800/60 mb-3" />

        <View className="px-1.5">
          {/* 3. Active Visitors in Society - BLUE BOARD STYLE */}
          <View className="mx-2 p-6 bg-[#2563EB] rounded-lg shadow-lg shadow-blue-500/20">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-white font-satoshi-black text-xl tracking-tight">Social Presence</Text>
                <Text className="text-blue-100 text-[10px] font-satoshi-bold mt-1 uppercase tracking-widest">
                  {visitors.length > 0 ? `${visitors.length} visitors active` : 'Community Status'}
                </Text>
              </View>
              <View className="flex-row items-center bg-white/15 px-3 py-1.5 rounded-full">
                <PulsingDot color={visitors.length > 0 ? "#4ADE80" : "#4ADE80"} />
                <Text className="text-white text-[10px] font-satoshi-black uppercase">
                  {visitors.length > 0 ? 'Live Inside' : 'All Clear'}
                </Text>
              </View>
            </View>

            {visitors.length > 0 ? (
              <>
                <View className="flex-row flex-wrap justify-between">
                  {visitors.slice(0, 8).map((v: any, index: number) => (
                    <View key={v._id || index} className="w-[22%] items-center mb-4">
                      <View className="w-16 h-16 bg-white/10 rounded-[22px] items-center justify-center border border-white/5 relative">
                        <Text className="text-white font-satoshi-black text-xl">{v.name ? v.name.charAt(0) : '?'}</Text>
                        <View className="absolute -bottom-1 -right-1 bg-[#0B3BBE] p-1 rounded-lg border border-white/20">
                          <User size={12} color="white" />
                        </View>
                      </View>
                      <Text className="text-white font-satoshi-bold text-[10px] mt-2.5 w-full text-center" numberOfLines={1}>{v.name ? v.name.split(' ')[0] : 'Visitor'}</Text>
                      <Text className="text-blue-100/50 font-satoshi-medium text-[8px] mt-0.5">{v.type || 'Guest'}</Text>
                    </View>
                  ))}
                </View>

                {visitors.length > 8 && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Visitors')}
                    activeOpacity={0.8}
                    className="w-full bg-white/10 mt-2 py-4 rounded-2xl flex-row items-center justify-center border border-white/5"
                  >
                    <Text className="text-white font-satoshi-black text-[12px] uppercase tracking-widest">View Full List ({visitors.length})</Text>
                    <ArrowRight size={14} color="white" className="ml-2" />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View className="py-2 items-center">
                <View className="w-16 h-16 bg-white/10 rounded-[22px] items-center justify-center mb-3">
                  <CheckCircle size={28} color="white" strokeWidth={1.5} />
                </View>
                <Text className="text-white font-satoshi-bold text-center text-[13px]">Peaceful Environment</Text>
                <Text className="text-blue-100/60 text-center text-[10px] mt-1 font-satoshi-medium px-8">No active visitors are currently inside the society</Text>
              </View>
            )}
          </View>


          {/* 4. Announcements Feed */}
          <View className="px-2 mt-6">
            <View className="flex-row items-end justify-between mb-4 px-1">
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[20px] tracking-tight">Latest Notices</Text>
              <TouchableOpacity onPress={() => stackNavigation.navigate('NoticeBoard')} className="pb-1">
                <Text className="text-blue-600 dark:text-blue-400 font-satoshi-bold text-xs uppercase tracking-wider">View All</Text>
              </TouchableOpacity>
            </View>
            {notices.length > 0 ? (
              <View>
                {notices.slice(0, 3).map(n => (
                  <AnnouncementCard
                    key={n._id}
                    title={n.title}
                    date={formatDate(n.createdAt)}
                    description={n.description}
                    isExpanded={expandedNotices.has(n._id)}
                    onToggle={() => toggleNotice(n._id)}
                  />
                ))}

                {notices.length > 3 && (
                  <TouchableOpacity
                    onPress={() => stackNavigation.navigate('NoticeBoard')}
                    activeOpacity={0.8}
                    className="bg-white dark:bg-zinc-900 rounded-[28px] py-6 px-8 items-center border border-gray-100 dark:border-zinc-800 shadow-sm mb-4"
                  >
                    <View className="bg-blue-50 dark:bg-blue-900/30 w-12 h-12 rounded-2xl items-center justify-center mb-3">
                      <ArrowRight size={20} color="#2563EB" />
                    </View>
                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-sm">View All Announcements</Text>
                    <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-xs mt-1">Read {notices.length - 3} more updates from society admin</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View className="bg-white dark:bg-zinc-900 rounded-[28px] p-8 items-center border border-gray-100 dark:border-zinc-800">
                <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-xs">No recent announcements</Text>
              </View>
            )}
          </View>

          {/* 5. Active Complaints Summary */}
          {complaints.length > 0 && (
            <View className="px-2 mt-2">
              <View className="flex-row items-end justify-between mb-4 px-1">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[20px] tracking-tight">My Complaints</Text>
                <TouchableOpacity onPress={() => stackNavigation.navigate('Complaints')} className="pb-1">
                  <Text className="text-blue-600 dark:text-blue-400 font-satoshi-bold text-xs uppercase tracking-wider">View All</Text>
                </TouchableOpacity>
              </View>
              <View className="rounded-lg overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm">
                {complaints.slice(0, 3).map(c => (
                  <ComplaintRow
                    key={c._id}
                    title={c.title}
                    status={c.status}
                    time={formatDate(c.createdAt)}
                    onPress={() => stackNavigation.navigate('Complaints')}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomTab activeTab="home" navigation={stackNavigation} />

      {/* Entry Request Approval Modal */}
      <Modal
        visible={!!entryRequest}
        transparent
        animationType="slide"
      >
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 shadow-2xl">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full items-center justify-center mb-4">
                <ShieldCheck size={40} color={PRIMARY_COLOR} />
              </View>
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-2xl text-center">Visitor Verification</Text>
              <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-center mt-2">A guest is requesting entry at the Main Gate.</Text>
            </View>

            <View className="bg-gray-50 dark:bg-zinc-950 rounded-3xl p-6 mb-8 border border-gray-100 dark:border-zinc-800">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-2xl items-center justify-center shadow-sm">
                  <User size={20} color={PRIMARY_COLOR} />
                </View>
                <View className="ml-4">
                  <Text className="text-gray-400 font-satoshi-bold text-[10px] uppercase tracking-widest">Visitor Name</Text>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg">{entryRequest?.visitor_name || 'Unknown'}</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-2xl items-center justify-center shadow-sm">
                  <Pin size={20} color="#E11D48" />
                </View>
                <View className="ml-4">
                  <Text className="text-gray-400 font-satoshi-bold text-[10px] uppercase tracking-widest">Purpose</Text>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base">{entryRequest?.visitor_type || 'General Visitor'}</Text>
                </View>
              </View>
            </View>

            <View className="gap-y-3">
              <TouchableOpacity
                onPress={() => handleEntryDecision('approved')}
                disabled={isHandlingApproval}
                activeOpacity={0.8}
                className="bg-green-600 w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg shadow-green-500/30"
              >
                {isHandlingApproval ? <ActivityIndicator color="white" /> : (
                  <>
                    <CheckCircle size={20} color="white" />
                    <Text className="text-white font-satoshi-black text-lg ml-3 text-center">APPROVE ENTRY</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleEntryDecision('denied')}
                disabled={isHandlingApproval}
                activeOpacity={0.8}
                className="bg-white dark:bg-zinc-800 w-full py-5 rounded-2xl flex-row items-center justify-center border border-gray-200 dark:border-zinc-700"
              >
                <Text className="text-rose-600 dark:text-rose-400 font-satoshi-black text-lg text-center">DENY ACCESS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setEntryRequest(null)}
                className="mt-2 py-2"
              >
                <Text className="text-gray-400 font-satoshi-bold text-center text-xs uppercase tracking-widest">Decide Later</Text>
              </TouchableOpacity>
            </View>
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

export default ResidentDashboard;
