import React, { useState } from 'react';
import { View, Text, TextInput, TouchableHighlight, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../../Utils/SupabaseConfig.js';
import { useNavigation } from '@react-navigation/native';
import SearchVideoCard from './SearchVideoCard.jsx'; // Import SearchVideoCard instead of VideoThumbnail

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSearch = async () => {
    if (!searchQuery){
      setSearchResults([]); 
      return;
    }
    setLoading(true);

    const isTagSearch = searchQuery.startsWith('#');
    const formattedQuery = isTagSearch ? searchQuery.slice(1) : searchQuery.trim(); // Remove '#' from tag
    let data = [];

    if (isTagSearch) {
      // Query related hashtags and their videos
      const { data: tagData, error: tagError } = await supabase
        .from('Hashtags')
        .select(`Video_Hashtags!inner(video_id)`)
        .ilike('tag', `%${formattedQuery}%`); // Case-insensitive search for the tag

      if (tagError || !tagData || tagData.length === 0) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      const videoIds = tagData.flatMap(tag => tag.Video_Hashtags.map(vh => vh.video_id));

      const { data: videoData, error: videoError } = await supabase
        .from('Videos')
        .select('id, videoUrl, description, thumbnail, created_at, user_id, Users(username, profileImage), Video_Hashtags(Hashtags(tag)), VideoLikes(userEmail)')
        .in('id', videoIds)
        .order('created_at', { ascending: false });

      if (videoError) {
        console.log('Error fetching videos:', videoError);
      }

      data = videoData;
    } else {
      // Standard description search
      const { data: videoData, error: videoError } = await supabase
        .from('Videos')
        .select('id, videoUrl, description, thumbnail, created_at, user_id, Users(username, profileImage), Video_Hashtags(Hashtags(tag)), VideoLikes(userEmail)')
        .ilike('description', `%${formattedQuery}%`)
        .order('created_at', { ascending: false });

      if (videoError) {
        console.log('Error fetching videos:', videoError);
      }

      data = videoData;
    }

    setSearchResults(data || []);
    setLoading(false);
  };

  const renderVideoResult = ({ item }) => (
    <SearchVideoCard video={item} searchQuery={searchQuery} /> 
  );

  // Refresh function
  const handleRefresh = async () => {
    if (searchQuery) {
      setLoading(true);
      await handleSearch();
    } else {
      setSearchResults([]); // Clear results if search query is empty on refresh
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search Title or Tags..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableHighlight
        onPress={handleSearch}
        style={styles.searchButton}
      >
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableHighlight>

      {loading && <Text style={styles.loadingText}>Loading...</Text>}

      <FlatList
        data={searchResults}
        showsVerticalScrollIndicator={false}
        renderItem={renderVideoResult}
        keyExtractor={item => item.id.toString()}
        onRefresh={handleRefresh}
        refreshing={loading}
      />

      {!loading && searchResults.length === 0 && searchQuery === '' && (
        <Text style={styles.noResultsText}>Please Search for a Trend's tag or Title above.</Text> // Default placeholder when search bar is empty
      )}

      {!loading && searchResults.length === 0 && searchQuery !== '' && (
        <Text style={styles.noResultsText}>No results found</Text> // Placeholder when no results are found
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
  },
  searchButton: {
    backgroundColor: 'black',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
  },
  noResultsText: {
    fontFamily: 'Poppins-Regular',
  },
});
