import { View, Text, Image, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import { Colors } from '../../Utils/Colors';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '../../Utils/SupabaseConfig.js';
import Toast from 'react-native-toast-message'; 

export default function VideoThumbnail({video, refreshData}) {

    const navigation = useNavigation();
    const {user} = useUser();
    const route = useRoute();
    // Determine if the current user has liked the video
  const isLiked = video.VideoLikes.some(like => like.userEmail === user?.primaryEmailAddress?.emailAddress);
  const isOwner = user?.primaryEmailAddress?.emailAddress === video?.emailRef; 

  const onDeleteHandler = (video) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        { text: 'Yes',
          onPress: () => deleteVideo(video),
          style: 'destructive',},
      ],
    )
  };

  const deleteVideo = async(video) => {
    const { error } = await supabase
    .from('Videos')
    .delete()
    .eq('id', video?.id);
    if (error) {
      console.error('Error deleting video:', error);
    } else {
      console.log('Video deleted successfully');
      Toast.show({ // Show toast on successful deletion
        type: 'success',
        text1: 'Video Deleted!',
        text2: 'Your video has been successfully deleted.',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });
      refreshData();
    }
  }

  return (
    <View style={{flex: 1}} onPress={() => navigation.navigate('play-video', {selectedVideo: video})}>
      { route.name === 'profile' && isOwner  && <TouchableOpacity style={{position: 'absolute', zIndex : 10, top:0, right:0, padding: 5}} onPress={() => onDeleteHandler(video)}>
        <MaterialCommunityIcons name="delete-circle" size={35} color="black" />
      </TouchableOpacity>}
      <TouchableOpacity style={{flex: 1, margin: 5}} onPress={() => navigation.navigate('play-video', {selectedVideo: video})}>
        <View style={{position: 'absolute', zIndex : 10, bottom:0, padding: 5,display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
            <View style={{display: 'flex', flexDirection: 'row', gap:2, alignItems: 'center'}}>
                <Image source={{uri: video?.Users?.profileImage}} style={{ width: 20, height: 20,backgroundColor: 'white', borderRadius: 99 }}/>
                <Text style={{color: 'white', fontFamily:'Poppins-Light', fontSize: 11}}>{video?.Users?.username}</Text>
            </View>
            <View style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3}}>
                <Text style={{color: 'white', fontFamily:'Poppins-Light', fontSize: 11}}>{video.VideoLikes.length}</Text>
                <AntDesign name={isLiked ? "heart" : "hearto"} size={24} color="red" />
            </View>
        </View>
      <Image source={{uri: video?.thumbnail}}
      style={{ width: '100%', height: 250, borderRadius: 10 }}/>
      </TouchableOpacity>
    </View>
  )
}