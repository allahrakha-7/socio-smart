import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  NativeModules,
  Platform,
  Image,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Search, Car, User, Trash2, X, Info, Camera } from 'lucide-react-native';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';

import { getApiBaseUrl } from '../../../utils/apiConfig';

const VehicleRegistry = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [session, setSession] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [makeModel, setMakeModel] = useState('');
  const [color, setColor] = useState('');
  const [parkingSlot, setParkingSlot] = useState('');
  const [vehicleImage, setVehicleImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionRaw) {
        navigation.navigate('Login');
        return;
      }
      const parsed = JSON.parse(sessionRaw);
      setSession(parsed);
      const headers = { Authorization: `Bearer ${parsed.token}` };

      const vRes = await fetch(`${baseUrl}/api/vehicles`, { headers });
      const vData = await vRes.json();
      if (vRes.ok) setVehicles(Array.isArray(vData) ? vData : []);

      if (parsed.role === 'admin') {
        const rRes = await fetch(`${baseUrl}/api/auth/all`, { headers });
        const rData = await rRes.json();
        if (rRes.ok) setResidents(Array.isArray(rData) ? rData.filter((u: any) => u.type === 'resident' && u.status === 'active') : []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to pull latest registry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAddVehicle = async () => {
    const isAdmin = session?.role === 'admin';
    if ((isAdmin && !selectedOwner) || !vehicleNumber || !makeModel || !parkingSlot) {
      Alert.alert('Required', 'Please fill in all details including parking slot.');
      return;
    }

    setIsSaving(true);
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          ownerId: isAdmin ? selectedOwner._id : session._id,
          ownerModel: 'Resident',
          vehicle_number: vehicleNumber.toUpperCase().trim(),
          vehicle_type: vehicleType,
          make_model: makeModel,
          color,
          parking_slot: parkingSlot.toUpperCase().trim(),
          vehicle_image: vehicleImage,
        }),
      });

      if (response.ok) {
        setIsModalVisible(false);
        resetForm();
        fetchData();
        Alert.alert('Success', 'Vehicle registered effectively.');
      } else {
        const err = await response.json();
        Alert.alert('Failed', err.message || 'Error occurred.');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteVehicle = (id: string) => {
    Alert.alert('Remove Vehicle', 'Are you sure you want to remove this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/vehicles/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${session.token}` },
            });
            if (response.ok) fetchData();
          } catch {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const handleApprove = async (id: string, action: 'approved' | 'rejected') => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/vehicles/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (response.ok) {
        fetchData();
        Alert.alert('Success', `Vehicle ${action} successfully.`);
      } else {
        const err = await response.json();
        Alert.alert('Error', err.message || 'Failed to update status.');
      }
    } catch {
      Alert.alert('Error', 'Connection failed.');
    }
  };

  const resetForm = () => {
    setSelectedOwner(null);
    setVehicleNumber('');
    setMakeModel('');
    setParkingSlot('');
    setVehicleImage('');
    setColor('');
  };

  const filteredVehicles = vehicles.filter((v) =>
    v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderVehicle = ({ item }: any) => {
    const isPending = item.approval_status === 'pending';
    const isRejected = item.approval_status === 'rejected';

    return (
      <View className="bg-white dark:bg-zinc-900 rounded-lg p-5 mb-4 shadow-sm border border-gray-100 dark:border-zinc-800">
        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full items-center justify-center mr-4">
              <Car size={24} color={PRIMARY_COLOR} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-lg font-satoshi-bold text-gray-900 dark:text-zinc-50">{item.vehicle_number}</Text>
                {isPending && (
                  <View className="ml-3 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                    <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-satoshi-bold">PENDING</Text>
                  </View>
                )}
                {isRejected && (
                  <View className="ml-3 px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 rounded-md">
                    <Text className="text-rose-700 dark:text-rose-400 text-[10px] font-satoshi-bold">REJECTED</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-500 dark:text-zinc-500 text-xs font-satoshi-medium">{item.make_model} ��� {item.color} ��� Slot: {item.parking_slot}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => deleteVehicle(item._id)} className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-full items-center justify-center border border-red-100 dark:border-red-900/40">
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-800 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <User size={14} color={colorScheme === 'dark' ? '#52525B' : "#9CA3AF"} />
            <Text className="ml-2 text-gray-600 dark:text-zinc-400 font-satoshi-bold text-xs">{item.owner?.full_name || 'System Admin'}</Text>
            <Text className="ml-2 text-gray-400 dark:text-zinc-500 font-satoshi-medium text-xs">��� Unit: {item.owner?.house_number || 'N/A'}</Text>
          </View>

          {session?.role === 'admin' && isPending && (
            <View className="flex-row gap-x-2">
              <TouchableOpacity
                onPress={() => handleApprove(item._id, 'rejected')}
                className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40"
              >
                <Text className="text-rose-600 dark:text-rose-400 text-[10px] font-satoshi-bold">REJECT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleApprove(item._id, 'approved')}
                className="px-3 py-1.5 rounded-lg bg-blue-600"
              >
                <Text className="text-white text-[10px] font-satoshi-bold">APPROVE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} className="p-3 mr-4">
              <ChevronLeft size={24} color={colorScheme === 'dark' ? '#F4F4F5' : "#111827"} />
            </TouchableOpacity>
            <Text className="text-2xl font-satoshi-bold text-gray-900 dark:text-zinc-50 tracking-tight">Vehicle Registry</Text>
          </View>
        </View>

        <View className="px-6">
          <View className="flex-row items-center bg-white dark:bg-zinc-900 rounded-full px-5 py-1.5 border border-gray-100 dark:border-zinc-800 shadow-sm">
            <Search size={20} color={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"} />
            <TextInput
              placeholder="Search by number plate or owner..."
              placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
            />
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>
        ) : (
          <FlatList
            data={filteredVehicles}
            keyExtractor={(item) => item._id}
            renderItem={renderVehicle}
            contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View className="items-center justify-center mt-20">
                <Car size={48} color={colorScheme === 'dark' ? '#27272A' : "#D1D5DB"} />
                <Text className="text-gray-400 dark:text-zinc-500 text-lg font-satoshi-bold mt-4">No vehicles found</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* Registration Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-zinc-900 rounded-t-[44px] p-8 pb-12 shadow-2xl h-[90%]">
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-2xl font-satoshi-black text-gray-900 dark:text-zinc-50">Register Vehicle</Text>
                <Text className="text-gray-500 dark:text-zinc-500 font-satoshi-medium mt-1">Add a new vehicle to the registry</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} className="bg-gray-100 dark:bg-zinc-800 p-2.5 rounded-full">
                <X size={24} color={colorScheme === 'dark' ? '#A1A1AA' : "#111827"} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Vehicle Image Picker */}
              <TouchableOpacity
                onPress={() => {
                  ImagePicker.openPicker({ width: 800, height: 600, cropping: true, includeBase64: true })
                    .then(image => setVehicleImage(`data:${image.mime};base64,${(image as any).data}`))
                    .catch(e => console.log(e));
                }}
                className="w-full h-40 bg-gray-50 dark:bg-zinc-800 rounded-3xl mb-6 items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-700 overflow-hidden"
              >
                {vehicleImage ? (
                  <View className="w-full h-full">
                    <Image source={{ uri: vehicleImage }} className="w-full h-full" />
                  </View>
                ) : (
                  <View className="items-center">
                    <Camera size={32} color="#94A3B8" />
                    <Text className="text-gray-400 font-satoshi-bold text-xs mt-2">Tap to take vehicle photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              {session?.role === 'admin' && (
                <>
                  <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Select Owner</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {residents.map((r) => (
                      <TouchableOpacity
                        key={r._id}
                        onPress={() => setSelectedOwner(r)}
                        className={`mr-3 px-4 py-3 rounded-2xl border ${selectedOwner?._id === r._id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'}`}
                      >
                        <Text className={`font-satoshi-bold text-sm ${selectedOwner?._id === r._id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-300'}`}>{r.full_name}</Text>
                        <Text className="text-[10px] text-gray-400 dark:text-zinc-500">{r.house_number}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <TextInput
                placeholder="Plate Number (e.g. ABC-1234)"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700 mb-4 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                autoCapitalize="characters"
              />

              <View className="flex-row mb-4">
                <TouchableOpacity onPress={() => setVehicleType('car')} className={`flex-1 p-4 rounded-2xl border mr-2 items-center ${vehicleType === 'car' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'}`}>
                  <Text className={`font-satoshi-bold ${vehicleType === 'car' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-500'}`}>CAR</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setVehicleType('bike')} className={`flex-1 p-4 rounded-2xl border items-center ${vehicleType === 'bike' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'}`}>
                  <Text className={`font-satoshi-bold ${vehicleType === 'bike' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-500'}`}>BIKE</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Make / Model (e.g. Honda Civic)"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                value={makeModel}
                onChangeText={setMakeModel}
                className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700 mb-4 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
              />

              <TextInput
                placeholder="Color"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                value={color}
                onChangeText={setColor}
                className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 mb-4 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
              />

              <TextInput
                placeholder="Parking Slot (e.g. P3-12)"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                value={parkingSlot}
                onChangeText={setParkingSlot}
                className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700 mb-8 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                autoCapitalize="characters"
              />

              <TouchableOpacity onPress={handleAddVehicle} disabled={isSaving} className="bg-[#2563EB] py-4 rounded-full items-center">
                {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-satoshi-bold text-lg">REGISTER VEHICLE</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Action FAB */}
      <TouchableOpacity
        onPress={() => setIsModalVisible(true)}
        style={{ position: 'absolute', bottom: 50, right: 35, elevation: 10, zIndex: 999 }}
        activeOpacity={0.8}
        className="w-16 h-16 bg-[#2563EB] rounded-full items-center justify-center shadow-2xl shadow-blue-600/50"
      >
        <Plus size={32} color="white" />
      </TouchableOpacity>
    </>
  );
};

export default VehicleRegistry;
