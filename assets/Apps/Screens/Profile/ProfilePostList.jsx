import { View, Text, FlatList } from 'react-native'
import React from 'react'
import VideoThumbnail from '../HomeScreen/VideoThumbnail'

export default function ProfilePostList({videos, GetLatestVideoList, loading}) {
  return (
    <View style={{ flex: 1}}>
        <FlatList
            data={videos}
            numColumns={2}
            onRefresh={GetLatestVideoList}
            refreshing={loading}
            renderItem={({ item }) => (
            <VideoThumbnail video={item} refreshData={() => GetLatestVideoList()} />
            )}
            keyExtractor={(item) => item.id ? item.id.toString() : `${Math.random()}`} // Ensure unique keys for each item
        />
    </View>
  )
}