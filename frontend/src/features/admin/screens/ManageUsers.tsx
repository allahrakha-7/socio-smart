import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, FlatList, Text, TextInput, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTab from '../../../components/bottom-tab/BottomTab';
import {
  Search,
  Filter,
  MoreVertical,
  ShieldCheck,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Check,
} from 'lucide-react-native';
import { RefreshControl, ActivityIndicator, Platform, NativeModules, StatusBar } from 'react-native';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';


const PRIMARY_COLOR = '#2563EB';



import { getApiBaseUrl } from '../../../utils/apiConfig';



const StatTile = ({
  label,
  value,
  total,
  onPress,
  barColor,
}: {

  label: string;
  value: number;
  total: number;
  onPress: () => void;
  barColor: string;

}) => (

  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    className="w-[48%] bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm p-4 mb-4"
  >
    <Text className="text-gray-900 dark:text-zinc-50 text-2xl font-satoshi-bold tracking-tight">{value}</Text>
    <Text className="text-gray-500 dark:text-zinc-500 text-[10px] font-satoshi-bold mt-1 uppercase tracking-widest">{label}</Text>
    <View className="mt-3 w-full h-[3px] bg-blue-50 dark:bg-zinc-800 rounded-full overflow-hidden">
      <View
        className="h-[3px] rounded-full"
        style={{ width: `${Math.min(100, (value / Math.max(1, total)) * 100)}%`, backgroundColor: barColor }}
      />
    </View>
  </TouchableOpacity>

);



