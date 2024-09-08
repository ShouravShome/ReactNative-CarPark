import messaging from '@react-native-firebase/messaging';

export const requestUserPermission = async () => {
  try {
    await messaging().requestPermission();
    console.log('Notification permission granted');
    const token = await messaging().getToken();
    console.log('Device token:', token);
    return token;
  } catch (error) {
    console.log('Error granting notification permission:', error);
    return null;
  }
  // messaging()
  //   .getToken()
  //   .then(token => console.log("Device token:", token));
};
