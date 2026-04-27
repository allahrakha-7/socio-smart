import React, { useState } from 'react';
import { Text, TextInput, View, ScrollView, TouchableOpacity, FlatList, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  Activity,
  ArrowLeft,
  Wrench,
  AlertTriangle,
  MapPin,
  CalendarDays,
} from 'lucide-react-native';
import { RefreshControl, ActivityIndicator, Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { StatusBar } from 'react-native';

const PRIMARY_COLOR = '#2563EB';

import { getApiBaseUrl } from '../../../utils/apiConfig';

const SESSION_KEY = '@sociosmart/session_v1';

const formatRelativeTime = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
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
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    className="w-[48%] bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm p-4 mb-4"
  >
    <Text className="text-gray-900 dark:text-zinc-50 text-2xl font-satoshi-bold tracking-tight">{value}</Text>
    <Text className="text-gray-500 dark:text-zinc-500 text-[10px] font-satoshi-bold mt-1 uppercase tracking-widest">{label}</Text>
    <View className="mt-3 w-full h-[3px] bg-gray-50 rounded-full overflow-hidden">
      <View
        className="h-[3px] rounded-full"
        style={{ width: `${Math.min(100, (value / Math.max(1, total)) * 100)}%`, backgroundColor: color }}
      />
    </View>
  </TouchableOpacity>
);

