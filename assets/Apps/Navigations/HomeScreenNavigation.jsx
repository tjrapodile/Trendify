import { View, Text } from 'react-native'
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import PlayVideoList from '../Screens/HomeScreen/PlayVideoList'
import HomeScreen from '../Screens/HomeScreen/HomeScreen'
import ProfileScreen from '../Screens/Profile/ProfileScreen'


export default function HomeScreenNavigation() {

  const Stack = createStackNavigator();
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name='home' component={HomeScreen} />
        <Stack.Screen name='play-video' component={PlayVideoList} />
        <Stack.Screen name='profile' component={ProfileScreen} />
    </Stack.Navigator>
  )
} 