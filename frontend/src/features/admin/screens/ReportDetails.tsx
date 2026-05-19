import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Platform, Alert, StyleSheet, Text, ActivityIndicator, NativeModules, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MoreHorizontal,
  FileText,
  Calendar,
  User,
  Download,
  Share2,
  Printer,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  ShieldCheck,
  Wrench,
  Sparkles,
  Shield,
  Activity,
  Car,
  BellRing
} from 'lucide-react-native';

import { getApiBaseUrl } from '../../../utils/apiConfig';

const SESSION_KEY = '@sociosmart/session_v1';

const CATEGORY_MAP: any = {
  'Staff Salaries': { icon: User, color: '#2563EB' },
  'Maintenance & Repairs': { icon: Wrench, color: '#EA580C' },
  'Security Infrastructure': { icon: ShieldCheck, color: '#9333EA' },
  'Security Services': { icon: Shield, color: '#9333EA' },
  'Operations': { icon: Activity, color: '#10B981' }
};

const ReportDetails = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');

      const response = await fetch(`${baseUrl}/api/reports/summary`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setReport(data);
      } else {
        Alert.alert('Error', data.message || 'Failed to load report data');
      }
    } catch (error) {
      console.error('Fetch Report Error:', error);
      Alert.alert('Network Error', 'Could not connect to the operations server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleAction = (action: string) => {
    Alert.alert(action, `Preparing to ${action.toLowerCase()} the report...`);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 items-center justify-center">
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#FFFFFF"} />
        <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
        <Text className="mt-4 text-gray-400 dark:text-zinc-500 font-satoshi-medium">Compiling dynamic summary...</Text>
      </SafeAreaView>
    );
  }

  if (!report) return null;

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
          </TouchableOpacity>
          <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Report Details</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View className="px-4 mt-2">
          {/* Main Info Card */}
          <View className="bg-white dark:bg-zinc-900 rounded-lg p-5 mb-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <View className="flex-row items-start mb-4">
              <View className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full items-center justify-center mr-4 border border-blue-100 dark:border-blue-900/20">
                <FileText size={24} color="#2563EB" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-1.5">
                  <View className="bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-md mr-2">
                    <Text className="text-green-700 dark:text-green-400 text-[10px] font-satoshi-bold uppercase tracking-wider">Finalized</Text>
                  </View>
                  <Text className="text-gray-400 dark:text-zinc-500 text-xs font-satoshi-bold">{report.id}</Text>
                </View>
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg leading-tight mb-1">{report.title}</Text>
                <Text className="text-[#2563EB] dark:text-blue-400 text-sm font-satoshi-bold">{report.period}</Text>
              </View>
            </View>

            <View className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800">
              <View className="flex-row items-center mb-3">
                <Calendar size={14} color={colorScheme === 'dark' ? '#71717A' : "#6B7280"} />
                <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium ml-2 w-24">Generated on:</Text>
                <Text className="text-gray-900 dark:text-zinc-50 text-xs font-satoshi-bold flex-1">{report.generatedOn}</Text>
              </View>
              <View className="flex-row items-center">
                <User size={14} color={colorScheme === 'dark' ? '#71717A' : "#6B7280"} />
                <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium ml-2 w-24">Generated by:</Text>
                <Text className="text-gray-900 dark:text-zinc-50 text-xs font-satoshi-bold flex-1">{report.generatedBy}</Text>
              </View>
            </View>
          </View>

          {/* Key Metrics Grid */}
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-xl mb-4">Key Metrics</Text>
          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="bg-white dark:bg-zinc-900 w-[48%] rounded-lg p-4 mb-4 shadow-sm border border-gray-100 dark:border-zinc-800">
              <View className="w-8 h-8 items-center justify-center mb-2">
                <TrendingUp size={18} color="#16A34A" />
              </View>
              <Text className="text-gray-500 dark:text-zinc-500 text-[10px] font-satoshi-bold uppercase mb-1 tracking-widest">Revenue</Text>
              <Text className="text-gray-900 dark:text-zinc-50 text-xl font-satoshi-bold">{report.metrics.revenue}</Text>
            </View>

            <View className="bg-white dark:bg-zinc-900 w-[48%] rounded-lg p-4 mb-4 shadow-sm border border-gray-100 dark:border-zinc-800">
              <View className="w-8 h-8 items-center justify-center mb-2">
                <TrendingDown size={18} color="#EF4444" />
              </View>
              <Text className="text-gray-500 dark:text-zinc-500 text-[10px] font-satoshi-bold uppercase mb-1 tracking-widest">Expenses</Text>
              <Text className="text-gray-900 dark:text-zinc-50 text-xl font-satoshi-bold">{report.metrics.expenses}</Text>
            </View>

            <View className="bg-white dark:bg-zinc-900 w-[48%] rounded-lg p-4 shadow-sm border border-gray-100 dark:border-zinc-800">
              <View className="w-8 h-8 items-center justify-center mb-2">
                <AlertOctagon size={18} color="#EA580C" />
              </View>
              <Text className="text-gray-500 dark:text-zinc-500 text-[10px] font-satoshi-bold uppercase mb-1 tracking-widest">Complaints</Text>
              <Text className="text-gray-900 dark:text-zinc-50 text-xl font-satoshi-bold">
                {report.metrics.complaints} <Text className="text-sm font-satoshi-medium text-gray-400 dark:text-zinc-600 lowercase">logged</Text>
              </Text>
            </View>

            <View className="bg-white dark:bg-zinc-900 w-[48%] rounded-lg p-4 shadow-sm border border-gray-100 dark:border-zinc-800">
              <View className="w-8 h-8 items-center justify-center mb-2">
                <ShieldCheck size={18} color="#2563EB" />
              </View>
              <Text className="text-gray-500 dark:text-zinc-500 text-[10px] font-satoshi-bold uppercase mb-1 tracking-widest">Resolved</Text>
              <Text className="text-gray-900 dark:text-zinc-50 text-xl font-satoshi-bold">
                {report.metrics.resolved} <Text className="text-sm font-satoshi-medium text-gray-400 dark:text-zinc-600 lowercase">fixed</Text>
              </Text>
            </View>

            <View className="bg-white dark:bg-zinc-900 w-[48%] mt-4 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-zinc-800">
              <View className="w-8 h-8 items-center justify-center mb-2">
                <Car size={18} color="#9333EA" />
              </View>
              <Text className="text-gray-500 dark:text-zinc-500 text-[10px] font-satoshi-bold uppercase mb-1 tracking-widest">Gate Log Audit</Text>
              <Text className="text-gray-900 dark:text-zinc-50 text-xl font-satoshi-bold">
                {report.metrics.gateLogs || 0} <Text className="text-sm font-satoshi-medium text-gray-400 dark:text-zinc-600 lowercase">entries</Text>
              </Text>
            </View>

            <View className="bg-white dark:bg-zinc-900 w-[48%] mt-4 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-zinc-800">
              <View className="w-8 h-8 items-center justify-center mb-2">
                <BellRing size={18} color="#EF4444" />
              </View>
              <Text className="text-gray-500 dark:text-zinc-500 text-[10px] font-satoshi-bold uppercase mb-1 tracking-widest">SOS Triggers</Text>
              <Text className="text-gray-900 dark:text-zinc-50 text-xl font-satoshi-bold">
                {report.metrics.emergencyAlerts || 0} <Text className="text-sm font-satoshi-medium text-gray-400 dark:text-zinc-600 lowercase">logs</Text>
              </Text>
            </View>
          </View>

          {/* Expense Breakdown */}
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-xl mb-4">Expense Breakdown</Text>
          <View className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-zinc-800 mb-6">
            {report.expenseBreakdown.map((item: any, index: number) => {
              const config = CATEGORY_MAP[item.category] || { icon: Activity, color: '#10B981' };
              const Icon = config.icon;
              const color = config.color;
              const isLast = index === report.expenseBreakdown.length - 1;

              return (
                <View key={item.id} className={`${!isLast ? 'border-b border-gray-50 dark:border-zinc-800 pb-5 mb-5' : ''}`}>
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${color}15` }}>
                        <Icon size={14} color={color} />
                      </View>
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm">{item.category}</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm">{item.amount}</Text>
                  </View>

                  <View className="flex-row items-center mt-1">
                    <View className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden mr-3">
                      <View className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: color }} />
                    </View>
                    <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-bold w-10 text-right">{item.percentage}%</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Secondary Actions */}
          <View className="flex-row justify-between mb-4">
            <TouchableOpacity
              onPress={() => handleAction('Share')}
              activeOpacity={0.7}
              className="flex-1 bg-white dark:bg-zinc-900 flex-row items-center justify-center py-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm mr-2"
            >
              <Share2 size={18} color={colorScheme === 'dark' ? '#94A3B8' : "#4B5563"} />
              <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-bold ml-2">Share Link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAction('Print')}
              activeOpacity={0.7}
              className="flex-1 bg-white dark:bg-zinc-900 flex-row items-center justify-center py-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm ml-2"
            >
              <Printer size={18} color={colorScheme === 'dark' ? '#94A3B8' : "#4B5563"} />
              <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-bold ml-2">Print Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Primary Action Button */}
      <View className={`absolute left-0 right-0 px-5 ${Platform.OS === 'ios' ? 'bottom-8' : 'bottom-5'}`}>
        <TouchableOpacity
          onPress={() => handleAction('Download PDF')}
          activeOpacity={0.85}
          className="bg-[#2563EB] flex-row items-center justify-center py-4 rounded-full shadow-lg shadow-blue-600/30"
        >
          <Download size={20} color="white" />
          <Text className="text-white text-base font-satoshi-bold ml-2 tracking-widest uppercase">Download PDF</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 110,
  },
});

export default ReportDetails;
