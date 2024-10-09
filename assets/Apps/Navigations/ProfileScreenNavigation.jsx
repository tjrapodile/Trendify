import { View, Text } from 'react-native';
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PlayVideoList from '../Screens/HomeScreen/PlayVideoList'; // Adjust the import path
import ProfileScreen from '../Screens/Profile/ProfileScreen';

export default function SearchScreenNavigation() {
  const Stack = createStackNavigator();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile" component={ProfileScreen} />
      <Stack.Screen name="play-video" component={PlayVideoList} />
    </Stack.Navigator>
  );
}
