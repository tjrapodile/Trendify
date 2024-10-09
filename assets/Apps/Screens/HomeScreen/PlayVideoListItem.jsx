import { View, Text, Dimensions, Image, TouchableHighlight, TextInput, Share, PanResponder } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import { Video } from 'expo-av';
import { ResizeMode } from 'expo-av';
import { StyleSheet } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ScrollView } from 'react-native';
import { supabase } from '../../Utils/SupabaseConfig';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function PlayVideoListItem({ video, index, activeIndex, userLikeHandler, user }) {
    const videoRef = useRef(null);
    const [status, setStatus] = useState({});
    const [hashtags, setHashtags] = useState([]);
    const [comments, setComments] = useState([]);
    const [commentVisible, setCommentVisible] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const longPressTimeout = useRef(null);
    const swipeThreshold = 10;
    const navigation = useNavigation();
    

    const HeightOfBottomTab = useBottomTabBarHeight();
    const ScreenHeight = Dimensions.get('window').height - HeightOfBottomTab - 70;



    useEffect(() => {
        fetchHashtags();
        fetchComments();
    }, [video.id]);
    

    const fetchHashtags = async () => {
        const { data, error } = await supabase
            .from('Video_Hashtags')
            .select('Hashtags(tag)')
            .eq('video_id', video.id);

        if (error) {
            console.error('Error fetching hashtags:', error);
        } else {
            setHashtags(data.map(item => item.Hashtags.tag));
        }
    };

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('Comments')
            .select('*, Users(username, profileImage)')
            .eq('video_id', video.id);

        if (error) {
            console.error('Error fetching comments:', error);
        } else {
            setComments(data);
        }
    };

    const handleAddComment = async () => {
        if (newComment.trim() === '') return;

        const { data, error } = await supabase
            .from('Comments')
            .insert([{
                video_id: video.id,
                user_email: user.primaryEmailAddress.emailAddress,
                comment: newComment
            }])
            .select('*, Users(username, profileImage)');

        if (error) {
            console.error('Error adding comment:', error);
        } else {
            setComments(prevComments => [...prevComments, data[0]]);
            setNewComment('');
        }
    };

    const checkAlreadyLiked = () => {
        const result = video.VideoLikes?.find(item => item.userEmail == user?.primaryEmailAddress?.emailAddress);
        return result;
    }

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this video: ${video?.videoUrl}`,
                url: video?.videoUrl,
                title: video?.description, // Optional: you can include a title
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const togglePlayback = async () => {
        if (status.isPlaying) {
            await videoRef.current.pauseAsync();
        } else {
            await videoRef.current.playAsync();
        }
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
            const { dx, dy } = gestureState;
            return Math.abs(dx) > swipeThreshold || Math.abs(dy) > swipeThreshold;
        },
        onPanResponderGrant: (evt) => {
            const { locationX } = evt.nativeEvent;

            // Start long press timer
            longPressTimeout.current = setTimeout(() => {
                if (locationX < Dimensions.get('window').width * 0.1) {
                    setPlaybackSpeed(0.5); // Slow motion
                    videoRef.current.setRateAsync(0.1, true);
                } else if (locationX > Dimensions.get('window').width * 0.9) {
                    setPlaybackSpeed(2.0); // Fast forward
                    videoRef.current.setRateAsync(4.0, true);
                }
            }, 500); // 500 ms for a long press
        },
        onPanResponderMove: (_, gestureState) => {
            // If swiping is detected, cancel the long press
            if (Math.abs(gestureState.dy) > swipeThreshold) {
                clearTimeout(longPressTimeout.current);
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            clearTimeout(longPressTimeout.current);
            if (Math.abs(gestureState.dy) < swipeThreshold && Math.abs(gestureState.dx) < swipeThreshold) {
                togglePlayback();
            }
            // Reset playback speed
            setPlaybackSpeed(1.0);
            videoRef.current.setRateAsync(1.0, true);
        },
        onPanResponderTerminate: () => {
            clearTimeout(longPressTimeout.current);
            setPlaybackSpeed(1.0);
            videoRef.current.setRateAsync(1.0, true);
        },
    });



    return (
        <View>
            <View style={{ position: 'absolute', zIndex: 10, bottom: 10, padding: 20, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', flex: 1, margin: 5 }}>
                <View>
                    <View style={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => {
                            console.log('My Video data', video)
                            const targetEmail = video?.emailRef;
                            console.log('Navigating to profile:', targetEmail); // Log the target email
                            // Only navigate if the target email is not the current user's email
                            if (targetEmail !== user.primaryEmailAddress.emailAddress) {
                                navigation.navigate('profile', { userEmail: targetEmail });
                            }
                        }} 
                            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Image
                                source={{ uri: video?.Users?.profileImage }}
                                style={{ width: 50, height: 50, backgroundColor: 'white', borderRadius: 99 }}
                            />
                            <Text style={{ color: 'white', fontFamily: 'Poppins-Light', fontSize: 15, marginLeft: 10 }}>{video?.Users?.username}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={{ color: 'white', fontFamily: 'Poppins-Light', fontSize: 15, marginTop: 10 }}>{video?.description}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20 }}>
                        {(hashtags.length > 0 ? hashtags : []).map((hashtag, index) => (
                            <Text key={index} style={styles.hashtag}>
                                {hashtag}
                            </Text>
                        ))}
                    </ScrollView>
                    <Text style={styles.locationText}>
                        📍 {video?.location}
                    </Text>
                </View>
                <View style={{ display: 'flex', gap: 15 }}>
                    <>
                        {checkAlreadyLiked() ?
                            <TouchableHighlight onPress={() => userLikeHandler(video, false)}>
                                <AntDesign name="heart" size={40} color="red" />
                            </TouchableHighlight>
                            : <TouchableHighlight onPress={() => userLikeHandler(video, true)}>
                                <AntDesign name="hearto" size={40} color="red" />
                            </TouchableHighlight>
                        }
                        <Text style={{ color: 'white', fontFamily: 'Poppins-Light', fontSize: 13, textAlign: 'center', marginTop: -10 }}>
                            {video?.VideoLikes?.length}
                        </Text>
                    </>
                    <TouchableHighlight onPress={() => setCommentVisible(prev => !prev)} style={{ alignItems: 'center' }}>
                        <Ionicons name="chatbox-outline" size={40} color="white" />
                    </TouchableHighlight>
                    <TouchableHighlight onPress={handleShare}>
                        <Feather name="share" size={40} color="white" />
                    </TouchableHighlight>
                </View>
            </View>
            {commentVisible && (
                <View style={styles.commentSection}>
                    <Text style={styles.commentHeader}>Comments</Text>
                    <ScrollView style={styles.commentList} showsVerticalScrollIndicator={false}>
                    {comments.length === 0 ? (
                        <Text style={{color: 'white'}}>Be the first to comment on the trend!</Text>
                    ) : (
                        comments.map((comment) => (
                            <View key={comment.id} style={styles.commentItem}>
                                <Image
                                    source={{ uri: comment.Users.profileImage }}
                                    style={styles.commentUserImage}
                                />
                                <View style={styles.commentContent}>
                                    <Text style={styles.commentUsername}>{comment.Users.username}</Text>
                                    <Text style={styles.commentText}>{comment.comment}</Text>
                                </View>
                            </View>
                        ))
                    )}
                    </ScrollView>
                    {/* Moved TextInput and buttons up to just under the header */}
                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Add a comment..."
                            placeholderTextColor="rgba(255, 255, 255, 0.6)"
                            value={newComment}
                            onChangeText={setNewComment}
                        />
                        <TouchableOpacity onPress={handleAddComment} style={styles.postButton}>
                            <Text style={styles.postButtonText}>Post</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCommentVisible(false)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            <View 
                {...panResponder.panHandlers}
                style={[styles.video, { height: ScreenHeight }]}
            >
                <Video
                    ref={videoRef}
                    source={{ uri: video?.videoUrl }}
                    style={[styles.video, { height: ScreenHeight }]}
                    resizeMode={ResizeMode.COVER}
                    useNativeControls={false}
                    isLooping
                    shouldPlay={activeIndex === index}
                    onPlaybackStatusUpdate={status => setStatus(() => status)}
                    onError={(e) => console.error('Video Error:', e)}
                    rate={playbackSpeed}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    video: {
        alignSelf: 'center',
        width: Dimensions.get('window').width,
    },
    hashtag: {
        color: 'white',
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        marginRight: 10,
    },
    locationText: {
        color: 'white',
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        marginTop: 10,
    },
    commentSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(28, 28, 28, 0.7)', // More transparent
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'gray',
        height: '60%', // Take up 60% of the screen height
        zIndex: 20,
    },
    commentHeader: {
        color: 'white',
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
        marginBottom: 10,
    },
    commentList: {
        maxHeight: '70%',
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    commentUserImage: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
    },
    commentContent: {
        flex: 1,
    },
    commentUsername: {
        color: 'white',
        fontFamily: 'Poppins-Medium',
    },
    commentText: {
        color: 'white',
        fontFamily: 'Poppins-Regular',
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentInput: {
        flex: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    postButton: {
        marginLeft: 10,
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 20,
    },
    postButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    closeButton: {
        marginLeft: 10,
        backgroundColor: 'red',
        padding: 10,
        borderRadius: 20,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
