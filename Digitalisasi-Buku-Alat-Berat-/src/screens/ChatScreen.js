import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar,
  Keyboard, Alert, Image, Modal, ScrollView, Dimensions
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import BASE_URL, { API_ENDPOINTS } from '../data/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const KOMATSU_YELLOW = '#FFB800'; 
const DEEP_BLUE = '#001F3F';

const AutoHeightImage = ({ uri, style }) => {
  const [aspectRatio, setAspectRatio] = useState(16 / 9); 
  useEffect(() => {
    if (uri) {
      Image.getSize(uri, (width, height) => {
        if (width && height) setAspectRatio(width / height);
      }, (error) => console.log('Failed to get image size:', error));
    }
  }, [uri]);
  return <Image source={{ uri }} style={[style, { aspectRatio }]} resizeMode="contain" />;
};

// ==========================================
// HELPER: Render text dengan pemisah "|" atau "."
// ==========================================
const renderMultiLineText = (text, textStyle, highlightStyle = null) => {
  if (!text || text === '-') return <Text style={textStyle}>-</Text>;
  
  // Split by "|" first, then by "." if no "|" found
  let splitItems = [];
  if (text.includes('|')) {
    splitItems = text.split('|').map(i => i.trim()).filter(i => i !== "");
  } else if (text.includes('.')) {
    // Split by "." but keep meaningful sentences (not decimals)
    splitItems = text.split(/\.\s+/).map(i => i.trim()).filter(i => i !== "");
    // Add back the period
    splitItems = splitItems.map(item => item.endsWith('.') ? item : item + '.');
  } else {
    return <Text style={textStyle}>{text}</Text>;
  }
  
  if (splitItems.length === 0) return <Text style={textStyle}>-</Text>;
  
  return (
    <View>
      {splitItems.map((item, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
          <Text style={[textStyle, { fontWeight: 'bold', marginRight: 6 }]}>•</Text>
          <View style={{ flex: 1 }}>
            <Text style={textStyle}>{item}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// ==========================================
// COMPONENT: S-MODE GENERAL CAUSES CARD
// ==========================================
const SModeGeneralCauses = ({ generalCauses }) => {
  if (!generalCauses || generalCauses.length === 0) return null;

  const renderCauses = () => {
    return generalCauses.map((cause, idx) => {
      const isNote = cause.kind === 'NOTE';
      return (
        <View key={idx} style={styles.generalCauseItem}>
          <View style={styles.generalCauseNumber}>
            <Text style={styles.generalCauseNumberText}>{isNote ? '📝' : idx + 1}</Text>
          </View>
          <View style={styles.generalCauseContent}>
            <Text style={styles.generalCauseText}>{cause.causeText}</Text>
          </View>
        </View>
      );
    });
  };

  return (
    <View style={styles.smodeGeneralCard}>
      <View style={styles.smodeGeneralHeader}>
        <MaterialCommunityIcons name="clipboard-text" size={20} color={KOMATSU_YELLOW} />
        <Text style={styles.smodeGeneralTitle}>GENERAL CAUSES</Text>
      </View>
      <View style={styles.smodeGeneralDivider} />
      <View style={styles.smodeGeneralBody}>
        {renderCauses()}
      </View>
    </View>
  );
};


const SModeResultCard = ({ conclusion, topAction }) => {
  if (!conclusion && !topAction) return null;

  return (
    <View style={styles.smodeResultCard}>
      <View style={styles.smodeResultCardHeader}>
        <MaterialCommunityIcons name="clipboard-check" size={20} color={KOMATSU_YELLOW} />
        <Text style={styles.smodeResultCardTitle}>DIAGNOSIS RESULT</Text>
      </View>
      <View style={styles.smodeResultCardDivider} />
      
      <View style={styles.smodeResultCardBody}>
        {conclusion && (
          <View style={styles.smodeResultSection}>
            <View style={styles.smodeResultSectionHeader}>
              <MaterialCommunityIcons name="target" size={16} color={KOMATSU_YELLOW} />
              <Text style={styles.smodeResultSectionTitle}>CONCLUSION</Text>
            </View>
            
            {conclusion.suspected_trouble && (
              <View style={styles.smodeResultItem}>
                <Text style={styles.smodeResultLabel}>Suspected Trouble:</Text>
                <Text style={styles.smodeResultValue}>{conclusion.suspected_trouble}</Text>
              </View>
            )}
            
            {conclusion.recommended_remedy && (
              <View style={styles.smodeResultItem}>
                <Text style={styles.smodeResultLabel}>Remedy:</Text>
                <Text style={styles.smodeResultValue}>{conclusion.recommended_remedy}</Text>
              </View>
            )}
          </View>
        )}

        {conclusion && topAction && (
          <View style={styles.smodeResultSectionDivider} />
        )}

        {topAction && (
          <View style={styles.smodeResultSection}>
            <View style={styles.smodeResultSectionHeader}>
              <MaterialCommunityIcons name="wrench" size={16} color={KOMATSU_YELLOW} />
              <Text style={styles.smodeResultSectionTitle}>FINAL ACTION</Text>
            </View>
            
            {topAction.cause_name && (
              <View style={styles.smodeResultItem}>
                <Text style={styles.smodeResultLabel}>Cause:</Text>
                <Text style={styles.smodeResultValue}>{topAction.cause_name}</Text>
              </View>
            )}
            
            {topAction.troubleshooting_step && (
              <View style={styles.smodeResultItem}>
                <Text style={styles.smodeResultLabel}>Step:</Text>
                <Text style={styles.smodeResultValue}>• {topAction.troubleshooting_step}</Text>
              </View>
            )}
            
            {topAction.remedy_text && (
              <View style={styles.smodeResultItem}>
                <Text style={styles.smodeResultLabel}>Remedy:</Text>
                <Text style={styles.smodeResultValue}>💡 {topAction.remedy_text}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

// ==========================================
// COMPONENT: STEP CARD (TROUBLESHOOTING) - UPDATED
// ==========================================
// ==========================================
// COMPONENT: STEP CARD (TROUBLESHOOTING) - UPDATED
// ==========================================
const StepCard = ({ data, index, isLastStep, onFinish, onNext }) => {
  const [showCircuit, setShowCircuit] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  const handleOpenZoom = (uri) => {
    setSelectedImg(uri);
    setModalVisible(true);
  };

  // Helper untuk render teks dengan pemisah "•"
  const renderBulletText = (text, textStyle) => {
    if (!text || text === '-') return <Text style={textStyle}>-</Text>;
    
    // Split by "•" symbol
    if (text.includes('•')) {
      const splitItems = text.split('•').map(i => i.trim()).filter(i => i !== "");
      if (splitItems.length === 0) return <Text style={textStyle}>-</Text>;
      
      return (
        <View>
          {splitItems.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
              <Text style={[textStyle, { fontWeight: 'bold', marginRight: 6, color: '#334155' }]}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={textStyle}>{item}</Text>
              </View>
            </View>
          ))}
        </View>
      );
    }
    
    // Jika ada "|" juga split
    if (text.includes('|')) {
      const splitItems = text.split('|').map(i => i.trim()).filter(i => i !== "");
      if (splitItems.length <= 1) return <Text style={textStyle}>{text}</Text>;
      
      return (
        <View>
          {splitItems.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
              <Text style={[textStyle, { fontWeight: 'bold', marginRight: 6, color: '#334155' }]}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={textStyle}>{item}</Text>
              </View>
            </View>
          ))}
        </View>
      );
    }
    
    // Jika ada ". " (titik spasi) split per kalimat
    if (text.includes('. ')) {
      const splitItems = text.split(/\.\s+/).map(i => i.trim()).filter(i => i !== "");
      if (splitItems.length <= 1) return <Text style={textStyle}>{text}</Text>;
      
      return (
        <View>
          {splitItems.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
              <Text style={[textStyle, { fontWeight: 'bold', marginRight: 6, color: '#334155' }]}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={textStyle}>{item}{item.endsWith('.') ? '' : '.'}</Text>
              </View>
            </View>
          ))}
        </View>
      );
    }
    
    // Teks biasa
    return <Text style={textStyle}>{text}</Text>;
  };

  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{index + 1}</Text></View>
        <Text style={styles.stepHeaderText}>REPAIR STEP</Text>
      </View>
      <Text style={styles.causeDesc}>{data.cause_description || data.cause_text || 'No description'}</Text>
      
      {/* ===== CIRCUIT DIAGRAM (image_url) ===== */}
      {data.image_url && (
        <TouchableOpacity style={styles.btnCircuit} onPress={() => setShowCircuit(!showCircuit)}>
          <MaterialCommunityIcons name={showCircuit ? "eye-off-outline" : "image-search-outline"} size={18} color="#FFF" />
          <Text style={styles.btnTextWhite}> {showCircuit ? "Hide Diagram" : "View Circuit Diagram"}</Text>
        </TouchableOpacity>
      )}
      {showCircuit && data.image_url && (
        <TouchableOpacity activeOpacity={0.9} style={styles.imageFrame} onPress={() => handleOpenZoom(data.image_url)}>
          <Text style={styles.labelFrame}>CIRCUIT DIAGRAM (Tap to Zoom)</Text>
          <AutoHeightImage uri={data.image_url} style={styles.fullImage} />
        </TouchableOpacity>
      )}

      {/* ===== CHECK METHOD - DENGAN BULLET POINTS ===== */}
      <View style={styles.methodBox}>
        <Text style={styles.labelSmall}>CHECK METHOD:</Text>
        {renderBulletText(data.check_method || data.troubleshooting_step || '-', styles.methodText)}
      </View>

      {/* ===== STANDARD CONDITION ===== */}
      <View style={styles.standardBox}>
        <Text style={styles.labelSmall}>STANDARD CONDITION:</Text>
        {data.standard_value && (
          <Text style={styles.standardValueText}>{data.standard_value}</Text>
        )}
        {/* ===== STANDARD IMAGE (standard_image_url) ===== */}
        {data.standard_image_url && (
          <TouchableOpacity activeOpacity={0.9} style={styles.imageFrameStandard} onPress={() => handleOpenZoom(data.standard_image_url)}>
            <Text style={[styles.labelFrame, {color: '#166534'}]}>STANDARD REFERENCE (Tap to Zoom)</Text>
            <AutoHeightImage uri={data.standard_image_url} style={styles.standardImage} />
          </TouchableOpacity>
        )}
      </View>

      {/* ===== REMEDY ===== */}
      {(data.remedy || data.remedy_text) && (
        <View style={styles.remedyBox}>
            <Text style={[styles.labelSmall, {color: '#B45309'}]}>REMEDY / SOLUTION:</Text>
            {renderBulletText(data.remedy || data.remedy_text, styles.methodText)}
        </View>
      )}

      <View style={styles.stepActionRow}>
        <TouchableOpacity style={styles.btnYa} onPress={onFinish}><Text style={styles.btnTextWhite}>Resolved</Text></TouchableOpacity>
        {!isLastStep && <TouchableOpacity style={styles.btnTidak} onPress={onNext}><Text style={styles.btnTextBlack}>Still Error</Text></TouchableOpacity>}
      </View>

      {/* ===== MODAL ZOOM IMAGE ===== */}
     <Modal visible={modalVisible} transparent={true} animationType="fade">
  <View style={styles.modalContainer}>
    <SafeAreaView style={styles.modalHeader}>
      <TouchableOpacity onPress={() => setModalVisible(false)}>
        <MaterialCommunityIcons name="close-circle" size={40} color={KOMATSU_YELLOW} />
      </TouchableOpacity>
    </SafeAreaView>
    <View style={styles.tableZoomContainer}>
      <ReactNativeZoomableView
        maxZoom={4}
        minZoom={1}
        zoomStep={0.5}
        initialZoom={1}
        bindToBorders={true}
        style={{ flex: 1 }}
      >
        <Image 
          source={{ uri: selectedImg }} 
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 }} 
          resizeMode="contain" 
        />
      </ReactNativeZoomableView>
    </View>
  </View>
</Modal>
    </View>
  );
}; 

// ==========================================
// COMPONENT: S-MODE INPUT SELECTION
// ==========================================
const SModeInputSelection = ({ inputs, caseCode, onAnalyze, loading }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelection = (rowId) => {
    setSelectedIds(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  };

  const handleAnalyze = () => {
    if (selectedIds.length === 0) {
      Alert.alert('Info', 'Please select at least one input.');
      return;
    }
    
    console.log('=== HANDLE ANALYZE ===');
    console.log('caseCode:', caseCode);
    console.log('selectedIds:', selectedIds);
    console.log('selectedIds.join(","):', selectedIds.join(','));
    
    if (!caseCode) {
      Alert.alert('Error', 'Case Code is missing. Please try again.');
      return;
    }
    
    onAnalyze(caseCode, selectedIds.join(','));
  };

  const questions = inputs?.filter(i => i.rowType === 'QUESTION') || [];
  const checkItems = inputs?.filter(i => i.rowType === 'CHECK_ITEM') || [];

  return (
    <View style={styles.smodeInputWrapper}>
      <ScrollView 
        style={styles.smodeInputScroll}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <View style={styles.smodeInputContainer}>
          <View style={styles.smodeHeader}>
            <MaterialCommunityIcons name="clipboard-list" size={24} color={DEEP_BLUE} />
            <Text style={styles.smodeSectionTitle}>DIAGNOSTIC INPUTS</Text>
          </View>
          <Text style={styles.smodeSubtitle}>Select conditions that match your situation:</Text>
          
          {questions.length > 0 && (
            <View style={styles.smodeGroup}>
              <View style={styles.smodeGroupHeader}>
                <MaterialCommunityIcons name="help-circle" size={18} color={DEEP_BLUE} />
                <Text style={styles.smodeGroupTitle}>Questions</Text>
                <View style={styles.smodeCountBadge}>
                  <Text style={styles.smodeCountText}>{questions.length}</Text>
                </View>
              </View>
              {questions.map((item) => (
                <TouchableOpacity
                  key={item.rowId}
                  style={[
                    styles.smodeInputItem,
                    selectedIds.includes(item.rowId) && styles.smodeInputItemSelected
                  ]}
                  onPress={() => toggleSelection(item.rowId)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.smodeCheckbox, selectedIds.includes(item.rowId) && styles.smodeCheckboxSelected]}>
                    {selectedIds.includes(item.rowId) && (
                      <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                    )}
                  </View>
                  <Text style={styles.smodeInputText} numberOfLines={2}>{item.rowText}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {checkItems.length > 0 && (
            <View style={styles.smodeGroup}>
              <View style={styles.smodeGroupHeader}>
                <MaterialCommunityIcons name="tools" size={18} color={DEEP_BLUE} />
                <Text style={styles.smodeGroupTitle}>Check Items</Text>
                <View style={styles.smodeCountBadge}>
                  <Text style={styles.smodeCountText}>{checkItems.length}</Text>
                </View>
              </View>
              {checkItems.map((item) => (
                <TouchableOpacity
                  key={item.rowId}
                  style={[
                    styles.smodeInputItem,
                    selectedIds.includes(item.rowId) && styles.smodeInputItemSelected
                  ]}
                  onPress={() => toggleSelection(item.rowId)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.smodeCheckbox, selectedIds.includes(item.rowId) && styles.smodeCheckboxSelected]}>
                    {selectedIds.includes(item.rowId) && (
                      <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                    )}
                  </View>
                  <Text style={styles.smodeInputText} numberOfLines={2}>{item.rowText}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.smodeActionRow}>
            <View style={styles.smodeSelectedInfo}>
              <MaterialCommunityIcons name="check-circle" size={16} color={selectedIds.length > 0 ? '#22C55E' : '#94A3B8'} />
              <Text style={styles.smodeSelectedCount}>
                Selected: <Text style={[styles.smodeSelectedCountBold, {color: selectedIds.length > 0 ? DEEP_BLUE : '#94A3B8'}]}>{selectedIds.length}</Text> item(s)
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.smodeAnalyzeBtn, 
                (loading || selectedIds.length === 0) && styles.smodeAnalyzeBtnDisabled
              ]}
              onPress={handleAnalyze}
              disabled={loading || selectedIds.length === 0}
            >
              <MaterialCommunityIcons 
                name={loading ? "loading" : "magnify"} 
                size={18} 
                color={KOMATSU_YELLOW} 
                style={loading && {transform: [{rotate: '360deg'}]}}
              />
              <Text style={styles.smodeAnalyzeBtnText}>
                {loading ? 'Analyzing...' : 'Analyze'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ==========================================
// COMPONENT: S-MODE RESULT
// ==========================================
const SModeResult = ({ result, imageFilename }) => {
  const [showTable, setShowTable] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  if (!result) return null;

  const handleViewTable = () => {
    setShowTable(!showTable);
  };

  const handleZoomTable = () => {
    setModalVisible(true);
  };

  const getTopAction = () => {
    if (!result.final_actions || result.final_actions.length === 0) return null;
    
    if (result.rankings && result.rankings.length > 0) {
      const topCause = result.rankings[0].trouble_candidate;
      const matchedAction = result.final_actions.find(
        action => action.cause_name === topCause
      );
      return matchedAction || result.final_actions[0];
    }
    
    return result.final_actions[0];
  };

  const topAction = getTopAction();

  const getSModelImageUrl = (filename) => {
    if (!filename) return null;
    const baseUrl = BASE_URL.replace('/api', '');
    return `${baseUrl}/images/S-MODE/${filename}`;
  };

  return (
    <View style={styles.smodeResultContainer}>
      <Text style={styles.smodeResultTitle}>📊 DIAGNOSTIC ANALYSIS RESULT</Text>
      
      {result.rankings && result.rankings.length > 0 && (
        <View style={styles.smodeRankings}>
          <Text style={styles.smodeRankingsTitle}>🏆 TOP 3 CAUSES</Text>
          {result.rankings.slice(0, 3).map((rank, idx) => (
            <View key={idx} style={styles.smodeRankItem}>
              <View style={styles.smodeRankBadge}>
                <Text style={styles.smodeRankNumber}>#{rank.rank_no || idx + 1}</Text>
              </View>
              <View style={styles.smodeRankContent}>
                <Text style={styles.smodeRankCause}>{rank.trouble_candidate}</Text>
                <View style={styles.smodeRankDetail}>
                  <Text style={styles.smodeRankSymbols}>Symbols: {rank.symbol_count}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {(result.conclusion || topAction) && (
        <SModeResultCard 
          conclusion={result.conclusion} 
          topAction={topAction} 
        />
      )}

      {imageFilename && (
        <>
          <TouchableOpacity 
            style={styles.checkTableBtn} 
            onPress={handleViewTable}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name={showTable ? "table-eye-off" : "table-eye"} 
              size={20} 
              color="#FFF" 
            />
            <Text style={styles.checkTableBtnText}>
              {showTable ? "HIDE REFERENCE TABLE" : "VIEW REFERENCE TABLE"}
            </Text>
          </TouchableOpacity>
          
          {showTable && (
            <TouchableOpacity 
              style={styles.tableImageContainer}
              onPress={handleZoomTable}
              activeOpacity={0.9}
            >
              <Text style={styles.tableImageLabel}>📋 REFERENCE TABLE (Tap to zoom)</Text>
              <Image 
                source={{ uri: getSModelImageUrl(imageFilename) }}
                style={styles.tableImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </>
      )}

      <Modal 
        visible={modalVisible} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close-circle" size={40} color={KOMATSU_YELLOW} />
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.tableZoomContainer}>
            <ScrollView 
              maximumZoomScale={4} 
              minimumZoomScale={1} 
              centerContent={true}
              horizontal={false}
            >
              <Image 
                source={{ uri: getSModelImageUrl(imageFilename) }}
                style={styles.tableZoomImage}
                resizeMode="contain"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ==========================================
// MAIN SCREEN
// ==========================================
const ChatScreen = ({ navigation, route }) => {
  const [searchText, setSearchText] = useState('');
  const [messages, setMessages] = useState([
    { id: 'start-' + Date.now(), sender: 'bot', text: 'Welcome! Please select a diagnosis mode to search:', type: 'mode_selection' }
  ]);
  const [loading, setLoading] = useState(false);
  const [activeData, setActiveData] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const flatListRef = useRef();
  const [userNim, setUserNim] = useState(null);
  const [sModeData, setSModeData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      try {
        const session = await AsyncStorage.getItem('user_session');
        if (session) {
          const userData = JSON.parse(session);
          setUserNim(userData.nim);
        }
      } catch (e) {
        console.log('Gagal ambil session:', e);
      }
    };

    getSession();

    if (route.params?.scannedCode) {
      selectMode('CODE', route.params.scannedCode);
    }
  }, [route.params?.scannedCode]);

  const resetChat = () => {
    setSelectedMode(null);
    setSModeData(null);
    setActiveData(null);
    setMessages([{ id: 'start-' + Date.now(), sender: 'bot', text: 'Welcome! Please select a diagnosis mode to search:', type: 'mode_selection' }]);
  };

  const triggerModeSelection = () => {
    setSelectedMode(null);
    setSModeData(null);
    setActiveData(null);
    setMessages(prev => [...prev, { 
      id: 'reselect-' + Date.now(), sender: 'bot', text: 'Please select a diagnosis mode again:', type: 'mode_selection' 
    }]);
  };

  const selectMode = (mode, autoKeyword = null) => {
    setSelectedMode(mode);
    setSModeData(null);
    setActiveData(null);
    setMessages(prev => [...prev, 
      { id: 'user-mode-' + Date.now(), sender: 'user', text: `Mode: ${mode}`, type: 'text' },
      { id: 'ask-' + Date.now(), sender: 'bot', text: `Mode ${mode} selected. Please enter your search keyword:`, type: 'text' }
    ]);
    if(autoKeyword) handleSearch(autoKeyword, mode);
  };

  const handleSearch = async (manualKeyword = null, forceMode = null) => {
    const mode = forceMode || selectedMode;
    const keyword = manualKeyword || searchText;
    if (!mode) return triggerModeSelection();
    if (!keyword.trim()) return;

    Keyboard.dismiss();
    if (!manualKeyword) setMessages(prev => [...prev, { id: 'user-msg-' + Date.now(), text: keyword, sender: 'user', type: 'text' }]);
    setSearchText('');
    setLoading(true);

    try {
      const url = `${API_ENDPOINTS.search}?mode=${mode}&keyword=${encodeURIComponent(keyword)}`;
      console.log('Search URL:', url);
      
      const res = await fetch(url);
      const data = await res.json();
      
      console.log("=== SEARCH RESPONSE ===");
      console.log("Status:", res.status);
      console.log("Search JSON:", data);
      
      if (res.ok && data && data.length > 0) {
        if (data.length === 1) {
          const firstItem = data[0];
          const id = firstItem.id || firstItem.case_id || firstItem.caseId;
          if (id) {
            fetchDetail(id, mode, firstItem);
          } else {
            setMessages(prev => [...prev, { 
              id: 'err-' + Date.now(), 
              sender: 'bot', 
              text: 'Error: ID not found in response.', 
              type: 'text' 
            }]);
          }
        } else {
          setMessages(prev => [...prev, { 
            id: 'list-' + Date.now(), 
            sender: 'bot', 
            text: `Found ${data.length} results, please choose one:`, 
            type: 'result_list', 
            data: data, 
            mode: mode 
          }]);
        }
      } else {
        setMessages(prev => [...prev, { id: 'err-' + Date.now(), sender: 'bot', text: 'Records not found.', type: 'text' }]);
      }
    } catch (e) {
      console.error('Search error:', e);
      setMessages(prev => [...prev, { id: 'err-' + Date.now(), sender: 'bot', text: 'Server connection failed. Please try again.', type: 'text' }]);
    } finally { setLoading(false); }
  };

  const fetchDetail = async (id, mode, searchItemData = null) => {
    console.log('Fetch detail - ID:', id, 'Mode:', mode);
    console.log('Search item data:', searchItemData);
    
    if (!id) {
      setMessages(prev => [...prev, { 
        id: 'err-' + Date.now(), 
        sender: 'bot', 
        text: 'Error: Invalid ID.', 
        type: 'text' 
      }]);
      return;
    }
    
    setLoading(true);
    try {
      const url = `${API_ENDPOINTS.detail}?mode=${mode}&id=${id}`;
      console.log('Detail URL:', url);
      
      const res = await fetch(url);
      const json = await res.json();
      
      console.log('Detail response:', JSON.stringify(json, null, 2));
      
      if (res.ok) {
        if (json.caseInfo) {
          console.log('Processing S-Mode response');
          
          setActiveData(null);
          
          const imageFilename = searchItemData?.image_filename || 
                               json.caseInfo.image_filename || 
                               json.caseInfo.imageFilename || 
                               null;
          
          const sData = {
            caseInfo: {
              ...json.caseInfo,
              imageFilename: imageFilename,
            },
            generalCauses: json.generalCauses || [],
            caseInputs: json.caseInputs || []
          };
          
          setSModeData(sData);
          
          setTimeout(() => {
            const caseCode = sData.caseInfo?.caseCode;
            
            setMessages(prev => [...prev, 
              { 
                id: 's-causes-' + Date.now(), 
                sender: 'bot', 
                type: 'info_card',
                data: {
                  code: sData.caseInfo?.caseCode || 'S-MODE',
                  title: sData.caseInfo?.title || 'Mechanical Diagnosis',
                  category: 'Mechanical (S)',
                  related_information: sData.generalCauses && sData.generalCauses.length > 0
                    ? sData.generalCauses.map(cause => 
                        cause.kind === 'NOTE' ? `[NOTE]${cause.causeText}` : cause.causeText
                      ).join(' | ')
                    : '-'
                }
              },
              { 
                id: 's-inputs-' + Date.now(), 
                sender: 'bot', 
                type: 's_mode_inputs',
                data: {
                  caseInputs: sData.caseInputs || [],
                  caseCode: caseCode || ''
                }
              }
            ]);
          }, 500);
          
          saveToHistory('S', null, json.caseInfo.caseId, json.caseInfo.title);
        }
        else if (json.header && json.causes !== undefined) {
          console.log('Processing CODE/E/H response');
          const finalData = { 
            ...json.header, 
            causes: json.causes || [] 
          };
          
          setActiveData(finalData);

          saveToHistory(
            mode,
            mode === 'CODE' ? Number(id) : null,
            mode !== 'CODE' ? Number(id) : null,
            finalData.description || finalData.title
          );

          setMessages(prev => [...prev, { 
            id: 'info-' + Date.now(), 
            sender: 'bot', 
            type: 'info_card', 
            data: finalData 
          }]);
          
          setTimeout(() => {
            if (finalData.causes && finalData.causes.length > 0) {
              setMessages(prev => [...prev, { 
                id: 'confirm-' + Date.now(), 
                sender: 'bot', 
                type: 'confirm_ask', 
                text: `Found ${finalData.causes.length} troubleshooting step(s). View details?` 
              }]);
            }
          }, 600);
        }
      } else {
        const errorMsg = json.errors ? 
          Object.values(json.errors).flat().join('\n') : 
          json.message || 'Failed to fetch detail.';
          
        setMessages(prev => [...prev, { 
          id: 'err-' + Date.now(), 
          sender: 'bot', 
          text: `Error: ${errorMsg}`, 
          type: 'text' 
        }]);
      }
    } catch (e) { 
      console.error('Detail error:', e); 
      setMessages(prev => [...prev, { 
        id: 'err-' + Date.now(), 
        sender: 'bot', 
        text: 'Failed to load detail. Please check your connection.', 
        type: 'text' 
      }]);
    } finally { setLoading(false); }
  };

  const analyzeSMode = async (caseCode, selectedRowIds) => {
    console.log('=== ANALYZE S-MODE ===');
    
    if (!caseCode) {
      setMessages(prev => [...prev, { 
        id: 'err-' + Date.now(), 
        sender: 'bot', 
        text: 'Error: Case Code is missing. Please try searching again.', 
        type: 'text' 
      }]);
      return;
    }
    
    if (!selectedRowIds || selectedRowIds.length === 0) {
      setMessages(prev => [...prev, { 
        id: 'err-' + Date.now(), 
        sender: 'bot', 
        text: 'Error: Please select at least one input.', 
        type: 'text' 
      }]);
      return;
    }
    
    setIsAnalyzing(true);
    setLoading(true);
    
    try {
      const payload = {
        caseCode: caseCode,
        selectedRowIds: selectedRowIds
      };
      
      const res = await fetch(API_ENDPOINTS.analyzeSMode, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { 
          id: 's-result-' + Date.now(), 
          sender: 'bot', 
          type: 's_mode_result',
          data: result
        }]);
      } else {
        const errorMsg = result.errors ? 
          Object.values(result.errors).flat().join('\n') : 
          result.message || 'Unknown error';
          
        setMessages(prev => [...prev, { 
          id: 'err-' + Date.now(), 
          sender: 'bot', 
          text: `Analysis failed: ${errorMsg}`, 
          type: 'text' 
        }]);
      }
    } catch (e) {
      console.error('Analysis error:', e);
      setMessages(prev => [...prev, { 
        id: 'err-' + Date.now(), 
        sender: 'bot', 
        text: 'Failed to analyze. Please check your connection.', 
        type: 'text' 
      }]);
    } finally {
      setIsAnalyzing(false);
      setLoading(false);
    }
  };

  const saveToHistory = async (diagnosisType, failureCodeId, troubleshootingCaseId, title) => {
    if (!userNim) return;

    try {
      const payload = {
        diagnosisType,
        failureCodeId: failureCodeId ?? null,
        troubleshootingCaseId: troubleshootingCaseId ?? null,
        userNim,
        diagnosisTitle: title
      };

      await fetch(API_ENDPOINTS.saveHistory, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

    } catch (error) {
      console.log('HISTORY ERROR:', error);
    }
  };
const InfoCard = ({ data }) => {
    const renderItems = (text) => {
      if (!text || text === '-') return <Text style={styles.valueWhiteSmall}>-</Text>;
      const splitItems = text.split('|').map(i => i.trim()).filter(i => i !== "");
      if (splitItems.length === 0) return <Text style={styles.valueWhiteSmall}>-</Text>;
      
      return (
        <View>
          {splitItems.map((item, idx) => {
            const isNote = item.startsWith('[NOTE]');
            const cleanText = isNote ? item.replace('[NOTE]', '') : item;

            return (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ width: 14, marginTop: 2, alignItems: 'center', justifyContent: 'center' }}>
                  {isNote ? (
                    <MaterialCommunityIcons name="star" size={12} color={'#CBD5E1'} />
                  ) : (
                    <Text style={[styles.valueWhiteSmall, { fontWeight: 'bold' }]}>•</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.valueWhiteSmall}>{cleanText}</Text>
                </View>
              </View>
            );
          })}
        </View>
      );
    };

    return (
      <View style={styles.infoCard}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons name="shield-check" size={16} color={KOMATSU_YELLOW} />
          <Text style={styles.cardInfoTag}> DIAGNOSTIC RESULT</Text>
        </View>
        <Text style={styles.infoTitle}>
          {data.code || data.case_code || 'N/A'} 
          {data.user_code ? ` (${data.user_code})` : ''}
        </Text>
        <Text style={styles.infoDesc}>{data.description || data.title || 'No description'}</Text>
        <View style={styles.divider} />
        
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.labelSmall}>COMPONENT:</Text>
            <Text style={styles.valueWhite}>{data.component_in_charge || '-'}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.labelSmall}>CATEGORY:</Text>
            <Text style={styles.valueWhite}>{data.category || data.mode || '-'}</Text>
          </View>
        </View>

        {/* ===== PROBLEM - DENGAN MULTI-LINE ===== */}
        {(data.problem_appears || data.trouble_description) && (
          <View style={styles.dataSection}>
            <Text style={styles.labelSmall}>PROBLEM:</Text>
            {renderMultiLineText(data.problem_appears || data.trouble_description, styles.valueYellow)}
          </View>
        )}

        {/* ===== CONTENTS OF TROUBLE - DENGAN MULTI-LINE ===== */}
        {data.contents_of_trouble && (
          <View style={styles.dataSection}>
            <Text style={styles.labelSmall}>CONTENTS OF TROUBLE:</Text>
            {renderMultiLineText(data.contents_of_trouble, styles.valueWhiteSmall)}
          </View>
        )}

        {/* ===== ACTION OF CONTROLLER - DENGAN MULTI-LINE ===== */}
        {data.action_of_controller && (
          <View style={styles.dataSection}>
            <Text style={styles.labelSmall}>ACTION OF CONTROLLER:</Text>
            {renderMultiLineText(data.action_of_controller, styles.valueWhiteSmall)}
          </View>
        )}

        {data.related_information && (
          <View style={styles.dataSection}>
            <Text style={styles.labelSmall}>
              {data.category === 'Mechanical (S)' ? 'GENERAL CAUSES:' : 'RELATED INFORMATION:'}
            </Text>
            {renderItems(data.related_information)}
          </View>
        )}

        {data.causes && data.causes.length > 0 && (
          <View style={styles.dataSection}>
            <Text style={styles.labelSmall}>TROUBLESHOOTING STEPS:</Text>
            <Text style={styles.valueWhiteSmall}>{data.causes.length} step(s) available</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    const isComplexCard = ['info_card', 'mode_selection', 'step_card', 'result_list', 's_mode_inputs', 's_mode_result', 's_mode_general_causes'].includes(item.type);

    return (
      <View style={[
        styles.msgWrapper, 
        isUser ? styles.userWrapper : styles.botWrapper,
        isComplexCard && { justifyContent: 'center' } 
      ]}>
        {!isUser && !isComplexCard && (
          <View style={styles.botAvatar}>
            <MaterialCommunityIcons name="robot-industrial" size={20} color={KOMATSU_YELLOW} />
          </View>
        )}
        
        {item.type === 'mode_selection' ? (
          <View style={styles.modeContainer}>
            <Text style={styles.modeTitle}>{item.text}</Text>
            <View style={styles.modeGrid}>
              {[
                { label: 'CODE', icon: 'barcode-scan', sub: 'Failure Code' },
                { label: 'E', icon: 'flash-outline', sub: 'Electrical' },
                { label: 'H', icon: 'water-outline', sub: 'Hydraulic' },
                { label: 'S', icon: 'cog-outline', sub: 'Mechanical' }
              ].map((m) => (
                <TouchableOpacity key={m.label} style={styles.modeCard} onPress={() => selectMode(m.label)}>
                  <View style={styles.modeIconCircle}>
                    <MaterialCommunityIcons name={m.icon} size={28} color={DEEP_BLUE} />
                  </View>
                  <Text style={styles.modeCardLabel}>{m.label}</Text>
                  <Text style={styles.modeCardSub}>{m.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : item.type === 'result_list' ? (
          <View style={styles.resultListContainer}>
            <Text style={styles.resultListHeader}>{item.text}</Text>
            {item.data.map((res, i) => {
              const id = res.id || res.case_id || res.caseId;
              return (
                <TouchableOpacity 
                  key={`${i}-${Date.now()}`} 
                  style={styles.resultItem} 
                  onPress={() => {
                    if (id) {
                      fetchDetail(id, item.mode, res);
                    } else {
                      Alert.alert('Error', 'ID not found');
                    }
                  }}
                >
                  <View style={styles.resultItemRow}>
                    <View style={styles.resultCodeBox}>
                      <Text style={styles.resultTitle}>{res.code || res.case_code || 'N/A'}</Text>
                    </View>
                    <View style={styles.resultInfoBox}>
                      <Text style={styles.resultSub} numberOfLines={2}>{res.trouble_description || res.description || res.title || 'No description'}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={DEEP_BLUE} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : item.type === 's_mode_general_causes' ? (
          <SModeGeneralCauses generalCauses={item.data.generalCauses} />
        ) : item.type === 's_mode_inputs' ? (
          <SModeInputSelection 
            inputs={item.data.caseInputs || []}
            caseCode={item.data.caseCode || ''}
            onAnalyze={analyzeSMode}
            loading={isAnalyzing}
          />
        ) : item.type === 's_mode_result' ? (
          <SModeResult 
            result={item.data} 
            imageFilename={sModeData?.caseInfo?.imageFilename}
          />
        ) : item.type === 'info_card' ? (
          <InfoCard data={item.data} />
        ) : item.type === 'confirm_ask' ? (
          <View style={styles.botBubble}>
            <Text style={styles.botText}>{item.text}</Text>
            {selectedMode !== 'S' && (
              <TouchableOpacity style={styles.btnConfirm} onPress={() => {
                if (activeData?.causes?.length > 0) {
                  setMessages(prev => [...prev, { 
                    id: 'step-0-' + Date.now(), 
                    sender: 'bot', 
                    type: 'step_card', 
                    data: activeData.causes[0], 
                    currentIndex: 0 
                  }]);
                } else {
                  Alert.alert("Info", "Troubleshooting steps not available.");
                }
              }}>
                <Text style={styles.btnTextYellow}>Show Steps</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : item.type === 'step_card' ? (
          <StepCard 
            data={item.data} 
            index={item.currentIndex} 
            isLastStep={item.currentIndex === (activeData?.causes?.length || 0) - 1}
            onNext={() => {
              const nextIdx = item.currentIndex + 1;
              if (activeData?.causes && nextIdx < activeData.causes.length) {
                setMessages(prev => [...prev, { 
                  id: `step-${nextIdx}-${Date.now()}`, 
                  sender: 'bot', 
                  type: 'step_card', 
                  data: activeData.causes[nextIdx], 
                  currentIndex: nextIdx 
                }]);
              }
            }}
            onFinish={() => Alert.alert("Success", "Diagnosis complete.")}
          />
        ) : (
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
            <Text style={isUser ? styles.userText : styles.botText}>{item.text}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerMainTitle}>TAB DIAGNOSTIC</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerSubTitle}>AI System Active</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={resetChat}>
          <MaterialCommunityIcons name="refresh" size={22} color={KOMATSU_YELLOW} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef} 
          data={messages} 
          keyExtractor={(item) => item.id}
          renderItem={renderMessage} 
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        {loading && <ActivityIndicator size="small" color={DEEP_BLUE} style={{ marginBottom: 10 }} />}
        
        {selectedMode && (
          <View style={styles.selectedModeBar}>
            <View style={styles.modeTag}>
              <MaterialCommunityIcons name="bullseye-arrow" size={14} color={DEEP_BLUE} />
              <Text style={styles.modeTagText}> Active Mode: <Text style={{fontWeight: 'bold'}}>{selectedMode}</Text></Text>
            </View>
            <TouchableOpacity style={styles.changeModeAction} onPress={triggerModeSelection}>
              <Text style={styles.changeModeActionText}>CHANGE MODE</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputArea}>
          <TextInput 
            style={styles.textInput} 
            placeholder={selectedMode ? `Type keyword...` : "Select mode above"} 
            value={searchText} 
            onChangeText={setSearchText} 
            onSubmitEditing={() => handleSearch()} 
            editable={!!selectedMode} 
          />
          <TouchableOpacity 
            style={[styles.sendBtn, {backgroundColor: selectedMode ? DEEP_BLUE : '#CCC'}]} 
            onPress={() => handleSearch()} 
            disabled={!selectedMode}
          >
            <MaterialCommunityIcons name="send" size={22} color={KOMATSU_YELLOW} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  checkTableBtn: {
    backgroundColor: '#1E40AF',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#2563EB',
    gap: 8,
  },
  checkTableBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  tableImageContainer: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 0,
  },
  tableImageLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
  },
  tableImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  tableZoomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableZoomImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    height: 75,
    backgroundColor: DEEP_BLUE, 
    borderBottomRightRadius: 25, 
    borderBottomLeftRadius: 25,
    elevation: 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { alignItems: 'center' },
  headerMainTitle: { fontWeight: '900', fontSize: 16, color: '#FFF', letterSpacing: 1.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 6 },
  headerSubTitle: { fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  refreshBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },

  chatContent: { padding: 15, paddingBottom: 20 },
  msgWrapper: { flexDirection: 'row', marginBottom: 20, width: '100%' },
  userWrapper: { justifyContent: 'flex-end' },
  botWrapper: { justifyContent: 'flex-start' },
  botAvatar: { width: 34, height: 34, borderRadius: 10, backgroundColor: DEEP_BLUE, justifyContent: 'center', alignItems: 'center', marginRight: 10, alignSelf: 'flex-end' },
  
  bubble: { padding: 14, borderRadius: 20, maxWidth: '80%' },
  userBubble: { backgroundColor: KOMATSU_YELLOW, borderBottomRightRadius: 4, alignSelf: 'flex-end' },
  botBubble: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderBottomLeftRadius: 4, padding: 14, maxWidth: '85%' },
  userText: { color: DEEP_BLUE, fontWeight: 'bold', fontSize: 14 },
  botText: { color: '#334155', lineHeight: 20, fontSize: 14 },

  modeContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 25, width: SCREEN_WIDTH * 0.9, alignSelf: 'center', elevation: 5, borderWidth: 1, borderColor: '#F1F5F9' },
  modeTitle: { fontSize: 12, color: '#64748B', fontWeight: '800', marginBottom: 15, textAlign: 'center' },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  modeCard: { width: '48%', backgroundColor: '#F8FAFC', paddingVertical: 15, borderRadius: 20, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  modeIconCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  modeCardLabel: { fontWeight: 'bold', fontSize: 14, color: DEEP_BLUE },
  modeCardSub: { fontSize: 9, color: '#94A3B8', marginTop: 2, fontWeight: '700' },

  resultListContainer: { backgroundColor: '#FFF', padding: 18, borderRadius: 25, width: SCREEN_WIDTH * 0.9, alignSelf: 'center', elevation: 5, borderWidth: 1, borderColor: '#F1F5F9' },
  resultListHeader: { fontSize: 12, color: '#64748B', fontWeight: '800', marginBottom: 15 },
  resultItem: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  resultItemRow: { flexDirection: 'row', alignItems: 'center' },
  resultCodeBox: { backgroundColor: DEEP_BLUE, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginRight: 12 },
  resultTitle: { fontWeight: 'bold', color: KOMATSU_YELLOW, fontSize: 13 },
  resultInfoBox: { flex: 1 },
  resultSub: { fontSize: 12, color: '#334155', lineHeight: 18 },

  selectedModeBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  modeTag: { flexDirection: 'row', alignItems: 'center' },
  modeTagText: { fontSize: 12, color: DEEP_BLUE },
  changeModeAction: { backgroundColor: DEEP_BLUE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  changeModeActionText: { color: KOMATSU_YELLOW, fontSize: 10, fontWeight: '900' },
  
  infoCard: { backgroundColor: '#001529', padding: 22, borderRadius: 28, width: SCREEN_WIDTH * 0.92, alignSelf: 'center', elevation: 12, borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardInfoTag: { color: KOMATSU_YELLOW, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  infoTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  infoDesc: { color: '#94A3B8', fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 18 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  gridCol: { flex: 1 },
  dataSection: { marginBottom: 16 },
  labelSmall: { color: '#64748B', fontSize: 10, fontWeight: '900', marginBottom: 5 },
  valueWhite: { color: '#F8FAFC', fontSize: 15, fontWeight: 'bold' },
  valueWhiteSmall: { color: '#CBD5E1', fontSize: 12, lineHeight: 18 },
  valueYellow: { color: KOMATSU_YELLOW, fontSize: 16, fontWeight: 'bold' },

  btnConfirm: { backgroundColor: '#002B5B', padding: 15, borderRadius: 16, marginTop: 15, alignItems: 'center', elevation: 4, borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)' },
  btnTextYellow: { color: KOMATSU_YELLOW, fontWeight: '900', fontSize: 14 },

  stepCard: { backgroundColor: '#FFF', padding: 22, borderRadius: 28, width: SCREEN_WIDTH * 0.92, alignSelf: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9', elevation: 5 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  stepBadge: { width: 28, height: 28, borderRadius: 10, backgroundColor: DEEP_BLUE, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepBadgeText: { color: KOMATSU_YELLOW, fontSize: 12, fontWeight: '900' },
  stepHeaderText: { color: DEEP_BLUE, fontWeight: '900', fontSize: 14, letterSpacing: 1.5 },
  causeDesc: { fontSize: 19, fontWeight: '900', color: '#1E293B', marginBottom: 15 },
  btnCircuit: { backgroundColor: '#334155', padding: 12, borderRadius: 14, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  imageFrame: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 18, padding: 10, marginBottom: 15, backgroundColor: '#F8FAFC' },
  imageFrameStandard: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
  labelFrame: { fontSize: 9, color: '#94A3B8', textAlign: 'center', marginBottom: 10, fontWeight: '800' },
  fullImage: { width: '100%' },
  methodBox: { backgroundColor: '#F1F5F9', padding: 14, borderRadius: 18, marginBottom: 12 },
  methodText: { fontSize: 13, color: '#334155', lineHeight: 22 },
  standardBox: { backgroundColor: '#F0FDF4', padding: 14, borderRadius: 18, marginBottom: 15, borderWidth: 1, borderColor: '#DCFCE7' },
  standardValueText: { fontSize: 16, fontWeight: '900', color: '#166534' },
  standardImage: { width: '100%' },
  remedyBox: { backgroundColor: '#FFFBEB', padding: 14, borderRadius: 18, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: KOMATSU_YELLOW },
  stepActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  btnYa: { flex: 1.2, backgroundColor: '#166534', padding: 15, borderRadius: 18, marginRight: 10, alignItems: 'center' },
  btnTidak: { flex: 1, backgroundColor: KOMATSU_YELLOW, padding: 15, borderRadius: 18, alignItems: 'center' },
  btnTextBlack: { color: DEEP_BLUE, fontWeight: '900' },
  btnTextWhite: { color: '#FFF', fontWeight: '900' },
  
  inputArea: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center' },
  textInput: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 20, height: 52, fontSize: 14, color: '#1E293B' },
  sendBtn: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 12, elevation: 4 },
  modalContainer: { flex: 1, backgroundColor: '#000' },
  modalHeader: { padding: 20, alignItems: 'flex-end' },

  // S-Mode General Causes Card Styles
  smodeGeneralCard: {
    backgroundColor: '#001529',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: SCREEN_WIDTH * 0.92,
    alignSelf: 'center',
  },
  smodeGeneralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  smodeGeneralTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  smodeGeneralDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  smodeGeneralBody: {
    gap: 8,
  },
  generalCauseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  generalCauseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,184,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  generalCauseNumberText: {
    color: KOMATSU_YELLOW,
    fontSize: 12,
    fontWeight: '700',
  },
  generalCauseContent: {
    flex: 1,
  },
  generalCauseText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },

  // S-Mode Result Card Styles (Conclusion & Final Action)
  smodeResultCard: {
    backgroundColor: '#001529',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: SCREEN_WIDTH * 0.92,
    alignSelf: 'center',
  },
  smodeResultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  smodeResultCardTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  smodeResultCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  smodeResultCardBody: {
    gap: 4,
  },
  smodeResultSection: {
    marginBottom: 4,
  },
  smodeResultSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  smodeResultSectionTitle: {
    color: KOMATSU_YELLOW,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  smodeResultItem: {
    marginBottom: 4,
    paddingLeft: 4,
  },
  smodeResultLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 1,
  },
  smodeResultValue: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  smodeResultNote: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  smodeResultSectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 8,
  },

  // S-Mode Input Styles
  smodeInputWrapper: {
    width: SCREEN_WIDTH * 0.92,
    alignSelf: 'center',
    maxHeight: 400,
    borderRadius: 20,
    backgroundColor: '#FFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  smodeInputScroll: {
    maxHeight: 400,
  },
  smodeInputContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  smodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  smodeSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: DEEP_BLUE,
    letterSpacing: 0.5,
  },
  smodeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    marginLeft: 2,
  },
  smodeGroup: {
    marginBottom: 12,
  },
  smodeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  smodeGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DEEP_BLUE,
  },
  smodeCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 4,
  },
  smodeCountText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  smodeInputItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 44,
  },
  smodeInputItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: DEEP_BLUE,
    borderWidth: 1.5,
  },
  smodeCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    flexShrink: 0,
  },
  smodeCheckboxSelected: {
    backgroundColor: DEEP_BLUE,
    borderColor: DEEP_BLUE,
  },
  smodeInputText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  smodeActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  smodeSelectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smodeSelectedCount: {
    fontSize: 12,
    color: '#64748B',
  },
  smodeSelectedCountBold: {
    fontWeight: 'bold',
  },
  smodeAnalyzeBtn: {
    backgroundColor: DEEP_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  smodeAnalyzeBtnDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
  smodeAnalyzeBtnText: {
    color: KOMATSU_YELLOW,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },

  // S-Mode Result Styles
  smodeResultContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 25,
    width: SCREEN_WIDTH * 0.92,
    alignSelf: 'center',
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  smodeResultTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: DEEP_BLUE,
    marginBottom: 16,
  },
  smodeRankings: {
    marginBottom: 16,
  },
  smodeRankingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  smodeRankItem: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smodeRankBadge: {
    backgroundColor: DEEP_BLUE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  smodeRankNumber: {
    color: KOMATSU_YELLOW,
    fontWeight: '700',
    fontSize: 11,
  },
  smodeRankContent: {
    flex: 1,
  },
  smodeRankCause: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  smodeRankDetail: {
    flexDirection: 'row',
    marginTop: 2,
  },
  smodeRankScore: {
    fontSize: 11,
    color: '#64748B',
    marginRight: 12,
  },
  smodeRankSymbols: {
    fontSize: 11,
    color: '#64748B',
  },
  smodeRankRemedy: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 4,
  },
});

export default ChatScreen;