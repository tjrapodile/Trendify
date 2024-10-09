import { View, Text, Image , TouchableOpacity, TextInput, Modal} from 'react-native'
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-expo';
import Colors from '../../Utils/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../Utils/SupabaseConfig.js';
import Toast from 'react-native-toast-message'; 
import { useNavigation } from '@react-navigation/native';

export default function ProfileIntro({videos, onRefresh}) {

const {user} = useUser();
const [totalLikes, setTotalLikes] = useState(0);
const [newUsername, setNewUsername] = useState(''); // State for new username
const [isEditingUsername, setIsEditingUsername] = useState(false);
const [profileData, setProfileData] = useState({ username: '', profileImage: '' });
const [currentUserId, setCurrentUserId] = useState(null);
const navigation = useNavigation();

useEffect(() => {
    console.log('Complete video email data:', videos?.[0]?.Users?.email);
    fetchProfileData();
    videos && calculateLikes();
},[videos])

const calculateLikes = () => {
    let likes = 0; // Initialize likes
    videos.forEach((element, index) => {
        console.log(`Element at index ${index}:`, element); // Log entire element for debugging
        const elementLikes = element.VideoLikes ? (Array.isArray(element.VideoLikes) ? element.VideoLikes.length : 0) : 0; // Ensure it’s an array or fallback to 0
        console.log(`Likes for video at index ${index}:`, elementLikes); // Log the likes count
        likes += elementLikes; // Accumulate likes
    });
    setTotalLikes(likes); // Set total likes after accumulating
    console.log("Total Likes:", likes); // Log the total likes
};

const pickImage = async () => {
  // Ask the user for the permission to access the camera roll
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permissionResult.granted === false) {
    alert('Permission to access camera roll is required!');
    return;
  }

  // Launch image picker
  let result = await ImagePicker.launchImageLibraryAsync();
  console.log('Image picker result:', result);
  if (!result.canceled) {
    // Upload the image to Supabase or handle it as needed
    await uploadProfileImage(result.assets[0].uri);
    fetchProfileData();
  }
};

const uploadProfileImage = async (uri) => {
  // Upload the image to your server or Supabase
  const { error } = await supabase
    .from('Users')
    .update({ profileImage: uri }) // Ensure your Users table has a `profileImage` field
    .eq('email', user?.emailAddresses[0]?.emailAddress); // Assuming `user.id` gives you the correct user ID

  if (error) {
    console.error('Error updating profile image:', error);
  } else {
    console.log('Profile image updated successfully!');
    Toast.show({ // Show toast on successful deletion
      type: 'success',
      text1: 'Profile Image Updated!',
      text2: 'Your profile image has been successfully updated.',
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
    });
    console.log(uri);
  }
};

const fetchProfileData = async () => {
  console.log("The videos object structure: ", videos)
  const loggedInUserEmail = user?.emailAddresses[0]?.emailAddress; // Get logged-in user email
  const profileEmail = videos.length > 0 ? videos[0]?.Users?.email : loggedInUserEmail;// Get the email of the profile being viewed

  if (!profileEmail) {
    console.error("Profile email is not defined.");
    return; // Return early if there's no profileEmail
  }

  console.log("Fetching profile for email: ", profileEmail);

  const { data, error } = await supabase
    .from('Users')
    .select('id, username, profileImage')
    .eq('email', profileEmail)
    .single(); // Fetch single user record

  if (error) {
    console.error('Error fetching profile data:', error);
  } else {
    setProfileData({
      username: data.username, 
      profileImage: data.profileImage,
    }); // Set the fetched profile data in state
    setCurrentUserId(data.id); 
  }

  if (profileEmail === loggedInUserEmail) {
    setCurrentUserId(user.id); // Set currentUserId to logged-in user ID
  }
};

const fetchLoggedInUserProfileData = async () => {
  const loggedInUserEmail = user?.emailAddresses[0]?.emailAddress;
  const { data, error } = await supabase
    .from('Users')
    .select('id, username, profileImage')
    .eq('email', loggedInUserEmail)
    .single();

  if (error) {
    console.error('Error fetching logged-in user profile data:', error);
  } else {
    setProfileData({
      username: data.username,
      profileImage: data.profileImage,
    });
    setCurrentUserId(data.id);
  }
};

const fetchLoggedInUserProfileDataAndPosts = async () => {
  const loggedInUserEmail = user?.emailAddresses[0]?.emailAddress;
  await fetchLoggedInUserProfileData();
  // Call the parent refresh function to get posts for logged-in user
  onRefresh(loggedInUserEmail);  // Use the onRefresh prop to update the posts
};



