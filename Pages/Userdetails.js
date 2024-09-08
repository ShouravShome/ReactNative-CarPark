import React, {useState, useEffect, useContext} from 'react';
import {View, Text, TextInput, Button, StyleSheet, TouchableOpacity} from 'react-native';
import {Card, Input} from 'react-native-elements';
import database from '@react-native-firebase/database';
import UserContext from '../Components/UserContext';

const UserDetails = ({navigation, route}) => {
  const userId = route.params?.userId;

  const [name, setName] = useState('');
  const {userData, setUserData} = useContext(UserContext);
  const isSubmitDisabled = !name || name.length < 4;

  const saveDataToUserTable = async (userId, userData,userDataForApplicationContext) => {
      try {
        await database().ref(`Users/${userId}`).set(userData);
        console.log('Name saved successfully.');
        setUserData(userDataForApplicationContext)
        navigation.navigate('UserType');
      } catch (error) {
        console.error('Error saving name:', error);
      }
    };

    const userDataforDatabase = {
      name: name,
      type: "TBA",
    };

    const userDataForApplicationContext = {
      userId: userId,
      userName: name,
    };
  

  const handleNameChange = text => {
    setName(text);
  };


  const saveDataToUser = async (userId, userDataforDatabase,userDataForApplicationContext) => {
    // await saveDataToOwner(phoneNumberId, ownerData);
    // await saveDataToTenant(phoneNumberId, tenantData);
    await saveDataToUserTable(userId,userDataforDatabase,userDataForApplicationContext)
  };

  return (
    <View style={styles.container}>
      <Card containerStyle={styles.card}>
        <Text style={styles.title}>User Details</Text>
        <Input
          placeholder="Name (min 4 characters)"
          value={name}
          onChangeText={handleNameChange}
          inputStyle={styles.input}
          containerStyle={styles.inputContainer}
        />
        <TouchableOpacity
          style={[styles.button, isSubmitDisabled && styles.disabledButton]}
          onPress={() => saveDataToUser(userId, userDataforDatabase,userDataForApplicationContext)}
          disabled={isSubmitDisabled}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc', // Change color for disabled state
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    marginRight: 5,
  },
});

export default UserDetails;
