import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ScanScreen from '../screens/ScanScreen';
import RiwayatScreen from '../screens/RiwayatScreen';
import RiwayatDetailScreen from '../screens/RiwayatDetailScreen';
import ProfileScreen from '../screens/ProfilScreen';

// Katalog & Detail Screens
import KatalogScreen from '../screens/KatalogScreen';
import DetailScreen from '../screens/DetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const RiwayatStack = createStackNavigator();

const RiwayatStackScreen = () => (
  <RiwayatStack.Navigator screenOptions={{ headerShown: false }}>
    <RiwayatStack.Screen name="RiwayatHome" component={RiwayatScreen} />
    <RiwayatStack.Screen name="RiwayatDetailScreen" component={RiwayatDetailScreen} />
  </RiwayatStack.Navigator>
);

const MainTabs = ({ route }) => {
  const role = route.params?.role;
  const isLecturer = role === 'lecturer';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FFB800',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#FFF',
          height: 65,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: '#EEE',
          elevation: 10,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Home: focused ? 'view-dashboard' : 'view-dashboard-outline',
            Chat: focused ? 'robot-happy' : 'robot-happy-outline',
            Scan: focused ? 'barcode-scan' : 'camera-iris',
            Riwayat: focused ? 'clipboard-text-clock' : 'clipboard-text-clock-outline',
            Profil: focused ? 'account-hard-hat' : 'account-hard-hat-outline',
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name]}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />

      {/* Tab Riwayat hanya muncul untuk lecturer */}
      {isLecturer && (
        <Tab.Screen name="Riwayat" component={RiwayatStackScreen} />
      )}

      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* AUTH */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

      {/* MAIN — kirim role lewat params */}
      <Stack.Screen name="Main" component={MainTabs} />

      {/* SUB-PAGES */}
      <Stack.Screen name="Katalog" component={KatalogScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
}