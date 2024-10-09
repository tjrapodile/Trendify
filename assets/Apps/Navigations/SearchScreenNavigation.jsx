import { View, Text } from 'react-native';
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SearchScreen from '../Screens/Search/SearchScreen'; // Adjust the import path
import PlayVideoList from '../Screens/HomeScreen/PlayVideoList'; // Adjust the import path

export default function SearchScreenNavigation() {
  const Stack = createStackNavigator();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="search" component={SearchScreen} />
      <Stack.Screen name="play-video" component={PlayVideoList} />
    </Stack.Navigator>
  );
}
