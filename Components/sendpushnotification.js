import axios from 'axios'
export const sendPushNotification = async (body,toDeviceToken) => {
    try {
      const fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';
      const serverKey = ''; // Obtain from Firebase Console -> Project Settings -> Cloud Messaging
      const message = {
        notification: {
          title: 'TakeMyPark',
          body: body,
        },
        to: toDeviceToken,
      };
  
      const response = await axios.post(fcmEndpoint, message, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${serverKey}`,
        },
      });
  
      console.log('Successfully sent message:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };