import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Animated,
  StatusBar,
  ScrollView,
  Dimensions,
  Alert as RNAlert,
  Appearance,
  TouchableOpacity
} from 'react-native';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ArrowLeft, 
  MapPin, 
  User, 
  Car, 
  Unlock, 
  Scan, 
  Activity, 
  Cpu, 
  Binary, 
  Zap,
  Target,
  RefreshCw
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import api, { getApiBaseUrl } from '../../../../utils/apiConfig';

const { width } = Dimensions.get('window');
const PRIMARY_BLUE = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';

const GateAccess = ({ navigation }: any) => {
  const [theme, setTheme] = useState(Appearance.getColorScheme());
  const isDark = theme === 'dark';

  const [plateInput, setPlateInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [confidence, setConfidence] = useState(0);
  
  const [recentDetections, setRecentDetections] = useState<any[]>([]);
  const [processStep, setProcessStep] = useState('Standby');
  const socketRef = useRef<Socket | null>(null);

  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setTheme(colorScheme));
    return () => sub.remove();
  }, []);

  const fetchRecent = async () => {
    try {
      const response = await api.get('/api/gate/recent-activity');
      if (response.status === 200) {
        setRecentDetections(response.data);
      }
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    fetchRecent();
    const baseUrl = getApiBaseUrl();
    const socket = io(baseUrl);
    socketRef.current = socket;

    socket.on('gate_activity', (data: any) => {
      setRecentDetections(prev => [data, ...prev].slice(0, 10));
      setResult(data);
      setShowResult(true);
      setProcessStep('NPR MATCH FOUND');
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 220, duration: 2500, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    return () => { socket.disconnect(); };
  }, []);

  const handleVerify = async () => {
    if (!plateInput) return;
    setIsVerifying(true);
    setProcessStep('EXTRACTING PLATE...');
    setConfidence(Math.floor(Math.random() * (99 - 85 + 1) + 85)); // Simulated Confidence

    try {
      // Logic Delay Simulation
      setTimeout(async () => {
        setProcessStep('OCR ANALYSIS...');
        setTimeout(async () => {
            setProcessStep('VERIFYING UID...');
            try {
              const response = await api.post('/api/vehicles/verify-access', { plate_number: plateInput });
              const data = response.data;
              setResult(data);
              setShowResult(true);
              setProcessStep(data.authorized ? 'ACCESS GRANTED' : 'ACCESS DENIED');
              setIsVerifying(false);
            } catch (err) {
              setProcessStep('ERROR: VERIFICATION FAILED');
              setIsVerifying(false);
            }
        }, 800);
      }, 800);
    } catch (error) {
      setProcessStep('ERROR: LINK OFFLINE');
      setIsVerifying(false);
    }
  };

  const handleManualOpen = async () => {
    RNAlert.alert("Manual Release", "Bypass NPR Logic and open the barrier?", [
      { text: "Cancel", style: "cancel" },
      { text: "RELEASE", style: "destructive", onPress: async () => {
        setProcessStep('ACTUATING RELAY...');
        try {
          const response = await api.post('/api/gate/manual-trigger');
          if (response.status === 200) {
            setProcessStep('BARRIER: OPEN');
            setShowResult(false);
            fetchRecent();
          }
        } catch (e) { setProcessStep('RELAY FAILURE'); }
      }}
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#09090b' : '#F8FAFC' }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#09090b' : "#F8FAFC"} />

      {/* Hub Header */}
      <View className="flex-row items-center justify-between px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color={isDark ? '#F4F4F5' : '#64748B'} />
          </TouchableOpacity>
          <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">NPR Logic Hub</Text>
        </View>
        <View className="flex-row items-center bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
          <Activity size={12} color={PRIMARY_BLUE} />
          <Text className="text-[10px] font-satoshi-black text-blue-600 uppercase ml-2 tracking-wider">Scanner Live</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
        {/* Real-Time Scanning Hub */}
        <View className="w-full aspect-[4/3] bg-zinc-900 rounded-[44px] overflow-hidden justify-center items-center shadow-2xl relative border-[6px] border-zinc-800">
          <View className="absolute inset-0 opacity-10 bg-blue-500" />
          <Scan size={56} color="rgba(255,255,255,0.1)" strokeWidth={1} />
          
          <Animated.View style={{ transform: [{ translateY: scanAnim }], width: '85%', height: 2, backgroundColor: '#2563EB', position: 'absolute', top: 40, shadowColor: '#2563EB', shadowOpacity: 1, shadowRadius: 15, elevation: 12 }} />

          {/* AI Intelligence Overlays */}
          <View className="absolute top-6 left-6 flex-row items-center bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
            <Target size={12} color={PRIMARY_BLUE} />
            <Text className="text-white font-satoshi-bold text-[8px] uppercase tracking-[2px] ml-2">Tracking Lock: Frontal</Text>
          </View>

          <View className="absolute top-6 right-6 flex-row items-center bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
            <Text className="text-white font-satoshi-bold text-[8px] uppercase tracking-[2px] mr-2">Confidence:</Text>
            <Text className={`font-satoshi-bold text-[10px] ${confidence > 90 ? 'text-green-400' : 'text-amber-400'}`}>{confidence}%</Text>
          </View>

          <View className="absolute bottom-6 w-full px-6">
            <View className="bg-black/60 rounded-2xl p-4 border border-white/10 flex-row items-center justify-between">
               <View className="flex-row items-center">
                  <Binary size={16} color={PRIMARY_BLUE} />
                  <Text className="text-white font-satoshi-black text-[11px] uppercase ml-3 tracking-widest">{processStep}</Text>
               </View>
               <Cpu size={16} color="rgba(255,255,255,0.4)" />
            </View>
          </View>
        </View>

        {/* Input & Logic Trigger */}
        <View className="mt-8">
          <Text className="text-zinc-400 font-satoshi-black text-[10px] uppercase tracking-[3px] mb-4 ml-1">Manual Plate Processing</Text>
          <View className="flex-row items-center bg-white dark:bg-zinc-900 rounded-[32px] px-6 py-5 border border-zinc-100 dark:border-zinc-800 shadow-sm">
             <Binary size={20} color={PRIMARY_BLUE} />
             <TextInput
               placeholder="Enter Plate Manually..."
               placeholderTextColor={isDark ? '#3F3F46' : "#94A3B8"}
               value={plateInput}
               onChangeText={setPlateInput}
               autoCapitalize="characters"
               className="flex-1 ml-4 text-gray-900 dark:text-zinc-50 font-satoshi-black text-xl"
             />
          </View>

          <View className="flex-row gap-x-4 mt-6">
             <Pressable 
               onPress={handleVerify}
               disabled={isVerifying || !plateInput}
               className={`flex-1 flex-row h-16 rounded-[28px] items-center justify-center ${!plateInput ? 'bg-zinc-100 dark:bg-zinc-900' : 'bg-blue-600 shadow-xl shadow-blue-500/30'} active:opacity-80`}
             >
                {isVerifying ? <ActivityIndicator color="white" /> : <><Target size={18} color="white" /><Text className="text-white font-satoshi-black text-sm ml-3 tracking-widest">VERIFY</Text></>}
             </Pressable>
             <Pressable 
               onPress={handleManualOpen}
               className="w-20 h-16 bg-white dark:bg-zinc-900 rounded-[28px] items-center justify-center border border-zinc-100 dark:border-zinc-800 active:opacity-60 shadow-sm"
             >
                <Unlock size={22} color={isDark ? '#F4F4F5' : '#1E293B'} />
             </Pressable>
          </View>
        </View>

        {/* Recent Detection Brain */}
        <View className="mt-10 mb-10">
           <View className="flex-row justify-between items-center mb-6 px-1">
             <Text className="text-zinc-950 dark:text-zinc-50 font-satoshi-black text-base">Activity Journal</Text>
             <Pressable onPress={fetchRecent} className="active:opacity-50"><RefreshCw size={18} color={PRIMARY_BLUE} /></Pressable>
           </View>

           {recentDetections.map((det, idx) => {
             const isAuth = det.authorized || det.status === 'GRANTED';
             return (
               <View key={idx} className="bg-white dark:bg-zinc-900 p-5 rounded-[28px] mb-4 border border-zinc-50 dark:border-zinc-800/50 flex-row items-center justify-between shadow-sm">
                 <View className="flex-row items-center">
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isAuth ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-rose-50 dark:bg-rose-900/10'}`}>
                       <Car size={20} color={isAuth ? PRIMARY_BLUE : '#EF4444'} />
                    </View>
                    <View className="ml-4">
                       <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-[14px] tracking-widest">{det.plate_number || det.vehicle_number}</Text>
                       <Text className="text-gray-400 font-satoshi-bold text-[9px] uppercase mt-0.5">{det.owner_name || 'Visitor'}  •  {det.type || 'NPR Scan'}</Text>
                    </View>
                 </View>
                 <View className={`px-3 py-1.5 rounded-full ${isAuth ? 'bg-green-50 dark:bg-green-900/10' : 'bg-rose-50 dark:bg-rose-900/10'}`}>
                    <Text className={`font-satoshi-black text-[8px] uppercase ${isAuth ? 'text-green-600' : 'text-rose-600'}`}>{isAuth ? 'Authorized' : 'Denied'}</Text>
                 </View>
               </View>
             );
           })}
        </View>
      </ScrollView>

      {/* Logic Decision Overlay */}
      <Modal visible={showResult} animationType="fade" transparent>
        <View className={`flex-1 justify-center items-center px-6 ${result?.authorized ? 'bg-green-600/95' : 'bg-rose-600/95'}`}>
          <View className="w-full bg-white dark:bg-zinc-950 rounded-[48px] p-8 items-center shadow-2xl relative">
             <View className="absolute top-[-30] w-20 h-20 rounded-full bg-white dark:bg-zinc-950 items-center justify-center shadow-lg border-2 border-zinc-100 dark:border-zinc-900">
                {result?.authorized ? <ShieldCheck size={40} color="#16A34A" /> : <ShieldAlert size={40} color="#E11D48" />}
             </View>

             <Text className={`text-3xl font-satoshi-black mt-8 text-center ${result?.authorized ? 'text-green-600' : 'text-rose-600'}`}>
                {result?.authorized ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
             </Text>
             <Text className="text-zinc-400 text-center font-satoshi-medium mt-2 px-4">
                {result?.authorized ? 'System recognized valid whitelist credentials.' : result?.reason || 'Vehicle entry is not authorized in current registry.'}
             </Text>

             {result?.authorized && (
                <View className="w-full mt-8 gap-y-3 bg-zinc-50 dark:bg-zinc-900 p-6 rounded-[32px]">
                   <View className="flex-row justify-between items-center"><Text className="text-zinc-400 text-[10px] font-satoshi-black uppercase">Identity</Text><Text className="text-zinc-950 dark:text-zinc-50 font-satoshi-black text-sm">{result.details?.owner}</Text></View>
                   <View className="flex-row justify-between items-center"><Text className="text-zinc-400 text-[10px] font-satoshi-black uppercase">Base Unit</Text><Text className="text-zinc-950 dark:text-zinc-50 font-satoshi-black text-sm">Flat {result.details?.unit}</Text></View>
                </View>
             )}

             <View className="w-full mt-10 gap-y-4">
                <Pressable 
                  onPress={handleManualOpen}
                  className={`py-5 rounded-[28px] items-center flex-row justify-center ${result?.authorized ? 'bg-green-600 shadow-xl shadow-green-500/30' : 'bg-rose-600 shadow-xl shadow-rose-500/30'} active:opacity-90`}
                >
                   <Unlock size={20} color="white" />
                   <Text className="text-white font-satoshi-black text-base ml-3">OPEN BARRIER</Text>
                </Pressable>
                <Pressable onPress={() => setShowResult(false)} className="py-5 bg-zinc-100 dark:bg-zinc-900 rounded-[28px] items-center active:opacity-60">
                   <Text className="text-zinc-950 dark:text-zinc-50 font-satoshi-black text-sm uppercase">Close Module</Text>
                </Pressable>
             </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GateAccess;
