import React, { useEffect, useState } from 'react';
import { Text, View, Image, FlatList, TouchableOpacity } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../../Utils/SupabaseConfig.js';
import VideoThumbnail from './VideoThumbnail.jsx';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { user } = useUser();
  const [videoList, setVideoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  const [lastFetchedTime, setLastFetchedTime] = useState(null); 
  const [profileImage, setProfileImage] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (user) {
      fetchProfileImage();
    }
    setLoadCount(0);
    setLastFetchedTime(null); // Reset on user change
  }, [user]);

  const fetchProfileImage = async () => {
    const { data, error } = await supabase
      .from('Users')
      .select('profileImage')
      .eq('email', user?.primaryEmailAddress?.emailAddress)
      .single();

    if (data) {
      // Use Supabase profile image if it exists; otherwise, fall back to Clerk image
      setProfileImage(data.profileImage || user.imageUrl);
    } else if (error) {
      console.error('Error fetching profile image:', error);
    }
  };

  const updateProfileImage = async () => {
    await supabase
      .from('Users')
      .update({ profileImage: user?.imageUrl })
      .eq('email', user?.primaryEmailAddress?.emailAddress)
      .is('profileImage', null);
    // After updating, fetch the latest profile image
    fetchProfileImage();
  };


  const GetLatestVideoList = async () => {
    setLoading(true);
    const query = supabase
      .from('Videos')
      .select('*, Users(username, name, profileImage), VideoLikes(userEmail, postIdRef)')
      .range(loadCount, loadCount + 100) // Adjusted to load 5 items
      .order('id', { ascending: false });

    // If lastFetchedTime exists, fetch videos created after that timestamp
    if (lastFetchedTime) {
      query.gt('created_at', lastFetchedTime);
    }

    const { data, error } = await query;

    if (error) {
      console.log('Error fetching video list:', error);
      setLoading(false);
      return; // Exit early on error
    }

    if (data) {
      // Create a Set to track unique video IDs
      const uniqueVideoIds = new Set(videoList.map(video => video.id));

      // Filter new data for unique videos
      const filteredVideos = data.filter(video => {
        if (uniqueVideoIds.has(video.id)) {
          return false; // Skip if already exists
        } else {
          uniqueVideoIds.add(video.id); // Add to set if it's new
          return true; // Include this video
        }
      });

      // Merge VideoLikes for existing videos in videoList
      const updatedVideoList = videoList.map(existingVideo => {
        const newVideo = data.find(video => video.id === existingVideo.id);
        if (newVideo) {
          // Merge likes if newVideo found
          existingVideo.VideoLikes = [
            ...new Set([...existingVideo.VideoLikes, ...newVideo.VideoLikes]),
          ];
        }
        return existingVideo;
      });

      // Combine existing videos with new unique videos
      setVideoList([...updatedVideoList, ...filteredVideos]);

      // Update the last fetched timestamp
      if (filteredVideos.length > 0) {
        const latestTimestamp = Math.max(...filteredVideos.map(video => new Date(video.created_at)));
        setLastFetchedTime(latestTimestamp);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    GetLatestVideoList();
  }, [loadCount]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('HomeScreen focused, refreshing video list...');
      fetchProfileImage();
      setLoadCount(0); // Reset load count to fetch new data
      GetLatestVideoList();
    });

    return unsubscribe; // Clean up the listener on unmount
  }, [navigation]);

  return (
    <View style={{ padding: 20 }}>
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontFamily: 'Poppins-SemiBold' }}>Latest Trends</Text>
        <TouchableOpacity onPress= {() => navigation.navigate('profile', { userEmail: user.primaryEmailAddress.emailAddress })}>
          <Image source={{ uri: profileImage }} style={{ width: 50, height: 50, borderRadius: 99 }} />
        </TouchableOpacity>
      </View>
      <View>
        <FlatList
          data={videoList}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          onRefresh={GetLatestVideoList}
          refreshing={loading}
          onEndReached={() => setLoadCount(prevCount => prevCount + 5)}
          onEndReachedThreshold={0.2}
          renderItem={({ item }) => (
            <VideoThumbnail video={item} refreshData={() => GetLatestVideoList()} />
          )}
          keyExtractor={(item) => item.id ? item.id.toString() : `${Math.random()}`} // Ensure unique keys for each item
        />
      </View>
    </View>
  );
}
