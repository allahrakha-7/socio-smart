import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, AlertTriangle, ShieldCheck, Wrench, Sparkles, CheckCircle, Clock } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import api from '../../../../utils/apiConfig';

const getRoleIcon = (role: string) => {
  if (role === 'Security') return ShieldCheck;
  if (role === 'Cleaner' || role === 'Gardener' || role === 'Housekeeping') return Sparkles;
  return Wrench;
};

const getRoleCategory = (role: string) => {
  if (role === 'Security') return 'Security Team';
  if (role === 'Cleaner' || role === 'Gardener' || role === 'Housekeeping') return 'Utility Services';
  return 'Maintenance Staff';
};

const StaffDirectory = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [staff, setStaff] = useState<any[]>([]);
  const [currentGuard, setCurrentGuard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const fetchStaff = async () => {
    try {
      const [staffRes, guardRes] = await Promise.all([
        api.get('/api/staff/directory'),
        api.get('/api/roster/current-guard')
      ]);
      setStaff(staffRes.data);
      setCurrentGuard(guardRes.data);
    } catch (error) {
      console.error('Error fetching directory data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const isShiftActive = (shiftStr: string) => {
    if (!shiftStr) return false;
    const parts = shiftStr.split(' - ');
    if (parts.length !== 2) return false;
    
    const parseTime = (str: string) => {
      if (!str) return 0;
      const tParts = str.trim().split(' ');
      if (tParts.length < 2) return 0;
      let [h, m] = tParts[0].split(':');
      let hr = parseInt(h, 10);
      let min = parseInt(m, 10);
      if (hr === 12) hr = 0;
      if (tParts[1] === 'PM') hr += 12;
      return hr * 60 + min;
    };
    
    const start = parseTime(parts[0]);
    const end = parseTime(parts[1]);
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    
    if (end < start) return current >= start || current <= end;
    return current >= start && current <= end;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStaff();
  };

  const handleCall = (name: string, phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const categories = ['All', 'Security Team', 'Maintenance Staff', 'Utility Services'];
  
  const filteredStaff = staff.filter(s => {
    if (activeTab === 'All') return true;
    return getRoleCategory(s.role) === activeTab;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC] dark:bg-zinc-950">
      <View className="flex-row items-center px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center mr-4"
        >
          <ArrowLeft size={20} color={isDark ? '#F4F4F5' : '#000000ff'} />
        </TouchableOpacity>
        <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Staff Directory</Text>
      </View>

      <View className="pl-6 py-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row pr-6">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveTab(cat)}
                className={`mr-2 px-5 py-2.5 rounded-full border ${activeTab === cat ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'}`}
              >
                <Text className={`font-satoshi-bold text-[13px] ${activeTab === cat ? 'text-white' : 'text-gray-600 dark:text-zinc-400'}`}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          className="px-5"
        >
          {/* NOW AT GATE SECTION */}
          {activeTab === 'All' || activeTab === 'Security Team' ? (
            <View className="mb-6">
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg mb-3">Now at Gate</Text>
              {currentGuard?.staff ? (
                <View className="bg-blue-600 rounded-3xl p-5 shadow-lg shadow-blue-500/30 flex-row items-center border border-blue-500">
                  <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mr-4 relative">
                    <ShieldCheck size={24} color="white" />
                    <View className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-blue-600" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-satoshi-black text-[18px]">{currentGuard.staff.full_name}</Text>
                    <Text className="text-blue-100 font-satoshi-medium text-xs mt-1">Verified Security Roster ��� On Duty</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleCall(currentGuard.staff.full_name, currentGuard.staff.phone)}
                    className="w-12 h-12 bg-white rounded-full items-center justify-center"
                  >
                    <Phone size={18} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-gray-100 dark:border-zinc-800 flex-row items-center justify-center shadow-sm">
                  <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-sm">No guard currently assigned to this shift.</Text>
                </View>
              )}
            </View>
          ) : null}

          {/* DIRECTORY LISTING */}
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg mb-3">Directory</Text>
          {filteredStaff.length === 0 ? (
             <View className="items-center justify-center mt-20">
               <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold">No staff members found.</Text>
             </View>
          ) : (
            filteredStaff.map((item) => {
              const IconComponent = getRoleIcon(item.role);
              const isOnline = item.status === 'online' || item.status === 'active';
              const onShiftNow = isShiftActive(item.shift);
              
              return (
                <View key={item._id} className={`bg-white dark:bg-zinc-900 rounded-[24px] p-5 mb-4 shadow-sm border ${onShiftNow ? 'border-blue-400 dark:border-blue-500' : 'border-gray-100 dark:border-zinc-800'}`}>
                  {onShiftNow && (
                    <View className="absolute top-0 right-5 bg-blue-600 px-3 py-1 rounded-b-lg">
                      <Text className="text-white text-[9px] font-satoshi-bold uppercase tracking-widest">Active Shift</Text>
                    </View>
                  )}
                  <View className="flex-row items-start justify-between mb-4 mt-2">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3 relative">
                        <IconComponent size={20} color="#2563EB" />
                        <View className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-[17px] leading-tight mb-1">{item.full_name}</Text>
                        <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-bold text-xs">{item.role} ��� {item.shift}</Text>
                      </View>
                    </View>
                  </View>

                  {item.assignedTasks && item.assignedTasks.length > 0 && (
                    <View className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl mb-4 border border-blue-100 dark:border-blue-900/30">
                      <View className="flex-row items-center mb-1">
                        <AlertTriangle size={14} color="#2563EB" />
                        <Text className="text-blue-700 dark:text-blue-400 text-xs font-satoshi-bold ml-1.5 uppercase tracking-wider">Currently Assigned</Text>
                      </View>
                      {item.assignedTasks.slice(0, 2).map((task: any, i: number) => (
                        <Text key={i} className="text-blue-900 dark:text-blue-300 font-satoshi-medium text-xs mt-1" numberOfLines={1}>
                          ��� {task.title} (Unit {task.resident?.house_number || 'Unknown'})
                        </Text>
                      ))}
                    </View>
                  )}

                  <View className="flex-row items-center gap-x-3">
                    <TouchableOpacity
                      onPress={() => handleCall(item.full_name, item.phone)}
                      className="flex-1 flex-row items-center justify-center bg-blue-600 h-12 rounded-full"
                    >
                      <Phone size={14} color="white" />
                      <Text className="text-white text-xs font-satoshi-bold ml-2 uppercase tracking-widest">Connect</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Complaints')}
                      className="flex-1 flex-row items-center justify-center bg-gray-100 dark:bg-zinc-800 h-12 rounded-full border border-gray-200 dark:border-zinc-700"
                    >
                      <Text className="text-gray-900 dark:text-zinc-300 text-xs font-satoshi-bold uppercase tracking-widest">Submit Issue</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default StaffDirectory;
