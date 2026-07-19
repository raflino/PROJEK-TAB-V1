import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, FlatList, StatusBar } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width; 
const SLIDER_HEIGHT = 200; 

const KOMATSU_YELLOW = '#FFB800'; 
const DEEP_BLUE = '#001F3F';

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const carouselData = [
    { id: '1', image: require('../../assets/slide1.jpg'), title: 'Energy Transformation', desc: 'Towards a greener future' },
    { id: '2', image: require('../../assets/slide2.jpg'), title: 'Expert Workforce', desc: 'Standard Astra workshops' },
    { id: '3', image: require('../../assets/slide3.jpg'), title: 'AI Monitoring Tech', desc: 'Real-time condition monitoring' },
    { id: '4', image: require('../../assets/slide4.jpg'), title: 'Preventive Maintenance', desc: 'Optimizing lifetime and efficiency' },
    { id: '5', image: require('../../assets/slide5.jpg'), title: 'Safety First', desc: 'Prioritizing health and safety' },
    { id: '6', image: require('../../assets/slide6.jpg'), title: 'Manual Digitalization', desc: 'Access catalogs anytime' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeIndex === carouselData.length - 1 ? 0 : activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await AsyncStorage.getItem('user_session');
        if (session) setUserData(JSON.parse(session));
      } catch (error) {
        console.log("Error loading user data", error);
      }
    };
    fetchUser();
  }, []);

  const getInitial = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFDFD" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.profileBox}>
            <View style={styles.avatarGradient}>
              <Text style={styles.avatarTxt}>{getInitial(userData?.nama)}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hello, {userData?.nama?.split(' ')[0] || 'User'}!</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {userData?.role}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FEATURED SLIDER */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={flatListRef}
            data={carouselData}
            horizontal
            pagingEnabled
            snapToAlignment="center"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
              setActiveIndex(newIndex);
            }}
            renderItem={({ item }) => (
              <View style={styles.slideCard}>
                <TouchableOpacity activeOpacity={0.9} style={styles.touchableCard}>
                  <ImageBackground source={item.image} style={styles.sliderImage} imageStyle={{ borderRadius: 20 }}>
                    <View style={styles.imageOverlay}>
                      <View style={styles.textContainer}>
                        <View style={styles.titleIndicator} />
                        <Text style={styles.titleText}>{item.title}</Text>
                        <Text style={styles.descText}>{item.desc}</Text>
                      </View>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            )}
          />
          <View style={styles.pagination}>
            {carouselData.map((_, i) => (
              <View key={i} style={[styles.dot, activeIndex === i ? styles.activeDot : null]} />
            ))}
          </View>
        </View>

        {/* SCAN BUTTON */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.mainScanButton} 
            onPress={() => navigation.navigate('Scan')}
          >
            <View style={styles.scanContent}>
               <View style={styles.scanIconCircle}>
                 <MaterialCommunityIcons name="qrcode-scan" size={24} color={KOMATSU_YELLOW} />
               </View>
               <View style={{marginLeft: 15}}>
                 <Text style={styles.scanHeadline}>Rapid Diagnosis</Text>
                 <Text style={styles.scanSubline}>Scan machine error codes</Text>
               </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>

        {/* QUICK ACCESS MENU */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CORE FEATURES</Text>
            <View style={[styles.titleLine, { backgroundColor: KOMATSU_YELLOW }]} />
          </View>
          
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Chat')}>
            <View style={[styles.iconBox, { backgroundColor: '#E8EFFF' }]}>
               <MaterialCommunityIcons name="robot" size={26} color="#2A52BE" />
            </View>
            <View style={styles.featureInfo}>
                <Text style={styles.featureName}>TAB AI Assistant</Text>
                <Text style={styles.featureDesc}>Smart technical troubleshooting</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#BBB" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, { marginTop: 12 }]} onPress={() => navigation.navigate('Katalog')}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}>
               <MaterialCommunityIcons name="file-document-multiple-outline" size={24} color="#E67E22" />
            </View>
            <View style={styles.featureInfo}>
                <Text style={styles.featureName}>Service Manuals</Text>
                <Text style={styles.featureDesc}>Digital parts & guidebooks</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#BBB" />
          </TouchableOpacity>
        </View>

        {/* --- TAMBAHAN PEMANIS (MAINTENANCE TIP & STATUS) --- */}
        <View style={styles.extraSection}>
            <View style={styles.tipCard}>
                <View style={styles.tipHeader}>
                    <MaterialCommunityIcons name="lightbulb-on" size={20} color={KOMATSU_YELLOW} />
                    <Text style={styles.tipTitle}>Maintenance Tip</Text>
                </View>
                <Text style={styles.tipContent}>
                    Always check hydraulic oil levels before starting the engine to ensure maximum pump lifetime.
                </Text>
            </View>

            <View style={styles.statusContainer}>
                <View style={styles.statusBox}>
                    <MaterialCommunityIcons name="access-point-check" size={20} color="#4CAF50" />
                    <Text style={styles.statusText}>System Online</Text>
                </View>
                <View style={styles.statusBox}>
                    <MaterialCommunityIcons name="shield-check-outline" size={20} color="#4CAF50" />
                    <Text style={styles.statusText}>Secure</Text>
                </View>
            </View>
        </View>
        {/* --------------------------------------------------- */}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  header: {
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 10,
  },
  profileBox: { flexDirection: 'row', alignItems: 'center' },
  avatarGradient: { 
    width: 52, height: 52, borderRadius: 15, 
    backgroundColor: DEEP_BLUE, justifyContent: 'center', 
    alignItems: 'center', marginRight: 15,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: KOMATSU_YELLOW 
  },
  avatarTxt: { color: KOMATSU_YELLOW, fontWeight: '800', fontSize: 18 },
  greeting: { fontSize: 21, fontWeight: '800', color: '#121212', letterSpacing: -0.5 },
  roleBadge: { 
    backgroundColor: '#FFF9E6', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, paddingVertical: 2, borderRadius: 6, marginTop: 2,
    borderWidth: 0.5,
    borderColor: KOMATSU_YELLOW
  },
  roleText: { color: '#B8860B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  sliderContainer: { marginTop: 15 },
  slideCard: { 
    width: ITEM_WIDTH, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  touchableCard: {
    width: width - 40,
  },
  sliderImage: { 
    width: '100%', 
    height: SLIDER_HEIGHT, 
    justifyContent: 'flex-end',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  imageOverlay: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 20,
    borderRadius: 20,
  },
  textContainer: { marginBottom: 5 },
  titleIndicator: { width: 30, height: 3, backgroundColor: KOMATSU_YELLOW, marginBottom: 8, borderRadius: 2 },
  titleText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18, lineHeight: 24 },
  descText: { color: '#E0E0E0', fontSize: 12, marginTop: 2, fontWeight: '400' },
  
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  dot: { height: 5, width: 5, borderRadius: 3, backgroundColor: '#DDD', marginHorizontal: 3 },
  activeDot: { width: 18, backgroundColor: KOMATSU_YELLOW },

  actionSection: { paddingHorizontal: 25, marginTop: 20 },
  mainScanButton: { 
    backgroundColor: DEEP_BLUE, 
    padding: 18, 
    borderRadius: 22, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    elevation: 5,
    borderLeftWidth: 5, 
    borderLeftColor: KOMATSU_YELLOW
  },
  scanContent: { flexDirection: 'row', alignItems: 'center' },
  scanIconCircle: { width: 44, height: 44, backgroundColor: 'rgba(255,184,0,0.15)', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  scanHeadline: { fontWeight: 'bold', fontSize: 16, color: '#FFF' },
  scanSubline: { fontSize: 11, color: '#AAA', marginTop: 1 },

  menuSection: { paddingHorizontal: 25, marginTop: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#BBB', letterSpacing: 1.2 },
  titleLine: { flex: 1, height: 2, marginLeft: 10, borderRadius: 1 },
  
  featureCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 15, 
    borderRadius: 20, 
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2
  },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  featureInfo: { flex: 1, marginLeft: 15 },
  featureName: { fontWeight: '700', color: '#1A1A1A', fontSize: 15 },
  featureDesc: { color: '#999', fontSize: 11, marginTop: 2 },

  // STYLES BARU UNTUK PEMANIS
  extraSection: { paddingHorizontal: 25, marginTop: 25 },
  tipCard: { 
    backgroundColor: '#002B5B', // Biru sedikit lebih terang dari background utama
    padding: 15, 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.3)'
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tipTitle: { color: KOMATSU_YELLOW, fontWeight: '800', fontSize: 13, marginLeft: 8, textTransform: 'uppercase' },
  tipContent: { color: '#B0C4DE', fontSize: 11, lineHeight: 16 },
  
  statusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  statusBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8F9FA', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    width: '48%'
  },
  statusText: { marginLeft: 8, fontSize: 11, fontWeight: '600', color: '#666' }
});

export default HomeScreen;