import React, { useMemo, useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, StyleSheet, Alert as RNAlert, ActivityIndicator, Text, TextInput, StatusBar, Platform, NativeModules, Image, PermissionsAndroid, Linking } from 'react-native';
import CropPicker from 'react-native-image-crop-picker';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiBaseUrl } from '../../../../utils/apiConfig';
import { ArrowLeft, Plus, X, Wrench, CheckCircle, Clock, Activity } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ComplaintStatus = 'pending' | 'in-progress' | 'resolved';

type Complaint = {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  isUrgent: boolean;
  requestLevel?: 'Unit Level' | 'Community Level';
  image?: string;
  createdAt: string;
};

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';


const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const StatusPill = ({ status }: { status: ComplaintStatus }) => {
  const { colorScheme } = useColorScheme();
  const isResolved = status === 'resolved';
  const isProgress = status === 'in-progress';

  const bg = isResolved ? 'bg-green-100 dark:bg-green-900/30' : isProgress ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30';
  const color = isResolved ? (colorScheme === 'dark' ? '#4ADE80' : '#16A34A') : isProgress ? (colorScheme === 'dark' ? '#60A5FA' : PRIMARY_COLOR) : (colorScheme === 'dark' ? '#FB923C' : '#EA580C');
  const label = status.toUpperCase();

  return (
    <View className={`flex-row items-center px-2.5 py-1 rounded-full ${bg}`}>
      {isResolved ? (
        <CheckCircle size={12} color={color} />
      ) : isProgress ? (
        <Activity size={12} color={color} />
      ) : (
        <Clock size={12} color={color} />
      )}
      <Text className="text-[10px] font-satoshi-bold ml-1 uppercase" style={{ color }}>
        {label}
      </Text>
    </View>
  );
};

