import React, {useEffect, useState, useContext} from 'react';
import {View, Text, StyleSheet, Dimensions, Image} from 'react-native';
import auth from '@react-native-firebase/auth';
import UserContext from '../Components/UserContext';
import database from '@react-native-firebase/database';
import SplashScreenSVG from '../Components/SplashScreenSVG';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({navigation}) => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const {userData, setUserData} = useContext(UserContext);
  const [name, setName] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Function to handle user state changes
    function onAuthStateChanged(user) {
      setUser(user);
      if (initializing) {
        setInitializing(false);
      }
    }

    // Subscribe to authentication state changes
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);

    // Unsubscribe when component unmounts
    return subscriber;
  }, []);

  const getUserDetails = async phoneNumber => {
    try {
      const snapshot = await database()
        .ref(`Users/${phoneNumber}`)
        .once('value');
      if (snapshot.exists()) {
        const userDataForApplicationContext = {
          userId: phoneNumber,
          userName: snapshot.val().name,
        };
        setUserData(userDataForApplicationContext);
        if (snapshot.val().type == 'Owner') {
          navigation.replace('Owner');
        } else if (snapshot.val().type == 'Tenant') {
          navigation.replace('Tenant');
        } else {
          navigation.replace('UserDetails', {userId: phoneNumber});
          console.log('done');
        }
      } else {
        navigation.replace('Register');
        console.log('done');
      }
    } catch (error) {
      console.error('Error getting phone number:', error);
      navigation.replace('Register');
    }
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!initializing) {
        if (!user) {
          navigation.replace('Register');
        } else {
          //console.log(user.phoneNumber);
          getUserDetails(user.phoneNumber);
          //navigation.replace('UserType', {userId: user.phoneNumber});
        }
      }
      // Redirect based on user authentication status after 3 seconds
    }, 3000); // 3000 milliseconds (3 seconds)

    // Clear the timeout to avoid memory leaks
    return () => clearTimeout(timeout);
  }, [initializing, user, navigation]);

  // Return the splash screen UI
  return (
    <View style={styles.container}>
      <SplashScreenSVG style={styles.image} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%', // Set image width to screen width
    height: '100%', // Set image height to screen height
  },
});

export default SplashScreen;
