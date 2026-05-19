import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert as RNAlert,
  Platform,
  Pressable,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import {
  ArrowLeft,
  Plus,
  Car,
  Bike,
  Trash2,
  User,
  Clock,
  ShieldCheck,
  X,
  Zap,
  Tag,
  Palette,
  AlertCircle
} from 'lucide-react-native';
import StatusModal from '../../../../components/modals/StatusModal';
import { getApiBaseUrl } from '../../../../utils/apiConfig';

const SESSION_KEY = '@sociosmart/session_v1';
const PRIMARY_BLUE = '#2563EB';

const MyVehicles = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [color, setColor] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'bike' | 'other'>('car');
  const [otherDetails, setOtherDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ type: 'success' | 'error'; title: string; message: string }>({
    type: 'success', title: '', message: ''
  });

  const fetchVehicles = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const rawSession = await AsyncStorage.getItem(SESSION_KEY);
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        setSession(parsed);
        const response = await fetch(`${baseUrl}/api/vehicles`, {
          headers: { Authorization: `Bearer ${parsed.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setVehicles(data || []);
        }
      }
    } catch (error) {
      console.error('Fetch vehicles error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const formatPlate = (text: string) => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleaned.length > 3) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
    }
    return cleaned;
  };

  const handleAddVehicle = async () => {
    if (!plateNumber || !makeModel || !color) {
      setModalConfig({
        type: 'error',
        title: 'Missing Information',
        message: 'Please complete all fields to register your vehicle in the society database.'
      });
      setModalVisible(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          vehicle_number: plateNumber,
          make_model: vehicleType === 'other' && otherDetails.trim() ? `${makeModel.trim()} (${otherDetails.trim()})` : makeModel.trim(),
          color: color,
          vehicle_type: vehicleType,
          parking_slot: 'Allocated'
        })
      });

      if (response.ok) {
        setModalConfig({
          type: 'success',
          title: 'Registration Submitted',
          message: 'Your vehicle has been added. Security will verify the details for automatic gate access.'
        });
        setModalVisible(true);
        setShowAddModal(false);
        setPlateNumber('');
        setMakeModel('');
        setColor('');
        setOtherDetails('');
        fetchVehicles();
      } else {
        const data = await response.json();
        setModalConfig({ type: 'error', title: 'Submission Failed', message: data.message || 'Unable to register vehicle.' });
        setModalVisible(true);
      }
    } catch (error) {
      setModalConfig({ type: 'error', title: 'Network Error', message: 'Could not connect to the server. Please check your connection.' });
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    RNAlert.alert(
      "Deregister Vehicle",
      "Are you sure you want to remove this vehicle? This will disable automatic gate access immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const baseUrl = getApiBaseUrl();
              const res = await fetch(`${baseUrl}/api/vehicles/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.token}` }
              });
              if (res.ok) fetchVehicles();
            } catch (e) {
              RNAlert.alert("Error", "Failed to delete vehicle. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#09090b' : '#F8FAFC' }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#09090b' : "#F8FAFC"} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center mr-2 rounded-full active:bg-gray-100 dark:active:bg-zinc-800"
          >
            <ArrowLeft size={22} color={isDark ? '#F4F4F5' : '#1E293B'} />
          </TouchableOpacity>
          <View>
            <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">My Vehicles</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
          className="w-11 h-11 bg-blue-600 rounded-full items-center justify-center shadow-lg shadow-blue-500/30"
        >
          <Plus size={22} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Stats Section */}
        <View className="flex-row mt-6 justify-between">
          <View className="bg-white dark:bg-zinc-900 p-5 rounded-[28px] w-[48%] border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <Text className="text-gray-400 font-satoshi-bold text-[9px] uppercase tracking-widest">Active Slots</Text>
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-2xl mt-1">
              {vehicles.length}
              <Text className="text-gray-300 dark:text-zinc-700 text-lg"> / 05</Text>
            </Text>
          </View>
          <View className="bg-white dark:bg-zinc-900 p-5 rounded-[28px] w-[48%] border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <Text className="text-gray-400 font-satoshi-bold text-[9px] uppercase tracking-widest">Unit Link</Text>
            <Text className="text-blue-600 font-satoshi-black text-2xl mt-1">{session?.house_number ?? '---'}</Text>
          </View>
        </View>

        {/* Vehicle List */}
        <View className="mt-8">
          <View className="flex-row items-center justify-between mb-6 px-1">
            <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-black text-[11px] uppercase tracking-[3px]">Registered Fleet</Text>
            <View className="h-[1px] flex-1 bg-gray-100 dark:bg-zinc-800 ml-4" />
          </View>

          {isLoading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color={PRIMARY_BLUE} />
              <Text className="text-gray-400 font-satoshi-medium text-xs mt-4">Loading your vehicles...</Text>
            </View>
          ) : vehicles.length === 0 ? (
            <View className="items-center py-16 bg-white dark:bg-zinc-900 rounded-[40px] border border-dashed border-zinc-200 dark:border-zinc-800">
              <View className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-full items-center justify-center border border-zinc-100 dark:border-zinc-800">
                <Car size={36} color={isDark ? '#3F3F46' : '#CBD5E1'} strokeWidth={1.5} />
              </View>
              <Text className="text-gray-400 font-satoshi-bold text-sm mt-5">No Vehicles Registered</Text>
              <Text className="text-gray-400 font-satoshi-medium text-[11px] mt-1 mb-8">Add your vehicle to start using the smart gate.</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="px-8 py-3.5 bg-blue-600 rounded-full shadow-lg shadow-blue-500/30"
              >
                <Text className="text-white font-satoshi-black text-xs tracking-widest">REGISTER NOW</Text>
              </TouchableOpacity>
            </View>
          ) : (
            vehicles.map((v) => (
              <View key={v._id} className="bg-white dark:bg-zinc-900 p-5 rounded-[32px] mb-5 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center">
                    <View className="w-14 h-14 bg-blue-50 dark:bg-blue-900/10 rounded-2xl items-center justify-center border border-blue-100 dark:border-blue-900/20">
                      {v.vehicle_type === 'bike' ? <Bike size={26} color={PRIMARY_BLUE} /> : <Car size={26} color={PRIMARY_BLUE} />}
                    </View>
                    <View className="ml-4">
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg tracking-[1.5px]">{v.vehicle_number}</Text>
                      <View className="flex-row items-center mt-0.5">
                        <Text className="text-gray-400 font-satoshi-bold text-[10px] uppercase">{v.make_model}</Text>
                        <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
                        <Text className="text-gray-400 font-satoshi-bold text-[10px] uppercase">{v.color}</Text>
                      </View>
                    </View>
                  </View>

                  {v.approval_status === 'approved' ? (
                    <View className="bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full flex-row items-center border border-green-100/50 dark:border-green-900/30">
                      <ShieldCheck size={12} color="#16A34A" />
                      <Text className="text-green-700 dark:text-green-400 font-satoshi-black text-[9px] uppercase ml-1.5">Verified</Text>
                    </View>
                  ) : (
                    <View className="bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full flex-row items-center border border-orange-100/50 dark:border-orange-900/30">
                      <Clock size={12} color="#EA580C" />
                      <Text className="text-orange-700 dark:text-orange-400 font-satoshi-black text-[9px] uppercase ml-1.5">Pending</Text>
                    </View>
                  )}
                </View>

                <View className="mt-5 pt-4 border-t border-zinc-50 dark:border-zinc-800 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 items-center justify-center mr-2 border border-zinc-100 dark:border-zinc-700">
                      <User size={14} color="#94A3B8" />
                    </View>
                    <View>
                      <Text className="text-gray-400 text-[8px] font-satoshi-bold uppercase">Audit Link</Text>
                      <Text className="text-gray-600 dark:text-zinc-400 text-[10px] font-satoshi-black">
                        Unit {session?.house_number}  RES-{v._id.slice(-6).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(v._id)}
                    activeOpacity={0.6}
                    className="w-10 h-10 bg-rose-50 dark:bg-rose-900/10 rounded-full items-center justify-center border border-rose-100 dark:border-rose-900/20"
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Vehicle Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
            className="flex-1"
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View className="bg-white dark:bg-zinc-950 rounded-t-[44px] p-8 pb-12 shadow-2xl">
              <View className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full self-center mb-6" />

              <View className="flex-row justify-between items-center mb-8">
                <View>
                  <Text className="text-2xl font-satoshi-black text-gray-900 dark:text-zinc-50">Register Vehicle</Text>
                  <Text className="text-gray-400 font-satoshi-medium text-xs mt-1">Linking to Unit {session?.house_number}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 rounded-full items-center justify-center border border-zinc-100 dark:border-zinc-800"
                >
                  <X size={20} color={isDark ? '#F4F4F5' : "#1E293B"} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="gap-y-6">
                {/* Plate Number */}
                <View>
                  <Text className="text-zinc-400 font-satoshi-black text-[10px] uppercase tracking-[2px] mb-2 ml-1">License Plate</Text>
                  <View className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 rounded-[24px] flex-row items-center border border-zinc-100 dark:border-zinc-800">
                    <Tag size={20} color={PRIMARY_BLUE} />
                    <TextInput
                      placeholder="e.g. ABC-1234"
                      placeholderTextColor={isDark ? '#3F3F46' : "#94A3B8"}
                      className="flex-1 ml-4 text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg"
                      value={plateNumber}
                      onChangeText={(t) => setPlateNumber(formatPlate(t))}
                      autoCapitalize="characters"
                      maxLength={9}
                    />
                  </View>
                </View>

                {/* Make & Color */}
                <View className="flex-row gap-x-4">
                  <View className="flex-1">
                    <Text className="text-zinc-400 font-satoshi-black text-[10px] uppercase tracking-[2px] mb-2 ml-1">Make / Model</Text>
                    <View className="bg-zinc-50 dark:bg-zinc-900/50 px-5 py-4 rounded-[24px] flex-row items-center border border-zinc-100 dark:border-zinc-800">
                      <Car size={18} color={PRIMARY_BLUE} />
                      <TextInput
                        placeholder="e.g. Corolla"
                        placeholderTextColor={isDark ? '#3F3F46' : "#94A3B8"}
                        className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm"
                        value={makeModel}
                        onChangeText={setMakeModel}
                      />
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-zinc-400 font-satoshi-black text-[10px] uppercase tracking-[2px] mb-2 ml-1">Color</Text>
                    <View className="bg-zinc-50 dark:bg-zinc-900/50 px-5 py-4 rounded-[24px] flex-row items-center border border-zinc-100 dark:border-zinc-800">
                      <Palette size={18} color={PRIMARY_BLUE} />
                      <TextInput
                        placeholder="e.g. White"
                        placeholderTextColor={isDark ? '#3F3F46' : "#94A3B8"}
                        className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm"
                        value={color}
                        onChangeText={setColor}
                      />
                    </View>
                  </View>
                </View>

                {/* Type Selection */}
                <View>
                  <Text className="text-zinc-400 font-satoshi-black text-[10px] uppercase tracking-[2px] mb-2 ml-1">Vehicle Type</Text>
                  <View className="flex-row gap-x-3">
                    {(['car', 'bike', 'other'] as const).map(type => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setVehicleType(type)}
                        activeOpacity={0.7}
                        className={`flex-1 py-4 items-center rounded-[24px] border-2 ${vehicleType === type ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-zinc-100 dark:border-zinc-800'}`}
                      >
                        <Text className={`font-satoshi-black text-[10px] uppercase tracking-widest ${vehicleType === type ? 'text-white' : 'text-zinc-400'}`}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {vehicleType === 'other' && (
                  <View>
                    <Text className="text-zinc-400 font-satoshi-black text-[10px] uppercase tracking-[2px] mb-2 ml-1">Additional Details</Text>
                    <View className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 rounded-[24px] border border-zinc-100 dark:border-zinc-800 min-h-[80px]">
                      <TextInput
                        placeholder="Please specify..."
                        placeholderTextColor={isDark ? '#3F3F46' : "#94A3B8"}
                        className="flex-1 text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm"
                        value={otherDetails}
                        onChangeText={setOtherDetails}
                        multiline
                      />
                    </View>
                  </View>
                )}

                {/* Security Note */}
                <View className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-[24px] border border-amber-100/50 dark:border-amber-900/20 flex-row items-center">
                  <AlertCircle size={18} color="#D97706" />
                  <Text className="ml-3 text-[10px] text-amber-800 dark:text-amber-400 font-satoshi-medium flex-1">
                    Your details will be verified by society management before NPR activation.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleAddVehicle}
                  disabled={isSubmitting}
                  activeOpacity={0.9}
                  className={`py-5 rounded-[28px] items-center mt-2 ${isSubmitting ? 'bg-blue-300' : 'bg-blue-600 shadow-xl shadow-blue-500/40'}`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-satoshi-black text-base tracking-widest">SUBMIT REGISTRATION</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <StatusModal
        visible={modalVisible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default MyVehicles;
