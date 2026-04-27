import React, { useEffect, useState } from 'react';
import BootSplash from 'react-native-bootsplash';
import { ActivityIndicator, Text, TextInput, View, Appearance } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';

// --- Imports ---
import OnboardingScreens from './src/screens/onboarding/onboarding-screens/OnboardingScreens';

// Auth
import Login from './src/screens/auth/Login';
import SignUp from './src/screens/auth/SignUp';
import ForgotPassword from './src/screens/auth/ForgotPassword';
import ResetPassword from './src/screens/auth/ResetPassword';
import ApprovalPending from './src/screens/auth/ApprovalPending';

// Dashboards
import Dashboard from './src/features/admin/dashboard/screens/Dashboard';
import ResidentDashboard from './src/features/resident/dashboard/screens/Dashboard';
import ResidentProfile from './src/features/resident/profile/screens/ResidentProfile';
import GuardDashboard from './src/features/guard/dashboard/screens/Dashboard';
import GateAccess from './src/features/guard/dashboard/screens/GateAccess';
import GateOverride from './src/features/guard/dashboard/screens/GateOverride';
import GuestVerification from './src/features/guard/dashboard/screens/GuestVerification';

import NoticeBoard from './src/features/admin/notices/screens/NoticeBoard';
import ManageAnnouncements from './src/features/admin/notices/screens/ManageAnnouncements';
import AdminAlerts from './src/features/admin/screens/AdminAlerts';
import GateLogs from './src/features/resident/gatelogs/screens/GateLogs';
import ManageComplaints from './src/features/admin/screens/ManageComplaints';
import ManageStaff from './src/features/admin/screens/ManageStaff';
import DutyRoster from './src/features/admin/screens/DutyRoster';
import ManageUsers from './src/features/admin/screens/ManageUsers';
import AdminProfile from './src/features/admin/screens/AdminProfile';
import ReportDetails from './src/features/admin/screens/ReportDetails';
import Complaints from './src/features/resident/complaints/screens/Complaints';
import Visitors from './src/features/resident/visitors/screens/Visitors';
import Payments from './src/features/resident/payments/screens/Payments';
import TrackComplaint from './src/features/resident/complaints/screens/TrackComplaint';
import GuardEntry from './src/features/admin/guard/screens/GuardEntry';
import CommunityChat from './src/screens/community-chat/CommunityChat';
import VehicleRegistry from './src/features/admin/vehicles/screens/VehicleRegistry';
import AppSettings from './src/features/admin/screens/AppSettings';
import Legal from './src/features/admin/screens/Legal';
import Support from './src/features/admin/screens/Support';
import AdminPayments from './src/features/admin/screens/AdminPayments';
import Household from './src/features/resident/household/screens/Household';
import SearchVehicle from './src/features/admin/vehicles/screens/SearchVehicle';
import ResidentCategories from './src/features/resident/categories/screens/ResidentCategories';
import ResidentsInfo from './src/features/resident/categories/screens/ResidentsInfo';
import EmergencyContacts from './src/features/resident/categories/screens/EmergencyContacts';
import StaffDirectory from './src/features/resident/categories/screens/StaffDirectory';
import MyVehicles from './src/features/resident/vehicles/screens/MyVehicles';
import Amenities from './src/features/resident/amenities/screens/Amenities';
import SecurityIntercom from './src/features/resident/intercom/screens/SecurityIntercom';
import { navigationRef } from './src/navigation/NavigationService';

const Stack = createNativeStackNavigator();
const SESSION_KEY = '@sociosmart/session_v1';
const LEGACY_ADMIN_SESSION_KEY = '@sociosmart/admin_session_v1';

