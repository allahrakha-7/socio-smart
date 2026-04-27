import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { X, Plus, Car, Camera, MapPin } from 'lucide-react-native';
import ImagePicker from 'react-native-image-crop-picker';

interface VehicleManagementProps {
  vehicles: any[];
  onUpdate: (next: any[]) => void;
  colorScheme: 'light' | 'dark' | undefined;
}

const VehicleManagement: React.FC<VehicleManagementProps> = ({ vehicles, onUpdate, colorScheme }) => {
  const addVehicle = () => {
    const currentVehicles = vehicles || [];
    onUpdate([...currentVehicles, { vehicle_no: '', model: '', parking_slot: '', image: '', color: '', type: 'car' }]);
  };

  const updateVehicle = (index: number, field: string, value: string) => {
    const next = [...vehicles];
    next[index][field] = value;
    onUpdate(next);
  };

  const pickImage = (index: number) => {
    ImagePicker.openPicker({
      width: 800,
      height: 600,
      cropping: true,
      includeBase64: true
    }).then(image => {
      updateVehicle(index, 'image', `data:${image.mime};base64,${(image as any).data}`);
    }).catch(e => console.log(e));
  };

  const removeVehicle = (index: number) => {
    onUpdate(vehicles.filter((_, i) => i !== index));
  };

  return (
    <View className="mb-4 bg-gray-50/50 dark:bg-zinc-900/40 p-5 rounded-[28px] border border-gray-100 dark:border-zinc-800">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
            <Car size={16} color="#2563EB" />
          </View>
          <Text className="text-[14px] font-satoshi-bold text-gray-900 dark:text-zinc-50 tracking-tight">Vehicles</Text>
        </View>
        <TouchableOpacity
          onPress={addVehicle}
          className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center shadow-sm"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Plus size={18} color="white" />
        </TouchableOpacity>
      </View>

      {vehicles.map((v, i) => (
        <View key={i} className="mb-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-50 dark:border-zinc-800 shadow-sm relative">
          <View className="flex-row">
            {/* Image Picker */}
            <TouchableOpacity
              onPress={() => pickImage(i)}
              className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-xl items-center justify-center border border-gray-100 dark:border-zinc-700 overflow-hidden"
            >
              {v.image ? (
                <Image source={{ uri: v.image }} className="w-full h-full" />
              ) : (
                <View className="items-center">
                  <Camera size={20} color="#94A3B8" />
                  <Text className="text-[8px] text-gray-400 font-satoshi-bold mt-1">Car Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Inputs Column */}
            <View className="flex-1 ml-4 gap-y-2">
              <View className="flex-row bg-gray-50 dark:bg-zinc-800 rounded-xl px-2 items-center">
                <TextInput
                  value={v.vehicle_no}
                  onChangeText={(t) => updateVehicle(i, 'vehicle_no', t.toUpperCase())}
                  className="flex-1 font-satoshi-bold text-gray-900 dark:text-zinc-50 text-[13px] py-2"
                  placeholder="Plate Number"
                  placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#A1A1AA'}
                />
              </View>
              <View className="flex-row bg-gray-50 dark:bg-zinc-800 rounded-xl px-2 items-center">
                <TextInput
                  value={v.model}
                  onChangeText={(t) => updateVehicle(i, 'model', t)}
                  className="flex-1 font-satoshi-medium text-gray-600 dark:text-zinc-300 text-[11px] py-1.5"
                  placeholder="Make & Model (e.g. Civic)"
                  placeholderTextColor={colorScheme === 'dark' ? '#3F3F46' : '#D1D5DB'}
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1 flex-row bg-gray-50 dark:bg-zinc-800 rounded-xl px-2 items-center">
                  <TextInput
                    value={v.parking_slot}
                    onChangeText={(t) => updateVehicle(i, 'parking_slot', t.toUpperCase())}
                    className="flex-1 font-satoshi-bold text-blue-600 dark:text-blue-400 text-[11px] py-1.5"
                    placeholder="Parking Slot"
                    placeholderTextColor={colorScheme === 'dark' ? '#3F3F46' : '#94A3B8'}
                  />
                  <MapPin size={10} color="#3B82F6" />
                </View>
              </View>
            </View>
          </View>

          {/* Status Badges */}
          {v.approval_status && v.approval_status !== 'approved' && (
            <View className={`absolute top-2 right-6 px-2 py-0.5 rounded-md ${v.approval_status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
              <Text className={`text-[8px] font-satoshi-bold uppercase ${v.approval_status === 'pending' ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {v.approval_status}
              </Text>
            </View>
          )}

          {/* Remove Button */}
          <TouchableOpacity
            onPress={() => removeVehicle(i)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 items-center justify-center border-2 border-white dark:border-zinc-900"
          >
            <X size={12} color="white" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default VehicleManagement;
