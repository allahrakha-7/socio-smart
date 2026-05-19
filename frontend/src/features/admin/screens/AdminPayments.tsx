import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, NativeModules, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Filter, ReceiptText, CheckCircle, Clock, AlertOctagon, MoreHorizontal, Check, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';

import { getApiBaseUrl } from '../../../utils/apiConfig';

const SESSION_KEY = '@sociosmart/session_v1';

const StatTile = ({ label, value, total, color }: any) => (
  <View className="w-[48%] bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm p-4 mb-4">
    <Text className="text-gray-900 dark:text-zinc-50 text-xl font-satoshi-bold tracking-tight">{value}</Text>
    <Text className="text-gray-500 dark:text-zinc-500 text-[10px] font-satoshi-bold mt-1 uppercase tracking-widest">{label}</Text>
    <View className="mt-3 w-full h-[3px] bg-gray-50 dark:bg-zinc-800 rounded-full overflow-hidden">
      <View
        className="h-[3px] rounded-full"
        style={{ width: `${Math.min(100, (value / Math.max(1, total)) * 100)}%`, backgroundColor: color }}
      />
    </View>
  </View>
);

const AdminPayments = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const fetchPayments = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(raw || '{}');
      const response = await fetch(`${baseUrl}/api/payments/admin/all`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setPayments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedPayment) return;
    try {
      const baseUrl = getApiBaseUrl();
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(raw || '{}');
      const response = await fetch(`${baseUrl}/api/payments/${selectedPayment._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsed.token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        Alert.alert('Success', `Payment marked as ${status.toUpperCase()}`);
        setModalVisible(false);
        fetchPayments();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const filteredData = useMemo(() => {
    if (filter === 'All') return payments;
    return payments.filter(p => p.status === filter.toLowerCase());
  }, [payments, filter]);

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalDues = payments.filter(p => p.status === 'due' || p.status === 'overdue' || p.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const defaultersCount = payments.filter(p => p.status === 'overdue').length;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC] dark:bg-zinc-950">
      <View className="flex-row items-center justify-between px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} className="w-10 h-10 items-center justify-center mr-4">
            <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#000000ff'} />
          </TouchableOpacity>
          <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Financials & Reports</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} />}
      >
        <View className="px-5 mt-5">
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg mb-4">Collection Reports</Text>
          <View className="flex-row flex-wrap justify-between">
            <StatTile label="Total Revenue (Paid)" value={`��� ${totalRevenue}`} total={totalRevenue + totalDues} color="#16A34A" />
            <StatTile label="Pending Dues" value={`��� ${totalDues}`} total={totalRevenue + totalDues} color="#EA580C" />
            <StatTile label="Total Bills" value={payments.length} total={payments.length} color="#2563EB" />
            <StatTile label="Defaulters" value={defaultersCount} total={payments.length} color="#EF4444" />
          </View>
          
          <View className="flex-row mt-4 mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['All', 'Paid', 'Pending', 'Due', 'Overdue'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setFilter(cat)}
                  className={`mr-2 px-5 py-2.5 rounded-full border ${filter === cat ? 'bg-[#0F766E] border-[#0F766E]' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'}`}
                >
                  <Text className={`font-satoshi-bold text-xs tracking-wider uppercase ${filter === cat ? 'text-white' : 'text-gray-600 dark:text-zinc-400'}`}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg mb-4">Tracking & Manual Updates</Text>
          {loading ? (
             <ActivityIndicator size="large" color="#0F766E" className="mt-10" />
          ) : filteredData.length === 0 ? (
            <View className="bg-white dark:bg-zinc-900 rounded-[24px] p-8 border border-gray-100 dark:border-zinc-800 items-center">
              <ReceiptText size={40} color="#CBD5E1" />
              <Text className="text-gray-400 font-satoshi-medium text-center mt-4">No records found for this filter.</Text>
            </View>
          ) : (
            filteredData.map((item) => (
              <TouchableOpacity
                key={item._id}
                onPress={() => { setSelectedPayment(item); setModalVisible(true); }}
                className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 mb-4 shadow-sm border border-gray-100 dark:border-zinc-800 flex-row items-center justify-between"
              >
                <View className="flex-1 pr-4">
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg">{item.title}</Text>
                  <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-xs mt-1">
                    Unit {item.house_number} ��� {item.resident?.full_name}
                  </Text>
                  <Text className="text-[#0F766E] dark:text-[#14B8A6] font-satoshi-black text-[16px] mt-2">��� {item.amount}</Text>
                </View>
                <View className="items-end">
                  <View className={`px-3 py-1.5 rounded-md mb-2 ${
                    item.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30' :
                    item.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30' :
                    item.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Text className={`font-satoshi-bold text-[10px] uppercase tracking-wider ${
                      item.status === 'paid' ? 'text-green-700 dark:text-green-400' :
                      item.status === 'overdue' ? 'text-red-700 dark:text-red-400' :
                      item.status === 'pending' ? 'text-orange-700 dark:text-orange-400' : 'text-blue-700 dark:text-blue-400'
                    }`}>{item.status}</Text>
                  </View>
                  {item.status !== 'paid' && (
                    <View className="bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full flex-row items-center mt-2">
                      <Text className="text-gray-600 dark:text-zinc-400 text-[10px] font-satoshi-bold">Update Status</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Manual Update Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 justify-center bg-black/60 px-5">
          <View className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-satoshi-black text-gray-900 dark:text-zinc-50">Audit & Update Bill</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-gray-100 dark:bg-zinc-800 p-2 rounded-full">
                <X size={20} color={colorScheme === 'dark' ? '#71717A' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {selectedPayment && (
              <View className="mb-6 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-bold uppercase tracking-widest mb-1">Resident Details</Text>
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg">{selectedPayment.resident?.full_name} (Unit {selectedPayment.house_number})</Text>
                <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium mt-1">Amount: ��� {selectedPayment.amount}</Text>
                {selectedPayment.receiptId && (
                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-satoshi-bold mt-2">Receipt Uploaded: {selectedPayment.receiptId}</Text>
                )}
              </View>
            )}

            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base mb-4">Manual Status Override</Text>
            
            <TouchableOpacity onPress={() => handleUpdateStatus('paid')} className="bg-green-600 p-4 rounded-xl items-center flex-row justify-center mb-3">
              <CheckCircle size={18} color="white" />
              <Text className="text-white font-satoshi-bold ml-2">Mark as PAID (Verified)</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleUpdateStatus('due')} className="bg-blue-600 p-4 rounded-xl items-center flex-row justify-center mb-3">
              <Clock size={18} color="white" />
              <Text className="text-white font-satoshi-bold ml-2">Revert to DUE</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleUpdateStatus('overdue')} className="bg-red-600 p-4 rounded-xl items-center flex-row justify-center">
              <AlertOctagon size={18} color="white" />
              <Text className="text-white font-satoshi-bold ml-2">Mark as DEFAULTER (Overdue)</Text>
            </TouchableOpacity>
            
            <Text className="text-gray-400 dark:text-zinc-600 text-center text-[10px] font-satoshi-medium mt-4">Audit trails log this action to the administrator.</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default AdminPayments;
