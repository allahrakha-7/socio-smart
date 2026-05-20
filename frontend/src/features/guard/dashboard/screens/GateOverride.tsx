import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Alert,
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
  Wifi,
  Zap,
  Info,

} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@sociosmart/session_v1';

import api, { getApiBaseUrl } from '../../../../utils/apiConfig';

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

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get('/api/gate/stats');
        if (response.status === 200) {
          setOfflineMode(false);
        }
      } catch (e) {
        setOfflineMode(true);
      }
    };
    checkStatus();
  }, []);

  const handleActuate = async () => {
    const nextState = gateState === 'closed' ? 'open' : 'closed';

    setIsProcessing(true);
    try {
      const response = await api.post('/api/gate/manual-trigger', {
        action: nextState.toUpperCase()
      });

      if (response.status === 200) {
        setGateState(nextState);
        setOfflineMode(false);
      } else {
        Alert.alert('Control Error', 'Failed to transmit override command.');
      }
    } catch (error: any) {
      console.error('Override error:', error);
      const errMsg = error.response?.data?.message || 'Could not communicate with Gate Bridge. Check physical wiring.';
      Alert.alert('System Error', errMsg);
    } finally {
      setIsProcessing(false);
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
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>

        {/* Fail-safe Warning */}
        <View className="bg-amber-950 border border-amber-900/50 p-6 rounded-lg mb-8 flex-row items-center">
          <View className="w-12 h-12 bg-amber-500/20 rounded-full items-center justify-center mr-4">
            <ShieldAlert size={28} color="#F59E0B" />
          </View>
          <View className="flex-1">
            <Text className="text-amber-500 font-satoshi-black text-xs uppercase tracking-widest mb-1">Fail-safe mode active</Text>
            <Text className="text-amber-200/60 font-satoshi-medium text-[11px] leading-4">AI recognition is disabled. Manual actuation required for all vehicle movements.</Text>
          </View>
        </View>



        {/* Actuation Command Area */}
        <View className="gap-y-6">
          <View className="flex-row gap-x-4">
            <View className="flex-1 bg-zinc-900/80 border border-zinc-800 p-5 rounded-lg">
              {offlineMode ? <WifiOff size={20} color="#71717A" /> : <Wifi size={20} color="#10B981" />}
              <Text className="text-zinc-500 font-satoshi-bold text-[10px] uppercase tracking-widest mt-3 mb-1">Sync Status</Text>
              <Text className={`font-satoshi-bold ${offlineMode ? 'text-zinc-50' : 'text-green-500'}`}>
                {offlineMode ? 'OFFLINE' : 'ONLINE'}
              </Text>
            </View>
            <View className="flex-1 bg-zinc-900/80 border border-zinc-800 p-5 rounded-lg">
              <Zap size={20} color="#2563EB" />
              <Text className="text-zinc-500 font-satoshi-bold text-[10px] uppercase tracking-widest mt-3 mb-1">Motor Power</Text>
              <Text className="text-zinc-50 font-satoshi-bold">NOMINAL</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleActuate}
            disabled={isProcessing}
            activeOpacity={0.85}
            className={`w-full py-5 mt-10 rounded-full items-center justify-center flex-row shadow-2xl ${gateState === 'closed' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-rose-600 shadow-rose-500/20'}`}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                {gateState === 'closed' ? <Unlock size={24} color="white" /> : <Lock size={24} color="white" />}
                <Text className="text-white font-satoshi-bold text-xl ml-4 tracking-wide uppercase">
                  COMMAND {gateState === 'closed' ? 'OPEN' : 'CLOSE'} GATE
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Legend */}
        <View className="mt-10 mb-20 p-6 bg-zinc-900 rounded-lg border border-zinc-800">
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
