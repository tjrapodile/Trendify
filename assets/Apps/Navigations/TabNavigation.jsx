import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'
import { Image, TouchableOpacity, Alert } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Colors from '../Utils/Colors'
import AddScreenNavigation from './AddScreenNavigation';
import HomeScreenNavigation from './HomeScreenNavigation';
import SearchScreenNavigation from './SearchScreenNavigation';
import ProfileScreenNavigation from './ProfileScreenNavigation';
import Toast from 'react-native-toast-message';
import { useAuth } from '@clerk/clerk-expo';

export default function TabNavigation() {
    const Tab = createBottomTabNavigator();
    const { signOut } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "OK",
                    onPress: async () => {
                        try {
                            await signOut();
                            Toast.show({
                                type: 'success',
                                text1: 'Logged out successfully',
                            });
                        } catch (err) {
                            console.error("Error signing out:", err);
                            Toast.show({
                                type: 'error',
                                text1: 'Failed to logout',
                                text2: 'Please try again',
                            });
                        }
                    }
                }
            ]
        );
    };

    const LogoutButton = () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 10 }}>
            <FontAwesome name="sign-out" size={24} color={Colors.BLACK} />
        </TouchableOpacity>
    );

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: Colors.BLACK,
                headerLeft: () => (
                    <Image
                        source={require('./trendify-logo.png')}  // Make sure to add your logo image
                        style={{ width: 30, height: 30, marginLeft: 10 }}
                    />
                ),
                headerTitleStyle: {
                    fontFamily: 'Poppins-ExtraBold'
                },
                headerRight: () => (
                    route.name === 'Profile' ? <LogoutButton /> : null
                ),
            })}
        >
            <Tab.Screen 
                name="Home" 
                component={HomeScreenNavigation}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="home-circle" size={size} color={color} />
                    ),
                    headerTitle: 'Trendify',
                }}
            />
            <Tab.Screen 
                name="Add" 
                component={AddScreenNavigation}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <FontAwesome6 name="add" size={size} color={color} />
                    ),
                    headerTitle: 'Add Video Clip',
                }}
            />
            <Tab.Screen 
                name="Search" 
                component={SearchScreenNavigation}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <FontAwesome name="search" size={size} color={color} />
                    ),
                    headerTitle: 'Search',
                }}
            />
            <Tab.Screen 
                name="Profile" 
                component={ProfileScreenNavigation}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <FontAwesome name="user" size={size} color={color} />
                    ),
                    headerTitle: 'View Profile',
                }}
            />
        </Tab.Navigator>
    )
}