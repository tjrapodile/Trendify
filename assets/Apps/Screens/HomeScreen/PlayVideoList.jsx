import { View, Text, FlatList, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import PlayVideoListItem from './PlayVideoListItem';
import { useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { supabase } from '../../Utils/SupabaseConfig';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useUser } from '@clerk/clerk-expo';
export default function PlayVideoList() {

  const params = useRoute().params;
  const [videoList, setVideoList] = useState([]);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState();
  const {user} = useUser();

  useEffect(() => {
    setVideoList([params.selectedVideo]);
    GetLatestVideoList();
  }, [params])

  const GetLatestVideoList = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Videos')
      .select('*,Users(username, name, profileImage), VideoLikes(userEmail, postIdRef)')
      .range(0, 5) // Adjusted to load 5 items
      .order('id', { ascending: false });

    if (error) {
      console.log('Error fetching video list:', error);
      setLoading(false);
      return; // Exit early on error
    }

    if (data) {
      console.log('Fetched video list:', data);
      const uniqueData = data.filter((video, index, self) =>
        index === self.findIndex((v) => v.id === video.id)
      ); // Filter duplicates based on the id
      setVideoList((prevList) => {
        const combinedList = [...prevList, ...uniqueData];
        // Remove duplicates after updating the state
        const uniqueCombinedList = combinedList.filter((video, index, self) =>
          index === self.findIndex((v) => v.id === video.id)
        );
        return uniqueCombinedList;
      });
    }

    setLoading(false);
  };

  const HeightOfBottomTab = useBottomTabBarHeight();
  const ScreenHeight = Dimensions.get('window').height - HeightOfBottomTab - 70;

  const userLikeHandler = async (videoPost, isLike) => {
    console.log(`User action: ${isLike ? "Liking" : "Disliking"} video ID: ${videoPost.id}`);
    if (isLike) {
      const {data, error} = await supabase
        .from('VideoLikes')
        .insert([{
          postIdRef: videoPost.id,
          userEmail: user.primaryEmailAddress.emailAddress
        }])
        .select();
        console.log("USer has liked the post and its saved in the DB");
  
      if (!error) {
        // Manually update the local videoList state
        setVideoList(prevList =>
          prevList.map(v =>
            v.id === videoPost.id
              ? { ...v, VideoLikes: [...(v.VideoLikes || []), { userEmail: user.primaryEmailAddress.emailAddress }] }
              : v
          )
        );
      }
    } else {
      // Handle the unlike case, and update the videoList
      const {data, error} = await supabase
        .from('VideoLikes')
        .delete()
        .eq('postIdRef', videoPost.id)
        .eq('userEmail', user.primaryEmailAddress.emailAddress);

        console.log("USer has unliked the post and its removed from the DB");
      
      if (!error) {
        // Manually update the local videoList state
        setVideoList(prevList =>
          prevList.map(v =>
            v.id === videoPost.id
              ? { ...v, 
                VideoLikes: v.VideoLikes?.filter(like => like.userEmail !== user.primaryEmailAddress.emailAddress) }
              : v
          )
        );
      }
    }
  };
  

  return (
    <View>
      <TouchableOpacity style={{ position: 'absolute',zIndex: 10, padding: 20 }} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back-circle-sharp" size={25} color="white" />
        <Text style={{fontFamily: 'Poppins-SemiBold', fontSize: 15, color: 'white'}}>Back</Text>
      </TouchableOpacity>
      <FlatList
        data={videoList}
        keyExtractor={(item) => `${item.id}-${item.timestamp}`}
        pagingEnabled
        snapToInterval={ScreenHeight}
        decelerationRate="fast" // Smoothens the paging experience
        snapToAlignment="start" // Aligns the snap to the start of the item
        bounces={false} // Prevents bouncing effect
        scrollEnabled={true} // Ensures scrolling is enabled
        onScroll={e=>{
          const index = Math.round(e.nativeEvent.contentOffset.y/ScreenHeight);
          setCurrentVideoIndex(index);
        }}
        style={{zIndex: -1 }}
        renderItem={({item, index}) => (
          <PlayVideoListItem video={item} index={index}  activeIndex={currentVideoIndex} userLikeHandler={userLikeHandler} user = {user}/>
        )}
        
      />
    </View>
  )
}