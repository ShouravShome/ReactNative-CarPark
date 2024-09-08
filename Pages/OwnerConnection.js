import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import database from '@react-native-firebase/database';
import UserContext from '../Components/UserContext';
import {sendPushNotification} from '../Components/sendpushnotification';

const OwnerConnection = ({route, navigation}) => {
  const [tenantRequests, setTenantRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const {userData, setUserData} = useContext(UserContext);
  const ownerDetailFromPreviousPage = userData;
  const ownerIdFromPreviousPage = ownerDetailFromPreviousPage.userId;
  const ownerName = ownerDetailFromPreviousPage.userName;
  const [isChanged, setChanged] = useState(false);

  const getTenantRequestFromPendingDBtable = async () => {
    try {
      const snapshot = await database().ref(`PendingConnection/`).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Error getting phone number:', error);
      return null;
    }
  };

  //when owner accepts connection request of tenant, it deletes the entry from PendingConnection node of the database
  const deleteTenantRequestFromPendingDBtable = async key => {
    try {
      await database().ref(`PendingConnection/${key}`).remove();
      setChanged(isChanged => !isChanged);
      Alert.alert(
        'TakeMyPark',
        'Your rejected the connection request',
        [
          {
            text: 'OK',
          },
        ],
        {cancelable: false},
      );
    } catch (error) {
      Alert.alert(
        'TakeMyPark',
        'Something went wrong! Try again later!',
        [
          {
            text: 'OK',
          },
        ],
        {cancelable: true},
      );
    }
  };
  const navigateToOwnerAcceptedConnections = () => {
    navigation.navigate('OwnerAcceptedConnections');
  };

  //add the connection to AcceptedConnection node of the database. The node is combination of ownerId_tenantId. 
  const addTenantToAcceptedConnectionsTable = async (
    ownerId_tenantId,
    dataToAddInConnectionDB,
  ) => {
    try {
      await database()
        .ref(`AcceptedConnection/${ownerId_tenantId}`)
        .set(dataToAddInConnectionDB);
      setChanged(isChanged => !isChanged);
      const snapshot = await database()
        .ref(`Tenant/${dataToAddInConnectionDB.TenantId}/deviceToken`)
        .once('value');
      const body = 'Your connection request has been accepted!';
      await sendPushNotification(body, snapshot.val());
      await database().ref(`PendingConnection/${ownerId_tenantId}`).remove();
      Alert.alert(
        'TakeMyPark',
        'Your accepted the connection request',
        [
          {
            text: 'OK',
          },
        ],
        {cancelable: false},
      );
    } catch (error) {
      Alert.alert(
        'TakeMyPark',
        'Something went wrong! Try again later!',
        [
          {
            text: 'OK',
          },
        ],
        {cancelable: true},
      );
    }
  };

  //accept button
  const handleAccept = key => {
    //console.log(key);

    for (const request of tenantRequests) {
      if (request.key === key) {
        console.log(request.key);
        const detailsToAddInConnectionDB = {
          OwnerId: request.OwnerId,
          OwnerName: request.OwnerName,
          TenantId: request.TenantId,
          TenantName: request.TenantName,
        };
        addTenantToAcceptedConnectionsTable(
          request.key,
          detailsToAddInConnectionDB,
        );
      }
    }
  };

  //reject button
  const handleReject = key => {
    // Reject logic here
    for (const request of tenantRequests) {
      if (request.key === key) {
        console.log(request.key);
        const detailsToAddInConnectionDB = {
          OwnerId: request.OwnerId,
          OwnerName: request.OwnerName,
          TenantId: request.TenantId,
          TenantName: request.TenantName,
        };
        deleteTenantRequestFromPendingDBtable(request.key);
      }
    }
  };

  const refreshRequests = async () => {
    setLoading(true);
    await fetchDataFromDB();
    setLoading(false);
  };

  //gets all the connections from PendingConnection node. and only pushes the ones that matches with OwnerId in the array allFriendRequestInOwnerAcc. 
  useEffect(() => {
    const fetchDataFromDB = async () => {
      const allFriendRequestInOwnerAcc = [];
      const data = await getTenantRequestFromPendingDBtable();
      if (data) {
        Object.keys(data).forEach(key => {
          const entry = data[key];
          if (entry.OwnerId === ownerIdFromPreviousPage) {
            allFriendRequestInOwnerAcc.push({
              key: key,
              OwnerId: entry.OwnerId,
              OwnerName: entry.OwnerName,
              TenantId: entry.TenantId,
              TenantName: entry.TenantName,
            });
          }
        });
      } else {
        console.log('Data is null.');
      }
      setTenantRequests(allFriendRequestInOwnerAcc);
    };
    const handleDataChange = snapshot => {
      // This callback will be called whenever there's a change in Firebase database
      // You can update the state accordingly
      fetchDataFromDB();
    };

    // Set up Firebase listener
    const ref = database().ref('PendingConnection/');
    ref.on('value', handleDataChange);

    // console.log(tenantRequests);
  }, [isChanged]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => backHandler.remove();
  }, []);

  const handleBackPress = () => {
    if (!isBackPressedOnce()) {
      markBackPressed();
      showToast('Press back again to exit');
      return true;
    } else {
      // Exiting the app
      BackHandler.exitApp();
      return false;
    }
  };

  let lastBackPressed = 0;

  const isBackPressedOnce = () => {
    const currentTime = new Date().getTime();
    const BACK_PRESS_TIMEOUT = 2000; // 2 seconds
    return currentTime - lastBackPressed < BACK_PRESS_TIMEOUT;
  };

  const markBackPressed = () => {
    lastBackPressed = new Date().getTime();
  };

  const showToast = message => {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Tenant Requests</Text>
      </View>
      <TouchableOpacity
        style={styles.connectionsButtonContainer}
        onPress={navigateToOwnerAcceptedConnections}
        activeOpacity={0.7}>
        <Text style={styles.connectionsButtonText}> Accepted Connections </Text>
      </TouchableOpacity>
      {tenantRequests && tenantRequests.length > 0 ? (
        tenantRequests.map(request => (
          <View key={request.key} style={styles.card}>
            <Text style={styles.name}>Name: {request.TenantName}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => handleAccept(request.key)}
                style={[styles.button, styles.acceptButton]}>
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReject(request.key)}
                style={[styles.button, styles.rejectButton]}>
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noRequestsText}>No tenant requests available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#4caf50',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 5,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  name: {
    fontSize: 18,
    marginBottom: 10,
    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  acceptButton: {
    backgroundColor: '#4caf50',
    marginRight: 10,
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  noRequestsText: {
    alignSelf: 'center',
    fontSize: 18,
    marginTop: 30,
  },
  connectionsButtonContainer: {
    backgroundColor: '#55c2da',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'black',
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 20,
  },
  connectionsButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default OwnerConnection;
