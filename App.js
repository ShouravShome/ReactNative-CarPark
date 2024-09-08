import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {StyleSheet, Text, View, Button} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {useEffect, useContext, useState} from 'react';
import {Alert} from 'react-native';
import {sendPushNotification} from './Components/sendpushnotification';
import {requestUserPermission} from './Components/requestuserpermission';
import {checkUserSignin} from './Components/checkusersignin';
import RegistrationScreen from './Pages/Registration';
import SplashScreen from './Pages/Splash';
import UserDetails from './Pages/Userdetails';
import ParkingSelectionPage from './Pages/UserType';
import OwnerParkingScehdule from './Pages/OwnerHomeScreen';
import TenantParkingSchedule from './Pages/TenantHomeScreen';
import TenantConnection from './Pages/TenantConnection';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import OwnerConnection from './Pages/OwnerConnection';
import {UserProvider} from './Components/UserContext';
import CheckingOwnerParkingAvailabilityFromTenantPage from './Pages/CheckParkingAvailabilityOfOwner';
import OwnerUserDetails from './Pages/OwnerUserdetails';
import Information1 from './Pages/Information1';
import Information2 from './Pages/Information2';
import Information3 from './Pages/Information3';
import Information4 from './Pages/Information4';
import OwnerAcceptedConnections from './Pages/OwnerAcceptedConnections';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);
  // Handle the received message here
});

export default function App() {
  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message received:', remoteMessage);
      // Handle the received message here
      const {title, body} = remoteMessage.notification || {};
      Alert.alert(title, body);
    });

    return () => {
      unsubscribeForeground();
    };
  }, []);

  // useEffect(() => {
  //   const unsubscribe = messaging().onNotificationOpenedApp(
  //     async remoteMessage => {
  //       console.log(
  //         'Notification opened from terminated state:',
  //         remoteMessage,
  //       );
  //       // Handle the notification here
  //     },
  //   );

  //   return unsubscribe;
  // }, []);

  // useEffect(() => {
  //   const handleInitialNotification = async () => {
  //     const remoteMessage = await messaging().getInitialNotification();
  //     if (remoteMessage) {
  //       console.log('Notification opened from quit state:', remoteMessage);
  //       // Handle the notification here
  //     }
  //   };

  //   handleInitialNotification();

  //   return () => {}; // No cleanup needed
  // }, []);

  // useEffect(() => {
  //   const unsubscribeMessage = messaging().onMessage(async remoteMessage => {
  //     const {title, body} = remoteMessage.notification || {};
  //     Alert.alert(title, body);
  //   });

  //   return unsubscribeMessage;
  // }, []);

  const tenantHome = 'TenantHome';
  const tenantConnection = 'TenantConnection';
  const ownerHome = 'OwnerHome';
  const ownerConnection = 'OwnerConnection';

  // const UserTypeStack = () => (
  //   <Stack.Navigator initialRouteName="UserTypeSelection" screenOptions={{headerMode: 'false'}}>
  //     <Stack.Screen name="UserTypeSelection" component={ParkingSelectionPage} />
  //     <Stack.Screen name={ownerHome} component={OwnerStackScreen} />
  //     <Stack.Screen name={tenantConnection} component={TenantStackScreen} />
  //   </Stack.Navigator>
  // );

  const OwnerStackScreen = route => (
    <Tab.Navigator
      initialRouteName={ownerHome}
      screenOptions={({route}) => ({
        activeTintColor: 'tomato',
        headerShown: false,
        inactiveTintColor: 'grey',
        labelStyle: {paddingBottom: 10, fontSize: 10},
        style: {padding: 10, height: 70},
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          let rn = route.name;

          if (rn === ownerHome) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (rn === ownerConnection) {
            iconName = focused ? 'list' : 'list-outline';
          }
          // You can return any component that you like here!
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name={ownerHome} component={OwnerParkingScehdule} />
      <Tab.Screen name={ownerConnection} component={OwnerConnection} />
    </Tab.Navigator>
  );
  const TenantStackScreen = () => (
    <Tab.Navigator
      initialRouteName={tenantHome}
      screenOptions={({route}) => ({
        activeTintColor: 'tomato',
        inactiveTintColor: 'grey',
        headerShown: false,
        labelStyle: {paddingBottom: 10, fontSize: 10},
        style: {padding: 10, height: 70},
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          let rn = route.name;

          if (rn === tenantHome) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (rn === tenantConnection) {
            iconName = focused ? 'list' : 'list-outline';
          }

          // You can return any component that you like here!
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name={tenantHome} component={TenantParkingSchedule} />
      <Tab.Screen name={tenantConnection} component={TenantConnection} />
    </Tab.Navigator>
  );

  return (
    <NavigationContainer>
      <UserProvider>
        <Stack.Navigator
          initialRouteName="SplashScreen"
          screenOptions={{headerMode: 'false'}}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Register" component={RegistrationScreen} />
          <Stack.Screen name="UserDetails" component={UserDetails} />
          <Stack.Screen name="ownerUserDetails" component={OwnerUserDetails} />
          <Stack.Screen name="UserType" component={ParkingSelectionPage} />
          <Stack.Screen name="Owner" component={OwnerStackScreen} />
          <Stack.Screen name="Tenant" component={TenantStackScreen} />
          <Stack.Screen
            name="OwnerParkingAvailability"
            component={CheckingOwnerParkingAvailabilityFromTenantPage}
          />
          <Stack.Screen
            name="OwnerAcceptedConnections"
            component={OwnerAcceptedConnections}
          />
          <Stack.Screen name="information1" component={Information1} />
          <Stack.Screen name="information2" component={Information2} />
          <Stack.Screen name="information3" component={Information3} />
          <Stack.Screen name="information4" component={Information4} />
        </Stack.Navigator>
      </UserProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
