import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, ActivityIndicator, Image, Linking, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Phone, User, Home, Heart, Info } from 'lucide-react-native';
import api from '../../../../utils/apiConfig';
import { useColorScheme } from 'nativewind';

const PRIMARY_COLOR = '#2563EB';

const ResidentsInfo = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [residents, setResidents] = useState<any[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('All');

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const response = await api.get('/api/community/residents');
      setResidents(response.data);
      setFilteredResidents(response.data);
    } catch (error) {
      console.error("Fetch residents error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = residents;

    // Filter by Block
    if (selectedBlock !== 'All') {
      result = result.filter(r => r.block === selectedBlock);
    }

    // Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.full_name?.toLowerCase().includes(query) ||
        r.house_number?.toLowerCase().includes(query) ||
        r.phone?.includes(query)
      );
    }

    setFilteredResidents(result);
  }, [searchQuery, selectedBlock, residents]);

  const blocks = ['All', ...new Set(residents.filter(r => r.block).map(r => r.block))].sort();

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA] dark:bg-zinc-950">
      {/* Header */}
      <View className="flex-row items-center px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center mr-4"
        >
          <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
        </TouchableOpacity>
        <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Community Directory</Text>
      </View>

      {/* Search & Filter Bar */}
      <View className="px-6 pt-4 pb-2 bg-white dark:bg-zinc-950">
        <View className="flex-row items-center bg-gray-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-full px-5 py-1.5 mb-4">
          <Search size={18} color="#64748B" />
          <TextInput
            placeholder="Search by Name or Unit..."
            placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#94A3B8'}
            className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {blocks.length > 2 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            {blocks.map(block => (
              <TouchableOpacity
                key={block}
                onPress={() => setSelectedBlock(block)}
                className={`px-5 py-2.5 rounded-full mr-2 border ${selectedBlock === block ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'}`}
              >
                <Text className={`font-satoshi-bold text-[13px] ${selectedBlock === block ? 'text-white' : 'text-gray-500 dark:text-zinc-400'}`}>
                  {block === 'All' ? 'All Blocks' : `Block ${block}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={PRIMARY_COLOR} size="large" />
          <Text className="mt-4 text-gray-400 font-satoshi-medium">Loading residents...</Text>
        </View>
      ) : filteredResidents.length > 0 ? (
        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
          {filteredResidents.map((resident) => (
            <View
              key={resident._id}
              className="mb-4 bg-white dark:bg-zinc-900 p-5 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-sm"
            >
              <View className="flex-row items-center">
                <Image
                  source={{ uri: resident.profile_image }}
                  className="w-16 h-16 rounded-[22px] bg-gray-100"
                  resizeMode="cover"
                />
                <View className="ml-4 flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg" numberOfLines={1}>{resident.full_name}</Text>
                    <TouchableOpacity onPress={() => handleCall(resident.phone)} className="w-9 h-9 bg-green-50 dark:bg-green-900/30 rounded-full items-center justify-center">
                      <Phone size={18} color="#16A34A" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <View className="bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                      <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-satoshi-bold uppercase">
                        {resident.block ? `Block ${resident.block}` : 'Unit'} {resident.house_number}
                      </Text>
                    </View>
                    {resident.blood_group && (
                      <View className="bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded ml-2 flex-row items-center">
                        <Heart size={10} color="#ec0909ff" />
                        <Text className="text-rose-600 dark:text-rose-400 text-[10px] font-satoshi-bold ml-1 uppercase">{resident.blood_group}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-800">
                <Text className="text-gray-400 font-satoshi-bold text-[9px] uppercase tracking-widest mb-1">Emergency Contact</Text>
                <TouchableOpacity
                  onPress={() => handleCall(resident.emergency_contact)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between"
                >
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[15px]">
                    {resident.emergency_contact || 'Not Provided'}
                  </Text>
                  <View className="bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-zinc-800">
                    <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-bold text-[10px] uppercase">Call Emergency</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View className="h-10" />
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-20 h-20 bg-gray-100 dark:bg-zinc-900 rounded-full items-center justify-center mb-4">
            <Info size={32} color="#94A3B8" />
          </View>
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg text-center">No Residents Found</Text>
          <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-sm text-center mt-2">We couldn't find any residents matching your search or filters.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ResidentsInfo;
