import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Text, View, ScrollView, Pressable, ActivityIndicator,
  StatusBar, Image, TextInput, Appearance, StyleSheet, RefreshControl, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationService from '../../../../navigation/NavigationService';
import {
  ArrowLeft, Search, Clock, MapPin, History, X, Info, Calendar as CalendarIcon, User, Layers, RefreshCw, AlertTriangle, Plus, ShieldCheck, ChevronRight
} from 'lucide-react-native';
import StatusModal from '../../../../components/modals/StatusModal';
import { getApiBaseUrl } from '../../../../utils/apiConfig';
import { AMENITIES_METADATA } from '../constants';

type Amenity = {
  _id?: string;
  name: string;
  status: 'available' | 'closed' | 'maintenance' | 'booked';
  location: string;
  price: string;
  description?: string;
  thumbnail?: string;
  timings?: { open: string; close: string };
  rules?: string[];
  icon?: string;
};

const PRIMARY_BLUE = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';

const TIME_SLOTS = [
  "06:00 AM - 08:00 AM", "08:00 AM - 10:00 AM", "10:00 AM - 12:00 PM",
  "12:00 PM - 02:00 PM", "02:00 PM - 04:00 PM", "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM", "08:00 PM - 10:00 PM"
];

const Amenities = () => {
  const [theme, setTheme] = useState(Appearance.getColorScheme());
  const isDark = theme === 'dark';

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const [amenityData, setAmenityData] = useState<Amenity[]>(
    AMENITIES_METADATA.map(m => ({ ...m, status: 'available' })) as Amenity[]
  );

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState<'admin' | 'resident'>('resident');
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ type: 'success' | 'error'; title: string; message: string }>({
    type: 'success', title: '', message: ''
  });

  const calendarDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const syncStatusesWithBackend = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');
      if (!parsed.token) return;
      setRole(parsed.role || 'resident');

      const response = await fetch(`${baseUrl}/api/amenities`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });

      const backendData = await response.json();
      if (response.ok && Array.isArray(backendData)) {
        setAmenityData(prev => prev.map(local => {
          const match = backendData.find(b => b.name === local.name);
          return match ? { ...local, ...match } : local;
        }));
      }
    } catch (e) { console.log(e); }
    finally { setLoadingStatus(false); }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncStatusesWithBackend();
    setRefreshing(false);
  }, [syncStatusesWithBackend]);

  const fetchBookedSlots = async (amenityId: string, date: Date) => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');
      const formattedDate = date.toISOString().split('T')[0];
      const response = await fetch(`${baseUrl}/api/amenities/${amenityId}/booked-slots?date=${formattedDate}`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });
      const data = await response.json();
      if (response.ok) setBookedSlots(data);
    } catch (error) { console.log(error); }
  };

  useEffect(() => {
    syncStatusesWithBackend();
  }, [syncStatusesWithBackend]);

  // Auto-sync the active modal if the backend fetch finishes AFTER the user tapped the card
  useEffect(() => {
    if (selectedAmenity && !selectedAmenity._id) {
      const match = amenityData.find(a => a.name === selectedAmenity.name && a._id);
      if (match) {
        setSelectedAmenity(match);
      }
    }
  }, [amenityData, selectedAmenity]);

  useEffect(() => {
    if (selectedAmenity?._id) fetchBookedSlots(selectedAmenity._id, selectedDate);
  }, [selectedAmenity, selectedDate]);

  // Removed deferred updates to prefer synchronous renders now that Portals are removed
  const pickSlot = (slot: string) => {
    setSelectedSlot(slot);
  };

  const pickDate = (date: Date) => {
    setSelectedDate(date);
  };

  const handleBook = async () => {
    if (!selectedAmenity || !selectedSlot) return;

    // Check if the amenity ID mapped properly, otherwise backend will reject it.
    if (!selectedAmenity._id) {
      setModalConfig({ type: 'error', title: 'Data Sync Error', message: 'This facility has not fully synced with the backend database. Please refresh the page.' });
      setModalVisible(true);
      return;
    }

    setBookingLoading(selectedAmenity._id);
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(sessionRaw || '{}');
      const response = await fetch(`${baseUrl}/api/amenities/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${parsed.token}` },
        body: JSON.stringify({ amenityId: selectedAmenity._id, bookingDate: selectedDate.toISOString(), slot: selectedSlot, purpose: 'General Usage' })
      });
      if (response.ok) {
        setModalConfig({ type: 'success', title: 'Request Submitted', message: 'The Administrator will review your booking shortly.' });
        setSelectedAmenity(null);
        setSelectedSlot(null);
      } else {
        const data = await response.json();
        setModalConfig({ type: 'error', title: 'Request Failed', message: data.message });
      }
      setModalVisible(true);
    } catch (e) {
      setModalConfig({ type: 'error', title: 'Error', message: 'Could not connect to server.' });
      setModalVisible(true);
    } finally { setBookingLoading(null); }
  };

  const handleReportIssue = () => {
    if (!selectedAmenity) return;
    NavigationService.navigate('Complaints', { amenityId: selectedAmenity._id, amenityName: selectedAmenity.name });
    setSelectedAmenity(null);
  };

  const amenityCards = useMemo(() => {
    return (
      <View className="flex-row flex-wrap justify-between px-2">
        {amenityData.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.9}
            onPress={() => setSelectedAmenity(item)}
            className="w-[48%] bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm mb-5"
          >
            <View className="h-32 w-full relative">
              <Image 
                source={item.thumbnail as any} 
                className="w-full h-full"
                resizeMode="cover"
              />
              {item.status !== 'available' && (
                <View className="absolute top-3 right-3 px-2 py-1 bg-black/60 rounded-lg">
                  <Text className="text-[8px] font-satoshi-black text-white uppercase">{item.status}</Text>
                </View>
              )}
            </View>
            <View className="p-4">
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-sm" numberOfLines={1}>{item.name}</Text>
              <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[9px] mt-1 uppercase tracking-widest">{item.location.split(',')[0]}</Text>
              
              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-blue-600 dark:text-blue-400 font-satoshi-black text-xs">{item.price}</Text>
                <View className="bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-xl">
                   <Plus size={12} color="#2563EB" strokeWidth={3} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [amenityData, searchQuery]);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#09090b' : '#FFFFFF' }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#09090b' : "#FFFFFF"} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => NavigationService.goBack()}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color={isDark ? '#F4F4F5' : '#64748B'} />
          </TouchableOpacity>
          <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Amenities</Text>
        </View>
        <TouchableOpacity
          onPress={() => setActiveTab(activeTab === 'new' ? 'history' : 'new')}
          activeOpacity={0.7}
          className="bg-gray-100 dark:bg-zinc-800 px-4 py-2 rounded-full active:opacity-70"
        >
          <Text className="text-[10px] font-satoshi-black text-gray-600 dark:text-zinc-400 uppercase tracking-wider">{activeTab === 'new' ? 'View History' : 'New Booking'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[PRIMARY_BLUE]}
            tintColor={PRIMARY_BLUE}
          />
        }
      >
        <View className="px-5 mt-6">
          <View className="flex-row items-center bg-gray-50 dark:bg-zinc-900 rounded-full px-5 py-1.5 border border-zinc-100 dark:border-zinc-800">
            <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search amenities..." placeholderTextColor="#94A3B8" className="flex-1 text-gray-800 dark:text-zinc-50 font-satoshi-medium text-base h-full" />
            <Search size={22} color="#CBD5E1" />
          </View>
        </View>

        <View className="mt-8 px-2 pb-24">
          {activeTab === 'new' ? amenityCards : (
            <View className="items-center py-20 px-8">
              <View className="w-20 h-20 items-center justify-center mb-6"><History size={32} color={PRIMARY_BLUE} /></View>
              <Text className="text-xl font-satoshi-black text-gray-900 dark:text-zinc-50 text-center">No Recent History</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Booking Absolute Overlay (Replacing Modal to maintain Context Tree) */}
      {!!selectedAmenity && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100, elevation: 100 }]} className="justify-end">
          <Pressable style={StyleSheet.absoluteFill} className="bg-black/60" onPress={() => setSelectedAmenity(null)} />
          <View className="bg-white dark:bg-zinc-950 rounded-t-[40px] pt-8 max-h-[90%]">
            <View className="flex-row justify-between items-center px-6 mb-4"><View><Text className="text-2xl font-satoshi-black text-gray-900 dark:text-zinc-50">{selectedAmenity.name}</Text><Text className="text-gray-400 text-sm tracking-tight">{selectedAmenity.location}</Text></View><Pressable onPress={() => setSelectedAmenity(null)} className="w-11 h-11 bg-gray-50 dark:bg-zinc-900/50 rounded-full items-center justify-center"><X size={20} color={isDark ? '#fff' : "#000"} /></Pressable></View>

            <ScrollView showsVerticalScrollIndicator={false} className="px-6 pb-12">
              <Text className="text-gray-500 font-satoshi-medium text-sm mb-6 leading-5">{selectedAmenity.description}</Text>

              <View className="flex-row items-center justify-between mb-4"><Text className="text-xs font-satoshi-black text-gray-400 uppercase tracking-widest">Reservation Date</Text><Text className="text-xs font-satoshi-black text-blue-600 uppercase">{selectedDate.toLocaleString('default', { month: 'long' })}</Text></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-8">
                {calendarDates.map((date, idx) => {
                  const isSelected = selectedDate.toDateString() === date.toDateString();
                  const isNewMonth = idx > 0 && date.getMonth() !== calendarDates[idx - 1].getMonth();
                  return (
                    <View key={idx} className="flex-row items-center">
                      {isNewMonth && <View className="w-[1px] h-10 bg-zinc-100 dark:bg-zinc-800 mx-4" />}
                      <Pressable
                        onPress={() => pickDate(date)}
                        className={`w-16 h-20 rounded-2xl items-center justify-center mr-3 border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800'}`}
                      >
                        <Text className={`text-[9px] uppercase font-satoshi-black ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>{date.toLocaleString('default', { weekday: 'short' })}</Text>
                        <Text className={`text-xl font-satoshi-black ${isSelected ? 'text-white' : 'text-gray-900 dark:text-zinc-50'}`}>{date.getDate()}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>

              <Text className="text-xs font-satoshi-black text-gray-400 uppercase tracking-widest mb-4">Choose Time Slot</Text>
              <View className="flex-row flex-wrap gap-3 mb-8">
                {TIME_SLOTS.map((slot, idx) => {
                  const isSelected = selectedSlot === slot;
                  const isBooked = bookedSlots.includes(slot);
                  return (
                    <Pressable
                      key={idx}
                      disabled={isBooked}
                      onPress={() => pickSlot(slot)}
                      className={`px-4 py-3 rounded-2xl border ${isBooked ? 'bg-zinc-50 dark:bg-zinc-900 opacity-40' : isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600' : 'bg-white dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800'}`}
                    >
                      <Text className={`text-xs font-satoshi-bold ${isBooked ? 'text-zinc-300 line-through' : isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'}`}>{slot}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-lg mb-4">
                <View className="flex-row items-center mb-3"><Info size={16} color={PRIMARY_BLUE} /><Text className="ml-2 font-satoshi-black text-gray-900 dark:text-zinc-50 text-sm">Booking Guidelines</Text></View>
                {selectedAmenity.rules?.map((rule, ri) => (
                  <View key={ri} className="flex-row items-start mb-2"><View className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 mr-2" /><Text className="flex-1 text-xs text-gray-400 font-satoshi-medium">{rule}</Text></View>
                ))}
              </View>

              <Pressable onPress={handleReportIssue} className="active:opacity-60 bg-amber-50 dark:bg-amber-900/10 p-5 rounded-lg mb-10 border border-amber-100 dark:border-amber-900/20"><View className="flex-row items-center mb-1"><AlertTriangle size={16} color="#D97706" /><Text className="ml-2 text-amber-900 dark:text-amber-200 font-satoshi-bold">Report Facility Issue</Text></View></Pressable>

              <Pressable
                onPress={handleBook}
                disabled={!selectedSlot || bookingLoading === selectedAmenity._id || selectedAmenity.status !== 'available'}
                className={`w-full h-16 rounded-full items-center justify-center mb-2 shadow-xl ${(!selectedSlot || selectedAmenity.status !== 'available') ? 'bg-zinc-100 dark:bg-zinc-900 shadow-transparent' : 'bg-blue-600 shadow-blue-500/30'}`}
              >
                {bookingLoading === selectedAmenity._id ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-satoshi-bold text-lg ">CONFIRM RESERVATION</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      )}

      <StatusModal visible={modalVisible} type={modalConfig.type} title={modalConfig.title} message={modalConfig.message} onClose={() => setModalVisible(false)} />
    </View>
  );
};

export default Amenities;
