import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building,
  Wrench
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

const PRIMARY_COLOR = '#2563EB';

const Support = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [showFAQs, setShowFAQs] = React.useState(false);

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />

      {/* Header */}
      <View className="flex-row items-center px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center mr-4"
        >
          <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
        </TouchableOpacity>
        <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Support Portal</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View className="mx-6 mt-4">

          {/* Maintenance Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-3 px-1">
              <Wrench size={16} color={PRIMARY_COLOR} />
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-sm uppercase tracking-widest ml-2">Maintenance Guide</Text>
            </View>
            <View className="w-full bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <Text className="text-gray-600 dark:text-zinc-400 font-satoshi-medium text-[13px] leading-6">
                Monthly dues cover common area lighting, elevator maintenance, waste collection, and general plumbing in hallways. Private apartment repairs are the resident's responsibility, although verified contractors can be requested via the Admin office.
              </Text>
            </View>
          </View>

          {/* Security Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-3 px-1">
              <ShieldCheck size={16} color={PRIMARY_COLOR} />
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-sm uppercase tracking-widest ml-2">Security Protocols</Text>
            </View>
            <View className="w-full bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <Text className="text-gray-600 dark:text-zinc-400 font-satoshi-medium text-[13px] leading-6">
                All visitors must be pre-authorized via the app or registered at the main gate. Delivery personnel are restricted to the lobby unless confirmed. Please report suspicious activity immediately using the Emergency SOS button.
              </Text>
            </View>
          </View>

          {/* FAQ Accordion */}
          <TouchableOpacity
            onPress={() => setShowFAQs(!showFAQs)}
            activeOpacity={0.8}
            className="flex-row items-center bg-white dark:bg-zinc-900 px-5 py-4 rounded-lg border border-gray-100 dark:border-zinc-800 shadow-sm"
          >
            <ExternalLink size={18} color={PRIMARY_COLOR} />
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-sm flex-1 ml-3">Frequently Asked Questions</Text>
            <ChevronRight size={18} color={colorScheme === 'dark' ? '#3F3F46' : "#CBD5E1"} style={{ transform: [{ rotate: showFAQs ? '90deg' : '0deg' }] }} />
          </TouchableOpacity>

          {showFAQs && (
            <View className="w-full mt-4 bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
              {[
                { q: "How do I pre-approve a visitor?", a: "Navigate to 'Visitor Management' on the home dashboard, tap 'Pre-Approve' and generate an entry code for your guest." },
                { q: "When are payments verified?", a: "Admins verify manual payments within 24 hours of receipt submission. Ensure you provide a clear Receipt ID." },
                { q: "How to book society amenities?", a: "Visit the 'Amenities' section, pick your facility and pick an available time slot." }
              ].map((faq, idx) => (
                <View key={idx} className={idx !== 0 ? "mt-6 pt-6 border-t border-gray-50 dark:border-zinc-800" : ""}>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm mb-2">{faq.q}</Text>
                  <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-xs leading-5">{faq.a}</Text>
                </View>
              ))}
            </View>
          )}

          <Text className="text-gray-300 dark:text-zinc-800 font-satoshi-bold text-[9px] text-center mt-12 uppercase tracking-widest">
            SocioSmart Community Support
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Support;
