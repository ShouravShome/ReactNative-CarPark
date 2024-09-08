import React, {useState, useContext, useEffect} from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';
import {Card, Input} from 'react-native-elements';
import database from '@react-native-firebase/database';
import UserContext from '../Components/UserContext';
import {requestUserPermission} from '../Components/requestuserpermission';

const OwnerUserDetails = ({navigation, route}) => {
  const [address, setAddress] = useState('');
  const [slotNo, setSlotNo] = useState('');
  const {userData, setUserData} = useContext(UserContext);
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState('');
  

  const setUserTypeInUserTable = async userId => {
    try {
      await database().ref(`Users/${userId}/type`).set('Owner');
      console.log('Type saved successfully.');
    } catch (error) {
      console.error('Error saving name:', error);
    }
  };

  const saveDataToOwner = async (ownerId, ownerDetails) => {
    try {
      await setUserTypeInUserTable(ownerId)
      await database().ref(`Owner/${ownerId}`).set(ownerDetails);
      console.log('Data saved successfully.');
      navigation.navigate('Owner');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleAddressChange = text => {
    setAddress(text);
  };

  const handleSlotNoChange = text => {
    setSlotNo(text);
  };

  const ownerData = {
    name: userName,
    address: address,
    slotNo: slotNo,
    deviceToken: token,
    phoneNumber: userId,
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

  useEffect(() => {
    const fetchData = async () => 
    {
        setToken(await requestUserPermission());
        setUserName(userData.userName);
        setUserId(userData.userId);
    };
        fetchData();
  }, []);


  const saveDataToUser = async (userId, ownerData) => {
    await saveDataToOwner(userId, ownerData);
  };

  return (
    <View style={styles.container}>
      <Card containerStyle={styles.card}>
        <Text style={styles.title}>Welcome!</Text>
        <Input
          placeholder="Enter your address"
          value={address}
          onChangeText={handleAddressChange}
          inputStyle={styles.input}
          containerStyle={styles.inputContainer}
          leftIcon={{type: 'font-awesome', name: 'map-marker'}}
          placeholderTextColor="#aaa"
        />
        <Input
          placeholder="Enter your slot number"
          value={slotNo}
          onChangeText={handleSlotNoChange}
          inputStyle={styles.input}
          containerStyle={styles.inputContainer}
          leftIcon={{type: 'font-awesome', name: 'sort-numeric-asc'}}
          placeholderTextColor="#aaa"
        />
        <Button
          title="Submit"
          onPress={() => saveDataToUser(userId, ownerData)}
          buttonStyle={styles.button}
          titleStyle={styles.buttonText}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  input: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    padding: 10,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OwnerUserDetails;
