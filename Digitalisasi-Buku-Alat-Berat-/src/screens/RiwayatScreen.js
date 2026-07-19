import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_ENDPOINTS } from '../data/api';

const NAVY = '#001F3F';
const YELLOW = '#FFB800';

const RiwayatScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState([]);
  const [selectedType, setSelectedType] = useState('CODE');

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_ENDPOINTS.historySummary}?diagnosisType=${selectedType}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.log('History Error:', error);
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const renderProblem = (text) => {
    if (!text) return null;

    const items = text
      .split(/(?=\(\d+\))/)
      .filter(item => item.trim() !== '');

    return items.map((item, index) => (
      <View key={index} style={styles.problemRow}>
        <MaterialCommunityIcons
          name="circle-small"
          size={20}
          color={NAVY}
        />

        <Text style={styles.problemItem}>
          {item.trim()}
        </Text>
      </View>
    ));
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('RiwayatDetailScreen', {
          id: item.idHistory,
          diagnosisType: selectedType,
          code: item.code,
          title: item.title,
          problem: item.problem
        });
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.code}>{item.code || '-'}</Text>
        </View>
        <View style={styles.searchBadge}>
          <MaterialCommunityIcons name="magnify" size={14} color={NAVY} />
          <Text style={styles.searchCount}>{item.totalSearch}x</Text>
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      {item.problem && (
        <>
          <Text style={styles.problemLabel}>Problem</Text>
          <View style={{ marginTop: 4 }}>
            {renderProblem(item.problem)}
          </View>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={styles.header}>
        <SafeAreaView>
          <Text style={styles.headerTitle}>History Monitoring</Text>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        <View style={styles.tabContainer}>
          {[
            { key: 'CODE', label: 'Failure-code' },
            { key: 'S', label: 'S-Mode' },
            { key: 'E', label: 'E-Mode' },
            { key: 'H', label: 'H-Mode' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedType === tab.key && styles.activeTab]}
              onPress={() => setSelectedType(tab.key)}
            >
              <Text style={[styles.tabText, selectedType === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.idHistory.toString()}
            renderItem={renderCard}
            contentContainerStyle={{ paddingBottom: 30 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchHistory();
                }}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="clipboard-text-search-outline"
                  size={80}
                  color="#DDD"
                />
                <Text style={styles.emptyText}>No history for this category</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F3F7',
  },
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
    paddingTop: 16,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#E8ECF2',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: { backgroundColor: NAVY },
  tabText: { color: '#666', fontWeight: '600', fontSize: 11 },
  activeTabText: { color: '#FFF' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: YELLOW,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  code: { fontWeight: 'bold', color: NAVY },
  searchBadge: { flexDirection: 'row', alignItems: 'center' },
  searchCount: { marginLeft: 4, fontWeight: '700', color: NAVY },
  title: { fontSize: 15, fontWeight: '600', color: '#333' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 15, color: '#999' },
  problemLabel: {
    marginTop: 8,
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
  },
  problemRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginTop: 2,
},
problemItem: {
  flex: 1,
  fontSize: 13,
  color: '#666',
  fontStyle: 'italic',
  lineHeight: 18,
},
});

export default RiwayatScreen;