import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SourcingStackParamList } from '@/types/navigation';
import SourcingListScreen from '@/screens/SourcingListScreen';
import CameraScreen from '@/screens/CameraScreen';
import ItemFormScreen from '@/screens/ItemFormScreen';

const Stack = createStackNavigator<SourcingStackParamList>();

export default function SourcingNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SourcingList"
        component={SourcingListScreen}
        options={{ title: 'Sourcing' }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ title: 'Capture Photo' }}
      />
      <Stack.Screen
        name="ItemForm"
        component={ItemFormScreen}
        options={{ title: 'Add Item' }}
      />
    </Stack.Navigator>
  );
}