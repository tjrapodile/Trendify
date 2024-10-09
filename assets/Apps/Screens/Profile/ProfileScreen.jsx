import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import ProfileIntro from './ProfileIntro'
import { supabase } from '../../Utils/SupabaseConfig.js';
import { useUser } from '@clerk/clerk-expo';
import ProfilePostList from './ProfilePostList.jsx';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen({route}) {

  const {user} = useUser();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { userEmail } = route.params || {};

  useEffect(() => {
    let searchedEmail = userEmail;
    const ownUsersEMail = user?.primaryEmailAddress?.emailAddress; 
    console.log("Searched User's email (Getting another users data): ", searchedEmail);
    console.log("Own User's email: ", ownUsersEMail);
    if (searchedEmail && (searchedEmail !== ownUsersEMail)) {
      GetUserPost(searchedEmail);
    }else{
      searchedEmail = null;
      GetUserPost(ownUsersEMail);
    }
  }, [userEmail, user]);

  const handleRefresh = () => {
    console.log("Refreshing posts for email: ",user?.primaryEmailAddress.emailAddress);
    const email = user?.primaryEmailAddress?.emailAddress;
    GetUserPost(email);
  };

  const GetUserPost = async (email) => {
    console.log(`Fetching posts for email: ${email}`); // Log the email being used to fetch posts
    setLoading(true);

    const { data, error } = await supabase
      .from('Videos')
      .select('*, VideoLikes(postIdRef, userEmail), Users(*)')
      .eq('emailRef', email)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching user posts:', error);
      setLoading(false);
      return; // Return early if there's an error
    }


    // Check if data is undefined or empty
    if (!data || data.length === 0) {
      console.log(`No videos found for email: ${email}`); // Log if no videos were found
    } else {
      console.log(`Number of videos fetched: ${data.length}`); // Log the number of videos fetched
    }

    setVideos(data || []); // Set videos to an empty array if data is undefined
    setLoading(false); // Set loading to false after fetching data
  };

  return (
    <View style={{padding: 10, paddingTop: 25, flex: 1}}>
      <FlatList
        data={[{data: 1}]}
        refreshing={loading}
        onRefresh={() => handleRefresh()}
        showsVerticalScrollIndicator={false}
        renderItem={({item,index}) => (
          <View>
            <ProfileIntro videos = {videos} onRefresh={GetUserPost}/>
            <ProfilePostList videos = {videos} GetLatestVideoList={handleRefresh} loading={loading}/>
          </View>
        )}
        keyExtractor={(item) => item.id ? item.id.toString() : `${Math.random()}`}
      />
    </View>
  )
} 
