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
import UserContext from '../Components/UserContext';
import {sendPushNotification} from '../Components/sendpushnotification';
import Contacts from 'react-native-contacts'; // Import Contacts package
import {PermissionsAndroid} from 'react-native';
import {selectContactPhone} from 'react-native-select-contact';
import {color} from 'react-native-elements/dist/helpers';

const TenantConnection = ({route, navigation}) => {
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
  const tenantDataFromPreviousPage = userData;
  const tenantName = tenantDataFromPreviousPage.userName;
  const tenantId = tenantDataFromPreviousPage.userId;

  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState([]);

  const currentDate = new Date();
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setOpenComponentFindByNumber(false);
    setSearchingOwnerPhoneNumber('');
    setOwnerDataFromDB(null); // Reset connection data
  };
//opens the phone contacts.
  const openContactPicker = async () => {
    try {
      const selection = await selectContactPhone();
      if (!selection) {
        return;
      }
      const {contact, selectedPhone} = selection;
      // Extract last 9 digits of the phone number
      const phoneNumber = selectedPhone.number.replace(/\D/g, '').slice(-9);
      // Format the phone number with +61 prefix
      const formattedPhoneNumber = '+61' + phoneNumber;
      setSearchingOwnerPhoneNumber(formattedPhoneNumber);
    } catch (error) {
      console.error('Error selecting contact:', error);
    }
  };
//triggered when searching if the owner exists in the  database.
  const handleSearchConnection = async () => {
    setOwnerDataFromDB(null)
    if (searchingOwnerPhoneNumber === '') {
      Alert.alert(
        'TakeMyPark',
        'No number has been entered!',
        [
          {
            text: 'OK',
            onPress: () => setSearchingOwnerPhoneNumber(''),
          },
        ],
        {cancelable: false},
      );
    } else {
      if (tenantId === searchingOwnerPhoneNumber) {
        Alert.alert(
          'TakeMyPark',
          'You cannot add your own number. Sorry!',
          [
            {
              text: 'OK',
              onPress: () => setSearchingOwnerPhoneNumber(''),
            },
          ],
          {cancelable: false},
        );
      } else {
        try {
          const snapshot = await database()
            .ref(`Owner/${searchingOwnerPhoneNumber}`)
            .once('value');
          if (snapshot.exists()) {
            setOwnerDataFromDB(snapshot.val()); // Set connection data if exists
            setSearchingOwnerPhoneNumber('');

            setOwnerIdFromDB(snapshot.val().phoneNumber);
            setOwnerNameFromDB(snapshot.val().name);
          } else {
            Alert.alert(
              'TakeMyPark',
              'User Not Found Try Again! Check the number format!',
              [
                {
                  text: 'OK',
                  onPress: () => setSearchingOwnerPhoneNumber(''),
                },
              ],
              {cancelable: false},
            );
          }
        } catch (error) {
          console.error('Error getting phone number:', error);
        }
      }
    }
  };
