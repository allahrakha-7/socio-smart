import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { X, Plus, PawPrint } from 'lucide-react-native';

interface PetManagementProps {
  pets: any[];
  onUpdate: (next: any[]) => void;
  colorScheme: 'light' | 'dark' | undefined;
}

const PetManagement: React.FC<PetManagementProps> = ({ pets, onUpdate, colorScheme }) => {
  const addPet = () => {
    onUpdate([...pets, { name: '', type: '' }]);
  };

  const updatePet = (index: number, field: string, value: string) => {
    const next = [...pets];
    next[index][field] = value;
    onUpdate(next);
  };

  const removePet = (index: number) => {
    onUpdate(pets.filter((_, i) => i !== index));
  };

  return (
    <View className="mb-4 bg-gray-50/50 dark:bg-zinc-900/40 p-5 rounded-[28px] border border-gray-100 dark:border-zinc-800">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
            <PawPrint size={16} color="#2563EB" />
          </View>
          <Text className="text-[14px] font-satoshi-bold text-gray-900 dark:text-zinc-50 tracking-tight">Society Pets</Text>
        </View>
        <TouchableOpacity
          onPress={addPet}
          className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center shadow-sm"
        >
          <Plus size={18} color="white" />
        </TouchableOpacity>
      </View>

      {pets.map((p, i) => (
        <View key={i} className="flex-row items-center gap-x-2 mb-3 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-gray-50 dark:border-zinc-800 shadow-sm">
          <View className="flex-1">
            <TextInput
              value={p.name}
              onChangeText={(t) => updatePet(i, 'name', t)}
              className="font-satoshi-bold text-gray-900 dark:text-zinc-50 text-[13px] px-2 py-1"
              placeholder="Pet Name"
              placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#A1A1AA'}
            />
            <TextInput
              value={p.type}
              onChangeText={(t) => updatePet(i, 'type', t)}
              className="font-satoshi-medium text-gray-400 dark:text-zinc-500 text-[11px] px-2 py-0.5"
              placeholder="Breed / Type (e.g. Husky)"
              placeholderTextColor={colorScheme === 'dark' ? '#3F3F46' : '#D1D5DB'}
            />
          </View>
          <TouchableOpacity
            onPress={() => removePet(i)}
            className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 items-center justify-center"
          >
            <X size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default PetManagement;
