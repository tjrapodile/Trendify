import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import Colors from '../../Utils/Colors'
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useNavigation } from '@react-navigation/native';


export default function AddScreen() {

  const navigation = useNavigation();

  const selectVideoFile = async() => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    console.log(result);
    if(!result.canceled){
      console.log(result.assets[0].uri);
      GenerateVideoThumbnail(result.assets[0].uri)
    }
  };

  const GenerateVideoThumbnail = async(videoUri) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        videoUri,
        {
          time: 5000,
        }
      );
      console.log("Thumbnail", uri);
      navigation.navigate('PreviewScreen', {video: videoUri, thumbnail: uri});
    } catch (e) {
      console.warn(e);
    }
  }


  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, display: 'flex'}}>
      <Image source={require('./AddVideo.png')}  
        style={{width: 150, height: 150}}
      />
      <Text style={{fontFamily: 'Poppins-SemiBold', fontSize: 20, marginTop: 20}}>Upload Your Video Here!</Text>
      <Text style={{fontFamily: 'Poppins-Light', fontSize: 15, marginTop: 30}}>Showcase The Next Big Trend With The World</Text>
      <TouchableOpacity  onPress={selectVideoFile} style={{
          backgroundColor: Colors.BLACK,
          padding: 10,
          paddingHorizontal: 20,
          borderRadius: 99,
          marginTop: 20
          }}>
        <Text style={{color: Colors.WHITE, fontFamily: 'Poppins-SemiBold'}}>Upload</Text>
      </TouchableOpacity>
    </View>
  )
}