//triggered when trying to send a connection request to an owner
  const connectTenant = async (ownerId, tenantId, ownerDataFromDB) => {
    try {
      const snapshot = await database()
        .ref(`PendingConnection/${ownerId}_${tenantId}`)
        .once('value');
      if (snapshot.exists()) {
        Alert.alert(
          'TakeMyPark',
          'You already sent a request to this owner!',
          [
            {
              text: 'OK',
              onPress: () => closeModal(),
            },
          ],
          {cancelable: false},
        );
      } else {
        const snapshot = await database()
          .ref(`AcceptedConnection/${ownerId}_${tenantId}`)
          .once('value');
        if (snapshot.exists()) {
          Alert.alert(
            'TakeMyPark',
            'You already added this owner!',
            [
              {
                text: 'OK',
                onPress: () => closeModal(),
              },
            ],
            {cancelable: false},
          );
        } else {
          await database()
            .ref(`PendingConnection/${ownerId}_${tenantId}`)
            .set(ownerDataFromDB);
          const snapshot = await database()
            .ref(`Owner/${ownerId}/deviceToken`)
            .once('value');
          const body = 'You have received a new connection request!';
          await sendPushNotification(body, snapshot.val());
          Alert.alert(
            'TakeMyPark',
            'You have sent a request to this Owner!',
            [
              {
                text: 'OK',
                onPress: () => closeModal(),
              },
            ],
            {cancelable: false},
          );
        }
      }
    } catch (error) {
      Alert.alert(
        'TakeMyPark',
        'Something went wrong! Try again leter!',
        [
          {
            text: 'OK',
            onPress: () => closeModal(),
          },
        ],
        {cancelable: false},
      );
    }
  };

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

  const connectionDetails = {
    OwnerId: ownerIdFromDB,
    OwnerName: ownerNameFromDB,
    TenantId: tenantId,
    TenantName: tenantName,
  };

  const handleFindPhoneNumber = () => {
    setOpenComponentFindByNumber(true);
  };

  const handleBackdropPress = () => {
    closeModal();
  };

  const handleModalPress = () => {
    // Handle press on modal content if needed
  };

  //gets all the connection from AcceptedConnection node. Then gets the connections of specific tenant by matching it with TenantId. 
  useEffect(() => {
    const fetchDataFromDB = async () => {
      const allConnectionsInTenantsAccount = [];
      const storeAvailabilityOfFiveDays = [];
      const data = await getConenctionsFromAcceptedConnectionsTable();
      console.log(tenantId);
      if (data) {
        const keys = Object.keys(data);

        for (const key of keys) {
          const entry = data[key];
          if (entry.TenantId === tenantId) {//seperating the connections that matches with specific tenant id. 
            // Use an IIFE to handle the asynchronous operations properly
            let storeAvailabilityOfFiveDays = []; // Initialize within the async function
            for (let i = 0; i < 7; i++) {
              const date = new Date();
              date.setDate(currentDate.getDate() + i);
              const formattedDate = `${date.getDate()}/${
                monthNames[date.getMonth()]
              }`;
              const dayName = days[date.getDay()];
              const firstThreeLettersOfDayName = dayName.substring(0, 3);

              const snapshot = await database()//getting the availability from the Owner node.
                .ref(`Owner/${entry.OwnerId}/schedule/${dayName}`)
                .once('value');
              if (snapshot.val() === 'available') {
                const availability = `${formattedDate}(${firstThreeLettersOfDayName}): Available`;
                storeAvailabilityOfFiveDays.push(availability);
              } else {
                const availability = `${formattedDate}(${firstThreeLettersOfDayName}): Not Available`;
                storeAvailabilityOfFiveDays.push(availability);
              }
            }
            const address = await database()
              .ref(`Owner/${entry.OwnerId}/address`)
              .once('value');
            const slotNo = await database()
              .ref(`Owner/${entry.OwnerId}/slotNo`)
              .once('value');

            //shows the availability status in the card. 
            allConnectionsInTenantsAccount.push({
              key: key,
              OwnerId: entry.OwnerId,
              OwnerName: entry.OwnerName,
              TenantId: entry.TenantId,
              TenantName: entry.TenantName,
              address: address.val(),
              slotNo: slotNo.val(),
              firstDate: storeAvailabilityOfFiveDays[0],
              secondDate: storeAvailabilityOfFiveDays[1],
              thirdDate: storeAvailabilityOfFiveDays[2],
              fourthDate: storeAvailabilityOfFiveDays[3],
              fifthDate: storeAvailabilityOfFiveDays[4],
              sixthDate: storeAvailabilityOfFiveDays[5],
              seventhDate: storeAvailabilityOfFiveDays[6],
            }); // Immediately invoke the async function
          }
        }
      } else {
        console.log('Data is null.');
      }
      setConnections(allConnectionsInTenantsAccount);
      console.log(allConnectionsInTenantsAccount);
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

  const handleRefresh = async () => {
    setRefreshing(true); // Set refreshing to true when user pulls to refresh
    await fetchDataFromDB(); // Call your data fetching function
    setRefreshing(false); // After fetching, set refreshing to false
  };

  const handleCheckAvailability = (OwnerId, OwnerName) => {
    const storeOwnerData = {
      OwnerId: OwnerId,
      OwnerName: OwnerName,
    };
    console.log(storeOwnerData);
    navigateToTenantHomeWithOwnerDetails(storeOwnerData);
  };
  const navigateToTenantHomeWithOwnerDetails = ownerData => {
    navigation.navigate('OwnerParkingAvailability', {value: ownerData});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connections</Text>
      <TouchableOpacity onPress={openModal} style={styles.addButton}>
        <Icon name="plus" size={24} color="black" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <TouchableWithoutFeedback onPress={handleModalPress}>
                <View style={styles.modalContent}>
                  {!openComponentFindByNumber ? (
                    <View style={styles.findOptionsContainer}>
                      <TouchableOpacity
                        onPress={handleFindPhoneNumber}
                        style={styles.findOptionPhone}>
                        <Icon name="phone" size={24} color="black" />
                        <Text style={styles.findOptionText}>
                          {' '}
                          Find by Phone
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.findOption}>
                        <Icon name="envelope" size={24} color="black" />
                        <Text style={styles.findOptionText}>Find by Email</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Find by phone</Text>
                      {ownerDataFromDB && (
                        <View style={styles.connectionDataContainer}>
                          <Text style={styles.connectionName}>
                            {ownerDataFromDB.name}
                          </Text>
                          <View style={styles.cardContainer}>
                            <View style={styles.phoneNumberContainer}>
                              <Text style={styles.connectionPhone}>
                                {ownerDataFromDB.phoneNumber}
                              </Text>
                              <TouchableOpacity
                                style={styles.connectButton}
                                onPress={() =>
                                  connectTenant(
                                    ownerIdFromDB,
                                    tenantId,
                                    connectionDetails,
                                  )
                                }>
                                <Text style={styles.connectButtonText}>
                                  Connect
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )}
                      <TextInput
                        style={styles.input}
                        placeholder="Phone Number (eg:+61xxxxxxxxx)"
                        keyboardType="phone-pad"
                        value={searchingOwnerPhoneNumber}
                        onChangeText={setSearchingOwnerPhoneNumber}
                      />
                      <TouchableOpacity
                        onPress={() => handleSearchConnection()}
                        style={styles.modalButton}>
                        <Text>Search Owner</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={openContactPicker}
                        style={styles.modalButton}>
                        <Text style={styles.contactButtonText}>
                          Search From Contacts
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <ScrollView
        contentContainerStyle={styles.scrollViewContainer}
        >
        {connections && connections.length > 0 ? (
          connections.map(connects => (
            <View style={styles.card} key={connects.key}>
              <View style={styles.cardContainer1}>
                <View style={styles.insideCardContainer}>
                  <View style={styles.leftContainer}>
                    <View style={styles.nameContainer}>
                      <Text style={styles.cardText}>Name: {connects.OwnerName}</Text>
                    </View>
                    <Text style={styles.addressText}>
                      Address: {connects.address}
                    </Text>
                    <Text style={styles.addressText}>
                      Slot No: {connects.slotNo}
                    </Text>
                    {connects.firstDate.includes('Not Available') ? (
                      <Text style={styles.notAvailabilityText}>
                        {connects.firstDate}
                      </Text>
                    ) : (
                      <Text style={styles.availabilityText}>
                        {connects.firstDate}
                      </Text>
                    )}
                    {connects.secondDate.includes('Not Available') ? (
                      <Text style={styles.notAvailabilityText}>
                        {connects.secondDate}
                      </Text>
                    ) : (
                      <Text style={styles.availabilityText}>
                        {connects.secondDate}
                      </Text>
                    )}
                    {connects.thirdDate.includes('Not Available') ? (
                      <Text style={styles.notAvailabilityText}>
                        {connects.thirdDate}
                      </Text>
                    ) : (
                      <Text style={styles.availabilityText}>
                        {connects.thirdDate}
                      </Text>
                    )}
                    {connects.fourthDate.includes('Not Available') ? (
                      <Text style={styles.notAvailabilityText}>
                        {connects.fourthDate}
                      </Text>
                    ) : (
                      <Text style={styles.availabilityText}>
                        {connects.fourthDate}
                      </Text>
                    )}
                    {connects.fifthDate.includes('Not Available') ? (
                      <Text style={styles.notAvailabilityText}>
                        {connects.fifthDate}
                      </Text>
                    ) : (
                      <Text style={styles.availabilityText}>
                        {connects.fifthDate}
                      </Text>
                    )}
                    {connects.sixthDate.includes('Not Available') ? (
                      <Text style={styles.notAvailabilityText}>
                        {connects.sixthDate}
                      </Text>
                    ) : (
                      <Text style={styles.availabilityText}>
                        {connects.sixthDate}
                      </Text>
                    )}
                    {connects.seventhDate.includes('Not Available') ? (
                      <Text style={styles.notAvailabilityText}>
                        {connects.seventhDate}
                      </Text>
                    ) : (
                      <Text style={styles.availabilityText}>
                        {connects.seventhDate}
                      </Text>
                    )}
                  </View>
                  <View style={styles.rightContainerCard}>
                    <View style={styles.iconContainerfollow}>
                      <TouchableOpacity>{/*future implementation. add an owner to Favourites list*/}
                        <Icon
                          style={{marginRight: 20, alignSelf: 'center'}}
                          name="heart"
                          size={20}
                          color="red"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity>{/*future implementation. remove a owner from connections*/}
                        <Icon name="user-times" size={20} color="black" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.checkAvailabilityButton}
                  onPress={() =>
                    handleCheckAvailability(
                      connects.OwnerId,
                      connects.OwnerName,
                    )
                  }>
                  <Text style={styles.checkAvailabilityButtonText}>
                    Check Availability
                  </Text>
                </TouchableOpacity>
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
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    position: 'absolute',
    top: 10,
    left: 20,
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
    marginBottom:20,
  },
  cardContainer1: {
    flex: 1,
  },
  insideCardContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: {
    fontSize: 20,
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
  rightContainerCard: {
    position: 'absolute',
    top: 0,
    right: 0,
    flex: 0.25,
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
    alignItems: 'center',
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

export default TenantConnection;
