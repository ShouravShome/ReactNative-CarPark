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
  ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import database from '@react-native-firebase/database';
import UserContext from '../Components/UserContext';
import {sendPushNotification} from '../Components/sendpushnotification';
//this modal opens when tenant cancel a parking request that has been sent
const ModalForCancelParkingRequest = ({
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
            <Text style={styles.alertTitle}>Cancel Request?</Text>
            <Text style={styles.alertBody}>
              Are you sure you want to cancel Request?
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
//this modal opens when tenant cancel a booked parking.
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
//similiar to OwnerHomeScreen.js 
const CardShowingDateWiseInfo = ({
  date,
  dayName,
  isCurrentDate,
  availability,
  onPress,
  userName,
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
      availabilityText = `You have already requested a parking from ${requestName}`;
      break;
    default:
      availabilityText = `Booked from ${bookedName}`;
  }

  const ConditionalRendering = ()=>{
    if(availabilityText === 'Available to Book'){
    }else if(availabilityText.includes('requested')){
      return(
        <TouchableOpacity
              style={styles.cancelRequestButtonContainer}
              onPress={onPress}
              activeOpacity={0.7}>
              <Text style={styles.buttonText}>Cancel Request</Text>
            </TouchableOpacity>
      )
    }
    else{
      return(
        <TouchableOpacity
              style={styles.cancelBookingButtonContainer}
              onPress={onPress}
              activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
      )
    }
  }
  return (
    <View style={styles.cardContainer}>
      <View style={{flexDirection: 'row'}}>
        <View style={styles.leftContainer}>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.dayNameText}>{dayName}</Text>
        </View>
        <View style={styles.rightContainer}>
           <ConditionalRendering/>
        </View>
      </View>

      <View style={styles.middleContainer}>
      {availabilityText.includes('requested') ? (
          <Text style={styles.requestedTextAvailable}>
            {availabilityText}
          </Text>
        ) : availabilityText.includes('Booked') ? (
          <Text style={styles.bookedTextAvailable}>
            {availabilityText}
          </Text>
        ) : (
          <Text style={styles.availabilityText}>
            {availabilityText}
          </Text>
        )}
      </View>
    </View>
  );
};

const TenantParkingSchedule = ({route}) => {
  //const ownerDetailsToCheckAvailability = route.params?.value;
  //const ownerIdToCheckAvailability = ownerDetailsToCheckAvailability.OwnerId;
  //console.log(ownerIdToCheckAvailability)
  //const ownerNameToCheckAvailability = ownerDetailsToCheckAvailability.OwnerName;
  const [scheduleData, setScheduleData] = useState([]);
  const [modalVisibilityForCancelParkingRequest, setModalVisibilityForCancelParkingRequest] = useState(false);
  const [modalVisibilityForCancelBooking, setModalVisibilityForCancelBooking] = useState(false);
  const [isChanged, setChanged] = useState(false);
  const [dayNameForDB, setdayNameForDB] = useState(false);


  const {userData, setUserData} = useContext(UserContext);
  const tenantDataFromPreviousPage = userData;
  const tenantNameFromPreviousPage = tenantDataFromPreviousPage.userName;
  const tenantIdFromPreviousPage = tenantDataFromPreviousPage.userId;
  const [ownerIdToCheckBookedParking, setOwnerIdTocheckBookedParking] =
    useState(false);


  const [loading, setLoading] = useState(false);
  const getAvailability = async (TenantId, day) => {
    try {
      const snapshot = await database()
        .ref(`Tenant/${TenantId}/schedule/${day}`)
        .once('value');
      const availability = snapshot.val();
      return availability;
    } catch (error) {
      console.error('Error getting availability', error);
      return null;
    }
  };
//tenants can only cancel the request or booking from home screen. 
  const cancelParkingBookingOrRequest = async (
    TenantId,
    dayName,
    ownerId,
  ) => {
    try {
      console.log(dayName);
      await database()
        .ref(`Tenant/${TenantId}/schedule/${dayName}`)
        .set('available');
      await database()
        .ref(`Owner/${ownerId}/schedule/${dayName}`)
        .set('available');
      setModalVisibilityForCancelParkingRequest(false);
      setModalVisibilityForCancelBooking(false);
      setChanged(isChanged => !isChanged);
      const snapshot = await database()
        .ref(`Owner/${ownerId}/deviceToken`)
        .once('value');
      const body =
        'One of your tenants cancelled their parking request!';
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
  const closeModal = async () => {//closes the modal
    setModalVisibilityForCancelParkingRequest(false);
    setModalVisibilityForCancelBooking(false);
  };

  // open alert boxes based on status. e.g. if the alert is for accepting a request 'request alert' box will open.
  const handleModalForCancleParkingRequest = (
    dayName,
    availability,
    ownerId,
  ) => {
    setModalVisibilityForCancelParkingRequest(true);
    setdayNameForDB(dayName);
    setOwnerIdTocheckBookedParking(ownerId);
  };
  const handleModalForCancelBooking = (
    dayName,
    availability,
    ownerId,
  ) => {
    setModalVisibilityForCancelBooking(true);
    setdayNameForDB(dayName);
    setOwnerIdTocheckBookedParking(ownerId);
  };

  //accept reject buttons...

  const handleYesButtonOfModalTriggerCancelParkingBookingOrRequest = () =>
    cancelParkingBookingOrRequest(
      tenantIdFromPreviousPage,
      dayNameForDB,
      ownerIdToCheckBookedParking,
    );

  const handleNoButtonOfModals = () =>
    closeModal();

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

  

  //refer to OwnerHomeScreen.js for detailed information. As they are designed in same way keeping the consistency. 
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
          tenantIdFromPreviousPage,
          dayName,
        );
  
        // Create a wrapper function to pass parameters to handlePress
        let onPress; // Pass your parameters here
  
        if (availability === 'available') {
          onPress = () => handleParkingRequest(dayName);
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
            const splittedText = availability.split('_');
            const status = splittedText[0];
            const requestName = splittedText[1];
            const requestId = splittedText[2];
            onPress = () =>
              handleModalForCancleParkingRequest(dayName, availability, requestId);
            data.push({
              date: formattedDate,
              dayName: dayName,
              isCurrentDate: isCurrentDate,
              availability: availability,
              onPress: onPress,
            });
          } else if (availability.includes('-')) {
            const splittedText = availability.split('-');
            const bookedName = splittedText[0];
            const bookedId = splittedText[1];
            onPress = () =>
              handleModalForCancelBooking(dayName, availability, bookedId);
            data.push({
              date: formattedDate,
              dayName: dayName,
              isCurrentDate: isCurrentDate,
              availability: availability,
              onPress: onPress,
            });
          } else {
            onPress = () =>
              handleModalForCancleBooking(dayName, availability);
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
    const handleDataChange = (snapshot) => {
      // This callback will be called whenever there's a change in Firebase database
      fetchData();
    };

    // Set up Firebase listener
    const ref = database().ref(`Tenant/${tenantIdFromPreviousPage}/schedule`);
    ref.on('value', handleDataChange);
    return()=>{
      ref.off('value', handleDataChange)
    }
  }, [tenantIdFromPreviousPage, isChanged]);

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
        <View style={{flex: 0.25}}>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <Text
          style={
            styles.bookScheduleText
          }>{`Your Weekly Booking Schedule ${tenantNameFromPreviousPage}`}</Text>
        {scheduleData.map((item, index) => (
          <CardShowingDateWiseInfo
            key={index}
            date={item.date}
            dayName={item.dayName}
            isCurrentDate={item.isCurrentDate}
            availability={item.availability}
            onPress={item.onPress}
            userName={item.userName}
          />
        ))}
        <ModalForCancelParkingRequest
          visible={modalVisibilityForCancelParkingRequest}
          onRequestClose={() => setModalVisibilityForCancelParkingRequest(false)}
          onReject={handleNoButtonOfModals}
          onAccept={handleYesButtonOfModalTriggerCancelParkingBookingOrRequest}
        />
        <ModalForCancelBooking
          visible={modalVisibilityForCancelBooking}
          onRequestClose={() => setModalVisibilityForCancelBooking(false)}
          onReject={handleNoButtonOfModals}
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
    width:'100%'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 80, // Adjust based on your requirement
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
    textAlign: 'center',
  },
  cardContainer: {
    flex:1,
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
    marginTop:5,
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
    fontWeight:'bold',
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
    backgroundColor: 'green',
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
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: 'white',
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

export default TenantParkingSchedule;
