import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import React, { useRef, useState } from 'react';
import { Video, ResizeMode } from 'expo-av';
import Colors from '../../Utils/Colors';
import * as WebBrowser from "expo-web-browser";
import { useWarmUpBrowser } from '../../hooks/useWarmUpBrowser';
import { useOAuth } from '@clerk/clerk-expo';
import { supabase } from '../../Utils/SupabaseConfig.js';
import { useAuth } from '../../../../AuthContext.jsx';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});

  useWarmUpBrowser();
  const {startOAuthFlow } = useOAuth({strategy: "oauth_google"});
  const { setEmail } = useAuth();
  const onPress = React.useCallback(async () => {
    try{
        const {createdSessionId, signIn, signUp, setActive} = await startOAuthFlow();
        console.log({createdSessionId, signIn, signUp, setActive});
        if(createdSessionId) {
            setActive({ session: createdSessionId });
            if(signUp?.emailAddress){
                const userEmail =signUp?.emailAddress; // Replace with actual login logic
                setEmail(userEmail); // Save email to context
                console.log("Email set in context:", userEmail);
                const { data, error } = await supabase
                .from('Users')
                .insert([
                { name: signUp?.firstName + " " + signUp?.lastName, email: signUp?.emailAddress, username: (signUp?.emailAddress).split('@')[0] },
                ])
                .select();

                if(data){
                    console.log(data);
                }
            }else if (signIn?.emailAddress) {
                const userEmail = signIn.emailAddress;
                setEmail(userEmail); // Save email to context for sign in case
                console.log("Email set in context (sign in):", userEmail); // Add this log
            }
        }else{
            console.log('No session created');
        }
    }catch(err){
        console.log("OAuth error", err);
    }
  
},[]);

  return (
    <View style={{ flex: 1 }}>
        <Video
            ref={videoRef}
            source={require('./login-video.mp4')} // Ensure this path is correct
            style={styles.video}
            shouldPlay
            resizeMode={ResizeMode.COVER}
            isLooping
            onError={(error) => console.log('Video Error:', error)}
            onLoad={() => console.log('Video loaded')}
            onLoadStart={() => console.log('Video load started')}
            onPlaybackStatusUpdate={(status) => {
            setStatus(() => status);
            if (status.isBuffering) {
                console.log('Video is buffering...');
            }
            }}
        />
        <View style={{ 
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 50,
            backgroundColor: Colors.BACKGROUND_TRANSP
        }}>
            <Text style={{
                fontFamily: 'Poppins-Bold',
                fontSize: 35,
                color: Colors.WHITE
                }}>
            Trendify
            </Text>
            <Text style={{
                fontFamily: 'Poppins-Medium', 
                fontSize: 20,
                color: Colors.WHITE,
                textAlign: 'center' 
            }}>
            Share. Create. View. Discover.
            </Text>
            <TouchableOpacity
            onPress={onPress}
            style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 10, 
                flexDirection: 'row', 
                marginTop: 30, 
                backgroundColor: Colors.WHITE, 
                borderRadius: 99, 
                padding: 10, 
                position: 'absolute', 
                bottom: 150
            }}>
                <Image 
                    source={require('./google-image.png')}  
                    style={{ width: 30, height: 30 }}
                />
                <Text style={{
                     fontFamily: 'Poppins-Medium', 
                     fontSize: 15, 
                     color: Colors.BLACK, 
                     textAlign: 'center' 
                }}>
                Sign In with Google
                </Text>
            </TouchableOpacity>
        </View>

    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top:0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
