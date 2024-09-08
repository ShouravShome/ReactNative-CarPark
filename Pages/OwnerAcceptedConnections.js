import React, {useState, useContext, useEffect, Refres} from 'react';
import {RefreshControl, ScrollView} from 'react-native';
import database from '@react-native-firebase/database';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon1 from 'react-native-vector-icons/AntDesign';
import UserContext from '../Components/UserContext';
import {sendPushNotification} from '../Components/sendpushnotification';
import Contacts from 'react-native-contacts'; // Import Contacts package
import {PermissionsAndroid} from 'react-native';
import {selectContactPhone} from 'react-native-select-contact';
import {color} from 'react-native-elements/dist/helpers';

const OwnerAcceptedConnections = ({route, navigation}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [openComponentFindByNumber, setOpenComponentFindByNumber] =
    useState(false);
  const [searchingOwnerPhoneNumber, setSearchingOwnerPhoneNumber] =
    useState('');
  const [ownerDataFromDB, setOwnerDataFromDB] = useState(null);
  const [ownerNameFromDB, setOwnerNameFromDB] = useState(null); // State to hold fetched connection data
  const [ownerIdFromDB, setOwnerIdFromDB] = useState(null);

  const [connections, setConnections] = useState([]);
  const [isChanged, setChanged] = useState(false);

  const {userData, setUserData} = useContext(UserContext);
  const ownerDetailFromPreviousPage = userData;
  const ownerIdFromPreviousPage = ownerDetailFromPreviousPage.userId;
  const ownerName = ownerDetailFromPreviousPage.userName;

  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState([]);

  const getConenctionsFromAcceptedConnectionsTable = async () => {
    try {
      const snapshot = await database()
        .ref(`AcceptedConnection/`)
        .once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Error getting phone number:', error);
      return null;
    }
  };

  //gets all the connections from AcceptedConnection node. and only pushes the connections that matches with OwnerId in the array allConnectionsInOwnersAccount. 
  useEffect(() => {
    const fetchDataFromDB = async () => {
      const allConnectionsInOwnersAccount = [];
      const storeAvailabilityOfFiveDays = [];
      const data = await getConenctionsFromAcceptedConnectionsTable();
      if (data) {
        const keys = Object.keys(data);

        for (const key of keys) {
          const entry = data[key];
          if (entry.OwnerId === ownerIdFromPreviousPage) {
            // Use an IIFE to handle the asynchronous operations properly
            allConnectionsInOwnersAccount.push({
              key: key,
              OwnerId: entry.OwnerId,
              OwnerName: entry.OwnerName,
              TenantId: entry.TenantId,
              TenantName: entry.TenantName,
            }); // Immediately invoke the async function
          }
        }
      } else {
        console.log('Data is null.');
      }
      setConnections(allConnectionsInOwnersAccount);
      console.log(allConnectionsInOwnersAccount);
    };
    const handleDataChange = snapshot => {
      // This callback will be called whenever there's a change in Firebase database
      // You can update the state accordingly
      fetchDataFromDB();
    };
    // Set up Firebase listener
    const ref = database().ref('AcceptedConnection/');
    ref.on('value', handleDataChange);
    const anotherRef = database().ref('Owner/');
    anotherRef.on('value', handleDataChange);
    // console.log(tenantRequests);
    return () => {
      ref.off('value', handleDataChange);
      anotherRef.off('value', handleDataChange);
    };
  }, [isChanged]);

  const handleRefresh = async () => {
    setRefreshing(true); // Set refreshing to true when user pulls to refresh
    await fetchDataFromDB(); // Call your data fetching function
    setRefreshing(false); // After fetching, set refreshing to false
  };

  useEffect(() => {
    const handleBackPress = () => {
      navigation.goBack();
      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [navigation]);

  const arrowButton = () =>{
    navigation.goBack()
  }
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <View style={styles.arrowIcon}>
          <TouchableOpacity onPress={arrowButton}>
            <Icon1 name="arrowleft" size={30} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.welcomeContainer}>
          <Text style={styles.title}>Connections</Text>
        </View>
        <View style={{flex: 0.25}}></View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        {connections && connections.length > 0 ? (
          connections.map(connects => (
            <View style={styles.card} key={connects.key}>
              <View style={styles.insideCardContainer}>
                <View style={styles.leftContainer}>
                  <View style={styles.nameContainer}>
                    <Text style={styles.cardText}>Name: {connects.TenantName}</Text>
                  </View>
                </View>
                <View style={styles.rightContainerCard}>
                  <View style={styles.iconContainerfollow}>
                    <TouchableOpacity>{/*future implementation. add a tenant to Favourites list*/}
                      <Icon
                        style={{marginRight: 20, alignSelf: 'center'}}
                        name="heart"
                        size={20}
                        color="red"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity>{/*future implementation. remove a tenant from connections*/}
                      <Icon name="user-times" size={20} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noConnectionContainer}>
            <Text style={styles.noConnectionText}>
              You have not added any connections.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    width: '100%',
    padding: 10,
    marginTop: 30,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50, // Adjust based on your requirement
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
    backgroundColor: 'white', // Adjust as needed
  },
  arrowIcon: {
    flex: 0.25,
  },
  welcomeContainer: {
    flex: 0.5,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    flex: 1,
    justifyContent: 'flex-end', // Stick the modal to the bottom
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
    margin: 0, // Remove any margin
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '100%', // Make the modal cover the whole screen width
    alignItems: 'center',
  },
  findOptionsContainer: {
    width: '100%',
    paddingHorizontal: 5,
  },
  findOptionPhone: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  findOption: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  findOptionText: {
    fontSize: 18,
    marginLeft: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: 'lightblue',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    width: '100%',
    padding: 10,
    marginBottom: 10,
  },
  connectionDataContainer: {
    alignItems: 'center',
  },
  connectionName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  connectionPhone: {
    fontSize: 16,
    marginRight: 60,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  connectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom:15,
  },
  insideCardContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightContainerCard: {
    position: 'absolute',
    top: 0,
    right: 0,
    flex: 0.25,
  },
  cardText: {
    fontSize: 17,
  },
  addressText: {
    fontSize: 19,
  },
  availabilityText: {
    fontSize: 18,
    color: 'green',
    fontWeight: '500',
  },
  notAvailabilityText: {
    fontSize: 18,
    color: 'red',
    fontWeight: '500',
  },
  leftContainer: {
    flex: 0.75,
  },
  rightContainer: {
    flexDirection: 'row',
  },
  iconContainer: {
    marginLeft: 10,
  },
  iconContainerfollow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkAvailabilityButton: {
    backgroundColor: 'orange',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: '100%',
    marginTop: 20,
  },
  checkAvailabilityButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noConnectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noConnectionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  connectionsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContainer: {
    margin: 10,
    padding: 10,
    backgroundColor: '#fff', // Card background color
    borderRadius: 8,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: {width: 1, height: 1}, // Shadow for iOS
    shadowOpacity: 0.3, // Shadow for iOS
    shadowRadius: 2, // Shadow for iOS
  },
  phoneNumberContainer: {
    flexDirection: 'row', // Arrange children in a row
    alignItems: 'center', // Align items vertically
  },
});

export default OwnerAcceptedConnections;
