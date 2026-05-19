import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StyleSheet, Alert, StatusBar, Platform, NativeModules, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import BottomTab from '../../../../components/bottom-tab/BottomTab';
import { io, Socket } from 'socket.io-client';
import {
  Bell, Search, Unlock, Lock, Camera, CheckCircle, XCircle, Clock, Car, UserPlus, Phone, AlertOctagon,
  Megaphone, Users, Check, Hash, ShieldCheck
} from 'lucide-react-native';

type Session = {
  _id?: string;
  id?: string;
  token: string;
  role: 'admin' | 'resident' | 'guard';
  expiresAt: number;
  email?: string;
  full_name?: string;
};

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';

import api, { getApiBaseUrl } from '../../../../utils/apiConfig';

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Live data from API replaces hardcoded placeholders

const GuardDashboard = ({ navigation }: any) => {
  const [session, setSession] = useState<Session | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState(false);
  const [emergencyDetail, setEmergencyDetail] = useState<any>(null);
  const [pendingExits, setPendingExits] = useState<any[]>([]);
  const [nprLogs, setNprLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalToday: 0, insideNow: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [passCode, setPassCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedVisitor, setVerifiedVisitor] = useState<any>(null);
  const [incomingPings, setIncomingPings] = useState<any[]>([]);

  // Unknown Vehicle Flow States
  const [unknownVehicleModalVisible, setUnknownVehicleModalVisible] = useState(false);
  const [unknownPlateNumber, setUnknownPlateNumber] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorUnit, setVisitorUnit] = useState('');
  const [visitorPurpose, setVisitorPurpose] = useState('Visitor Entry');
  const [authorizedActivity, setAuthorizedActivity] = useState<any>(null);

  const stackNavigation = navigation?.getParent?.() ?? navigation;

  const fetchGuardData = async () => {
    setIsLoading(true);
    try {
      const [lRes, sRes, aRes] = await Promise.all([
        api.get('/api/gate/logs'),
        api.get('/api/gate/stats'),
        api.get('/api/alerts/active')
      ]);

      if (lRes.status === 200) {
        const logs = lRes.data;
        // Process logs for UI components
        setPendingExits(logs.filter((l: any) => l.status === 'inside').slice(0, 3));
        setNprLogs(logs.filter((l: any) => l.vehicle_number).slice(0, 4));
      }
      if (sRes.status === 200) {
        setStats(sRes.data);
      }
      if (aRes.status === 200) {
        const activeAlerts = aRes.data;
        setActiveEmergency(activeAlerts.length > 0);
        // If there's an alert, we could store its details in state to show who triggered it
        if (activeAlerts.length > 0) {
          setEmergencyDetail(activeAlerts[0]);
        }
      }
    } catch (e) {
      console.log("Guard data fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    const socket = io(baseUrl);

    socket.on('emergency_alert', async (data) => {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(raw || '{}');
      if (parsed.role === 'guard' && data.routedTo && data.routedTo !== parsed.id) {
        console.log('[Security Hub] SOS routed to another guard on duty.');
        return;
      }
      console.log('[Security Hub] SOS Critical Signal Received:', data);
      setActiveEmergency(true);
      setEmergencyDetail({
        sender: { full_name: data.sender },
        location: data.location,
        description: 'Panic alarm triggered via SocioSmart SOS Hub. IoT Siren Active.'
      });
    });

    socket.on('security_ping', (data) => {
      console.log('[Security Hub] Standard Ping Received:', data);
      setIncomingPings(prev => [{
        id: data.id,
        sender: data.sender,
        house: data.house,
        type: data.type,
        time: data.time || new Date(),
        status: 'pending'
      }, ...prev]);
    });

    socket.on('entry_request_handled', (data) => {
      console.log('[Security Hub] Entry Request Handled:', data);
      Alert.alert(
        "Request Status",
        `Resident has ${data.status} entry for ${data.visitor} heading to House ${data.house}.`
      );
      fetchGuardData();
    });

    socket.on('gate_activity', (data: any) => {
      console.log('[Security Hub] Gate Activity Socket Event:', data);

      // Auto-refresh the logs
      fetchGuardData();

      // If authorized, show visual unlock state
      if (data.authorized) {
        setGateOpen(true);
        if (data.plate_number !== 'MANUAL_OVERRIDE') {
          setAuthorizedActivity(data);
          setTimeout(() => {
            setAuthorizedActivity(null);
          }, 6000);
        }
        setTimeout(() => {
          setGateOpen(false);
        }, 5000);
      } else {
        // Unrecognized / Visitor Vehicle Alert
        if (data.plate_number !== 'MANUAL_OVERRIDE') {
          setUnknownPlateNumber(data.plate_number);
          setVisitorName('');
          setVisitorPhone('');
          setVisitorUnit('');
          setVisitorPurpose('Visitor Entry');
          setUnknownVehicleModalVisible(true);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Session;
          if (parsed?.token && parsed?.role && parsed?.expiresAt && parsed.expiresAt > Date.now()) {
            setSession(parsed);
            fetchGuardData();
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

  const { colorScheme } = useColorScheme();

  const name = session?.full_name ?? 'Guard Ahmed';
  const shiftTime = 'Morning Shift (08:00 AM - 04:00 PM)';

  const handleManualOverride = () => {
    navigation.navigate('GateOverride');
  };

  const handleMarkExit = (logId: string, guestName: string) => {
    Alert.alert("Mark Exit", `Confirm exit for ${guestName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          if (!session) return;
          try {
            const response = await api.patch(`/api/gate/exit/${logId}`);
            if (response.status === 200) {
              Alert.alert("Success", "Exit logged.");
              fetchGuardData();
            }
          } catch (e) { Alert.alert("Error", "Could not mark exit."); }
        }
      }
    ]);
  };

  const handleVerifyPassCode = async () => {
    if (!passCode || passCode.length < 6) {
      Alert.alert("Error", "Please enter a valid 6-digit code");
      return;
    }

    setVerifying(true);
    setVerifiedVisitor(null);
    try {
      const response = await api.get(`/api/visitors/verify/${passCode}`);

      if (response.status === 200) {
        const data = response.data;
        setVerifiedVisitor(data);
      } else {
        Alert.alert("Invalid Code", response.data?.message || "No active pre-approval found");
      }
    } catch (error: any) {
      Alert.alert("Invalid Code", error.response?.data?.message || "No active pre-approval found");
    } finally {
      setVerifying(false);
    }
  };

  const handleApproveEntry = async () => {
    if (!verifiedVisitor || !session) return;
    try {
      const response = await api.post('/api/gate/entry', {
        name: verifiedVisitor.name,
        phone: verifiedVisitor.phone,
        type: verifiedVisitor.type,
        unit_to_visit: verifiedVisitor.house_number,
        purpose: 'Pre-approved visit'
      });

      if (response.status === 201 || response.status === 200) {
        // Trigger physical gate command
        await api.post('/api/gate/manual-trigger', { action: 'OPEN' });

        Alert.alert("Success", "Entry logged. Gate Open!");
        setVerifyModalVisible(false);
        setPassCode('');
        setVerifiedVisitor(null);
        fetchGuardData();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to log entry");
    }
  };

  const handleApproveUnknownEntry = async () => {
    if (!visitorName.trim() || !visitorUnit.trim()) {
      Alert.alert("Missing Information", "Please enter Visitor Name and House Unit to visit.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create a guest entry log
      const response = await api.post('/api/gate/entry', {
        name: visitorName.trim(),
        phone: visitorPhone.trim(),
        vehicle_number: unknownPlateNumber,
        type: 'Visitor',
        unit_to_visit: visitorUnit.trim(),
        purpose: visitorPurpose.trim(),
        gate: 'Main Gate'
      });

      if (response.status === 201 || response.status === 200) {
        // 2. Trigger the gate command via manual trigger
        // This transmits OPEN to ESP32/Relay via MQTT
        await api.post('/api/gate/manual-trigger', {});

        Alert.alert("Success", "Visitor Entry Logged & Gate Command Transmitted.");
        setUnknownVehicleModalVisible(false);
        setVisitorName('');
        setVisitorPhone('');
        setVisitorUnit('');
        setVisitorPurpose('Visitor Entry');
        fetchGuardData();
      } else {
        Alert.alert("Error", "Could not log visitor entry.");
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "An error occurred while logging visitor entry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolvePing = async (pingId: string) => {
    try {
      const response = await api.patch(`/api/communications/handle/${pingId}`);
      if (response.status === 200) {
        setIncomingPings(prev => prev.filter(p => p.id !== pingId));
      }
    } catch (e) {
      console.log("Error resolving ping:", e);
    }
  };

  const onLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to end your shift and sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove([SESSION_KEY]);
          stackNavigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA] dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8F9FA"} />

      {authorizedActivity && (
        <View className="absolute top-24 left-6 right-6 bg-green-600 dark:bg-green-700 p-5 rounded-[28px] z-50 flex-row items-center border border-green-500 shadow-xl shadow-green-600/30">
          <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
            <CheckCircle size={24} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-satoshi-bold text-xs uppercase tracking-wider mb-0.5">Authorized Vehicle Scanned</Text>
            <Text className="text-white font-satoshi-black text-xs">
              {authorizedActivity.details?.make === 'Pre-Approved' ? 'Guest' : 'Resident'} {authorizedActivity.details?.owner || 'Owner'} (Flat {authorizedActivity.details?.unit || 'N/A'}) - Car {authorizedActivity.plate_number} entered at {formatTime(authorizedActivity.timestamp || new Date().toISOString())}.
            </Text>
          </View>
        </View>
      )}

      {/* 1. Header Area */}
      <View className="px-6 bg-[#F8F9FA] dark:bg-zinc-950">
        <View className="flex-row items-center justify-between">
          {/* Left: Logo */}
          <View className="flex-row items-center">
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-[24px] tracking-tight">SocioSmart</Text>
          </View>

          {/* Right: Actions */}
          <View className="flex-row items-center gap-x-5">
            <TouchableOpacity activeOpacity={0.6}>
              <Search size={24} color={colorScheme === 'dark' ? '#fafafa' : '#1f2937'} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => stackNavigation.navigate('NoticeBoard')}
              activeOpacity={0.6}
              className="relative"
            >
              <Bell size={24} color={colorScheme === 'dark' ? '#fafafa' : '#1f2937'} strokeWidth={1.5} />
              <View className="absolute top-0 right-0 w-[10px] h-[10px] bg-[#EF4444] rounded-full border-2 border-[#F8F9FA] dark:border-zinc-950" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 bg-offWhite dark:bg-zinc-950 overflow-hidden" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View className="h-[2px] bg-gray-200 dark:bg-zinc-800/60 mb-3" />
        <View className="px-6 pt-6">

          {/* 4. Emergency & Alert System (Top Priority if Active) */}
          {activeEmergency && (
            <View className="bg-red-500 dark:bg-red-600 rounded-2xl p-5 mb-8 shadow-sm shadow-red-200 dark:shadow-none">
              <View className="flex-row items-center justify-between mb-4 border-b border-red-400/30 pb-4">
                <View className="flex-row items-center">
                  <AlertOctagon size={24} color="white" className="animate-pulse" />
                  <Text className="text-white font-satoshi-black text-[18px] uppercase tracking-widest ml-2">Panic Alarm</Text>
                </View>
                <View className="bg-white px-3 py-1 rounded-full">
                  <Text className="text-red-600 font-satoshi-bold text-[11px]">{emergencyDetail?.location || 'Unknown'}</Text>
                </View>
              </View>
              <Text className="text-white font-satoshi-bold text-lg mb-1">{emergencyDetail?.sender?.full_name}</Text>
              <Text className="text-red-50 font-satoshi-medium text-[13px] mb-4">{emergencyDetail?.description || 'A resident has triggered a severe Emergency SOS.'}</Text>
              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => Alert.alert("Calling...", `Contacting ${emergencyDetail?.sender?.full_name} at ${emergencyDetail?.sender?.phone}`)}
                  className="bg-white/20 rounded-xl px-4 py-3 flex-row items-center justify-center flex-1 mr-3 border border-white/30"
                >
                  <Phone size={16} color="white" />
                  <Text className="text-white font-satoshi-bold text-[12px] ml-2">Call Resident</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-red-700/50 rounded-xl px-4 py-3 flex-row items-center justify-center flex-1 border border-red-900/20">
                  <AlertOctagon size={16} color="white" />
                  <Text className="text-white font-satoshi-bold text-[12px] ml-2">Notify Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 3.1 Digital Pings & Call Requests (NEW) */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[18px]">Call Requests</Text>
              <View className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                <Text className="text-blue-600 dark:text-blue-400 font-satoshi-bold text-[10px]">{incomingPings.length} PENDING</Text>
              </View>
            </View>

            {incomingPings.length > 0 ? (
              <View className="gap-y-3">
                {incomingPings.map((ping) => (
                  <View key={ping.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 rounded-full items-center justify-center mr-4">
                        <Phone size={20} color="#2563EB" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[15px]">{ping.sender}</Text>
                        <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-[12px]">House {ping.house} ��� {ping.type}</Text>
                      </View>
                    </View>
                    <View className="flex-row gap-x-2">
                      <TouchableOpacity
                        onPress={() => handleResolvePing(ping.id)}
                        className="bg-green-500 px-4 py-2 rounded-xl"
                      >
                        <Check size={16} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => Alert.alert("Calling...", `Redirecting to internal extension for House ${ping.house}`)}
                        className="bg-blue-600 px-4 py-2 rounded-xl"
                      >
                        <Phone size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-white dark:bg-zinc-900 rounded-lg p-8 items-center border border-gray-100 dark:border-zinc-800 shadow-sm">
                <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-xs">No active call requests</Text>
              </View>
            )}
          </View>

          {/* 3. Visitor Management */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[18px]">Visitor Control</Text>
              <View className="flex-row">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => stackNavigation.navigate('GuestVerification')}
                  className="bg-blue-600 px-3 py-1 rounded-full flex-row items-center shadow-sm mr-1"
                >
                  <ShieldCheck size={14} color="white" />
                  <Text className="text-white font-satoshi-bold text-xs ml-1.5">Verify Guest</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => stackNavigation.navigate('GuardEntry')}
                  className="bg-blue-600 px-3 py-2 rounded-full flex-row items-center shadow-sm"
                >
                  <UserPlus size={14} color="white" />
                  <Text className="text-white font-satoshi-bold text-xs ml-1.5">Add Entry</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
              <View className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex-row items-center">
                <Clock size={14} color={colorScheme === 'dark' ? '#94A3B8' : "#64748B"} />
                <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-bold text-[11px] uppercase ml-2 tracking-wider">Pending Exits Inside Society</Text>
              </View>
              {pendingExits.length > 0 ? (
                pendingExits.map((visitor, idx) => (
                  <View key={visitor._id} className={`p-4 flex-row justify-between items-center ${idx !== pendingExits.length - 1 ? 'border-b border-gray-50 dark:border-zinc-800' : ''}`}>
                    <View className="flex-1 pr-4">
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[15px]">{visitor.name}</Text>
                      <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-[12px] mt-1">{visitor.vehicle_number || 'Walk-in'} ��� {formatTime(visitor.entry_time)}</Text>
                    </View>
                    <View className="items-end">
                      <View className="bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded mb-2">
                        <Text className="text-blue-700 dark:text-blue-400 font-satoshi-bold text-[11px]">{visitor.unit_to_visit || 'Guest'}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleMarkExit(visitor._id, visitor.name)} className="bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 flex-row items-center">
                        <Check size={12} color={colorScheme === 'dark' ? '#A1A1AA' : "#475569"} />
                        <Text className="text-gray-600 dark:text-zinc-400 font-satoshi-bold text-[11px] ml-1">Mark Exit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View className="p-10 items-center">
                  <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-xs text-center">No visitors currently inside</Text>
                </View>
              )}
            </View>
          </View>

          {/* 2. Automated Gate Access (NPR Feed) */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[18px]">Live NPR Feed</Text>
            </View>
            <View className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden p-1">
              {nprLogs.length > 0 ? (
                nprLogs.map((plate, idx) => {
                  const isExited = plate.status === 'exited';
                  return (
                    <View key={plate._id} className={`p-3 rounded-lg mb-1 flex-row items-center border ${!isExited ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/40' : 'bg-gray-50 dark:bg-zinc-900/20 border-gray-100 dark:border-zinc-800/40'}`}>
                      <View className="bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm mr-4">
                        <Text className="font-satoshi-black text-[16px] text-gray-900 dark:text-zinc-50 tracking-widest">{plate.vehicle_number}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          {!isExited ? <CheckCircle size={14} color="#16A34A" /> : <Clock size={14} color="#64748B" />}
                          <Text className={`font-satoshi-bold text-[13px] ml-1.5 ${!isExited ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-400'} uppercase`}>
                            {!isExited ? 'Inside Society' : 'Exited Society'}
                          </Text>
                        </View>
                        <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-[11px]">{plate.name} ��� {formatTime(plate.entry_time)}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View className="p-8 items-center">
                  <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-xs text-center">No recent vehicle logs</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => stackNavigation.navigate('GateLogs')} className="py-3 items-center">
                <Text className="text-blue-600 dark:text-blue-400 font-satoshi-bold text-[13px]">View Full History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. Information & Communication */}
          <View className="mb-8">
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[18px] mb-4">Duty Resources</Text>
            <View className="flex-row justify-between">
              <TouchableOpacity activeOpacity={0.8} onPress={() => stackNavigation.navigate('NoticeBoard')} className="w-[48%] bg-white dark:bg-zinc-900 rounded-lg p-4 items-center border border-gray-100 dark:border-zinc-800 shadow-sm shadow-blue-100 dark:shadow-none">
                <View className="w-12 h-12 items-center justify-center mb-3">
                  <Megaphone size={26} color={colorScheme === 'dark' ? '#60A5FA' : "#2563EB"} />
                </View>
                <Text className="text-center font-satoshi-bold text-gray-900 dark:text-zinc-50 text-[14px]">Daily Updates</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={() => stackNavigation.navigate('SearchVehicle')} className="w-[48%] bg-white dark:bg-zinc-900 rounded-lg p-4 items-center border border-gray-100 dark:border-zinc-800 shadow-sm shadow-blue-100 dark:shadow-none">
                <View className="w-12 h-12 items-center justify-center mb-3">
                  <Car size={30} color={colorScheme === 'dark' ? '#60A5FA' : "#2563EB"} />
                </View>
                <Text className="text-center font-satoshi-bold text-gray-900 dark:text-zinc-50 text-[14px]">Vehicle Lookup</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>

      <BottomTab activeTab="home" navigation={stackNavigation} />

      {/* Verify Pass Code Modal */}
      <Modal visible={verifyModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View className="bg-white dark:bg-zinc-900 rounded-t-[40px] p-8 pb-10 w-full">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-satoshi-black text-gray-900 dark:text-zinc-50">Verify Pass Code</Text>
              <TouchableOpacity onPress={() => { setVerifyModalVisible(false); setVerifiedVisitor(null); setPassCode(''); }} className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-full items-center justify-center">
                <XCircle size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <TextInput
                value={passCode}
                onChangeText={setPassCode}
                placeholder="Enter 6-digit code"
                keyboardType="numeric"
                maxLength={6}
                className="bg-gray-50 dark:bg-zinc-800 p-5 rounded-2xl text-center text-3xl font-satoshi-black text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-zinc-700"
              />
              <TouchableOpacity
                onPress={handleVerifyPassCode}
                disabled={verifying}
                className="mt-4 bg-blue-600 p-4 rounded-2xl items-center"
              >
                {verifying ? <ActivityIndicator color="white" /> : <Text className="text-white font-satoshi-bold text-lg">Verify Guest</Text>}
              </TouchableOpacity>
            </View>

            {verifiedVisitor && (
              <View className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/40 mb-6">
                <Text className="text-blue-600 dark:text-blue-400 font-satoshi-bold text-xs uppercase tracking-widest mb-3">Pre-Approved Visitor Details</Text>
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center mr-4">
                    <UserPlus size={24} color="white" />
                  </View>
                  <View>
                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-xl">{verifiedVisitor.name}</Text>
                    <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium">{verifiedVisitor.type} ��� {verifiedVisitor.phone}</Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center bg-white/50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-blue-50 dark:border-zinc-700">
                  <View>
                    <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[10px] uppercase">Visiting Unit</Text>
                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg">{verifiedVisitor.house_number}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[10px] uppercase">Resident</Text>
                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-medium text-sm">{verifiedVisitor.resident?.full_name}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleApproveEntry}
                  className="mt-6 bg-green-600 p-5 rounded-2xl items-center shadow-lg shadow-green-500/30"
                >
                  <Text className="text-white font-satoshi-black text-lg">GRANT ENTRY</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Unknown Vehicle Modal */}
      <Modal visible={unknownVehicleModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View className="bg-white dark:bg-zinc-900 rounded-t-[40px] p-8 pb-10 w-full">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center gap-x-2">
                <AlertOctagon size={24} color="#EA580C" />
                <Text className="text-2xl font-satoshi-black text-gray-900 dark:text-zinc-50">Unknown Vehicle</Text>
              </View>
              <TouchableOpacity onPress={() => setUnknownVehicleModalVisible(false)} className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-full items-center justify-center">
                <XCircle size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[80%]">
              <View className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/30 mb-6 flex-row items-center justify-between">
                <View>
                  <Text className="text-orange-800 dark:text-orange-400 font-satoshi-black text-xs uppercase tracking-widest">Detected Plate Number</Text>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-2xl mt-1 tracking-widest">{unknownPlateNumber}</Text>
                </View>
                <Camera size={32} color="#EA580C" opacity={0.8} />
              </View>

              <View className="gap-y-4">
                <View>
                  <Text className="text-xs font-satoshi-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">Visitor Name</Text>
                  <TextInput
                    value={visitorName}
                    onChangeText={setVisitorName}
                    placeholder="Enter visitor's full name"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                    className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                  />
                </View>

                <View className="flex-row gap-x-4">
                  <View className="flex-1">
                    <Text className="text-xs font-satoshi-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">Visiting Unit</Text>
                    <TextInput
                      value={visitorUnit}
                      onChangeText={setVisitorUnit}
                      placeholder="e.g. 402"
                      keyboardType="numeric"
                      placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                      className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-satoshi-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">Phone Number</Text>
                    <TextInput
                      value={visitorPhone}
                      onChangeText={setVisitorPhone}
                      placeholder="e.g. 03001234567"
                      keyboardType="phone-pad"
                      placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                      className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-satoshi-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2">Purpose of Visit</Text>
                  <TextInput
                    value={visitorPurpose}
                    onChangeText={setVisitorPurpose}
                    placeholder="e.g. Guest / Delivery"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                    className="bg-gray-50 dark:bg-zinc-800/50 px-5 py-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                  />
                </View>

                <TouchableOpacity
                  onPress={handleApproveUnknownEntry}
                  disabled={isLoading}
                  className="mt-6 bg-green-600 p-5 rounded-2xl items-center shadow-lg shadow-green-500/30 flex-row justify-center gap-x-2"
                >
                  <Unlock size={20} color="white" />
                  <Text className="text-white font-satoshi-black text-lg">APPROVE & OPEN GATE</Text>
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
    paddingBottom: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  }
});

export default GuardDashboard;
