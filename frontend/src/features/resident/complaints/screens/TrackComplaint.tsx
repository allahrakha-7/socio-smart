import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Circle,
  Phone,
  Droplets,
  Zap,
  Trash2,
  Wrench,
  AlertCircle
} from 'lucide-react-native';

const PRIMARY_COLOR = '#2563EB';

const TrackComplaint = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Mock data or from route params
  const complaint = route.params?.complaint || {
    id: '#10133',
    title: 'Water',
    category: 'Plumbing',
    description: 'Leakage from main pipes or public sources',
    status: 'in-progress',
    raisedOn: '10 NOV 2024',
    raisedAt: '04:00 PM',
    raisedBy: 'Rohan Rode',
    steps: [
      { id: 1, title: 'You Raised a Complaint', subtitle: '10th November 2024 (04:00 PM)', completed: true },
      { id: 2, title: 'Notified to Manager', subtitle: '10th November 2024 (04:15 PM)', completed: true },
      { id: 3, title: 'Addressed to respective team', subtitle: 'Pending action', completed: false },
      { id: 4, title: 'Resolved', subtitle: 'Awaiting completion', completed: false },
    ]
  };

  const getCategoryIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'water': return Droplets;
      case 'electricity': return Zap;
      case 'garbage': return Trash2;
      case 'maintenance': return Wrench;
      default: return AlertCircle;
    }
  };

  const IconComponent = getCategoryIcon(complaint.title);

  const getStatusColors = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', color: '#16A34A' };
      case 'in-progress': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', color: '#2563EB' };
      default: return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', color: '#EA580C' };
    }
  };

  const statusStyle = getStatusColors(complaint.status);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-gray-50 dark:border-zinc-900">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <ArrowLeft size={24} color={isDark ? '#F4F4F5' : '#1F2937'} />
        </TouchableOpacity>
        <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 ml-2">Track Complaint</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-6">
        {/* Complaint Info Card */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-gray-50 dark:bg-zinc-900 rounded-2xl items-center justify-center border border-gray-100 dark:border-zinc-800">
              <IconComponent size={32} color={PRIMARY_COLOR} />
            </View>
            <View className="ml-4">
              <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50">{complaint.title}</Text>
              <Text className="text-sm font-satoshi-medium text-gray-400 dark:text-zinc-500">{complaint.id}</Text>
            </View>
          </View>
          <View className={`${statusStyle.bg} px-4 py-1.5 rounded-xl`}>
            <Text className={`${statusStyle.text} text-[12px] font-satoshi-bold uppercase tracking-wider`}>
              {complaint.status === 'in-progress' ? 'Active' : complaint.status}
            </Text>
          </View>
        </View>

        <Text className="text-gray-600 dark:text-zinc-400 text-[15px] font-satoshi-medium mb-6">
          {complaint.description}
        </Text>

        {/* Details Highlight Card */}
        <View className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-[32px] mb-8 border border-blue-100 dark:border-blue-900/30">
          <View className="flex-row items-center mb-4">
            <Calendar size={18} color={PRIMARY_COLOR} />
            <Text className="ml-3 text-gray-700 dark:text-zinc-200 font-satoshi-medium">
              Complain raised on <Text className="font-satoshi-bold">{complaint.raisedOn}</Text>
            </Text>
          </View>
          <View className="flex-row items-center mb-4">
            <Clock size={18} color={PRIMARY_COLOR} />
            <Text className="ml-3 text-gray-700 dark:text-zinc-200 font-satoshi-bold">{complaint.raisedAt}</Text>
          </View>
          <View className="flex-row items-center">
            <User size={18} color={PRIMARY_COLOR} />
            <Text className="ml-3 text-gray-700 dark:text-zinc-200 font-satoshi-medium">
              Raised by <Text className="font-satoshi-bold">{complaint.raisedBy}</Text>
            </Text>
          </View>
        </View>

        {/* Tracking Status Section */}
        <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 mb-6">Tracking Status</Text>

        <View className="pl-2">
          {complaint.steps.map((step: any, index: number) => (
            <View key={step.id} className="flex-row items-start mb-6">
              <View className="items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center ${step.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-zinc-800'} border ${step.completed ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-zinc-700'}`}>
                  {step.completed ? (
                    <CheckCircle2 size={22} color="#10B981" />
                  ) : (
                    <Circle size={22} color={isDark ? '#3F3F46' : "#D1D5DB"} />
                  )}
                </View>
                {index !== complaint.steps.length - 1 && (
                  <View className={`w-[2px] h-10 ${step.completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-zinc-800'} my-1`} />
                )}
              </View>
              <View className="ml-4 pt-1 flex-1">
                <Text className={`text-base font-satoshi-bold ${step.completed ? 'text-gray-900 dark:text-zinc-50' : 'text-gray-400 dark:text-zinc-600'}`}>
                  {step.title}
                </Text>
                <Text className="text-[13px] font-satoshi-medium text-gray-500 dark:text-zinc-500 mt-1">
                  {step.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default TrackComplaint;
