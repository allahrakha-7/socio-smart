import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Phone, User, Home, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react-native';
import api from '../../../../utils/apiConfig';
import { useColorScheme } from 'nativewind';

const PRIMARY_COLOR = '#2563EB';

const GuestVerification = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [residents, setResidents] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);

  // Guest Info Form
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestType, setGuestType] = useState('Visitor');
  const [guestPlate, setGuestPlate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await api.get(`/api/visitors/search-house/${searchQuery.trim()}`);
      setResidents(response.data);
      if (response.data.length === 0) {
        Alert.alert("No Results", "No active residents found for this house number.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to search residents.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestEntry = async (resident: any) => {
    if (!guestName || !guestPhone) {
      Alert.alert("Missing Information", "Please enter guest name and phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/visitors/request-entry', {
        name: guestName,
        phone: guestPhone,
        type: guestType,
        plate_number: guestPlate,
        resident_id: resident._id
      });

      Alert.alert(
        "Request Sent",
        `Entry request sent to ${resident.full_name} (${resident.house_number}). Please wait for approval.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to initiate entry request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA] dark:bg-zinc-950">
      <View className="px-6 py-4 flex-row items-center border-b border-gray-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={20} color={colorScheme === 'dark' ? '#FFF' : '#111827'} />
        </TouchableOpacity>
        <Text className="ml-2 text-xl font-satoshi-black text-gray-900 dark:text-zinc-50">Verify Guest</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>

        {/* 1. House Search */}
        <View className="mb-8">
          <Text className="text-xs font-satoshi-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Step 1: Locate Resident</Text>
          <View className="flex-row items-center">
            <View className="flex-1 flex-row items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full px-3 py-2 shadow-sm">
              <Home size={18} color="#64748B" />
              <TextInput
                placeholder="Enter House Number (e.g. 101)"
                placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#94A3B8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
            </View>
            <TouchableOpacity
              onPress={handleSearch}
              className="ml-3 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-md shadow-blue-500/30"
            >
              {isSearching ? <ActivityIndicator color="white" size="small" /> : <Search size={22} color="white" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Resident Selection */}
        {residents.length > 0 && (
          <View className="mb-8">
            <Text className="text-xs font-satoshi-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Step 2: Select Resident</Text>
            <View className="gap-y-3">
              {residents.map((res) => (
                <TouchableOpacity
                  key={res._id}
                  onPress={() => setSelectedResident(res)}
                  className={`flex-row items-center p-4 rounded-2xl border ${selectedResident?._id === res._id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-100 dark:bg-zinc-900 dark:border-zinc-800'}`}
                >
                  <View className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full items-center justify-center">
                    <User size={20} color="#64748B" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base">{res.full_name}</Text>
                    <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium">Unit {res.house_number}  •  {res.phone}</Text>
                  </View>
                  {selectedResident?._id === res._id ? (
                    <CheckCircle2 size={24} color={PRIMARY_COLOR} />
                  ) : (
                    <View className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-zinc-700" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 3. Guest Form */}
        {selectedResident && (
          <View className="mb-10 bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <Text className="text-xs font-satoshi-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 dark:border-zinc-800 pb-3">Step 3: Guest Details</Text>

            <View className="space-y-5">
              <View className='mb-2'>
                <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-bold text-[11px] mb-2 uppercase tracking-tight">Visitor Name</Text>
                <TextInput
                  placeholder="Enter Full Name"
                  placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#94A3B8'}
                  value={guestName}
                  onChangeText={setGuestName}
                  className="bg-gray-50 dark:bg-zinc-950 px-5 py-4 rounded-xl text-gray-900 dark:text-zinc-50 font-satoshi-medium border border-gray-100 dark:border-zinc-800"
                />
              </View>

              <View className='mb-2'>
                <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-bold text-[11px] mb-2 uppercase tracking-tight">Mobile Number</Text>
                <TextInput
                  placeholder="Enter Contact Number"
                  placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#94A3B8'}
                  value={guestPhone}
                  onChangeText={setGuestPhone}
                  keyboardType="phone-pad"
                  className="bg-gray-50 dark:bg-zinc-950 px-5 py-4 rounded-xl text-gray-900 dark:text-zinc-50 font-satoshi-medium border border-gray-100 dark:border-zinc-800"
                />
              </View>

              <View>
                <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-bold text-[11px] mb-2 uppercase tracking-tighter">Vehicle Plate (Optional)</Text>
                <TextInput
                  placeholder="e.g. ABC-1234"
                  placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#94A3B8'}
                  value={guestPlate}
                  onChangeText={v => setGuestPlate(v.toUpperCase())}
                  className="bg-gray-50 dark:bg-zinc-950 px-5 py-4 rounded-xl text-gray-900 dark:text-zinc-50 font-satoshi-medium border border-gray-100 dark:border-zinc-800"
                />
              </View>

              <View className="pt-4">
                <TouchableOpacity
                  onPress={() => handleRequestEntry(selectedResident)}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                  className="bg-blue-600 w-full py-4 rounded-full flex-row items-center justify-center shadow-lg shadow-blue-500/40"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Phone size={18} color="white" />
                      <Text className="text-white font-satoshi-bold text-sm ml-3">CONNECT RESIDENT FOR APPROVAL</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default GuestVerification;
