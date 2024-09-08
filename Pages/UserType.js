import React, {useContext, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import database from '@react-native-firebase/database';
import UserContext from '../Components/UserContext';
import {requestUserPermission} from '../Components/requestuserpermission';

const ParkingSelectionPage = ({navigation, route}) => {
  const phoneNumberId = route.params?.userId;
  const [userType, setUserType] = useState(null);
  const [userName, setUserName] = useState(null);
  const {userData, setUserData} = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState(null);

  // const userDataTenantOrOwner = {
  //   userId: phoneNumberId,
  //   userType: userType,
  // };

  // const getNameOfCurrentUserByNumber = async phoneNumber => {
  //   try {
  //     const snapshot = await database()
  //       .ref(`Owner/${phoneNumber}`)
  //       .once('value');
  //     setUserName(snapshot.val().name);
  //     const token = await requestUserPermission();
  //     if (token) {
  //       // Store the token in Firebase here
  //       setToken(token);
  //       await database().ref(`Tenant/${phoneNumber}/deviceToken`).set(token);
  //       await database().ref(`Owner/${phoneNumber}/deviceToken`).set(token);
  //     } else {
  //       // Handle the case where permission was not granted or an error occurred
  //     }
  //   } catch (error) {
  //     console.error('Error getting phone number:', error);
  //     return null;
  //   } finally {
  //     setLoading(false); // Set loading to false after data is fetched or if there's an error
  //   }
  // };

  const setUserTypeInUserTable = async userId => {
    try {
      await database().ref(`Users/${userId}/type`).set('Tenant');
      console.log('Type saved successfully.');
    } catch (error) {
      console.error('Error saving name:', error);
    }
  };

  const saveDataToTenant = async (tenantId, tenantDetails) => {
    try {
      await setUserTypeInUserTable(tenantId);
      await database().ref(`Tenant/${tenantId}`).set(tenantDetails);
      console.log('Name saved successfully tenant.');
      navigation.navigate('Tenant', {screen: 'TenantConnection'});
    } catch (error) {
      console.error('Error saving name:', error);
    }
  };

  const tenantData = {
    name: userName,
    phoneNumber: userId,
    deviceToken: token,
    schedule: {
      Saturday: 'available',
      Sunday: 'available',
      Monday: 'available',
      Tuesday: 'available',
      Wednesday: 'available',
      Thursday: 'available',
      Friday: 'available',
    },
  };

  const handleSelection = type => {
    setUserType(type);
    // Redirect to appropriate page based on selection
    if (type === 'owner') {
      navigation.navigate('ownerUserDetails');
    } else if (type === 'tenant') {
      saveDataToTenant(userId, tenantData);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
    setToken(await requestUserPermission());
    setUserName(userData.userName);
    setUserId(userData.userId);
    };
    fetchData();
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Parking App</Text>
      <Text style={styles.subtitle}>Are you a...</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, userType === 'owner' && styles.selectedButton]}
          onPress={() => handleSelection('owner')}>
          <Text style={styles.buttonText}>Owner</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            userType === 'tenant' && styles.selectedButton,
          ]}
          onPress={() => handleSelection('tenant')}>
          <Text style={styles.buttonText}>Tenant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: screenWidth * 0.8, // Use a percentage of screen width
    maxWidth: 300, // Maximum width for larger screens
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    minWidth: 120, // Minimum width for smaller screens
  },
  selectedButton: {
    backgroundColor: '#388E3C', // Darker shade when selected
  },
  buttonText: {
    fontSize: 16,
    color: '#ffffff',
  },
});

export default ParkingSelectionPage;
