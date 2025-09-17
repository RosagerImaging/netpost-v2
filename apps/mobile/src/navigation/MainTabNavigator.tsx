import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/types/navigation';
import SourcingNavigator from './SourcingNavigator';
import InventoryScreen from '@/screens/InventoryScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple icon components using text
const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => {
  const getIcon = () => {
    switch (label) {
      case 'Sourcing': return '📱';
      case 'Inventory': return '📦';
      case 'Profile': return '👤';
      default: return '●';
    }
  };

  return (
    <Text style={{
      fontSize: 20,
      opacity: focused ? 1 : 0.6,
    }}>
      {getIcon()}
    </Text>
  );
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tab.Screen
        name="Sourcing"
        component={SourcingNavigator}
        options={{
          tabBarLabel: 'Sourcing',
          tabBarIcon: ({ focused }) => <TabIcon label="Sourcing" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ focused }) => <TabIcon label="Inventory" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}