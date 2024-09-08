import React, { useState, useContext, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { CountryPicker } from '../Components/CountryPickerModal/src/CountryPicker';
import {requestUserPermission} from '../Components/requestuserpermission';
import UserContext from '../Components/UserContext';
import { PermissionsAndroid } from 'react-native';

const RegistrationScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumberWithCode, setPhoneNumberWithCode] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState(null);
  const {userData, setUserData} = useContext(UserContext);
  const [selectedCountry, setSelectedCountry] = useState({
    cca2: 'AU',
    callingCode: '61',
  });

  
  

  const handleCountryCodeChange = country => {
    setSelectedCountry(country);
  };

  const signInWithPhoneNumber = async () => {
    try {
      if (!phoneNumber || phoneNumber.length !== 9) {
        console.log('Please enter a valid phone number with 9 digits.');
        return;
      }

      setIsLoading(true);
      const fullPhoneNumber = `+${selectedCountry.callingCode}${phoneNumber}`
      const confirmation = await auth().signInWithPhoneNumber(fullPhoneNumber);
      setPhoneNumberWithCode(fullPhoneNumber)
      setConfirm(confirmation);
      setShowOTP(true);
    } catch (error) {
      Alert.alert(
        'TakeMyPark',
        'Something went wrong. Please try again!',
        [
          {
            text: 'OK',
          },
        ],
        {cancelable: false},
      );
    } finally {
      setIsLoading(false);
    }
  };

  async function confirmCode() {
    try {
      setIsLoading(true);
      await confirm.confirm(otp);
      getPhoneNumber(phoneNumberWithCode);
    } catch (error) {
      Alert.alert(
        'TakeMyPark',
        'The OTP does not match! Please try again.',
        [
          {
            text: 'OK',
          },
        ],
        {cancelable: false},
      );
    } finally {
      setIsLoading(false);
    }
  }

  const getPhoneNumber = async (phoneNumber) => {
    try {
      const snapshot = await database().ref(`Users/${phoneNumber}`).once('value');
      if (snapshot.exists()) {
        const userDataTenantOrOwner = {
          userId: phoneNumber,
          userName: snapshot.val().name,
        };
        setUserData(userDataTenantOrOwner);
        const token = await requestUserPermission();
        if(snapshot.val().type == "Owner"){
          await database().ref(`Owner/${phoneNumber}/deviceToken`).set(token);
          navigation.navigate('Owner');
        }else if(snapshot.val().type == "Tenant")
        {
          await database().ref(`Tenant/${phoneNumber}/deviceToken`).set(token);
          navigation.navigate('Tenant');
        }
        else{
          navigation.navigate('UserDetails', { userId: phoneNumber });
          console.log('done');
        }
      } else {
        navigation.navigate('UserDetails', { userId: phoneNumber });
        console.log('done');
      }
    } catch (error) {
      console.error('Error getting phone number:', error);
      return null;
    }
  };

  const isNextDisabled = !phoneNumber || phoneNumber.length !== 9;
  const isValidateDisabled = !otp || otp.length !==6;

  useEffect(() => {
    const requestReadContactsPermission= async ()=> {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            'title': 'App Premission',
            'message': 'Chat x App need permission.'
          }
        )
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("You can read contacts")
        } else {
          console.log("read contacts permission denied")
        }
      } catch (err) {
        console.warn(err)
      }
    }
    requestReadContactsPermission();
  }, []);


  return (
    <View style={styles.container}>
      {!showOTP ? (
        <View style={styles.registrationContainer}>
          <Text style={styles.header}>Enter your phone number</Text>
          <View style={styles.inputContainer}>
            <View style={styles.countryPickerContainer}>
              <CountryPicker
                withEmoji
                withFilter
                onSelect={handleCountryCodeChange}
                countryCode={selectedCountry.cca2}
                visible={false}
              />
              <Text style={styles.countryCode}>{`+${selectedCountry.callingCode}`}</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Phone Number (no phone code)"
              keyboardType="numeric"
              onChangeText={text => setPhoneNumber(text.replace(/[^0-9]/g, '').slice(0, 9))}
              value={phoneNumber}
              maxLength={9}
            />
          </View>
          <TouchableOpacity
            style={[styles.button, isNextDisabled && styles.disabledButton]}
            onPress={signInWithPhoneNumber}
            disabled={isNextDisabled}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.registrationContainer}>
          <Text style={styles.header}>Enter OTP</Text>
          <TextInput
            style={styles.otpinput}
            placeholder="6 digit OTP"
            keyboardType="numeric"
            onChangeText={text => setOTP(text.replace(/[^0-9]/g, '').slice(0, 9))}
            value={otp}
            maxLength={6}
          />
          <TouchableOpacity style={[styles.button, isValidateDisabled && styles.disabledButton]} onPress={confirmCode}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  registrationContainer: {
    width: '80%',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
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
  countryPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  countryCode: {
    fontSize: 16,
    color: '#000',
  },
  otpinput:{
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  }
});

export default RegistrationScreen;
