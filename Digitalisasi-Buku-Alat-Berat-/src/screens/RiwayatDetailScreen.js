import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_ENDPOINTS } from '../data/api';

const NAVY = '#001F3F';
const YELLOW = '#FFB800';
const YELLOW_BG = '#FFFBEA';
const WHITE    = '#FFFFFF';
const BG       = '#F2F3F7';
const MUTED    = '#9CA3AF';
const SUBTEXT  = '#6B7280';
const TEXT     = '#1A1D26';
const BORDER   = '#E8ECF2';
const RED_BG   = '#FDECEA';
const RED      = '#D94F3D';

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const d = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${d}  ${t}`;
  } catch { return dateString; }
};

const MahasiswaCard = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.avatarBox}>
      <Text style={styles.avatarText}>
        {(item.namaMahasiswa ?? '?')[0].toUpperCase()}
      </Text>
    </View>
    <View style={styles.cardInfo}>
      <Text style={styles.studentName} numberOfLines={1}>
        {item.namaMahasiswa ?? '-'}
      </Text>
      <Text style={styles.studentNim}>{item.nim ?? '-'}</Text>
      <Text style={styles.dateRow}>
        {formatDateTime(item.firstSearch)}  →  {formatDateTime(item.lastSearch)}
      </Text>
    </View>
    <View style={styles.countBox}>
      <MaterialCommunityIcons name="magnify" size={17} color={NAVY} />
      <Text style={styles.countText}>{item.totalSearch}x</Text>
    </View>
  </View>
);

const RiwayatDetailScreen = ({ route, navigation }) => {
  const { id, diagnosisType, code, title, problem } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => { fetchDetail(); }, []);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_ENDPOINTS.historyDetail}?diagnosisType=${diagnosisType}&idItem=${id}`
      );
      const json = await response.json();
      const list = Array.isArray(json?.data) ? json.data : json?.data ? [json.data] : [];
      setData(list);
    } catch (e) {
      console.log('DETAIL ERROR:', e);
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = diagnosisType === 'CODE' ? 'Failure Code' : `${diagnosisType}-Mode`;

  const Header = () => (
    <View style={styles.header}>
      <SafeAreaView>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Detail History</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <Header />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={NAVY} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <Header />
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>📋</Text>
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptySubtitle}>No students have searched this diagnosis.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <Header />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Info block */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoCode}>{code || '-'}</Text>
          <Text style={styles.infoTitle}>{title || 'No Title'}</Text>

          {problem && (
            <>
              <Text style={styles.problemLabel}>Problem</Text>
              <Text style={styles.problem}>{problem}</Text>
            </>
          )}

          <View style={styles.infoPillRow}>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{typeLabel}</Text>
            </View>
            <Text style={styles.infoCount}>
              {data.length} {data.length === 1 ? 'Student' : 'Students'}
            </Text>
          </View>
        </View>

        {/* Section label */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>STUDENT RECORDS</Text>
          <View style={styles.sectionLine} />
        </View>

        {data.map((item, index) => (
          <MahasiswaCard key={item.nim ?? index} item={item} index={index} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  /* Navy header melengkung */
  header: {
    backgroundColor: NAVY,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backBtn: {
    width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  backBtnText: { fontSize: 22, color: WHITE, fontWeight: '700' },
  navTitle: {
    fontSize: 18, fontWeight: '700',
    color: WHITE, letterSpacing: 0.2,
  },

  body: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48 },

  center: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', padding: 32,
  },

  /* Info block */
  infoBlock: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  infoCode: {
    fontSize: 11, fontWeight: '800',
    color: YELLOW, letterSpacing: 1.5, marginBottom: 4,
  },
  infoTitle: {
    fontSize: 17, fontWeight: '700',
    color: TEXT, marginBottom: 10, lineHeight: 24,
  },
  problemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
    textTransform: 'uppercase',
  },
  problem: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 12,
  },
  infoPillRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typePill: {
    backgroundColor: NAVY,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  typePillText: { color: WHITE, fontWeight: '700', fontSize: 11 },
  infoCount: { fontSize: 12, color: SUBTEXT, fontWeight: '600' },

  /* Section label */
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, gap: 10,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    color: MUTED, letterSpacing: 1.2,
  },
  sectionLine: { flex: 1, height: 2, backgroundColor: YELLOW, borderRadius: 2 },

  /* Card */
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 14,
    padding: 14, marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
    gap: 12,
  },
  avatarBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: RED_BG,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  avatarText: { color: RED, fontWeight: '800', fontSize: 18 },
  cardInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 2 },
  studentNim: { fontSize: 12, color: SUBTEXT, fontWeight: '500', marginBottom: 4 },
  dateRow: { fontSize: 11, color: MUTED, fontWeight: '500' },
  countBox: { alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 2 },
  countIcon: { fontSize: 20 },
  countText: { fontSize: 11, fontWeight: '700', color: NAVY, letterSpacing: 0.3 },

  /* Loading */
  loadingText: { marginTop: 14, fontSize: 14, color: MUTED, fontWeight: '600' },

  /* Empty */
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 28,
  },
  emptyBackBtn: {
    backgroundColor: NAVY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  emptyBackBtnText: { color: WHITE, fontWeight: '700', fontSize: 14 },
});

export default RiwayatDetailScreen;