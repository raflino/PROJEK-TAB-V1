import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import * as IntentLauncher from 'expo-intent-launcher';

const KOMATSU_YELLOW = '#FFB800'; 
const DEEP_BLUE = '#001F3F';

const KatalogScreen = ({ navigation }) => {
  
  const manualFiles = [
    { 
      id: '1', 
      title: 'PC200-8 Service Manual', 
      subtitle: 'Shop Manual SEN00084-03',
      size: '65.2 MB', 
      localFile: require('../../assets/pdf/manual_pc200_8.pdf'), 
      fileName: 'manual_pc200_8.pdf'
    },
  ];

  const openPDF = async (fileSource, fileName) => {
    try {
      const asset = Asset.fromModule(fileSource);
      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new Error("Gagal memuat file");
      }

      const fileUri = FileSystem.cacheDirectory + fileName;
      
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: fileUri
      });

      if (Platform.OS === 'android') {
        try {
          const contentUri = await FileSystem.getContentUriAsync(fileUri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: 'application/pdf',
          });
        } catch (intentError) {
          console.warn('Intent launcher failed, falling back to sharing:', intentError);
          const isSharingAvailable = await Sharing.isAvailableAsync();
          if (isSharingAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Buka ${fileName}`,
            });
          } else {
            throw new Error("Tidak dapat membuka file PDF. Pastikan ada aplikasi PDF reader.");
          }
        }
      } else {
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Buka ${fileName}`,
          });
        } else {
          throw new Error("Sharing tidak tersedia di perangkat ini");
        }
      }

    } catch (error) {
      Alert.alert(
        "Gagal Membuka PDF",
        error.message + "\n\n" +
        "Pastikan:\n" +
        "1. Ada aplikasi PDF reader terinstall\n" +
        "2. Coba restart aplikasi",
        [{ text: "OK" }]
      );
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.pdfCard} 
      onPress={() => openPDF(item.localFile, item.fileName)}
      activeOpacity={0.7}
    >
      <View style={styles.pdfIconBox}>
        <MaterialCommunityIcons name="file-pdf-box" size={32} color="#E74C3C" />
      </View>
      <View style={styles.pdfInfo}>
        <Text style={styles.pdfTitle}>{item.title}</Text>
        <Text style={styles.pdfSubtitle}>{item.subtitle}</Text>
        <Text style={styles.fileDetails}>{item.fileName} • {item.size}</Text>
      </View>
      <View style={styles.openBadge}>
         <MaterialCommunityIcons name="eye-outline" size={20} color={DEEP_BLUE} />
         <Text style={styles.openText}>BUKA</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Manuals</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>OFFLINE DOCUMENTS</Text>
            <View style={styles.yellowLine} />
        </View>
        <FlatList
          data={manualFiles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FDFDFD' 
  },
  header: {
    backgroundColor: DEEP_BLUE,
    height: 110,
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
    elevation: 10,
  },
  headerTitle: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: '800' 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: 20 
  },
  sectionLabelContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  sectionLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#BBB', 
    letterSpacing: 1.2 
  },
  yellowLine: { 
    flex: 1, 
    height: 2, 
    backgroundColor: KOMATSU_YELLOW, 
    marginLeft: 10 
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pdfIconBox: { 
    width: 55, 
    height: 55, 
    backgroundColor: '#FDEDEC', 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  pdfInfo: { 
    flex: 1, 
    marginLeft: 15 
  },
  pdfTitle: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#1A1A1A' 
  },
  pdfSubtitle: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 2 
  },
  fileDetails: { 
    fontSize: 10, 
    color: '#999', 
    marginTop: 4, 
    fontWeight: '600' 
  },
  openBadge: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginLeft: 10 
  },
  openText: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: DEEP_BLUE, 
    marginTop: 2 
  }
});

export default KatalogScreen;