const App = () => {
  const [initialRouteName, setInitialRouteName] = useState<string | null>(null);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    const init = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('@sociosmart/app_settings_v1');
        if (savedSettings) {
          const parsedSett = JSON.parse(savedSettings);
          if (parsedSett.theme) {
            if (parsedSett.theme === 'System') {
              setColorScheme('system');
            } else {
              setColorScheme(parsedSett.theme === 'Dark' ? 'dark' : 'light');
            }
          } else {
            // Fallback for legacy settings
            if (parsedSett.darkMode !== undefined) {
              setColorScheme(parsedSett.darkMode ? 'dark' : 'light');
            } else {
              setColorScheme('system');
            }
          }
        } else {
          setColorScheme('system');
        }

        const raw = await AsyncStorage.getItem(SESSION_KEY);
        const legacyRaw = raw ? null : await AsyncStorage.getItem(LEGACY_ADMIN_SESSION_KEY);
        const storageValue = raw ?? legacyRaw;

        if (!storageValue) {
          setInitialRouteName('Onboarding');
          return;
        }

        const parsed = JSON.parse(storageValue);
        const expiresAt = typeof parsed?.expiresAt === 'number' ? parsed.expiresAt : 0;
        const token = typeof parsed?.token === 'string' ? parsed.token : '';

        if (!token || !expiresAt || expiresAt <= Date.now()) {
          await AsyncStorage.multiRemove([SESSION_KEY, LEGACY_ADMIN_SESSION_KEY]);
          setInitialRouteName('Onboarding');
          return;
        }

        const role = parsed.role;
        const status = parsed.status;

        if (role === 'resident' && status === 'pending') {
          setInitialRouteName('ApprovalPending');
        } else if (role === 'resident') {
          setInitialRouteName('ResidentDashboard');
        } else if (role === 'guard') {
          setInitialRouteName('GuardDashboard');
        } else {
          setInitialRouteName('Dashboard');
        }
      } catch {
        setInitialRouteName('Onboarding');
      }
    };

    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      AsyncStorage.getItem('@sociosmart/app_settings_v1').then(raw => {
        if (raw) {
          const settings = JSON.parse(raw);
          // Only sync if user is in System mode or hasn't set an override
          if (settings.theme === 'System' || (!settings.theme && settings.darkMode === undefined)) {
             setColorScheme(newColorScheme === 'dark' ? 'dark' : 'light');
          }
        } else {
          setColorScheme(newColorScheme === 'dark' ? 'dark' : 'light');
        }
      });
    });

    init().finally(async () => {
      await BootSplash.hide({ fade: true });
    });

    return () => subscription.remove();
  }, [setColorScheme]);

  if (!initialRouteName) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const linking = {
    prefixes: ['sociosmart://'],
    config: {
      screens: {
        ResetPassword: 'reset-password/:token',
      },
    },
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreens} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
        <Stack.Screen name="ApprovalPending" component={ApprovalPending} />

        {/* Admin Features */}
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="ManageUsers" component={ManageUsers} />
        <Stack.Screen name="ManageStaff" component={ManageStaff} />
        <Stack.Screen name="DutyRoster" component={DutyRoster} />
        <Stack.Screen name="AdminProfile" component={AdminProfile} />
        <Stack.Screen name="AdminAlerts" component={AdminAlerts} />
        <Stack.Screen name="NoticeBoard" component={NoticeBoard} />
        <Stack.Screen name="ManageAnnouncements" component={ManageAnnouncements} />
        <Stack.Screen name="GateLogs" component={GateLogs} />
        <Stack.Screen name="ManageComplaints" component={ManageComplaints} />
        <Stack.Screen name="ReportDetails" component={ReportDetails} />
        <Stack.Screen name="VehicleRegistry" component={VehicleRegistry} />
        <Stack.Screen name="AppSettings" component={AppSettings} />
        <Stack.Screen name="Legal" component={Legal} />
        <Stack.Screen name="Support" component={Support} />
        <Stack.Screen name="AdminPayments" component={AdminPayments} />
        <Stack.Screen name="Household" component={Household} />
        <Stack.Screen name="SearchVehicle" component={SearchVehicle} />

        {/* Resident Features */}
        <Stack.Screen name="ResidentDashboard" component={ResidentDashboard} />
        <Stack.Screen name="ResidentProfile" component={ResidentProfile} />
        <Stack.Screen name="Complaints" component={Complaints} />
        <Stack.Screen name="Visitors" component={Visitors} />
        <Stack.Screen name="Payments" component={Payments} />
        <Stack.Screen name="TrackComplaint" component={TrackComplaint} />
        <Stack.Screen name="ResidentCategories" component={ResidentCategories} />
        <Stack.Screen name="ResidentsInfo" component={ResidentsInfo} />
        <Stack.Screen name="MyVehicles" component={MyVehicles} />
        <Stack.Screen name="Amenities" component={Amenities} />
        <Stack.Screen name="SecurityIntercom" component={SecurityIntercom} />
        <Stack.Screen name="EmergencyContacts" component={EmergencyContacts} />
        <Stack.Screen name="StaffDirectory" component={StaffDirectory} />
        {/* Guard Features */}
        <Stack.Screen name="GuardDashboard" component={GuardDashboard} />
        <Stack.Screen name="GuardEntry" component={GuardEntry} />
        <Stack.Screen name="GateAccess" component={GateAccess} />
        <Stack.Screen name="GateOverride" component={GateOverride} />
        <Stack.Screen name="GuestVerification" component={GuestVerification} />

        {/* Shared */}
        <Stack.Screen name="CommunityChat" component={CommunityChat} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
