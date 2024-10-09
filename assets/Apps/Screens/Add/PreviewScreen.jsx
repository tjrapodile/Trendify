import { View, Text, Image, KeyboardAvoidingView, ScrollView, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { TextInput } from 'react-native-gesture-handler';
import Colors from '../../Utils/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { s3Bucket } from '../../Utils/S3BucketConfig';
import Toast from 'react-native-toast-message';
import { supabase } from '../../Utils/SupabaseConfig.js';
import { useAuth } from '../../../../AuthContext.jsx';
import { useUser } from '@clerk/clerk-expo';  // Import Clerk's OAuth functionality

export default function PreviewScreen() {

  const params = useRoute().params;
  const navigation = useNavigation();
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [hashtags, setHashtags] = useState([]); 
  const [location, setLocation] = useState(''); 
  const { setEmail } = useAuth();  // Use email from context, fallback to Supabase
  const { isLoaded, user } = useUser();  // Clerk's useUser hook

  useEffect(() => {
    const fetchUserEmail = async () => {
      // Ensure the Clerk user is loaded
      if (!isLoaded || !user) return;

      try {
        const userEmail = user.emailAddresses[0]?.emailAddress;

        if (userEmail) {
          setEmail(userEmail);
          console.log("Email retrieved from Clerk:", userEmail);

          // Optionally, you can still update or verify this email in Supabase
          const { data, error } = await supabase
            .from('Users')
            .upsert({ email: userEmail }, { onConflict: 'email' })
            .select()
            .single();

          if (error) {
            console.error("Error updating user email in Supabase:", error);
          } else {
            console.log("User email updated/verified in Supabase:", data);
          }
        } else {
          console.error("No email found for the Clerk user");
        }
      } catch (err) {
        console.error("Error fetching or updating user email:", err);
      }
    };

    fetchUserEmail();
  }, [isLoaded, user]);

  const handleHashtagChange = (index, value) => {
    const newHashtags = [...hashtags];
    newHashtags[index] = `#${value.replace('#', '')}`;
    setHashtags(newHashtags);
  };

  const addHashtagField = () => {
    if (hashtags.length < 10) { // Max 2 rows of 4 hashtags each
      setHashtags([...hashtags, '#']);
    }
  };

  const removeHashtagField = () => {
    if (hashtags.length > 0) {
      setHashtags(hashtags.slice(0, -1));
    }
  };

  const getUserIdFromEmail = async (email) => {
    const { data, error } = await supabase
      .from('Users')
      .select('id')
      .eq('email', email)
      .single();
  
    if (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
  
    return data.id; // Return the numeric ID
  };

  const uploadHandler = async() => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      console.error('User email is not available, aborting upload.');
      Toast.show({
        type: 'error',
        text1: 'Email Not Available',
        text2: 'Please login to upload a video.',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });
      return;
    }

    console.log('Upload handler started');
    if (!description.trim()) {
      console.log('Description is empty, showing error toast');
      Toast.show({
        type: 'error',
        text1: 'Description Required',
        text2: 'Please add a description before uploading.',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });
      return;
    } 
    
    try {
      console.log('Starting upload process');
      Toast.show({
        type: 'info',
        text1: 'Uploading...',
        text2: 'Your Video Is Being Uploaded 🎥',
        position: 'top',
        visibilityTime: 0,
        autoHide: false,
      });

      const video = params.video;
      const image = params.thumbnail;
      console.log('Video path:', video);
      console.log('Image path:', image);

      const videoData = await uploadFileToAWS(video, 'video');
      console.log('Video upload result:', videoData);

      const imageData = await uploadFileToAWS(image, 'image');
      console.log('Image upload result:', imageData);
      
      const numericUserId = await getUserIdFromEmail(user.emailAddresses[0].emailAddress);
    
      if (!numericUserId) {
        console.error('Numeric User ID not found');
        return; // Abort if the user ID could not be retrieved
      }

      console.log('Inserting video data into Supabase');
      const videoInsertPayload = {
        videoUrl: videoData.Location,
        thumbnail: imageData.Location,
        description: description,
        emailRef: user.emailAddresses[0].emailAddress,
        location: location,
        user_id: numericUserId,
      };
      console.log('Video insert payload:', videoInsertPayload);
      console.log('Video URL:', videoData.Location);
      console.log('Thumbnail URL:', imageData.Location);
      console.log('Description:', description);
      console.log('Email Reference:', user.emailAddresses[0].emailAddress);
      console.log('Location:', location);
      console.log('user_id:', numericUserId);

      const { data: videoInsertData, error: videoError } = await supabase
        .from('Videos')
        .insert([videoInsertPayload])
        .select();
        

      if (videoError) {
        console.error('Error inserting video data:', videoError);
        console.error('Error details:', JSON.stringify(videoError, null, 2));
        throw videoError;
      }

      console.log('Video insert result:', videoInsertData);
      const videoId = videoInsertData[0].id;

      console.log('Processing hashtags');
      for (let hashtag of hashtags) {
        const { data: hashtagData, error: hashtagError } = await supabase
          .from('Hashtags')
          .insert([{ tag: hashtag.trim() }])
          .select()
          .single();

        if (hashtagError) {
          console.error('Error inserting hashtag:', hashtagError);
          console.error('Error details:', JSON.stringify(hashtagError, null, 2));
          throw hashtagError;
        }

        console.log('Processing video_hashtags');
        const { error: videoHashtagError } = await supabase
          .from('Video_Hashtags')
          .insert([{ video_id: videoId, hashtag_id: hashtagData.id }]);

        if (videoHashtagError) {
          console.error('Error linking video and hashtag:', videoHashtagError);
          console.error('Error details:', JSON.stringify(videoHashtagError, null, 2));
          throw videoHashtagError;
        }
      }
      console.log('Upload complete');
      Toast.hide();
      Toast.show({
        type: 'success',
        text1: 'Upload Complete!',
        text2: 'Your video has been shared! 🚀',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });

      console.log('Navigating to AddScreen...');
      navigation.navigate('AddScreen');

    } catch (error) {
      console.error('Caught error in upload process:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Toast.hide();
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'There was an error uploading your file 😞',
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
      });
    }
  };

  const uploadFileToAWS = async(file, type) => {
    const fileType = file.split('.').pop();
    const params = {
      Bucket: 'trendify-app',
      Key: `TrendifyFile-${Date.now()}.${fileType}`,
      Body: await fetch(file).then(res => res.blob()),
      ACL: 'public-read',
      ContentType: fileType === 'mp4' || 'mov' ? `video/${fileType}` : `image/${fileType}`
    }

    try {
      const data = await s3Bucket.upload(params).promise();
      if (type === 'video') {
        setVideoUrl(data?.Location);
        console.log('Uploaded video URL:', data?.Location);
      }
      return data;
    } catch (error) {
      console.error('Error uploading to AWS:', error);
      throw error;
    }
  }

  return (
    <KeyboardAvoidingView style={{ padding: 20, backgroundColor: Colors.WHITE, flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignItems: 'center', marginTop: 0, flexDirection: 'row', gap: 10 }}>
          <Ionicons name="arrow-back-circle-sharp" size={25} color="black" />
          <Text style={{fontFamily: 'Poppins-SemiBold', fontSize: 15}}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 0 }}>
          <Text style={{fontFamily: 'Poppins-SemiBold', fontSize: 15}}>Add Details</Text>
          <Image source={{ uri: params.thumbnail }} style={{ width: 150, height: 267, marginTop: 10, borderRadius: 20 }} />
          <TextInput
            onChangeText={text => setDescription(text)}
            placeholder='Title'
            style={{ width: '100%', height: 50, backgroundColor: '#F5F5F5', borderRadius: 10, marginTop: 30, padding: 10 }}
          />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            {hashtags.map((hashtag, index) => (
              <TextInput
                key={index}
                value={hashtag}
                onChangeText={(text) => handleHashtagChange(index, text)}
                placeholder='Add hashtag'
                style={{ width: '48.5%', height: 50, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 10, marginRight: 5, marginBottom: 5 }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <TouchableOpacity onPress={addHashtagField} style={{ backgroundColor: Colors.BLACK, padding: 10, borderRadius: 5, marginRight: 10 }}>
              <Text style={{ color: Colors.WHITE }}>Add Hashtag</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={removeHashtagField} style={{ backgroundColor: Colors.BLACK, padding: 10, borderRadius: 5 }}>
              <Text style={{ color: Colors.WHITE }}>Remove Hashtag</Text>
            </TouchableOpacity>
          </View>                   

          <TextInput
            value={location}
            onChangeText={(text) => setLocation(text.replace(/[^a-zA-Z0-9,\s]/g, ''))}
            placeholder='Enter location'
            style={{ width: '100%', height: 50, backgroundColor: '#F5F5F5', borderRadius: 10, marginTop: 30, padding: 10 }}
          />

          <TouchableOpacity onPress={uploadHandler} style={{ backgroundColor: Colors.BLACK, padding: 10, paddingHorizontal: 20, borderRadius: 99, marginTop: 60 }}>
            <Text style={{ color: Colors.WHITE }}>Finalize Upload</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