const ManageUsers = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/all`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Fetch Users Error:', error);
      Alert.alert('Error', 'Could not fetch user directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleUpdateStatus = async (userId: string, newStatus: string, role: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/update-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus, role }),
      });

      if (response.ok) {
        Alert.alert('Success', `User marked as ${newStatus}`);
        fetchUsers();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to update user status');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Connection failed.');
    }
  };

  const filters = ['All', 'Active', 'Pending', 'Suspended', 'Residents', 'Staff'];

  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === 'active').length;
  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended' || u.status === 'revoked').length;

  const filteredUsers = users.filter((user) => {
    const name = user.full_name || '';
    const unit = user.house_number || user.assigned_gate || '';
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesTab = true;
    if (activeFilter === 'Active') matchesTab = user.status === 'active';
    if (activeFilter === 'Pending') matchesTab = user.status === 'pending';
    if (activeFilter === 'Suspended') matchesTab = user.status === 'suspended' || user.status === 'revoked';
    if (activeFilter === 'Residents') matchesTab = user.type === 'resident';
    if (activeFilter === 'Staff') matchesTab = user.type === 'guard';

    return matchesSearch && matchesTab;
  });



  const renderUserCard = ({ item }: any) => {
    const isPending = item.status === 'pending';
    const isSuspended = item.status === 'revoked' || item.status === 'suspended';
    const displayName = item.full_name;
    const displayRole = item.role || item.type;
    const displayUnit = item.house_number || item.assigned_gate || 'N/A';

    return (
      <View className={`bg-white dark:bg-zinc-900 rounded-lg p-4 mb-4 shadow-sm border ${isPending ? 'border-orange-200 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/10' : 'border-gray-100 dark:border-zinc-800'}`}>
        <View className="flex-row items-center">
          <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${item.type === 'guard' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
            {item.type === 'guard' ? (
              <ShieldCheck size={24} color="#9333EA" />
            ) : (
              <User size={24} color="#2563EB" />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base">{displayName}</Text>
            <Text className="text-gray-500 dark:text-zinc-500 text-xs font-satoshi-medium mt-0.5">{displayRole} ��� {displayUnit}</Text>
          </View>

          <View className="items-end">
            <View className={`px-2.5 py-1 rounded-full flex-row items-center mb-1 ${isPending ? 'bg-orange-100 dark:bg-orange-900/40' : isSuspended ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40'}`}>
              {isPending ? <Clock size={10} color="#EA580C" /> : isSuspended ? <XCircle size={10} color="#EF4444" /> : <CheckCircle size={10} color="#16A34A" />}
              <Text className={`text-[9px] font-satoshi-bold ml-1 uppercase tracking-wider ${isPending ? 'text-orange-700' : isSuspended ? 'text-red-700' : 'text-green-700'}`}>
                {item.status}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              className="p-1"
              onPress={() => setSelectedUser(item)}
            >
              <MoreVertical size={20} color={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
        </View>

        {isPending && (
          <View className="flex-row mt-4 pt-4 border-t border-orange-100 dark:border-orange-900/30">
            <TouchableOpacity
              className="flex-1 bg-green-600 py-2.5 rounded-xl items-center mr-2"
              onPress={() => handleUpdateStatus(item._id, 'active', item.type)}
            >
              <Text className="text-white font-satoshi-bold text-xs uppercase tracking-widest">Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-gray-200 dark:bg-zinc-800 py-2.5 rounded-xl items-center"
              onPress={() => handleUpdateStatus(item._id, 'revoked', item.type)}
            >
              <Text className="text-gray-600 dark:text-zinc-400 font-satoshi-bold text-xs uppercase tracking-widest">Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };


  return (

    <SafeAreaView className="flex-1 bg-[#F8FAFC] dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
      <View className="flex-row justify-between items-center px-6 py-4">

        <View>

          <Text className="text-2xl font-satoshi-bold text-gray-900 dark:text-zinc-50 tracking-tight">User Directory</Text>

          <Text className="text-gray-500 dark:text-zinc-500 text-sm font-satoshi-medium mt-1">Manage residents & staff</Text>

        </View>

      </View>



      <View className="px-5">

        <View className="bg-[#0B3BBE] rounded-lg p-5 shadow-sm">

          <View className="flex-row items-center justify-between">

            <View>

              <Text className="text-white font-satoshi-bold text-base">Management Overview</Text>

              <Text className="text-blue-100 text-xs font-satoshi-medium mt-1">{totalCount} total users</Text>

            </View>

            <TouchableOpacity

              activeOpacity={0.7}

              onPress={() => setActiveFilter('Pending')}

              className="bg-white/15 rounded-2xl px-3 py-2"

            >

              <Text className="text-white text-[10px] font-satoshi-bold tracking-widest uppercase">{pendingCount} PENDING</Text>

            </TouchableOpacity>

          </View>



          <View className="flex-row mt-4">

            <TouchableOpacity

              activeOpacity={0.7}

              onPress={() => setActiveFilter('Active')}

              className="flex-1 bg-white/15 rounded-2xl px-4 py-3 mr-3"

            >

              <Text className="text-white text-sm font-satoshi-bold">{activeCount}</Text>

              <Text className="text-blue-100 text-[10px] font-satoshi-bold mt-1 uppercase">Active</Text>

            </TouchableOpacity>

            <TouchableOpacity

              activeOpacity={0.7}

              onPress={() => setActiveFilter('Suspended')}

              className="flex-1 bg-white/15 rounded-2xl px-4 py-3"

            >

              <Text className="text-white text-sm font-satoshi-bold">{suspendedCount}</Text>

              <Text className="text-blue-100 text-[10px] font-satoshi-bold mt-1 uppercase">Suspended</Text>

            </TouchableOpacity>

          </View>

        </View>

      </View>



      <View className="px-5 mt-4 mb-4">

        <View className="flex-row items-center bg-white dark:bg-zinc-900 rounded-full px-5 py-1.5 border border-gray-100 dark:border-zinc-800 shadow-sm">

          <Search size={20} color={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"} />

          <TextInput

            placeholder="Search by name or unit..."

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

                  className={`mr-2 px-5 py-2 rounded-full border ${isActive ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'

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
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderUserCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_COLOR]} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <Filter size={48} color={colorScheme === 'dark' ? '#27272A' : "#D1D5DB"} />
              <Text className="text-gray-400 dark:text-zinc-500 text-lg font-satoshi-bold mt-4">No users found</Text>
              <Text className="text-gray-400 dark:text-zinc-500 text-sm font-satoshi-medium mt-1 text-center px-10">
                No users match your current search or filter
              </Text>
            </View>
          }
        />
      )}

      {/* User Options Modal */}
      <Modal visible={!!selectedUser} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedUser(null)}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-white dark:bg-zinc-900 rounded-t-[32px] p-6 pb-10 shadow-2xl">
                <View className="items-center mb-6">
                  <View className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mb-4" />
                  <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${selectedUser?.type === 'guard' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                    {selectedUser?.type === 'guard' ? <ShieldCheck size={32} color="#9333EA" /> : <User size={32} color="#2563EB" />}
                  </View>
                  <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50">{selectedUser?.full_name}</Text>
                  <Text className="text-sm font-satoshi-medium text-gray-500 dark:text-zinc-400 mt-1">
                    {selectedUser?.role || selectedUser?.type} ��� {selectedUser?.house_number || selectedUser?.assigned_gate || 'N/A'}
                  </Text>
                </View>

                <View className="space-y-3 gap-y-3">
                  {(selectedUser?.status === 'revoked' || selectedUser?.status === 'suspended' || selectedUser?.status === 'pending') && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        handleUpdateStatus(selectedUser._id, 'active', selectedUser.type);
                        setSelectedUser(null);
                      }}
                      className="flex-row items-center bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30"
                    >
                      <View className="w-10 h-10 bg-green-100 dark:bg-green-800/40 rounded-full items-center justify-center mr-3">
                        <Check size={20} color="#16A34A" />
                      </View>
                      <Text className="text-green-700 dark:text-green-400 font-satoshi-bold text-base flex-1">Approve / Activate User</Text>
                    </TouchableOpacity>
                  )}

                  {(selectedUser?.status === 'active' || selectedUser?.status === 'pending') && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        handleUpdateStatus(selectedUser._id, 'revoked', selectedUser.type);
                        setSelectedUser(null);
                      }}
                      className="flex-row items-center bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30"
                    >
                      <View className="w-10 h-10 bg-red-100 dark:bg-red-800/40 rounded-full items-center justify-center mr-3">
                        <Ban size={20} color="#EF4444" />
                      </View>
                      <Text className="text-red-700 dark:text-red-400 font-satoshi-bold text-base flex-1">Suspend / Revoke Access</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedUser(null)}
                    className="flex-row items-center justify-center bg-gray-200 dark:bg-zinc-800 p-4 rounded-2xl mt-2"
                  >
                    <Text className="text-gray-900 dark:text-zinc-300 font-satoshi-bold text-base">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <BottomTab activeTab="users" navigation={navigation} />

    </SafeAreaView>

  );

};


export default ManageUsers;
