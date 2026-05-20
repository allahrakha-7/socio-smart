import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, NativeModules, Platform, StatusBar, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Receipt, CheckCircle2, Wallet, Search, Clock, Calendar, AlertTriangle, Download, X, History, Activity } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { getApiBaseUrl } from '../../../../utils/apiConfig';

type PaymentStatus = 'paid' | 'due' | 'overdue' | 'pending';

type BillingRecord = {
  _id: string;
  title: string;
  amount: number;
  status: PaymentStatus;
  type: string;
  month: string;
  year: number;
  dueDate: string;
  paidAt?: string;
  receiptId?: string;
  paymentMethod?: string;
  breakdown?: { label: string; amount: number }[];
  resident?: { full_name: string; house_number: string };
};

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';
const API_PORT = 5000;


const Payments = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [payments, setPayments] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<string>('resident');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  // Receipt Modal State
  const [selectedBill, setSelectedBill] = useState<BillingRecord | null>(null);
  const [proofVia, setProofVia] = useState('');
  const [proofId, setProofId] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');
      setRole(parsed.role || 'resident');

      const endpoint = parsed.role === 'admin' ? '/api/payments/admin/all' : '/api/payments/my';
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setPayments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Fetch Payments Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleItemClick = (payment: BillingRecord) => {
    setSelectedBill(payment);
    setProofVia(payment.paymentMethod || '');
    setProofId(payment.receiptId || '');
  };

  const toggleStatus = async (payment: BillingRecord) => {
    const newStatus = payment.status === 'paid' ? 'due' : 'paid';
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');

      const response = await fetch(`${baseUrl}/api/payments/${payment._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsed.token}`
        },
        body: JSON.stringify({ status: newStatus, paymentMethod: payment.paymentMethod || 'Cash' })
      });

      if (response.ok) {
        const updated = await response.json();
        setPayments(prev => prev.map(p => p._id === payment._id ? updated : p));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update ledger.');
    }
  };

  const submitProof = async () => {
    if (!selectedBill || !proofVia || !proofId) {
      Alert.alert('Notice', 'Please provide both payment method and receipt ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');

      const response = await fetch(`${baseUrl}/api/payments/${selectedBill._id}/proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsed.token}`
        },
        body: JSON.stringify({ paymentMethod: proofVia, receiptId: proofId })
      });

      if (response.ok) {
        const updated = await response.json();
        setPayments(prev => prev.map(p => p._id === selectedBill._id ? updated : p));
        Alert.alert('Success', 'Payment proof submitted for verification.');
        setSelectedBill(null);
        setProofVia('');
        setProofId('');
      } else {
        const data = await response.json();
        Alert.alert('Submission Failed', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const text = `${p.resident?.full_name || ''} ${p.resident?.house_number || ''} ${p.title}`.toLowerCase();
      const matchesSearch = text.includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' ? true : activeFilter === 'paid' ? p.status === 'paid' : p.status !== 'paid';
      return matchesSearch && matchesFilter;
    });
  }, [payments, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    const totalCount = payments.length;
    const paidCount = payments.filter(p => p.status === 'paid').length;
    const unpaidBills = payments.filter(p => p.status !== 'paid');
    const totalOutstanding = unpaidBills.reduce((acc, curr) => acc + curr.amount, 0);
    const totalCollected = payments.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);

    // Nearest due date calculation
    const dues = unpaidBills.filter(b => b.dueDate).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const nearestDue = dues.length > 0 ? new Date(dues[0].dueDate) : null;
    const daysLeft = nearestDue ? Math.ceil((nearestDue.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;

    const collectionRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    return { totalCollected, totalOutstanding, daysLeft, nearestDue, collectionRate, unpaidCount: unpaidBills.length };
  }, [payments]);

  const renderStatusBadge = (status: PaymentStatus) => {
    const styles = {
      paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CheckCircle2 },
      due: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock },
      overdue: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: AlertTriangle },
      pending: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Activity }
    };
    const { bg, text, icon: Icon } = styles[status];
    return (
      <View className={`flex-row items-center px-2.5 py-1 rounded-full ${bg}`}>
        <Icon size={10} color={status === 'paid' ? '#15803D' : status === 'overdue' ? '#B91C1C' : status === 'pending' ? '#2563EB' : '#B45309'} />
        <Text className={`ml-1.5 text-[9px] font-satoshi-black uppercase tracking-wider ${text}`}>{status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
          </TouchableOpacity>
          <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">
            {role === 'admin' ? 'Billing Oversight' : 'Finance Hub'}
          </Text>
        </View>
        <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
          <History size={20} color={colorScheme === 'dark' ? '#2563EB' : '#2563EB'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Statistics & Overview Section */}
        <View className="px-5">
          {role === 'admin' ? (
            <View>
              {/* Admin Statistics Row */}
              <View className="flex-row gap-x-4 mb-4">
                <View className="flex-1 bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <Text className="text-gray-400 font-satoshi-bold text-[10px] uppercase tracking-widest mb-1">Collection Efficiency</Text>
                  <Text className="text-blue-600 font-satoshi-black text-2xl">{stats.collectionRate.toFixed(1)}%</Text>
                  <View className="w-full h-1 bg-gray-50 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                    <View className="h-full bg-blue-600" style={{ width: `${stats.collectionRate}%` }} />
                  </View>
                </View>
                <View className="flex-1 bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <Text className="text-gray-400 font-satoshi-bold text-[10px] uppercase tracking-widest mb-1">Unpaid Dues</Text>
                  <Text className="text-red-500 font-satoshi-black text-2xl">{stats.unpaidCount}</Text>
                  <Text className="text-gray-400 text-[10px] font-satoshi-medium mt-1">Found across society</Text>
                </View>
              </View>

              {/* Revenue Overview Card */}
              <View className="bg-zinc-950 dark:bg-zinc-900 rounded-lg p-8 shadow-2xl">
                <View className="flex-row justify-between items-center mb-6">
                  <View>
                    <Text className="text-zinc-500 font-satoshi-bold text-xs uppercase tracking-widest mb-1">Total Revenue (This Month)</Text>
                    <Text className="text-white font-satoshi-black text-3xl">Rs. {stats.totalCollected.toLocaleString()}</Text>
                  </View>
                  <View className="w-12 h-12 bg-white/10 rounded-lg items-center justify-center">
                    <Activity size={24} color="white" />
                  </View>
                </View>
                <View className="flex-row items-center pt-6 border-t border-white/10 uppercase tracking-tighter">
                  <View className="flex-1">
                    <Text className="text-zinc-500 font-satoshi-bold text-[9px] mb-1">Pending Amount</Text>
                    <Text className="text-red-400 font-satoshi-bold text-base italic">Rs. {stats.totalOutstanding.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity
                    className="bg-blue-600 px-6 py-2.5 rounded-lg"
                    onPress={() => setActiveFilter('unpaid')}
                  >
                    <Text className="text-white font-satoshi-black text-[10px] uppercase">Identify Defaulters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            /* Resident Summary Card */
            <View className="bg-blue-600 dark:bg-blue-700 rounded-lg p-8 shadow-2xl shadow-blue-500/30">
              <View className="flex-row justify-between items-start mb-10">
                <View>
                  <Text className="text-blue-100 font-satoshi-bold text-xs uppercase tracking-widest mb-1">Outstanding Balance</Text>
                  <Text className="text-white font-satoshi-black text-4xl">Rs. {stats.totalOutstanding.toLocaleString()}</Text>
                </View>
                <View className="w-12 h-12 bg-white/20 rounded-lg items-center justify-center">
                  <Wallet size={24} color="white" />
                </View>
              </View>
              <View className="flex-row items-center bg-white/10 p-4 rounded-lg border border-white/10">
                <Clock size={18} color="white" />
                <View className="ml-4">
                  <Text className="text-white font-satoshi-bold text-sm">
                    {stats.daysLeft !== null
                      ? `${stats.daysLeft} days until due date`
                      : 'No pending dues'}
                  </Text>
                  <Text className="text-blue-100 text-[10px] font-satoshi-medium">
                    {stats.nearestDue
                      ? `Next Payment: ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(stats.nearestDue)}`
                      : 'Your account is currently clear'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Global Search (Admin Only) */}
        {role === 'admin' && (
          <View className="px-5 mt-6">
            <View className="bg-white dark:bg-zinc-900 rounded-full px-5 py-1.5 border border-gray-100 dark:border-zinc-800 shadow-sm flex-row items-center">
              <Search size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search house member or flat..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 h-14 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
              />
            </View>
          </View>
        )}

        {/* Filters */}
        <View className="flex-row px-5 mt-6 gap-x-2">
          {(['all', 'unpaid', 'paid'] as const).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              className={`px-5 py-2 rounded-full border ${activeFilter === f ? 'bg-[#2563EB] dark:bg-white border-[#2563EB] dark:border-white' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-gray-100'}`}
            >
              <Text className={`text-[12px] font-satoshi-bold uppercase tracking-widest ${activeFilter === f ? 'text-white dark:text-zinc-900' : 'text-gray-400 dark:text-zinc-500'}`}>
                {f === 'unpaid' && role === 'admin' ? 'Defaulters' : f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List Content */}
        <View className="px-5 mt-6">
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg mb-4 ml-1 italic opacity-80">
            {role === 'admin' ? 'Resident Ledgers' : 'Billing Ledger'}
          </Text>

          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : (
            <>
              {filteredPayments.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  activeOpacity={0.8}
                  onPress={() => handleItemClick(item)}
                  className="bg-white dark:bg-zinc-900 rounded-lg p-5 mb-4 border border-gray-100 dark:border-zinc-800 shadow-sm"
                >
                  <View className="flex-row items-center">
                    <View className={`w-14 h-14 rounded-2xl items-center justify-center ${item.status === 'paid' ? 'bg-green-50/50' : item.status === 'pending' ? 'bg-blue-50/50' : 'bg-amber-50/50'}`}>
                      <Receipt size={24} color={item.status === 'paid' ? '#10B981' : item.status === 'pending' ? '#2563EB' : '#F59E0B'} />
                    </View>

                    <View className="flex-1 ml-4 pr-2">
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[15px]" numberOfLines={1}>
                        {role === 'admin' ? item.resident?.full_name : item.title}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        {role === 'admin' ? (
                          <View className="bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md mr-2">
                            <Text className="text-gray-500 text-[8px] font-satoshi-black tracking-widest uppercase">House {item.resident?.house_number}</Text>
                          </View>
                        ) : (
                          <Calendar size={10} color="#94A3B8" />
                        )}
                        <Text className="text-gray-400 text-[10px] font-satoshi-medium ml-1 uppercase">
                          {item.month} {item.year}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-base">Rs. {item.amount.toLocaleString()}</Text>
                      <View className="mt-2">
                        {renderStatusBadge(item.status)}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {filteredPayments.length === 0 && (
                <View className="items-center justify-center py-20 bg-white/50 rounded-lg border border-dashed border-gray-200">
                  <Receipt size={40} color="#CBD5E1" />
                  <Text className="mt-4 text-gray-400 font-satoshi-medium">No ledger records found</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bill Detail / Receipt Modal */}
      <Modal visible={!!selectedBill} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-white dark:bg-zinc-950 rounded-t-[44px] p-8 pb-12">
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-gray-400 font-satoshi-bold text-xs uppercase tracking-widest mb-1">Reference No.</Text>
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-xl">#{selectedBill?._id?.slice(-8).toUpperCase()}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedBill(null)}
                className="w-12 h-12 rounded-full items-center justify-center bg-gray-50 dark:bg-zinc-900"
              >
                <X size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
            </View>

            <View className="items-center mb-10">
              <View className="mb-4">
                {renderStatusBadge(selectedBill?.status || 'due')}
              </View>
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-5xl">Rs. {selectedBill?.amount?.toLocaleString()}</Text>
              <Text className="text-gray-400 font-satoshi-medium mt-2">{selectedBill?.title}</Text>
            </View>

            <View className="bg-gray-50 dark:bg-zinc-900/50 rounded-[32px] p-6 mb-8 border border-gray-100 dark:border-zinc-800">
              <Text className="text-gray-400 font-satoshi-bold text-[10px] uppercase tracking-widest mb-4">Charge Breakdown</Text>
              {selectedBill?.breakdown?.map((item, idx) => (
                <View key={idx} className="flex-row justify-between items-center mb-3">
                  <Text className="text-gray-600 dark:text-zinc-400 font-satoshi-medium text-sm">{item.label}</Text>
                  <Text className="text-gray-900 dark:text-zinc-100 font-satoshi-bold text-sm">Rs. {item.amount.toLocaleString()}</Text>
                </View>
              ))}
              <View className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800 flex-row justify-between items-center">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-base">Total Charge</Text>
                <Text className="text-blue-600 font-satoshi-black text-base">Rs. {selectedBill?.amount?.toLocaleString()}</Text>
              </View>
            </View>

            {(selectedBill?.status === 'paid' || selectedBill?.status === 'pending') ? (
              <View className="flex-row gap-x-4">
                <View className="flex-1 bg-zinc-100 dark:bg-zinc-900 p-5 rounded-lg border border-gray-50 dark:border-zinc-800">
                  <Text className="text-gray-400 font-satoshi-bold text-[10px] uppercase mb-1">Paid Via</Text>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm">{selectedBill?.paymentMethod || 'Not Provided'}</Text>
                </View>
                <View className="flex-1 bg-zinc-100 dark:bg-zinc-900 p-5 rounded-lg border border-gray-50 dark:border-zinc-800">
                  <Text className="text-gray-400 font-satoshi-bold text-[10px] uppercase mb-1">Receipt ID</Text>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm">{selectedBill?.receiptId || 'Not Provided'}</Text>
                </View>
              </View>
            ) : (
              role === 'admin' ? (
                <TouchableOpacity
                  onPress={() => { toggleStatus(selectedBill!); setSelectedBill(null); }}
                  className="w-full h-16 bg-blue-600 rounded-full items-center justify-center shadow-xl shadow-blue-500/20"
                >
                  <Text className="text-white font-satoshi-black text-lg uppercase tracking-widest">Verify & Mark as Paid</Text>
                </TouchableOpacity>
              ) : (
                <View className="gap-y-4">
                  <View className="bg-gray-50 dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
                    <Text className="text-gray-400 font-satoshi-bold text-[10px] uppercase tracking-widest mb-3 px-1">Payment Confirmation</Text>
                    <TextInput
                      placeholder="Paid Via (e.g. Bank, Cash, EasyPaisa)"
                      placeholderTextColor="#94A3B8"
                      value={proofVia}
                      onChangeText={setProofVia}
                      className="bg-white dark:bg-zinc-950 px-5 h-14 rounded-xl border border-gray-50 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium mb-3"
                    />
                    <TextInput
                      placeholder="Transaction / Receipt ID"
                      placeholderTextColor="#94A3B8"
                      value={proofId}
                      onChangeText={setProofId}
                      className="bg-white dark:bg-zinc-950 px-5 h-14 rounded-xl border border-gray-50 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={submitProof}
                    disabled={isSubmitting}
                    className="w-full h-16 bg-blue-600 rounded-full items-center justify-center shadow-xl shadow-blue-500/20"
                  >
                    {isSubmitting ? <ActivityIndicator color="white" /> : (
                      <Text className="text-white font-satoshi-black text-lg uppercase tracking-widest">Submit for Verification</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )
            )}

            {selectedBill?.status === 'paid' && (
              <TouchableOpacity className="mt-8 flex-row items-center justify-center py-2">
                <Download size={16} color={PRIMARY_COLOR} />
                <Text className="text-blue-600 font-satoshi-bold text-sm ml-2">Download Summary Receipt</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 10
  },
});

export default Payments;
