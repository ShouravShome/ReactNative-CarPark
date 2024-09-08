import React, {useContext, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  BackHandler,
  ToastAndroid,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import database from '@react-native-firebase/database';
import UserContext from '../Components/UserContext';
import {sendPushNotification} from '../Components/sendpushnotification';

//this modal opens when owner press on owner presses take action button to accept or reject a parking request
const ModalForParkingRequestAcceptOrReject = ({
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
            <Text style={styles.alertTitle}>Parking Request</Text>
            <Text style={styles.alertBody}>
              You have a request. Kindly accept or reject!
            </Text>
            <View style={styles.alertButtonContainer}>
              <TouchableOpacity
                style={[styles.alertButton, {backgroundColor: '#55c2da'}]}
                onPress={onAccept}>
                <Text style={styles.alertButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertButton, {backgroundColor: '#55c2da'}]}
                onPress={onReject}>
                <Text style={styles.alertButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
};
//this modal opens when owner press cancel booking button to cancel the parking. Yes mean cancel the parking. No means go back to withour doing anything. 
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

//this is the main card showing all the information about a parking spot. Each date has its separate parking details. Data is data the card is representing. Dayname is the name of the day that the card is representing.
//availability is holding the status of the parking spot of that day if its available or not. and on press is deciding the button corresponding the card. 
//the button call differnt functions based on the availability status.Eg: of the status is unavailable the button name is "make available". and for available makes the button name "make unavailable"
//'_' (underscore) denotes requested and '-'(dash denotes) booked. Same for all of the screen, TenantHomeScreen and CheckParkingAvailabilityOfOwner. 
const CardShowingDateWiseInfo = ({
  date,
  dayName,
  isCurrentDate,
  availability,
  onPress,
}) => {
  if (availability.includes('_')) {//this denotes a tenant has requested for the parking
    var splittedText = availability.split('_');
    var status = splittedText[0];
    var requestName = splittedText[1];
    var requestId = splittedText[2];
  }

  if (availability.includes('-')) {//this denotes that the parking has been booked for someone already.
    var splittedText1 = availability.split('-');
    var bookedName = splittedText1[0];
    var bookedId = splittedText1[1];
  }
  let availabilityText;
  switch (availability) {
    case 'available':
      availabilityText = 'Available For Connections';
      break;
    case 'not available':
      availabilityText = 'Not Available For Connections';
      break;
    case `Request_${requestName}_${requestId}`:
      availabilityText = `You have a request from ${requestName}`;
      break;
    default:
      availabilityText = `Booked for ${bookedName}`;
  }

  const ConditionalRendering = () => {
    if (availabilityText === 'Available For Connections') {
      return (
        <TouchableOpacity
          style={styles.notavailablebuttonContainer}
          onPress={onPress}
          activeOpacity={0.7}>
          <Text style={styles.buttonText}>Make Unavailable</Text>
        </TouchableOpacity>
      );
    } else if (availabilityText === 'Not Available For Connections') {
      return (
        <TouchableOpacity
          style={styles.availablebuttonContainer}
          onPress={onPress}
          activeOpacity={0.7}>
          <Text style={styles.buttonText}>   Make Available  </Text>
        </TouchableOpacity>
      );
    } else if (availabilityText.includes('request')) {
      return (
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={onPress}
          activeOpacity={0.7}>
          <Text style={styles.takeactionbuttonText}>    Take Action    </Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          style={styles.cancelBookingButtonContainer}
          onPress={onPress}
          activeOpacity={0.7}>
          <Text style={styles.cancelbookingbuttonText}>  Cancel Booking  </Text>
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
        {availabilityText === 'Available For Connections' ? (
          <Text style={styles.availabilityTextAvailable}>
            {availabilityText}
          </Text>
        ) : availabilityText === 'Not Available For Connections' ? (
          <Text style={styles.availabilityTextUnavailable}>
            {availabilityText}
          </Text>
        ) : (
          <Text style={styles.availabilityTextOther}>{availabilityText}</Text>
        )}
      </View>
    </View>
  );
};

const OwnerParkingSchedule = ({route}) => {
  // const ownerDetailFromPreviousPage = route.params?.value;
  // const ownerIdFromPreviousPage = ownerDetailFromPreviousPage.userId;
  // const ownerName = ownerDetailFromPreviousPage.userName;
  const [scheduleData, setScheduleData] = useState([]);
  const [
    modalVisibilityForParkingRequestAcceptOrReject,
    setModalVisibilityForParkingRequestAcceptOrReject,
  ] = useState(false);
  const [modalVisibilityBookingCancel, setModalVisibilityBookingCancel] =
    useState(false);
  const [isChanged, setChanged] = useState(false);
  const [dayNameToQueryInDB, setDayNameToQueryInDB] = useState(false);
  const [nameOfTenantGotRequestFrom, setNameOfTenantGotRequestFrom] =
    useState(false);
  const [idOfTenantGotRequestFrom, setIdOfTenantGotRequestFrom] =
    useState(false);
  const {userData, setUserData} = useContext(UserContext);
  const ownerDetailFromPreviousPage = userData;
  const ownerIdFromPreviousPage = ownerDetailFromPreviousPage.userId;
  const ownerNameFromPreviousPage = ownerDetailFromPreviousPage.userName;
  const [loading, setLoading] = useState(false);

  const getAvailabilityOfParkingSpotsFromOwnerDB = async (ownerId, day) => {
    try {
      const snapshot = await database()
        .ref(`Owner/${ownerId}/schedule/${day}`)
        .once('value');
      const availability = snapshot.val();
      return availability;
    } catch (error) {
      console.error('Error getting availability', error);
      return null;
    }
  };
  //All functions dealing with Database!!

  //when owner presses make available button this function triggers
  const makeParkingAvailableForTenant = async (ownerId, dayName) => {
    try {
      console.log(dayName);
      await database()
        .ref(`Owner/${ownerId}/schedule/${dayName}`)
        .set('available');
      setChanged(isChanged => !isChanged);
    } catch {
      setAlertForParkingAvailability(false);
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
  //when owner presses make unavailable button this function triggers
  const makeParkingUnavailableForTenant = async (ownerId, dayName) => {
    try {
      console.log(dayName);
      await database()
        .ref(`Owner/${ownerId}/schedule/${dayName}`)
        .set('not available');
      setChanged(isChanged => !isChanged);
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

  //this function is triggered when accept is clicked
  const acceptParking = async (
    ownerId,
    ownerName,
    dayName,
    tenantName,
    tenantId,
  ) => {
    try {
      await database()
        .ref(`Owner/${ownerId}/schedule/${dayName}`)
        .set(`${tenantName}-${tenantId}`);
      await database()
        .ref(`Tenant/${tenantId}/schedule/${dayName}`)
        .set(`${ownerName}-${ownerId}`);
      console.log('Space availability updated successfully.');
      setModalVisibilityForParkingRequestAcceptOrReject(false);
      setChanged(isChanged => !isChanged);
      const snapshot = await database()
        .ref(`Tenant/${tenantId}/deviceToken`)
        .once('value');
      const body =
        'Your Parking Request has been accepted!';
      await sendPushNotification(body, snapshot.val());// gets the token from "Tenant" root to send FCM message.
    } catch {
      setModalVisibilityForParkingRequestAcceptOrReject(false);
      setChanged(isChanged => !isChanged);
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
  //this is triggered when when reject button is pressed. This is also called when owner wants to cancle an already booked parking. 
  const rejectParking = async (ownerId, dayName, tenantId) => {
    try {
      await database()
        .ref(`Owner/${ownerId}/schedule/${dayName}`)
        .set('available');
      await database()
        .ref(`Tenant/${tenantId}/schedule/${dayName}`)
        .set('available');
      setModalVisibilityForParkingRequestAcceptOrReject(false);
      setModalVisibilityBookingCancel(false);
      setChanged(isChanged => !isChanged);
      const snapshot = await database()
        .ref(`Tenant/${tenantId}/deviceToken`)
        .once('value');
      const body =
        'One of your Parking Requests has been cancelled!';
      await sendPushNotification(body, snapshot.val());// gets the token from "Tenant" root to send FCM message.
    } catch {
      setModalVisibilityForParkingRequestAcceptOrReject(false);
      setModalVisibilityBookingCancel(false);
      setChanged(isChanged => !isChanged);
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

  //handle make available and make unavailable buttons

  const handleMakeParkingAvailable = dayName => {
    setDayNameToQueryInDB(dayName);
    makeParkingAvailableForTenant(ownerIdFromPreviousPage, dayName);
  };
  const handleMakeParkingNotAvailable = dayName => {
    setDayNameToQueryInDB(dayName);
    makeParkingUnavailableForTenant(ownerIdFromPreviousPage, dayName);
  };

  // open modals based on status. opens handleModalForParkingRequestAcceptOrReject when owner wants to accept a parking
  const handleModalForParkingRequestAcceptOrReject = (
    dayName,
    requestOrBookingNameFromDB,
    requestOrBookingIdFromDB,
  ) => {
    setDayNameToQueryInDB(dayName);
    setModalVisibilityForParkingRequestAcceptOrReject(true);
    setNameOfTenantGotRequestFrom(requestOrBookingNameFromDB);
    setIdOfTenantGotRequestFrom(requestOrBookingIdFromDB);
  };

  //opens handleModalForCancelBooking when owner wants to cancel already booked parking.
  const handleModalForCancelBooking = (
    dayName,
    requestOrBookingNameFromDB,
    requestOrBookingIdFromDB,
  ) => {
    setDayNameToQueryInDB(dayName);
    setModalVisibilityBookingCancel(true);
    setNameOfTenantGotRequestFrom(requestOrBookingNameFromDB);
    setIdOfTenantGotRequestFrom(requestOrBookingIdFromDB);
  };


  //accept reject buttons of the modals...
  const handleRejectButtonOfModalTriggerRejectParking = () =>
    rejectParking(
      ownerIdFromPreviousPage,
      dayNameToQueryInDB,
      idOfTenantGotRequestFrom,
    );

  const handleAcceptButtonOfModalTriggerAcceptParking = () =>
    acceptParking(
      ownerIdFromPreviousPage,
      ownerNameFromPreviousPage,
      dayNameToQueryInDB,
      nameOfTenantGotRequestFrom,
      idOfTenantGotRequestFrom,
    );

  const closeModalForCancelBooking = async () => {
    setModalVisibilityBookingCancel(false);
  };


  //handle notify connections button. Retrives all connected tenants of that owner. than from 'Tenant' root of firebase gets the device token.
  const notifyConnectionButton = async () => {
    const getAllTheConnectionsOfOwnerFromDBtable = async () => {
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

    const allConnectionInOwnerAcc = [];
    const data = await getAllTheConnectionsOfOwnerFromDBtable();
    if (data) {
      Object.keys(data).forEach(key => {
        const entry = data[key];
        if (entry.OwnerId === ownerIdFromPreviousPage) {
          allConnectionInOwnerAcc.push({
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

    for (let i = 0; i < allConnectionInOwnerAcc.length; i++) {
      const snapshot = await database()
        .ref(`Tenant/${allConnectionInOwnerAcc[i].TenantId}/deviceToken`)
        .once('value');
      const body = `New Parking Spot available from ${allConnectionInOwnerAcc[i].OwnerName}`;
      await sendPushNotification(body, snapshot.val());
    }
    Alert.alert(
      'TakeMyPark',
      'You have notified your all connections!',
      [
        {
          text: 'OK',
        },
      ],
      {cancelable: true},
    );
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
  //Owner can accept reject tenants request. Owner can also cancel booked parkings and make them available or unavailable.

  useEffect(() => {
    const fetchData = async () => {
      const data = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(currentDate.getDate() + i); // looking for current date
        const formattedDate = `${date.getDate()}/${
          date.getMonth() + 1
        }/${date.getFullYear()}`; // date format dd/mm/yyyy to show on front-end
        const dayName = days[date.getDay()]; //coresponding day for the date!

        const availability = await getAvailabilityOfParkingSpotsFromOwnerDB(
          ownerIdFromPreviousPage,
          dayName,
        );
        let onPress;
        //Checking from database if the parking is available, not available , Request_Tenant's name(Format to identify the received requests from Tenant) and Tenant's name(shows only name of Tenant for whom the parking is booked))
        if (availability === 'available') {
          onPress = () => handleMakeParkingNotAvailable(dayName); //sending function so that each card will call different functions based on the availability status. e.g if parking is unavailable for the connection. then the function of making the parking available will be called when the make available button is pressed. 
          const isCurrentDate = i === 0; // currently not used// this variable is used so that user cannot update the availability or handle any request for current day or date.
          data.push({
            // pushing date, day name of the date , checking if it is current date and the parking availability status of that day along with the function. this will be mapped with card component to render in front-end. Date/dayname availability status is mapped with card to show information to user.
            date: formattedDate,
            dayName: dayName,
            isCurrentDate: isCurrentDate,
            availability: availability,
            onPress: onPress,
          });
        } else if (availability === 'not available') {
          onPress = () => handleMakeParkingAvailable(dayName); //sending function so that the Parking Spot can be made avaiable by clicking the button in the card. 
          const isCurrentDate = i === 0;
          data.push({
            date: formattedDate,
            dayName: dayName,
            isCurrentDate: isCurrentDate,
            availability: availability,
            onPress: onPress,
          });
        } else {
          const isCurrentDate = i === 0;
          if (availability.includes('_')) {
            //The parking requests are specifically identified with '_' for distinguishment. and booked parkings are handled by '-' //underscore and hash. 
            console.log('if');
            const splittedText = availability.split('_');
            const status = splittedText[0];
            const requestName = splittedText[1];
            const requestId = splittedText[2];
            onPress = () =>
              handleModalForParkingRequestAcceptOrReject(
                dayName,
                requestName,
                requestId,
              );
            data.push({
              date: formattedDate,
              dayName: dayName,
              isCurrentDate: isCurrentDate,
              availability: availability,
              onPress: onPress,
            });
          } else {
            const splittedText = availability.split('-');
            const bookedName = splittedText[0];
            const bookedId = splittedText[1];
            onPress = () =>
              handleModalForCancelBooking(dayName, bookedName, bookedId); //only for the one's where parking is booked. this will show a Yes or No button for already accepted parking. If Yes it will by default set available in the parking spot.
            data.push({
              date: formattedDate,
              dayName: dayName,
              isCurrentDate: isCurrentDate,
              availability: availability,
              onPress: onPress,
            });
          }
        }
      }
      setScheduleData(data);
      //console.log(data);
    };
    const handleDataChange = snapshot => {
      // This callback will be called whenever there's a change in Firebase database
      fetchData();
    };

    // Set up Firebase listener
    const ref = database().ref(`Owner/${ownerIdFromPreviousPage}/schedule`);
    ref.on('value', handleDataChange);
    return()=>{
      ref.off('value', handleDataChange)
    }
  }, [ownerIdFromPreviousPage, isChanged]); // isChanged is used to identify if any data is changed and re-render the page to user.

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

  const refreshParkingSpots = async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{flex: 0.25}}></View>
        <View style={{flex: 0.5}}>
          <Text style={styles.heading}>Welcome</Text>
        </View>
        <View style={{flex: 0.25}}></View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <Text
          style={
            styles.bookScheduleText
          }>{`Parking Spot Availability For ${ownerNameFromPreviousPage}`}</Text>
        <TouchableOpacity
          style={styles.connectionsButtonContainer}
          onPress={notifyConnectionButton}
          activeOpacity={0.7}>
          <Text style={styles.connectionsButtonText}> Notify Connections </Text>
        </TouchableOpacity>
        {scheduleData.map((item, index) => (
          <CardShowingDateWiseInfo
            key={index}
            date={item.date}
            dayName={item.dayName}
            isCurrentDate={item.isCurrentDate}
            availability={item.availability}
            onPress={item.onPress}
          />
        ))}
        <ModalForParkingRequestAcceptOrReject
          visible={modalVisibilityForParkingRequestAcceptOrReject}
          onRequestClose={() =>
            setModalVisibilityForParkingRequestAcceptOrReject(false)
          }
          onReject={handleRejectButtonOfModalTriggerRejectParking}
          onAccept={handleAcceptButtonOfModalTriggerAcceptParking}
        />
        <ModalForCancelBooking
          visible={modalVisibilityBookingCancel}
          onRequestClose={() => setModalVisibilityBookingCancel(false)}
          onReject={closeModalForCancelBooking}
          onAccept={handleRejectButtonOfModalTriggerRejectParking}//pressing Yes in the modal trigger reject parking. Means the booking is cancelled.
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
    paddingHorizontal: 10,
    paddingTop: 80, 
  },
  bookScheduleText: {
    color: 'red',
    marginBottom: 20,
    fontSize: 20,
  },
  header: {
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
  heading: {
    flex: 0.5,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#4caf50',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 10,
    marginLeft: 5,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
  availabilityTextAvailable: {
    fontSize: 14,
    color: 'green',
    fontWeight: 'bold',
  },
  availabilityTextUnavailable: {
    fontSize: 14,
    color: 'red',
    fontWeight: 'bold',
  },
  availabilityTextOther: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  buttonContainer: {
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
  connectionsButtonContainer: {
    backgroundColor: '#55c2da',
    paddingVertical: 8,
    paddingHorizontal: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'black',
  },
  availablebuttonContainer: {
    backgroundColor: 'green',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  notavailablebuttonContainer: {
    backgroundColor: 'red',
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
  takeactionbuttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  cancelbookingbuttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  connectionsButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
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

export default OwnerParkingSchedule;
