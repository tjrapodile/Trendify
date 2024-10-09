import { View, Text, Image, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo';

// Helper function to highlight matching text
function highlightText(text, searchQuery) {
  if (!searchQuery) return text;

  // Case insensitive matching
  const regex = new RegExp(`(${searchQuery})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => 
    regex.test(part) ? (
      <Text key={index} style={{ backgroundColor: 'yellow' }}>{part}</Text>
    ) : (
      <Text key={index}>{part}</Text>
    )
  );
}

export default function SearchVideoCard({ video, searchQuery, userLikeHandler }) {  // Accept `searchQuery` as a prop
  const navigation = useNavigation();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Determine if the video is liked by the user on initial render
    const likedByUser = video.VideoLikes?.some(like => like.userEmail === user?.primaryEmailAddress?.emailAddress);
    setIsLiked(likedByUser);
  }, [video, user]);



  return (
    <TouchableOpacity 
      style={{ flex: 1, margin: 5 }} 
      onPress={() => navigation.navigate('play-video', { selectedVideo: video })}
    >
      {/* Thumbnail */}
      <Image 
        source={{ uri: video?.thumbnail || 'default_thumbnail_url' }} 
        style={{ width: '100%', height: 350, borderRadius: 10 }} 
      />
      
      {/* Video Info */}
      <View style={{ padding: 10 }}>
        {/* Highlighted Description */}
        <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold' }}>
          {highlightText(video?.description || 'Untitled Video', searchQuery)}
        </Text>
        
        {/* User Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
          <Image 
            source={{ uri: video?.Users?.profileImage || 'default_profile_image_url' }} 
            style={{ width: 30, height: 30, borderRadius: 99, marginRight: 10 }} 
          />
          <Text style={{ fontFamily: 'Poppins-Light' }}>{video?.Users?.username || 'Unknown User'}</Text>
        </View>
        
        {/* Tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {video?.Video_Hashtags?.map((vh, index) => (
            <Text key={index} style={{ marginRight: 5, fontFamily: 'Poppins-Light', fontSize: 12, color: '#007BFF' }}>
              {highlightText(`${vh.Hashtags.tag}`, searchQuery)}
            </Text>
          ))}
        </View>

        {/* Likes */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
          <Text style={{ fontFamily: 'Poppins-Light', fontSize: 12 }}>
            {video?.VideoLikes?.length || 0}
          </Text>
          <AntDesign name={isLiked ? 'heart' : 'hearto'} size={20} color="red" style={{ marginLeft: 5 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
