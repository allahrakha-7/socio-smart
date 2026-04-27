import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Alert,
  Platform,
  NativeModules,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import {
  ShieldAlert,
  ArrowLeft,
  Unlock,
  Lock,
  WifiOff,
  Zap,
  Info,
  RotateCcw,
  Settings
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@sociosmart/session_v1';

import { getApiBaseUrl } from '../../../../utils/apiConfig';

const GateOverride = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [gateState, setGateState] = useState<'closed' | 'open'>('closed');
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineMode, setOfflineMode] = useState(true);

  // Animation for the barrier
  const barrierAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barrierAnim, {
      toValue: gateState === 'open' ? 1 : 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [gateState]);

  const handleActuate = async () => {
    const nextState = gateState === 'closed' ? 'open' : 'closed';

    setIsProcessing(true);
    try {
      // 1. Backend Log for Audit (Manual Override)
      const baseUrl = getApiBaseUrl();
      const rawSession = await AsyncStorage.getItem(SESSION_KEY);
      const session = rawSession ? JSON.parse(rawSession) : null;

      await fetch(`${baseUrl}/api/gate/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          name: 'MANUAL OVERRIDE',
          type: 'Resident', // Placeholder for log structure
          purpose: `Manual ${nextState.toUpperCase()} command issued by Guard`,
          gate: 'Main Gate',
          status: nextState === 'open' ? 'inside' : 'exited'
        })
      });

      // 2. Simulate MQTT Delay
      setTimeout(() => {
        setGateState(nextState);
        setIsProcessing(false);
      }, 1000);

    } catch (error) {
      console.error('Override error:', error);
      setIsProcessing(false);
      Alert.alert('System Error', 'Could not communicate with Gate Bridge. Check physical wiring.');
    }
  };

  const barrierRotation = barrierAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-90deg']
  });

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
          </TouchableOpacity>
          <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Hardware Override</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
          <Settings size={20} color={colorScheme === 'dark' ? '#71717A' : '#64748B'} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>

        {/* Fail-safe Warning */}
        <View className="bg-amber-950 border border-amber-900/50 p-6 rounded-[32px] mb-8 flex-row items-center">
          <View className="w-12 h-12 bg-amber-500/20 rounded-2xl items-center justify-center mr-4">
            <ShieldAlert size={28} color="#F59E0B" />
          </View>
          <View className="flex-1">
            <Text className="text-amber-500 font-satoshi-black text-xs uppercase tracking-widest mb-1">Fail-safe mode active</Text>
            <Text className="text-amber-200/60 font-satoshi-medium text-[11px] leading-4">AI recognition is disabled. Manual actuation required for all vehicle movements.</Text>
          </View>
        </View>

        {/* Barrier Visualization Component */}
        <View className="w-full aspect-square bg-zinc-900/50 rounded-[48px] border border-zinc-800 items-center justify-center mb-10 overflow-hidden relative">
          <View className="absolute inset-0 bg-blue-500/5" />

          {/* The Gate Post */}
          <View className="w-10 h-32 bg-zinc-700 rounded-lg absolute bottom-[15%] left-[20%] border-r border-zinc-600 shadow-2xl" />

          {/* The Animated Barrier Arm */}
          <Animated.View
            style={{
              transform: [
                { translateX: -10 },
                { translateY: 40 },
                { rotate: barrierRotation },
                { translateX: 130 },
                { translateY: -40 }
              ],
              width: 260,
              height: 16,
              backgroundColor: '#EF4444',
              borderRadius: 8,
              position: 'absolute',
              top: '55%',
              left: '20%',
              borderWidth: 2,
              borderColor: 'white'
            }}
          >
            <View className="flex-row justify-around py-1">
              <View className="w-8 h-2 bg-white/40 rounded-full" />
              <View className="w-8 h-2 bg-white/40 rounded-full" />
              <View className="w-8 h-2 bg-white/40 rounded-full" />
            </View>
          </Animated.View>

          {/* Status Text Overlay */}
          <View className="absolute bottom-8 items-center">
            <Text className="text-zinc-500 font-satoshi-bold text-[10px] uppercase tracking-widest mb-1">Current Barrier State</Text>
            <Text className={`text-4xl font-satoshi-black ${gateState === 'open' ? 'text-green-500' : 'text-rose-500'}`}>
              {gateState.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Actuation Command Area */}
        <View className="gap-y-6">
          <View className="flex-row gap-x-4">
            <View className="flex-1 bg-zinc-900/80 border border-zinc-800 p-5 rounded-[28px]">
              <WifiOff size={20} color="#71717A" />
              <Text className="text-zinc-500 font-satoshi-bold text-[10px] uppercase tracking-widest mt-3 mb-1">Sync Status</Text>
              <Text className="text-zinc-50 font-satoshi-bold">OFFLINE</Text>
            </View>
            <View className="flex-1 bg-zinc-900/80 border border-zinc-800 p-5 rounded-[28px]">
              <Zap size={20} color="#2563EB" />
              <Text className="text-zinc-500 font-satoshi-bold text-[10px] uppercase tracking-widest mt-3 mb-1">Motor Power</Text>
              <Text className="text-zinc-50 font-satoshi-bold">NOMINAL</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleActuate}
            disabled={isProcessing}
            activeOpacity={0.85}
            className={`w-full py-7 rounded-[32px] items-center justify-center flex-row shadow-2xl ${gateState === 'closed' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-rose-600 shadow-rose-500/20'}`}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                {gateState === 'closed' ? <Unlock size={24} color="white" /> : <Lock size={24} color="white" />}
                <Text className="text-white font-satoshi-black text-xl ml-4 tracking-widest uppercase">
                  COMMAND {gateState === 'closed' ? 'OPEN' : 'CLOSE'} GATE
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setGateState('closed')}
            className="w-full py-5 rounded-[24px] border border-zinc-800 items-center justify-center flex-row"
          >
            <RotateCcw size={16} color="#71717A" />
            <Text className="text-zinc-500 font-satoshi-bold ml-2">Emergency System Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Info Legend */}
        <View className="mt-10 mb-20 p-6 bg-zinc-900 rounded-[32px] border border-zinc-800">
          <View className="flex-row items-center mb-3">
            <Info size={18} color="#2563EB" />
            <Text className="ml-2 text-zinc-50 font-satoshi-bold text-sm">Audit Notice</Text>
          </View>
          <Text className="text-zinc-500 text-xs leading-5 font-satoshi-medium">
            All manual overrides are logged with your user ID. Excessive use without valid system fault documentation may be subject to review by society administration.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default GateOverride;