const checkIfUsernameExists = async (username) => {
  const { data, error } = await supabase
    .from('Users')
    .select('*')
    .eq('username', username);

  if (error) {
    console.error('Error checking username:', error);
  }
  return data.length > 0; // Returns true if username exists
};

const confirmUsernameChange = async () => {
  const usernameExists = await checkIfUsernameExists(newUsername);

  if (usernameExists) {
    Toast.show({ // Show toast on successful deletion
      type: 'error',
      text1: 'Username already exists!',
      text2: 'Your new username must be unique.',
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
    });
    return;
  }

  const { error } = await supabase
    .from('Users')
    .update({ username: newUsername })
    .eq('email', user?.emailAddresses[0]?.emailAddress);

  if (error) {
    console.error('Error updating username:', error);
  } else {
    setIsEditingUsername(false); // Exit edit mode
    fetchProfileData();
    Toast.show({ // Show toast on successful deletion
      type: 'success',
      text1: ' Username Updated!',
      text2: 'Your username has been successfully updated.',
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
    });
  }
};


  return (
    <View style={{ marginTop: 0}}>
      <View style={{alignItems: 'center', marginTop: 20}}>
        <View style={{ position: 'absolute', top: 0, right: 0, flexDirection: 'row', alignItems: 'center', marginTop: -20 }}>
          {currentUserId === user.id ? (
            <>
              <TouchableOpacity onPress={() => setIsEditingUsername(!isEditingUsername)} style={{ flexDirection: 'column', alignItems: 'center', position: 'absolute', top: 130, right: 100 }}>
                  <Ionicons name="pencil" size={24} color="black" />
              </TouchableOpacity>
            </>
          ) : (
            // If viewing another user's profile, show a button to navigate back to the user's own profile
            <TouchableOpacity onPress={() => {
              fetchLoggedInUserProfileDataAndPosts();
              navigation.goBack();
            }} style={{ flexDirection: 'column', alignItems: 'center', marginLeft: 180 }}>
              <Ionicons name="arrow-back-circle" size={24} color="black" />
              <Text style={{ marginLeft: 5 }}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
          <TouchableOpacity onPress={currentUserId === user.id ? pickImage : null}>
            <Image source={{uri: profileData.profileImage || user.imageUrl }} style={{ width: 100, height: 100, borderRadius: 99 }} />
          </TouchableOpacity>
        <Text style={{marginTop: 10, fontSize: 20, fontWeight: 'bold', fontFamily: 'Poppins-Medium'}}>{profileData.username}</Text>
        <Text style={{marginTop: 5, fontSize: 16, fontWeight: '400', fontFamily: 'Poppins-Regular', color: Colors.BACKGROUND_TRANSP}}>{currentUserId === user.id ? user?.emailAddresses[0]?.emailAddress : null}</Text>
      </View>
{/* Modal for Editing Username */}
<Modal
        animationType="slide"
        transparent={true}
        visible={isEditingUsername}
        onRequestClose={() => setIsEditingUsername(!isEditingUsername)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // Modal overlay
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            width: '80%',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, fontFamily: 'Poppins-Medium', color: 'black', alignSelf: 'center' }}>Enter your new username</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: 'gray',
                padding: 10,
                width: '100%',
                borderRadius: 10,
                marginBottom: 20,
                color: 'black',
                fontFamily: 'Poppins-Regular',
              }}
              placeholder="Enter new username"
              value={newUsername}
              onChangeText={setNewUsername}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', display:'flex' }}>
              <TouchableOpacity onPress={confirmUsernameChange} style={{
                padding: 10,
                backgroundColor: 'black',
                borderRadius: 5,
                width: '48%',
                alignItems: 'center',
              }}>
                <Text style={{ color: 'white', fontFamily: 'Poppins-Medium' }}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() =>setIsEditingUsername(!isEditingUsername)} style={{
                padding: 10,
                backgroundColor: 'red',
                borderRadius: 5,
                width: '48%',
                alignItems: 'center',
              }}>
                <Text style={{ color: 'white', fontFamily: 'Poppins-Medium' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{marginTop: 0, display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
        <View style={{padding: 20, alignItems: 'center'}}>
            <Ionicons name="videocam-outline" size={24} color="black" />
            <Text style={{marginTop: 5, fontSize: 0, fontWeight: '400', fontFamily: 'Poppins-Bold'}}>{videos?.length} Posts</Text>
        </View>
        <View style={{padding: 20, alignItems: 'center'}}>
        <AntDesign name="heart" size={24} color="red" />
            <Text style={{marginTop: 5, fontSize: 0, fontWeight: '400', fontFamily: 'Poppins-Bold'}}>{totalLikes} Likes</Text>
        </View>
      </View>
    </View>
  )
}