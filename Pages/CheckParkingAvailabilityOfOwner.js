import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import database from '@react-native-firebase/database';
import UserContext from '../Components/UserContext';
import {sendPushNotification} from '../Components/sendpushnotification';
//opens modal when tenant wants to cancel an already sent request.
const ModalForCancelParkingRequest = ({
  visible,
  onRequestClose,
  onReject,
  onAccept,
}) => {
  if (!visible) {
    return null;
  } else {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onRequestClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.alertIconContainer}>
              <Icon name="checkcircle" size={40} color="green" />
            </View>
            <Text style={styles.alertTitle}>Cancel Request?</Text>
            <Text style={styles.alertBody}>
              Are you sure you want to cancel request?
            </Text>
            <View style={styles.alertButtonContainer}>
              <TouchableOpacity
                style={[styles.alertButton, {backgroundColor: '#55c2da'}]}
                onPress={onAccept}>
                <Text style={styles.alertButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertButton, {backgroundColor: '#55c2da'}]}
                onPress={onReject}>
                <Text style={styles.alertButtonText}>No </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
};
//opens modal when tenant wants to cancel an already booked parking. 
const ModalForCancelBooking = ({
  visible,
  onRequestClose,
  onReject,
  onAccept,
}) => {
  if (visible === 'false') {
    return null;
  } else {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onRequestClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.alertIconContainer}>
              <Icon name="checkcircle" size={40} color="green" />
            </View>
            <Text style={styles.alertTitle}>Cancel Booking</Text>
            <Text style={styles.alertBody}>
              Do you want to cancel the booking?
            </Text>
            <View style={styles.alertButtonContainer}>
              <TouchableOpacity
                style={[styles.alertButton, {backgroundColor: '#55c2da'}]}
                onPress={onAccept}>
                <Text style={styles.alertButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertButton, {backgroundColor: '#55c2da'}]}
                onPress={onReject}>
                <Text style={styles.alertButtonText}>No </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
};
//Same as OwnerHomeScreen.js
const CardShowingDateWiseInfo = ({
  date,
  dayName,
  isCurrentDate,
  availability,
  onPress,
  TenantId,
}) => {
  if (availability.includes('_')) {
    var splittedText = availability.split('_');
    var status = splittedText[0];
    var requestName = splittedText[1];
    var requestId = splittedText[2];
  }
  if (availability.includes('-')) {
    var splittedText1 = availability.split('-');
    var bookedName = splittedText1[0];
    var bookedId = splittedText1[1];
  }

  let availabilityText;
  switch (availability) {
    case 'available':
      availabilityText = 'Available to Book';
      break;
    case `Request_${requestName}_${requestId}`:
      if (requestId === TenantId) {
        console.log(requestName);
        console.log('gotcha');
        availabilityText = `You have requested a parking!`;
        break;
      } else {
        console.log(TenantId);
        availabilityText = 'Not Available';
        break;
      }

    case 'not available':
      availabilityText = 'Not Available';
      break;
    default:
      if (bookedId === TenantId) {
        availabilityText = `Already Booked a parking.`;
        break;
      } else {
        availabilityText = 'Not Available';
        break;
      }
  }

  const ConditionalRendering = () => {
    if (availabilityText === 'Available to Book') {
      return (
        <TouchableOpacity
          style={styles.sendRequestButtonContainer}
          onPress={onPress}
          activeOpacity={0.7}>
          <Text style={styles.buttonText}>  Sent Request  </Text>
        </TouchableOpacity>
      );
    } else if (availabilityText.includes('requested')) {
      return (
        <TouchableOpacity
          style={styles.cancelRequestButtonContainer}
          onPress={onPress}
          activeOpacity={0.7}>
          <Text style={styles.cancelRequestbuttonText}>Cancel Request</Text>
        </TouchableOpacity>
      );
    } else if (availabilityText === 'Not Available') {
      return (
        <TouchableOpacity
          style={[styles.buttonContainer, {backgroundColor: 'gray'}]}
          activeOpacity={1}>
          <Text style={[styles.buttonText, {color: 'lightgray'}]}>  Not Available  </Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          style={styles.cancelBookingButtonContainer}
          onPress={onPress}
          activeOpacity={0.7}>
          <Text style={styles.buttonText}>Cancel Booking</Text>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={{flexDirection: 'row'}}>
        <View style={styles.leftContainer}>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.dayNameText}>{dayName}</Text>
        </View>
        <View style={styles.rightContainer}>
          <ConditionalRendering />
        </View>
      </View>
      <View style={styles.middleContainer}>
        {availabilityText === 'You have requested a parking!' ? (
          <Text style={styles.requestedTextAvailable}>{availabilityText}</Text>
        ) : availabilityText === 'Already Booked a parking.' ? (
          <Text style={styles.bookedTextAvailable}>{availabilityText}</Text>
        ) : (
          <Text style={styles.availabilityText}>{availabilityText}</Text>
        )}
      </View>
    </View>
  );
};

const CheckingOwnerParkingAvailabilityFromTenantPage = ({
  route,
  navigation,
}) => {
  const ownerDetailsToCheckAvailability = route.params?.value;
  const ownerIdToCheckAvailability = ownerDetailsToCheckAvailability.OwnerId;

  const ownerNameToCheckAvailability =
    ownerDetailsToCheckAvailability.OwnerName;
  const [scheduleData, setScheduleData] = useState([]);

  const [
    modalVisibilityForCancelParkingRequest,
    setModalVisibilityForCancelParkingRequest,
  ] = useState(false);
  const [modalVisibilityForCancelBooking, setModalVisibilityForCancelBooking] =
    useState(false);
  const [isChanged, setChanged] = useState(false);
  const [dayNameForDB, setdayNameForDB] = useState(false);

  const {userData, setUserData} = useContext(UserContext);
  const tenantDataFromPreviousPage = userData;
  const tenantNameFromPreviousPage = tenantDataFromPreviousPage.userName;
  const tenantIdFromPreviousPage = tenantDataFromPreviousPage.userId;
  const [loading, setLoading] = useState(false);

  const getAvailability = async (OwnerId, day) => {
    try {
      const snapshot = await database()
        .ref(`Owner/${OwnerId}/schedule/${day}`)
        .once('value');
      const availability = snapshot.val();
      return availability;
    } catch (error) {
      console.error('Error getting availability', error);
      return null;
    }
  };
//cancel booking or sent request
  const cancelParkingBookingOrRequest = async (OwnerId, dayName, TenantId) => {
    try {
      console.log(dayName);
      await database()
        .ref(`Owner/${OwnerId}/schedule/${dayName}`)
        .set('available');
      await database()
        .ref(`Tenant/${TenantId}/schedule/${dayName}`)
        .set('available');
      setModalVisibilityForCancelParkingRequest(false);
      setModalVisibilityForCancelBooking(false);
      setChanged(isChanged => !isChanged);
      const snapshot = await database()
        .ref(`Owner/${OwnerId}/deviceToken`)
        .once('value');
      const body = 'One of your tenants cancelled their parking request!';
      await sendPushNotification(body, snapshot.val());
    } catch {
      setModalVisibilityForCancelParkingRequest(false);
      setModalVisibilityForCancelBooking(false);
      setChanged(isChanged => !isChanged);
      Alert.alert(
        'TakeMyPark',
        'Sorry something went wrong! Try again leter!',
        [
          {
            text: 'OK',
          },
        ],
        {cancelable: true},
      );
    }
  };
//send a parking request
  const sendParkingRequest = async (
    OwnerId,
    dayName,
    TenantName,
    TenantId,
    OwnerName,
  ) => {
    try {
      const snapshot = await database()
        .ref(`Tenant/${TenantId}/schedule/${dayName}`)
        .once('value');
      const availability = snapshot.val();
      //console.log(availability);
      if (availability === 'available') {
        const snapshot = await database()
          .ref(`Owner/${OwnerId}/schedule/${dayName}`)
          .once('value');
        const availability = snapshot.val();
        if (availability === 'available') {
          await database()
            .ref(`Owner/${OwnerId}/schedule/${dayName}`)
            .set(`Request_${TenantName}_${TenantId}`);
          await database()
            .ref(`Tenant/${TenantId}/schedule/${dayName}`)
            .set(`Request_${OwnerName}_${OwnerId}`);
          setChanged(isChanged => !isChanged);
          const snapshot = await database()
            .ref(`Owner/${OwnerId}/deviceToken`)
            .once('value');
          const body = 'You got a new Parking Request!';
          await sendPushNotification(body, snapshot.val());
        } else {
          setChanged(isChanged => !isChanged);
          Alert.alert(
            'TakeMyPark',
            'Owner has made the parking unavailable!',
            [
              {
                text: 'OK',
              },
            ],
            {cancelable: true},
          );
        }
      } else {
        setChanged(isChanged => !isChanged);
        Alert.alert(
          'TakeMyPark',
          'You have already booked parking from other owner for this day! Please check the schedule!',
          [
            {
              text: 'OK',
            },
          ],
          {cancelable: true},
        );
      }
    } catch {
      setChanged(isChanged => !isChanged);
      Alert.alert(
        'TakeMyPark',
        'Sorry something went wrong! Try again leter!',
        [
          {
            text: 'OK',
          },
        ],
        {cancelable: true},
      );
    }
  };
//the button that used to send a parking request
  const handleSendRequestButton = dayName => {
    setdayNameForDB(dayName);
    sendParkingRequest(
      ownerIdToCheckAvailability,
      dayName,
      tenantNameFromPreviousPage,
      tenantIdFromPreviousPage,
      ownerNameToCheckAvailability,
    );
  };
  // open modals based on status. e.g. open modal CancelBooking if tenant tries to cancel already booked parking.
  const handleModalForCancelParkingRequest = dayName => {
    setModalVisibilityForCancelParkingRequest(true);
    setdayNameForDB(dayName);
  };
  const handleModalForCancelBooking = dayName => {
    setModalVisibilityForCancelBooking(true);
    setdayNameForDB(dayName);
  };

  //Yes No buttons of modals...

  const handleYesButtonOfModalTriggerCancelParkingBookingOrRequest = () =>
    //clicking yes in modal will cancel the parking request or booking
    cancelParkingBookingOrRequest(
      ownerIdToCheckAvailability,
      dayNameForDB,
      tenantIdFromPreviousPage,
    );

  const handleNoButtonOfModal = () => {
    //closes the modal
    setModalVisibilityForCancelBooking(false);
    setModalVisibilityForCancelParkingRequest(false);
  };

  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const currentDate = new Date();

  const refreshParkingSpots = async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  };
  //Refer to OwnerHomeScreen.js
  useEffect(() => {
    const fetchData = async () => {
      const data = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(currentDate.getDate() + i);
        const formattedDate = `${date.getDate()}/${
          date.getMonth() + 1
        }/${date.getFullYear()}`;
        const dayName = days[date.getDay()];

        const availability = await getAvailability(
          ownerIdToCheckAvailability,
          dayName,
        );

        // Create a wrapper function to pass parameters to handlePress
        let onPress; // Pass your parameters here

        if (availability === 'available') {
          onPress = () => handleSendRequestButton(dayName);
          const isCurrentDate = i === 0;
          data.push({
            date: formattedDate,
            dayName: dayName,
            isCurrentDate: isCurrentDate,
            availability: availability,
            onPress: onPress,
            TenantId: tenantIdFromPreviousPage,
          });
        } else {
          const isCurrentDate = i === 0;
          if (availability.includes('_')) {
            console.log('if');
            const splittedText = availability.split('_');
            const status = splittedText[0];
            const requestName = splittedText[1];
            onPress = () => handleModalForCancelParkingRequest(dayName);
            data.push({
              date: formattedDate,
              dayName: dayName,
              isCurrentDate: isCurrentDate,
              availability: availability,
              onPress: onPress,
              TenantId: tenantIdFromPreviousPage,
            });
          } else {
            onPress = () => handleModalForCancelBooking(dayName);
            data.push({
              date: formattedDate,
              dayName: dayName,
              isCurrentDate: isCurrentDate,
              availability: availability,
              onPress: onPress,
              TenantId: tenantIdFromPreviousPage,
            });
          }
        }
      }
      setScheduleData(data);
      //console.log(data);
    };
    const handleDataChange = snapshot => {
      // This callback will be called whenever there's a change in Firebase database
      // You can update the state accordingly
      fetchData();
    };

    // Set up Firebase listener
    const ref = database().ref(`Owner/${ownerIdToCheckAvailability}/schedule`);
    ref.on('value', handleDataChange);
    return () => {
      ref.off('value', handleDataChange);
    };
  }, [ownerIdToCheckAvailability, isChanged]);

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

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <View style={styles.arrowIcon}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrowleft" size={30} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.welcomeContainer}>
          <Text style={styles.title}>Welcome</Text>
        </View>
        <View style={{flex: 0.25}}></View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <Text
          style={
            styles.bookScheduleText
          }>{`Booked Schedule from ${ownerNameToCheckAvailability}`}</Text>
        {scheduleData.map((item, index) => (
          <CardShowingDateWiseInfo
            key={index}
            date={item.date}
            dayName={item.dayName}
            isCurrentDate={item.isCurrentDate}
            availability={item.availability}
            onPress={item.onPress}
            TenantId={item.TenantId}
          />
        ))}
        <ModalForCancelParkingRequest
          visible={modalVisibilityForCancelParkingRequest}
          onRequestClose={() =>
            setModalVisibilityForCancelParkingRequest(false)
          }
          onReject={handleNoButtonOfModal}
          onAccept={handleYesButtonOfModalTriggerCancelParkingBookingOrRequest}
        />
        <ModalForCancelBooking
          visible={modalVisibilityForCancelBooking}
          onRequestClose={() => setModalVisibilityForCancelBooking(false)}
          onReject={handleNoButtonOfModal}
          onAccept={handleYesButtonOfModalTriggerCancelParkingBookingOrRequest}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80, // Adjust based on your requirement
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    flex: 0.5,
    alignItems: 'center',
  },
  arrowIcon: {
    flex: 0.25,
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
    fontSize: 10,
    marginLeft: 5,
  },
  bookScheduleText: {
    color: 'red',
    marginBottom: 20,
    fontSize: 20,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
    marginVertical: 10,
    width: '100%',
  },
  leftContainer: {
    flex: 1,
  },
  middleContainer: {
    flex: 1,
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 5,
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayNameText: {
    fontSize: 14,
    color: '#666',
  },
  availabilityText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  requestedTextAvailable: {
    fontSize: 14,
    color: 'red',
    fontWeight: 'bold',
  },
  bookedTextAvailable: {
    fontSize: 14,
    color: 'green',
    fontWeight: 'bold',
  },
  buttonContainer: {
    backgroundColor: 'grey',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  cancelRequestButtonContainer: {
    backgroundColor: 'yellow',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  cancelBookingButtonContainer: {
    backgroundColor: 'red',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  sendRequestButtonContainer: {
    backgroundColor: 'green',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelRequestbuttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  unavailableText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  alertIconContainer: {
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertBody: {
    textAlign: 'center',
    marginBottom: 20,
  },
  alertButtonContainer: {
    flexDirection: 'row',
  },
  alertButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  alertButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CheckingOwnerParkingAvailabilityFromTenantPage;