const Complaints = ({ navigation, route }: any) => {
  const { colorScheme } = useColorScheme();
  const prefillAmenity = route?.params?.amenityName;
  const prefillAmenityId = route?.params?.amenityId;

  const [activeFilter, setActiveFilter] = useState<'all' | ComplaintStatus>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState(prefillAmenity ? `Issue with ${prefillAmenity}` : '');
  const [category, setCategory] = useState(prefillAmenity ? 'Maintenance' : '');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [targetAmenity, setTargetAmenity] = useState(prefillAmenityId || null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    if (prefillAmenity) {
      setIsModalVisible(true);
    }
    fetchComplaints();
  }, [prefillAmenity]);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/api/complaints/my`, {
        headers: { Authorization: `Bearer ${parsed.token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setComplaints(Array.isArray(data) ? data : []);
      } else {
        console.error("Fetch Complaints Error:", data.message);
        setComplaints([]);
      }
    } catch (error) {
      console.error("Fetch Complaints Network Error:", error);
      setComplaints([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    if (activeFilter === 'all') return complaints;
    return complaints.filter((c) => c.status === activeFilter);
  }, [activeFilter, complaints]);

  const [requestLevel, setRequestLevel] = useState<'Unit Level' | 'Community Level'>('Unit Level');

  const COMPLAINT_CATEGORIES = ['Water', 'Electricity', 'Security', 'Internet', 'Plumbing', 'Cleaner', 'Lift', 'Parking', 'Other'];

  const [image, setImage] = useState<string | null>(null);

  const openCreate = () => {
    setTitle('');
    setCategory('');
    setDescription('');
    setIsUrgent(false);
    setRequestLevel('Unit Level');
    setImage(null);
    setIsModalVisible(true);
  };

  const pickImage = () => {
    RNAlert.alert("Attachment", "Provide visual evidence for your complaint", [
      {
        text: "Library",
        onPress: () => {
          CropPicker.openPicker({ width: 800, height: 800, cropping: true, includeBase64: true })
            .then((img: any) => setImage(`data:${img.mime};base64,${img.data}`))
            .catch(err => {
              if (err.message.toLocaleLowerCase().includes("permission")) {
                RNAlert.alert("Permission", "Please enable storage permissions in settings.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Open Settings", onPress: () => Linking.openSettings() }
                ]);
              }
            });
        }
      },
      {
        text: "Camera",
        onPress: async () => {
          if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.CAMERA,
              {
                title: "SocioSmart Camera Permission",
                message: "SocioSmart needs camera access to help you attach visual proof.",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK"
              }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              RNAlert.alert("Permission", "Please enable camera permissions in settings.", [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() }
              ]);
              return;
            }
          }
          CropPicker.openCamera({ width: 800, height: 800, cropping: true, includeBase64: true })
            .then((img: any) => setImage(`data:${img.mime};base64,${img.data}`))
            .catch(err => {
              RNAlert.alert("Permission", "Please enable camera permissions in settings.", [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() }
              ]);
            });
        }
      },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalVisible(false);
  };

  const handleSubmit = async () => {
    const d = description.trim();
    const c = category.trim();

    if (!c || !d) {
      RNAlert.alert('Missing Fields', 'Please select a category and provide a description.');
      return;
    }

    setIsSaving(true);
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsed.token}`
        },
        // We use category as title if title is empty for brevity in the list
        body: JSON.stringify({
          title: title || c,
          category: c,
          description: d,
          isUrgent,
          requestLevel,
          image,
          amenity: targetAmenity
        })
      });

      if (response.ok) {
        const newComplaint = await response.json();
        setComplaints(prev => [newComplaint, ...prev]);
        setIsModalVisible(false);
        RNAlert.alert("Success", "Complaint submitted successfully.");
      } else {
        const err = await response.json();
        RNAlert.alert("Error", err.message || "Failed to submit complaint.");
      }
    } catch (error) {
      RNAlert.alert("Error", "Unable to connect to server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          className="w-11 h-11 items-center justify-center"
        >
          <ArrowLeft size={22} color={colorScheme === 'dark' ? '#F4F4F5' : "#111827"} />
        </TouchableOpacity>
        <Text className="text-[22px] font-satoshi-bold text-gray-900 dark:text-zinc-50 tracking-tight">Complaints</Text>
        <TouchableOpacity
          onPress={openCreate}
          activeOpacity={0.85}
          className="w-11 h-11 items-center justify-center bg-blue-600 rounded-full shadow-lg shadow-blue-500/40"
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="px-5 mb-4">
        <View className="flex-row bg-white dark:bg-zinc-900 rounded-[24px] p-1.5 border border-gray-100 dark:border-zinc-800 shadow-sm">
          {(['all', 'pending', 'in-progress', 'resolved'] as const).map((key) => {
            const isActive = activeFilter === key;
            const label = key === 'all' ? 'All' : key === 'in-progress' ? 'Active' : key.charAt(0).toUpperCase() + key.slice(1);
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.85}
                onPress={() => setActiveFilter(key)}
                className={`flex-1 py-3 rounded-full items-center ${isActive ? 'bg-blue-600' : ''}`}
              >
                <Text className={`text-[10px] font-satoshi-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-400 dark:text-zinc-500'}`}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View className="px-5 pt-4">
            {filteredComplaints.map((item) => (
              <TouchableOpacity
                key={item._id}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('TrackComplaint', {
                  complaint: {
                    id: `#${item._id.slice(-6).toUpperCase()}`,
                    title: item.title,
                    category: item.category,
                    description: item.description,
                    status: item.status,
                    raisedOn: new Date(item.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }),
                    raisedAt: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    raisedBy: 'You', // In a real app, this would be the session user name
                    steps: [
                      { id: 1, title: 'You Raised a Complaint', subtitle: `${new Date(item.createdAt).toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, completed: true },
                      { id: 2, title: 'Notified to Manager', subtitle: item.status !== 'pending' ? 'Notification Sent' : 'Processing...', completed: item.status !== 'pending' },
                      { id: 3, title: 'Addressed to respective team', subtitle: item.status === 'in-progress' || item.status === 'resolved' ? 'Assigned and Active' : 'Awaiting Assignment', completed: item.status === 'in-progress' || item.status === 'resolved' },
                      { id: 4, title: 'Resolved', subtitle: item.status === 'resolved' ? 'Issue Fixed' : 'Pending Completion', completed: item.status === 'resolved' },
                    ]
                  }
                })}
                className="bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 p-6 mb-5 shadow-sm"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className={`w-12 h-12 items-center justify-center ${item.isUrgent ? 'text-red-500' : 'text-blue-500'}`}>
                      <Wrench size={22} color={item.isUrgent ? '#EF4444' : '#2563EB'} />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base leading-tight">
                        {item.title}
                      </Text>
                      <View className="flex-row items-center mt-1.5">
                        <Text className="text-gray-400 dark:text-zinc-500 text-[9px] font-satoshi-bold uppercase tracking-widest">{item.category}</Text>
                        <View className="w-1 h-1 rounded-full bg-gray-200 dark:bg-zinc-800 mx-2" />
                        <Text className="text-blue-500 dark:text-blue-400 text-[9px] font-satoshi-bold uppercase tracking-widest">{item.requestLevel || 'Unit Level'}</Text>
                      </View>
                    </View>
                  </View>
                  <StatusPill status={item.status} />
                </View>

                {item.description ? (
                  <Text className="text-gray-500 dark:text-zinc-400 text-xs font-satoshi-medium mt-4 leading-relaxed line-clamp-2">
                    {item.description}
                  </Text>
                ) : null}

                <View className="mt-5 pt-4 border-t border-gray-50 dark:border-zinc-800 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Clock size={10} color="#94A3B8" />
                    <Text className="text-gray-400 dark:text-zinc-500 text-[9px] font-satoshi-bold ml-1.5 uppercase tracking-tighter">{formatDate(item.createdAt)}</Text>
                  </View>
                  <View className="bg-gray-50 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                    <Text className="text-gray-400 dark:text-zinc-500 text-[8px] font-satoshi-black uppercase tracking-widest">#{item._id.slice(-6).toUpperCase()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {filteredComplaints.length === 0 && (
              <View className="items-center justify-center mt-20 opacity-40">
                <Wrench size={60} color="#94A3B8" strokeWidth={1} />
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-lg mt-4">All Clear</Text>
                <Text className="text-gray-500 text-xs font-satoshi-medium mt-2 text-center px-10">
                  No active complaints found. Use the plus button above to submit a ticket.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* MODAL: RAISE A COMPLAINT - HIGH FIDELITY */}
      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View className="bg-white dark:bg-zinc-950 rounded-t-[44px] p-8 pb-12 shadow-2xl">
            <View className="flex-row items-center justify-between mb-8">
              <View>
                <Text className="text-[26px] font-satoshi-black text-gray-900 dark:text-zinc-50">Raise a complaint</Text>
                <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium mt-1">Submit a formal society grievance</Text>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                className="w-12 h-12 rounded-full items-center justify-center bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
              >
                <X size={20} color={colorScheme === 'dark' ? '#F4F4F5' : "#111827"} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[80%]">
              <View className="space-y-6">
                {/* 1. Category Selector */}
                <View>
                  <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest ml-1 mb-2">Complaint Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-1">
                    {COMPLAINT_CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategory(cat)}
                        className={`mr-2 px-5 py-3 rounded-2xl border ${category === cat ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'}`}
                      >
                        <Text className={`text-[11px] font-satoshi-bold ${category === cat ? 'text-white' : 'text-gray-500 dark:text-zinc-400'}`}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* 2. Urgency Toggle */}
                <TouchableOpacity
                  onPress={() => setIsUrgent(!isUrgent)}
                  activeOpacity={0.8}
                  className="flex-row items-center mt-2 group"
                >
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${isUrgent ? 'border-blue-600 bg-blue-600' : 'border-gray-200 dark:border-zinc-800'}`}>
                    {isUrgent && <View className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </View>
                  <Text className={`font-satoshi-bold text-sm ${isUrgent ? 'text-blue-600' : 'text-gray-500 dark:text-zinc-500'}`}>Is it Urgent?</Text>
                </TouchableOpacity>

                {/* 3. Request Level Selection */}
                <View className="mt-4">
                  <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest ml-1 mb-3">Request Level</Text>
                  <View className="flex-row gap-x-6">
                    {(['Unit Level', 'Community Level'] as const).map(lvl => (
                      <TouchableOpacity
                        key={lvl}
                        onPress={() => setRequestLevel(lvl)}
                        className="flex-row items-center"
                      >
                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${requestLevel === lvl ? 'border-blue-600' : 'border-gray-200 dark:border-zinc-800'}`}>
                          {requestLevel === lvl && <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                        </View>
                        <Text className={`font-satoshi-bold text-sm ${requestLevel === lvl ? 'text-gray-900 dark:text-zinc-50' : 'text-gray-400'}`}>{lvl}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 4. Description */}
                <View className="mt-4">
                  <View className="flex-row justify-between items-center mb-2 px-1">
                    <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest">Description</Text>
                    <Text className="text-[10px] font-satoshi-medium text-gray-300">1000 characters</Text>
                  </View>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    maxLength={1000}
                    textAlignVertical="top"
                    placeholder="Provide details about the issue..."
                    placeholderTextColor={colorScheme === 'dark' ? '#3F3F46' : "#D1D5DB"}
                    className="bg-gray-50 dark:bg-zinc-900/40 p-5 rounded-[28px] border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium h-36"
                  />
                </View>

                {/* 5. Photo Attachment UI */}
                <View className="mt-2">
                  <View className="flex-row items-center justify-between ml-1 mb-2">
                    <Text className="text-[10px] font-satoshi-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest">Visual Evidence</Text>
                    {image && (
                      <TouchableOpacity onPress={() => setImage(null)}>
                        <Text className="text-red-500 font-satoshi-bold text-[10px] uppercase tracking-tighter">Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={pickImage}
                    activeOpacity={0.7}
                    className="w-full h-40 rounded-[28px] border-2 border-dashed border-gray-100 dark:border-zinc-800 items-center justify-center bg-gray-50/50 dark:bg-zinc-900/20 overflow-hidden"
                  >
                    {image ? (
                      <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <>
                        <View className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 items-center justify-center shadow-sm mb-2">
                          <Plus size={20} color={PRIMARY_COLOR} />
                        </View>
                        <Text className="text-gray-400 font-satoshi-bold text-[11px] uppercase tracking-widest">Attach Photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSaving}
                activeOpacity={0.85}
                className="mt-10 bg-blue-600 rounded-[28px] h-16 items-center justify-center shadow-xl shadow-blue-500/40"
              >
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-satoshi-black text-lg tracking-widest uppercase">Submit Complaint</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    justifyContent: 'flex-end',
  },
});

export default Complaints;
