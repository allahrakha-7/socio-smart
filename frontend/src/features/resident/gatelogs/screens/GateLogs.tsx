import React, { useState, useCallback, useMemo } from 'react';
import {
  Text, TextInput, View, ScrollView, Pressable, FlatList,
  ActivityIndicator, Platform, NativeModules, StatusBar,
  Alert as RNAlert, Appearance, RefreshControl, TouchableOpacity, Share, Image
} from 'react-native';
import {
  Search,
  ArrowLeft,
  Filter,
  Car,
  Package,
  UserCheck,
  XCircle,
  ArrowRightCircle,
  ArrowLeftCircle,
  Download,
  Calendar,
  ShieldAlert,
  Trash2,
  Clock,
  User,
  Zap,
  ChevronRight
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../../../../utils/apiConfig';

const SESSION_KEY = '@sociosmart/session_v1';
const PRIMARY_BLUE = '#2563EB';

const formatTime = (iso: string) => {
  if (!iso) return '--:--';
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateLocal = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
};

const getStayDuration = (entry: string, exit: string) => {
  if (!entry || !exit) return null;
  const start = new Date(entry).getTime();
  const end = new Date(exit).getTime();
  const diff = Math.floor((end - start) / (1000 * 60)); // Minutes
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

const GateLogs = ({ navigation }: any) => {
  const [theme, setTheme] = useState(Appearance.getColorScheme());
  const isDark = theme === 'dark';

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [session, setSession] = useState<any>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionRaw) return;
      const parsed = JSON.parse(sessionRaw);
      setSession(parsed);

      const endpoint = parsed.role === 'admin' ? '/api/gate/logs' : '/api/gate/my';
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Fetch Logs Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLogs();
    const sub = Appearance.addChangeListener(({ colorScheme }) => setTheme(colorScheme));
    return () => sub.remove();
  }, [fetchLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const filters = ['All', 'Inside', 'Exited', 'Manual', 'Resident', 'Visitor', 'Delivery'];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const plate = (log.vehicle_number || log.plate_number || '').toLowerCase();
      const name = (log.name || '').toLowerCase();
      const unit = (log.unit_to_visit || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = plate.includes(query) || name.includes(query) || unit.includes(query);

      let matchesTab = true;
      if (activeFilter === 'Inside') matchesTab = log.status === 'inside';
      if (activeFilter === 'Exited') matchesTab = log.status === 'exited';
      if (activeFilter === 'Manual') matchesTab = log.is_manual_override || log.plate_number === 'MANUAL_OVERRIDE';
      if (activeFilter === 'Resident') matchesTab = log.type === 'Resident';
      if (activeFilter === 'Visitor') matchesTab = log.type === 'Visitor';
      if (activeFilter === 'Delivery') matchesTab = log.type === 'Delivery';

      return matchesSearch && matchesTab;
    });
  }, [logs, searchQuery, activeFilter]);

  const handleDelete = async (id: string) => {
    RNAlert.alert("Audit Deletion", "Are you sure you want to remove this security record? This will be logged.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "DELETE", style: "destructive", onPress: async () => {
          try {
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/api/gate/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${session.token}` }
            });
            if (res.ok) fetchLogs();
          } catch (e) { }
        }
      }
    ]);
  };

  const handleExportLogs = async () => {
    if (!logs || logs.length === 0) {
      RNAlert.alert("Export Error", "There are no logs to export.");
      return;
    }

    try {
      const headers = ['Name', 'Vehicle', 'Unit', 'Entry Time', 'Exit Time', 'Status', 'Type'].join(',');
      const rows = logs.map(log => {
        const name = `"${log.name || ''}"`;
        const vehicle = `"${log.vehicle_number || ''}"`;
        const unit = `"${log.unit_to_visit || ''}"`;
        const entry = `"${new Date(log.entry_time).toLocaleString()}"`;
        const exit = log.exit_time ? `"${new Date(log.exit_time).toLocaleString()}"` : '""';
        const status = `"${log.status || ''}"`;
        const type = `"${log.type || ''}"`;
        return [name, vehicle, unit, entry, exit, status, type].join(',');
      });

      const csvData = [headers, ...rows].join('\n');
      
      await Share.share({
        message: csvData,
        title: 'GateLogs_Export.csv',
      });
    } catch (error) {
      console.error(error);
      RNAlert.alert("Export Failed", "Could not export logs at this time.");
    }
  };

  const renderLogCard = ({ item }: any) => {
    const isExited = item.status === 'exited';
    const isOverride = item.is_manual_override || item.plate_number === 'MANUAL_OVERRIDE';
    const duration = getStayDuration(item.entry_time, item.exit_time);

    return (
      <View className={`bg-white dark:bg-zinc-900 p-6 rounded-[32px] mb-4 border shadow-sm ${isOverride ? 'border-rose-100 dark:border-rose-900/40 bg-rose-50/10' : 'border-zinc-50 dark:border-zinc-800/60'}`}>
        <View className="flex-row justify-between items-start">
          <View className="flex-row flex-1">
            <View className={`w-14 h-14 rounded-3xl items-center justify-center ${isOverride ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-blue-50 dark:bg-blue-900/10'}`}>
              {item.type === 'Resident' ? <Car size={24} color={PRIMARY_BLUE} /> : <UserCheck size={24} color={isOverride ? '#EF4444' : PRIMARY_BLUE} />}
            </View>
            <View className="ml-4 flex-1">
              <View className="flex-row items-center flex-wrap">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg tracking-widest">{item.vehicle_number || item.plate_number}</Text>
                {isOverride && (
                  <View className="ml-2 bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                    <Text className="text-rose-700 dark:text-rose-400 text-[8px] font-satoshi-black">OVERRIDE</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-400 font-satoshi-bold text-[10px] mt-0.5 uppercase">{item.name} ��� Unit {item.unit_to_visit}</Text>
            </View>
          </View>

          <View className={`px-3 py-1.5 rounded-full flex-row items-center ${isExited ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-green-100 dark:bg-green-900/30'}`}>
            <View className={`w-1.5 h-1.5 rounded-full ${isExited ? 'bg-zinc-400' : 'bg-green-500'} mr-2`} />
            <Text className={`text-[9px] font-satoshi-black uppercase ${isExited ? 'text-zinc-500' : 'text-green-700 dark:text-green-400'}`}>{item.status}</Text>
          </View>
        </View>

        {session?.role === 'admin' && item.plate_image && (
          <View className="mt-4 mb-2 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800">
            <Image
              source={{ uri: item.plate_image }}
              className="w-full h-32"
              resizeMode="cover"
            />
          </View>
        )}

        {/* Audit Data Block */}
        <View className="mt-6 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-3xl space-y-3">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Clock size={12} color="#94A3B8" />
              <Text className="ml-2 text-gray-400 text-[9px] font-satoshi-bold uppercase">Timeline</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-[11px]">{formatTime(item.entry_time)}</Text>
              <ChevronRight size={10} color="#CBD5E1" />
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-[11px]">{isExited ? formatTime(item.exit_time) : 'Active'}</Text>
            </View>
          </View>

          {duration && (
            <View className="flex-row justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-2">
              <Text className="text-gray-400 text-[9px] font-satoshi-bold uppercase">Total Stay</Text>
              <Text className="text-blue-600 font-satoshi-black text-[11px]">{duration}</Text>
            </View>
          )}

          <View className="flex-row justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-2">
            <View className="flex-row items-center">
              <User size={12} color="#94A3B8" />
              <Text className="ml-2 text-gray-400 text-[9px] font-satoshi-bold uppercase">Guard on Duty</Text>
            </View>
            <Text className="text-gray-600 dark:text-zinc-400 font-satoshi-bold text-[10px]">{item.guard?.full_name || 'System Auto'}</Text>
          </View>
        </View>

        {session?.role === 'admin' && (
          <Pressable onPress={() => handleDelete(item._id)} className="mt-4 flex-row items-center justify-center p-2">
            <Trash2 size={16} color="#EF4444" />
            <Text className="ml-2 text-rose-500 font-satoshi-bold text-[10px] uppercase">Deregister Record</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#09090b' : '#F8FAFC' }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#09090b' : "#F8FAFC"} />

      {/* Search & Audit Header */}
      <View className="flex-row items-center justify-between px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color={isDark ? '#F4F4F5' : '#000000ff'} />
          </TouchableOpacity>
          <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Access Logs</Text>
        </View>
        <TouchableOpacity onPress={handleExportLogs} className="bg-blue-600 px-4 py-2.5 rounded-full flex-row items-center shadow-md shadow-blue-500/20 active:opacity-80">
          <Download size={14} color="white" />
          <Text className="text-white text-[10px] font-satoshi-black ml-2 uppercase">Export Logs</Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 mt-4">
        <View className="flex-row items-center bg-white dark:bg-zinc-900 rounded-full px-5 py-1.5 border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <Search size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search plate or unit..."
            placeholderTextColor={isDark ? '#3F3F46' : "#94A3B8"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-4 text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm"
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View className="mt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 mb-4">
          {filters.map(f => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              className={`mr-3 px-4 py-2.5 rounded-full border ${activeFilter === f ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'}`}
            >
              <Text className={`font-satoshi-black text-[10px] uppercase tracking-widest ${activeFilter === f ? 'text-white' : 'text-zinc-500'}`}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={PRIMARY_BLUE} />
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item._id}
          renderItem={renderLogCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 opacity-50">
              <Zap size={48} color={isDark ? '#27272A' : "#D1D5DB"} strokeWidth={1} />
              <Text className="text-gray-400 font-satoshi-bold text-sm mt-4">No security logs found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default GateLogs;
