import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, StatusBar, StyleSheet, Modal, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { getApiBaseUrl, default as api } from '../../../../utils/apiConfig';
import {
  PlusCircle,
  MessageSquareWarning,
  Car,
  LayoutGrid,
  CreditCard,
  Building,
  Siren,
  Phone,
  Users,
  Wrench,
} from 'lucide-react-native';
import BottomTab from '../../../../components/bottom-tab/BottomTab';

const PRIMARY_COLOR = '#2563EB';

const GridItem = ({ label, icon: Icon, color, onPress }: any) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="w-[30%] items-center mb-8"
    >
      <View className="w-[72px] h-[72px] bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 items-center justify-center shadow-sm">
        <Icon size={28} color={color} strokeWidth={2} />
      </View>
      <Text
        className="text-gray-900 dark:text-zinc-50 text-[11px] font-satoshi-bold text-center mt-2.5 leading-tight tracking-tight px-1"
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

const AnnouncementCard = ({ item }: any) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <View
      style={{ width: 300 }}
      className="mr-4 bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-100 dark:border-zinc-800 shadow-sm self-start"
    >
      <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-[16px] mb-1 leading-tight" numberOfLines={2}>
        {item.title}
      </Text>
      <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-[10px] uppercase tracking-widest mb-4">
        {formatDate(item.createdAt)}
      </Text>

      <Text
        className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-[13px] leading-relaxed"
        numberOfLines={isExpanded ? undefined : 2}
      >
        {item.content}
      </Text>

      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={{ width: '100%', height: 140, borderRadius: 8, marginTop: 12, marginBottom: isExpanded ? 0 : 4 }}
          resizeMode="cover"
        />
      ) : null}

      {item.content.length > 50 && (
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          className="mt-2 pt-2 border-t border-gray-50 dark:border-zinc-800/50"
        >
          <Text className="text-blue-600 font-satoshi-black text-xs tracking-[1px]">
            {isExpanded ? 'Show Less' : 'Read More'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const StatusCard = ({ title, onDuty, total, bgGradient }: any) => {
  return (
    <View className="w-[48%] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800">
      <View style={{ backgroundColor: bgGradient }} className="px-5 py-2.5">
        <Text className="text-white font-satoshi-bold text-[11px] uppercase tracking-widest">{title}</Text>
      </View>
      <View className="p-5 flex-row justify-between items-end">
        <View>
          <View className="flex-row items-center mb-1">
            <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-xl">{onDuty}</Text>
          </View>
          <Text className="text-gray-400 text-[10px] font-satoshi-medium uppercase tracking-tighter">On Duty</Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-xl">{total}</Text>
          <Text className="text-gray-400 text-[10px] font-satoshi-medium uppercase tracking-tighter">Total</Text>
        </View>
      </View>
    </View>
  );
};

const ResidentCategories = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          api.get('/api/announcements'),
          api.get('/api/staff/stats')
        ]);
        setAnnouncements(aRes.data);
        setStats(sRes.data);
      } catch (e) {
        console.log("Fetch data error:", e);
      }
    };
    fetchData();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA] dark:bg-zinc-950" edges={['top']}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8F9FA"} />

      {/* Header */}
      <View className="flex-row items-center px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <View className="w-10 h-10 items-center justify-center mr-4">
          <LayoutGrid size={22} color={PRIMARY_COLOR} strokeWidth={2.5} />
        </View>
        <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Community Actions</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="px-5 mt-2 mb-8">
          <View className="flex-row justify-between">
            <StatusCard
              title="Guards"
              onDuty={stats?.guards?.onDuty ?? '--'}
              total={stats?.guards?.total ?? '--'}
              bgGradient="#2563EB"
            />
            <StatusCard
              title="Staff"
              onDuty={stats?.serviceStaff?.onDuty ?? '--'}
              total={stats?.serviceStaff?.total ?? '--'}
              bgGradient="#2563EB"
            />
          </View>
        </View>

        {/* 2. Community Actions Grid ... */}
        <View className="px-1">
          <View className="flex-row flex-wrap justify-evenly">
            <GridItem
              label="Raise Complaint"
              icon={MessageSquareWarning}
              color="#2563EB"
              onPress={() => navigation.navigate('Complaints')}
            />
            <GridItem
              label="Payments"
              icon={CreditCard}
              color="#2563EB"
              onPress={() => navigation.navigate('Payments')}
            />
            <GridItem
              label="Amenities"
              icon={Building}
              color="#2563EB"
              onPress={() => navigation.navigate('Amenities')}
            />
            <GridItem
              label="My Vehicles"
              icon={Car}
              color="#2563EB"
              onPress={() => navigation.navigate('MyVehicles')}
            />

            <GridItem
              label="Pre-Approve"
              icon={PlusCircle}
              color="#2563EB"
              onPress={() => navigation.navigate('Visitors')}
            />
            <GridItem
              label="Call Security"
              icon={Phone}
              color="#2563EB"
              onPress={() => navigation.navigate('SecurityIntercom')}
            />
            <GridItem
              label="Staff Direct."
              icon={Wrench}
              color="#2563EB"
              onPress={() => navigation.navigate('StaffDirectory')}
            />
            <GridItem
              label="Residents"
              icon={Users}
              color="#2563EB"
              onPress={() => navigation.navigate('ResidentsInfo')}
            />
            <GridItem
              label="Emergency No's"
              icon={Siren}
              color="#2563EB"
              onPress={() => navigation.navigate('EmergencyContacts')}
            />
          </View>
        </View>

        {/* 3. Horizontal Announcements */}
        {announcements.length > 0 && (
          <View className="mt-2">
            <View className="flex-row justify-between items-center px-5 mb-5">
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-2xl">Announcements</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 12 }}
            >
              {announcements.map((n) => (
                <AnnouncementCard
                  key={n._id}
                  item={n}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <BottomTab activeTab="services" navigation={navigation} />
    </SafeAreaView>
  );
};

export default ResidentCategories;
