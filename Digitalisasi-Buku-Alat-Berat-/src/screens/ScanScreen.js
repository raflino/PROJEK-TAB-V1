import React, { useState, useRef, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity,  
  ActivityIndicator, Alert, Dimensions, Platform 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator'; 
import * as ImagePicker from 'expo-image-picker'; 
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();
  const isProcessing = useRef(false);

  // 1. FILTER KODE ERROR (Diperbarui dengan Regex lebih kuat)
  const validateAndExtractCode = (rawText) => {
    if (!rawText) return null;
    
    // Hapus spasi dan jadikan huruf kapital
    const cleanText = rawText.replace(/\s+/g, '').toUpperCase();
    console.log("Clean text:", cleanText);
    
    // Pattern disesuaikan dengan kode alat berat (Hitachi, Komatsu, CAT, dll)
    const patterns = [
      /([A-Z]{2,4}\d{2,5})/,          // CA145, E10, E1023
      /([A-Z0-9]{3,5}[-]\d{1,3})/,    // 1234-5, CA-15
      /(\d{3,5}[A-Z]\d{2,4})/,        // 123A456
      /([A-Z]{1,2}\d{1,3}[A-Z]{1,2})/,// E15A
      /(CID\d{2,4}FMI\d{1,2})/        // Kode CAT standar
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        console.log("Match found:", match[1]);
        return match[1];
      }
    }
    
    return cleanText.length > 2 ? cleanText.substring(0, 30) : null;
  };

  // 2. FUNGSI OCR (Diperbarui dengan sistem Multi-Engine)
  const performOCR = async (base64Data, retryCount = 0) => {
    try {
      if (!base64Data || base64Data.length < 100) {
        throw new Error("Data gambar tidak valid");
      }

      const apiKey = "K84623724388957"; 
      
      // Jika retryCount 0 gunakan OCREngine 2, jika retryCount 1 gunakan OCREngine 1
      const engineToUse = retryCount === 0 ? "2" : "1";
      
      const formData = new FormData();
      formData.append("base64Image", `data:image/jpeg;base64,${base64Data}`);
      formData.append("apikey", apiKey);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");
      formData.append("detectOrientation", "true");
      formData.append("scale", "true");
      formData.append("isTable", "false");
      formData.append("OCREngine", engineToUse); 

      console.log(`Mengirim request OCR... (Percobaan ${retryCount + 1}, Engine: ${engineToUse})`);

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const result = await response.json();
      
      if (result.OCRExitCode === 1 || result.OCRExitCode === 2) {
        let fullText = '';
        
        if (result.ParsedResults && result.ParsedResults.length > 0) {
          fullText = result.ParsedResults
            .map(item => item.ParsedText)
            .join(' ')
            .trim();
        }

        console.log(`Raw OCR Text (Engine ${engineToUse}):`, `"${fullText}"`);

        // Jika tidak ada teks terdeteksi dan baru percobaan pertama, coba lagi dengan Engine berbeda
        if ((!fullText || fullText.length === 0) && retryCount === 0) {
          console.log("Teks kosong, mencoba lagi dengan OCR Engine 1...");
          return await performOCR(base64Data, 1);
        }

        if (!fullText || fullText.length === 0) {
          Alert.alert(
            "Tidak Ada Teks Terdeteksi", 
            "Pastikan:\n• Kode berada dalam kotak\n• Kamera fokus dan tidak buram\n• Tidak ada pantulan cahaya berlebih",
            [{ text: "Coba Lagi" }]
          );
          return { success: false };
        }

        const validCode = validateAndExtractCode(fullText);

        if (validCode) {
          setScanResult({
            code: validCode,
            fullText: fullText,
            timestamp: new Date().toISOString()
          });

          Alert.alert(
            "✅ Kode Terdeteksi!", 
            `Kode: ${validCode}\n\nTeks lengkap:\n${fullText}`,
            [
              { text: "Batal", style: "cancel" },
              { 
                text: "Analisis", 
                onPress: () => navigation.navigate('Chat', { scannedCode: validCode, fullText: fullText }) 
              }
            ]
          );
          return { success: true };
        } else {
          Alert.alert(
            "Teks Terbaca", 
            `Teks: "${fullText}"\n\nTidak ada format kode error yang cocok. Lanjutkan dengan teks ini?`,
            [
              { text: "Coba Lagi" },
              { 
                text: "Tetap Lanjutkan", 
                onPress: () => navigation.navigate('Chat', { scannedCode: fullText.substring(0, 50), fullText: fullText }) 
              }
            ]
          );
          return { success: false };
        }
      } else {
        throw new Error(`OCR Error Code: ${result.OCRExitCode}`);
      }
    } catch (error) {
      console.error("OCR Error:", error);
      Alert.alert("Error", "Gagal memproses gambar ke server. Pastikan internet stabil.");
      return { success: false };
    }
  };

  // 3. SCAN VIA KAMERA (Diperbarui logika Crop dan Kompresi)
  const handleScan = useCallback(async () => {
    if (!cameraRef.current || loading || isProcessing.current) {
      return;
    }

    try {
      isProcessing.current = true;
      setLoading(true);
      console.log("Mengambil foto...");
      
      const photo = await cameraRef.current.takePictureAsync({ 
        quality: 1, 
        base64: false,
        skipProcessing: true, 
      });

      if (!photo || !photo.uri) throw new Error("Gagal mengambil foto");

      // Ukuran kotak dari UI adalah 150 tinggi
      const cropAreaWidth = SCREEN_WIDTH * 0.85; 
      const cropAreaHeight = 150; 
      
      const factorX = photo.width / SCREEN_WIDTH;
      const factorY = photo.height / SCREEN_HEIGHT;
      
      const cropWidth = cropAreaWidth * factorX;
      const cropHeight = cropAreaHeight * factorY;
      
      // Hitung posisi tengah yang pas
      const originX = (photo.width - cropWidth) / 2;
      const originY = (photo.height - cropHeight) / 2;

      const safeOriginX = Math.max(0, Math.floor(originX));
      const safeOriginY = Math.max(0, Math.floor(originY));
      const safeCropWidth = Math.floor(Math.min(cropWidth, photo.width - safeOriginX));
      const safeCropHeight = Math.floor(Math.min(cropHeight, photo.height - safeOriginY));

      console.log("Memotong area:", { safeOriginX, safeOriginY, safeCropWidth, safeCropHeight });

      // Crop, Resize, dan set format ke JPEG agar base64 lebih ringan
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          { crop: { originX: safeOriginX, originY: safeOriginY, width: safeCropWidth, height: safeCropHeight } },
          { resize: { width: 1000 } } 
        ],
        { 
          base64: true, 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );

      if (!manipulated.base64) throw new Error("Gagal konversi ke base64");

      await performOCR(manipulated.base64);

    } catch (error) {
      console.error("Scan Error:", error);
      Alert.alert("Error", `Gagal melakukan scan: ${error.message}`);
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  }, [loading]);

  // 4. SCAN VIA GALERI (Diperbarui dengan resizing yang sama agar API tidak timeout)
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("Izin Diperlukan", "Akses galeri diperlukan");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 2],
        quality: 1,
        base64: false, // Ambil URI saja dulu agar bisa dikompres
      });

      if (!result.canceled && result.assets?.[0]) {
        setLoading(true);
        isProcessing.current = true;
        
        const asset = result.assets[0];
        
        // Kompres dan resize gambar galeri ke JPEG
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1000 } }], // Resize agar tidak terlalu besar
          { base64: true, compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );  
        
        await performOCR(manipulated.base64);
      }
    } catch (error) {
      console.error("Gallery Error:", error);
      Alert.alert("Error", "Gagal memilih gambar");
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  const toggleFlash = () => setFlash(prev => !prev);

  // --- UI RENDER ---

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.whiteText}>Memuat kamera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <MaterialCommunityIcons name="camera-off" size={80} color="#666" />
          <Text style={styles.permissionTitle}>Akses Kamera Diperlukan</Text>
          <Text style={styles.permissionDesc}>
            Izinkan aplikasi untuk mengakses kamera{'\n'}agar dapat melakukan scan kode error
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <MaterialCommunityIcons name="camera" size={24} color="#003366" />
            <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={35} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>FAILURE CODE SCANNER</Text>
          <Text style={styles.headerSub}>Excavator Monitor System</Text>
        </View>
        <View style={{ width: 35 }} />
      </View>

      {/* CAMERA AREA */}
      <View style={styles.cameraArea}>
        {isFocused && (
          <>
            <CameraView 
              ref={cameraRef} 
              style={StyleSheet.absoluteFill} 
              facing="back"
              enableTorch={flash}
              autofocus="on"
            />
            <View style={styles.overlayContainer} pointerEvents="box-none">
              <View style={styles.maskDark} />
              <View style={styles.maskCenterRow}>
                <View style={styles.maskDark} />
                <View style={styles.targetFrame}>
                  <View style={styles.cornerTL} />
                  <View style={styles.cornerTR} />
                  <View style={styles.cornerBL} />
                  <View style={styles.cornerBR} />
                  {loading && (
                    <View style={styles.loadingBox}>
                      <ActivityIndicator size="large" color="#FFD700" />
                      <Text style={styles.loadingText}>Memindai...</Text>
                    </View>
                  )}
                </View>
                <View style={styles.maskDark} />
              </View>
              <View style={[styles.maskDark, { alignItems: 'center', paddingTop: 20 }]}>
                <Text style={styles.hintText}>
                  POSISIKAN KODE ERROR DI DALAM KOTAK
                </Text>
                {scanResult && (
                  <View style={styles.lastScanBadge}>
                    <Text style={styles.lastScanLabel}>Terakhir: </Text>
                    <Text style={styles.lastScanCode}>{scanResult.code}</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </View>

      {/* BOTTOM PANEL */}
      <View style={styles.bottomPanel}>
        <Text style={styles.instruction}>
          Scan kode kerusakan pada panel monitor alat berat{'\n'}untuk mendapatkan analisis perbaikan
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.sideBtn} onPress={handlePickImage} disabled={loading}>
            <MaterialCommunityIcons name="image-plus" size={30} color="#FFD700" />
            <Text style={styles.sideText}>Galeri</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleScan} 
            disabled={loading} 
            style={[styles.mainBtn, { backgroundColor: loading ? '#444' : '#FFD700' }]}
          >
            <MaterialCommunityIcons name="camera-iris" size={50} color="#003366" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideBtn} onPress={toggleFlash}>
            <MaterialCommunityIcons 
              name={flash ? "flashlight" : "flashlight-off"} 
              size={30} 
              color={flash ? "#FFD700" : "#555"} 
            />
            <Text style={[styles.sideText, { color: flash ? "#FFD700" : "#555" }]}>
              Flash
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  whiteText: { color: 'white', marginTop: 10 },
  permissionTitle: { color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  permissionDesc: { color: '#999', fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  permissionBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 30,
    alignItems: 'center',
  },
  permissionBtnText: { color: '#003366', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  headerSub: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  cameraArea: { flex: 1 },
  overlayContainer: { ...StyleSheet.absoluteFillObject },
  maskDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
  maskCenterRow: { flexDirection: 'row', height: 150 },
  targetFrame: {
    width: SCREEN_WIDTH * 0.85,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: 35, height: 35,
    borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#FFD700',
  },
  cornerTR: {
    position: 'absolute', top: 0, right: 0,
    width: 35, height: 35,
    borderTopWidth: 5, borderRightWidth: 5, borderColor: '#FFD700',
  },
  cornerBL: {
    position: 'absolute', bottom: 0, left: 0,
    width: 35, height: 35,
    borderBottomWidth: 5, borderLeftWidth: 5, borderColor: '#FFD700',
  },
  cornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: 35, height: 35,
    borderBottomWidth: 5, borderRightWidth: 5, borderColor: '#FFD700',
  },
  loadingBox: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  loadingText: { color: '#FFD700', marginTop: 10, fontWeight: 'bold' },
  hintText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  lastScanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.5)',
  },
  lastScanLabel: { color: '#999', fontSize: 11 },
  lastScanCode: { color: '#4CAF50', fontSize: 14, fontWeight: 'bold', marginLeft: 5 },
  bottomPanel: {
    backgroundColor: '#111',
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
  },
  instruction: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  mainBtn: {
    padding: 12,
    borderRadius: 60,
    elevation: 15,
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  sideBtn: { alignItems: 'center', width: 60 },
  sideText: { color: '#FFD700', fontSize: 10, marginTop: 5, fontWeight: 'bold' },
});