const ManageComplaints = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedComplaints, setExpandedComplaints] = useState<Set<string>>(new Set());
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  const toggleComplaintExpansion = (id: string) => {
    setExpandedComplaints(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchComplaints = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');
      const response = await fetch(`${baseUrl}/api/complaints/all`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setComplaints(data);
      }
    } catch (error) {
      console.error('Fetch Complaints Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchComplaints();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const handleUpdateStatus = (complaint: any) => {
    setSelectedComplaint(complaint);
  };

  const updateStatus = async (complaintId: string, status: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');
      const response = await fetch(`${baseUrl}/api/complaints/status/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsed.token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchComplaints();
      } else {
        Alert.alert('Error', 'Failed to update status.');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed.');
    }
  };

  const filters = ['All', 'Urgent', 'Pending', 'In Progress', 'Resolved'];

  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === 'pending').length;
  const progressCount = complaints.filter((c) => c.status === 'in-progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const urgentCount = complaints.filter((c) => c.isUrgent).length;

  const filteredComplaints = complaints.filter((complaint) => {
    const residentName = complaint.resident?.full_name || '';
    const houseNumber = complaint.resident?.house_number || '';
    const matchesSearch =
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      houseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      residentName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesTab = true;
    if (activeFilter === 'Urgent') matchesTab = complaint.isUrgent;
    if (activeFilter === 'Pending') matchesTab = complaint.status === 'pending';
    if (activeFilter === 'In Progress') matchesTab = complaint.status === 'in-progress';
    if (activeFilter === 'Resolved') matchesTab = complaint.status === 'resolved';

    return matchesSearch && matchesTab;
  });

  const renderComplaintCard = ({ item }: any) => {
    const isPending = item.status === 'pending';
    const isProgress = item.status === 'in-progress';
    const isResolved = item.status === 'resolved';
    const isExpanded = expandedComplaints.has(item._id);

    return (
      <View className={`bg-white dark:bg-zinc-900 rounded-xl p-5 mb-4 shadow-sm border ${item.isUrgent ? 'border-red-200 dark:border-red-900/30 bg-red-50/5 dark:bg-red-900/10' : 'border-gray-100 dark:border-zinc-800'}`}>
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800 px-2.5 py-1.5 rounded-full border border-gray-100 dark:border-zinc-700">
            <Wrench size={12} color={colorScheme === 'dark' ? '#94A3B8' : "#4B5563"} />
            <Text className="text-gray-600 dark:text-zinc-400 text-xs font-satoshi-bold ml-1.5 uppercase tracking-wider">{item.category}</Text>
          </View>

          <View className={`px-2.5 py-1.5 rounded-full flex-row items-center ${isPending ? 'bg-orange-100 dark:bg-orange-900/30' : isProgress ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
            {isPending ? (
              <Clock size={12} color="#EA580C" />
            ) : isProgress ? (
              <Activity size={12} color="#2563EB" />
            ) : (
              <CheckCircle size={12} color="#16A34A" />
            )}
            <Text className={`text-[10px] font-satoshi-bold ml-1.5 tracking-wider ${isPending ? 'text-orange-700 dark:text-orange-400' : isProgress ? 'text-blue-700 dark:text-blue-400' : 'text-green-700 dark:text-green-400'}`}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View className="flex-row items-start mb-2">
          {item.isUrgent ? (
            <AlertTriangle size={18} color="#EF4444" className="mr-2 mt-0.5" />
          ) : null}
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base leading-tight flex-1">{item.title}</Text>
        </View>

        {item.description ? (
          <View>
            <Text
              className="text-gray-600 dark:text-zinc-400 font-satoshi-medium text-sm leading-relaxed mb-2"
              numberOfLines={isExpanded ? undefined : 4}
            >
              {item.description}
            </Text>
            <TouchableOpacity onPress={() => toggleComplaintExpansion(item._id)} activeOpacity={0.7} className="mb-4">
              <Text className="text-[#2563EB] font-satoshi-bold text-[13px]">
                {isExpanded ? 'Show Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="flex-row items-center mb-3">
          <View className="flex-row items-center mr-4">
            <MapPin size={14} color={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"} />
            <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium ml-1.5">{item.resident?.house_number || 'N/A'}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-300 dark:text-zinc-800 mr-2">���</Text>
            <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium">{item.resident?.full_name}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-3 border-t border-gray-50 dark:border-zinc-800">
          <View className="flex-row items-center">
            <CalendarDays size={14} color={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"} />
            <Text className="text-gray-400 dark:text-zinc-500 text-xs font-satoshi ml-1.5">{formatRelativeTime(item.createdAt)}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleUpdateStatus(item)}
            className={`px-4 py-2 rounded-full flex-row items-center ${isResolved ? 'bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700' : 'bg-[#2563EB]'}`}
          >
            <Text className={`text-xs font-satoshi-bold uppercase tracking-widest ${isResolved ? 'text-gray-400 dark:text-zinc-500' : 'text-white'}`}>
              {isResolved ? 'Details' : 'Update'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="p-3 mr-5"
          >
            <ArrowLeft size={24} color={colorScheme === 'dark' ? '#F4F4F5' : "#1F2937"} />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-satoshi-bold text-gray-900 dark:text-zinc-50 tracking-tight">Complaints</Text>
          </View>
        </View>
      </View>

      {/* UPDATED BLUE BOARD STYLING */}
      <View className="px-5">
        <View className="bg-[#0B3BBE] rounded-lg p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-satoshi-bold text-base">Complaints Overview</Text>
              <Text className="text-blue-100 text-xs font-satoshi-medium mt-1">{totalCount} total tickets</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveFilter('Urgent')}
              className="bg-white/15 rounded-2xl px-3 py-2"
            >
              <Text className="text-white text-[10px] font-satoshi-bold tracking-widest uppercase">{urgentCount} URGENT</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row mt-4">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveFilter('Pending')}
              className="flex-1 bg-white/15 rounded-xl px-4 py-3 mr-3"
            >
              <Text className="text-white text-sm font-satoshi-bold">{pendingCount}</Text>
              <Text className="text-blue-100 text-[10px] font-satoshi-bold mt-1 uppercase">Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveFilter('In Progress')}
              className="flex-1 bg-white/15 rounded-2xl px-4 py-3"
            >
              <Text className="text-white text-sm font-satoshi-bold">{progressCount}</Text>
              <Text className="text-blue-100 text-[10px] font-satoshi-bold mt-1 uppercase">In Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="px-5 mt-4 mb-4">
        <View className="flex-row items-center bg-white dark:bg-zinc-900 rounded-full px-5 py-1.5 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <Search size={20} color={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"} />
          <TextInput
            placeholder="Search issue, unit, or resident..."
            placeholderTextColor={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <View className="pl-5 mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row pb-4">
            {filters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.8}
                  className={`mr-1.5 px-5 py-2 rounded-full border ${isActive ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'
                    }`}
                >
                  <Text className={`font-satoshi-bold text-sm ${isActive ? 'text-white' : 'text-gray-600 dark:text-zinc-400'}`}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item._id}
          renderItem={renderComplaintCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <Filter size={48} color="#D1D5DB" />
              <Text className="text-gray-400 text-lg font-satoshi-bold mt-4">No complaints found</Text>
              <Text className="text-gray-400 text-sm font-satoshi-medium mt-1 text-center px-10">
                Try adjusting your search query or changing the filter tab above
              </Text>
            </View>
          }
        />
      )}

      {/* Complaint Update Modal */}
      <Modal visible={!!selectedComplaint} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedComplaint(null)}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-white dark:bg-zinc-900 rounded-t-[32px] p-6 pb-10 shadow-2xl">
                <View className="items-center mb-6">
                  <View className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mb-4" />
                  <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${selectedComplaint?.isUrgent ? 'bg-red-50 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                    <Wrench size={32} color={selectedComplaint?.isUrgent ? '#EF4444' : '#2563EB'} />
                  </View>
                  <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 text-center px-4">{selectedComplaint?.title}</Text>
                  <Text className="text-sm font-satoshi-medium text-gray-500 dark:text-zinc-400 mt-1">
                    {selectedComplaint?.resident?.house_number || 'N/A'} ��� {selectedComplaint?.resident?.full_name}
                  </Text>
                </View>

                <View className="mt-2">
                  {selectedComplaint?.status === 'resolved' ? (
                    <View className="items-center mb-2 px-2">
                      <Text className="text-gray-600 dark:text-zinc-400 font-satoshi-medium text-sm leading-relaxed text-center mb-4">
                        {selectedComplaint?.description}
                      </Text>
                      <View className="flex-row items-center bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full border border-green-100 dark:border-green-900/30">
                        <CheckCircle size={14} color="#16A34A" />
                        <Text className="text-green-700 dark:text-green-400 font-satoshi-bold text-xs ml-2 uppercase tracking-widest">Complaint has been resolved successfully</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View className="flex-row gap-x-3">
                        {selectedComplaint?.status === 'pending' && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                              updateStatus(selectedComplaint._id, 'in-progress');
                              setSelectedComplaint(null);
                            }}
                            className="flex-1 flex-row items-center justify-center bg-blue-50 dark:bg-blue-900/20 py-3.5 rounded-full border border-blue-200 dark:border-blue-900/30"
                          >
                            <Activity size={18} color="#2563EB" />
                            <Text className="text-blue-700 dark:text-blue-400 font-satoshi-bold text-sm ml-2">In Progress</Text>
                          </TouchableOpacity>
                        )}

                        {(selectedComplaint?.status === 'pending' || selectedComplaint?.status === 'in-progress') && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                              updateStatus(selectedComplaint._id, 'resolved');
                              setSelectedComplaint(null);
                            }}
                            className="flex-1 flex-row items-center justify-center bg-green-50 dark:bg-green-900/20 py-3.5 rounded-full border border-green-200 dark:border-green-900/30"
                          >
                            <CheckCircle size={18} color="#16A34A" />
                            <Text className="text-green-700 dark:text-green-400 font-satoshi-bold text-sm ml-2">Resolve</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setSelectedComplaint(null)}
                        className="items-center justify-center bg-gray-100 dark:bg-zinc-800 py-3.5 rounded-full mt-3 border border-gray-200 dark:border-zinc-700"
                      >
                        <Text className="text-gray-900 dark:text-zinc-300 font-satoshi-bold text-sm">Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageComplaints;
