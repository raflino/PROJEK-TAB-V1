import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView,
  Platform, Modal, FlatList, Animated
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_ENDPOINTS } from '../data/api';

const NAVY = '#003366';
const GOLD = '#FFD700';
const RED  = '#E53935';
const GREEN = '#2E7D32';

const toTitleCase = str =>
  str.replace(/\b\w/g, c => c.toUpperCase());

const getCurrentYear = () => new Date().getFullYear();

const validateNIM = nim => {
  if (!/^\d{10}$/.test(nim)) return 'Student ID must be exactly 10 digits.';
  const year = Number.parseInt(nim.substring(2, 6), 10);
  if (year < 2000 || year > getCurrentYear())
    return `Student ID must contain a valid enrollment year (2000–${getCurrentYear()}) at digits 3–6.`;
  return null;
};

const validateNIDN = nidn => {
  if (!/^\d{10}$/.test(nidn)) return 'Lecturer ID (NPK) must be exactly 10 digits.';
  return null;
};

const passwordRules = [
  { key: 'length',  label: 'At least 8 characters',        test: p => p.length >= 8 },
  { key: 'upper',   label: 'Contains an uppercase letter',  test: p => /[A-Z]/.test(p) },
  { key: 'number',  label: 'Contains a number',             test: p => /\d/.test(p) },
];

const STEPS = ['Personal Info', 'Password', 'Security Questions'];

const getCheckIconColor = (passed, passwordLength) => {
  if (passed) return GREEN;
  return passwordLength > 0 ? RED : '#CCC';
};

const getCheckTextColor = (passed, passwordLength) => {
  if (passed) return GREEN;
  return passwordLength > 0 ? RED : '#AAA';
};

const StepIndicator = ({ current }) => (
  <View style={styles.stepContainer}>
    <View style={styles.stepRow}>
      {[1, 2, 3].map(s => (
        <View key={s} style={styles.stepGroup}>
          <View style={[styles.stepDot, current >= s ? styles.stepDotActive : styles.stepDotInactive]}>
            {current > s
              ? <MaterialCommunityIcons name="check" size={13} color={NAVY} />
              : <Text style={[styles.stepNum, { color: current === s ? NAVY : '#AAA' }]}>{s}</Text>
            }
          </View>
          {s < 3 && <View style={[styles.stepLine, current > s ? styles.stepLineActive : styles.stepLineInactive]} />}
        </View>
      ))}
    </View>
    <Text style={styles.stepLabel}>{STEPS[current - 1]}</Text>
  </View>
);

const PasswordChecklist = ({ password }) => (
  <View style={styles.checklist}>
    {passwordRules.map(rule => {
      const passed = rule.test(password);
      return (
        <View key={rule.key} style={styles.checkRow}>
          <MaterialCommunityIcons
            name={passed ? 'check-circle' : 'close-circle'}
            size={16}
            color={getCheckIconColor(passed, password.length)}
          />
          <Text style={[styles.checkText, { color: getCheckTextColor(passed, password.length) }]}>
            {rule.label}
          </Text>
        </View>
      );
    })}
  </View>
);

const QuestionPicker = ({ label, questions, selectedId, onSelect, excludeIds = [] }) => {
  const [open, setOpen] = useState(false);
  const available = questions.filter(q => !excludeIds.includes(q.id) || q.id === selectedId);
  const selected  = questions.find(q => q.id === selectedId);

  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.inputWrapper, styles.pickerBtn]}
        onPress={() => setOpen(true)}
      >
        <MaterialCommunityIcons name="shield-account-outline" size={20} color={NAVY} style={styles.inputIcon} />
        <Text style={[styles.pickerText, !selected && { color: '#999' }]} numberOfLines={2}>
          {selected ? selected.question : 'Select a security question...'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerHeaderText}>Select Question</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={NAVY} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={available}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, item.id === selectedId && styles.pickerItemActive]}
                  onPress={() => { onSelect(item.id); setOpen(false); }}
                >
                  <MaterialCommunityIcons
                    name={item.id === selectedId ? 'radiobox-marked' : 'radiobox-blank'}
                    size={18} color={item.id === selectedId ? GOLD : '#AAA'}
                  />
                  <Text style={[styles.pickerItemText, item.id === selectedId && { color: NAVY, fontWeight: 'bold' }]}>
                    {item.question}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const RegisterScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [step, setStep]   = useState(1);
  const [role, setRole]   = useState('student');
  const [loading, setLoading] = useState(false);

  const [nama, setNama]   = useState('');
  const [nim, setNim]     = useState('');
  const [nimError, setNimError] = useState('');

  const [password, setPassword]       = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ]   = useState(true);
  const [q1Id, setQ1Id] = useState(null);
  const [q2Id, setQ2Id] = useState(null);
  const [q3Id, setQ3Id] = useState(null);
  const [a1, setA1]     = useState('');
  const [a2, setA2]     = useState('');
  const [a3, setA3]     = useState('');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res    = await fetch(API_ENDPOINTS.securityQuestions);
        const result = await res.json();
        if (result.success) setQuestions(result.data);
      } catch (error) {
        console.warn('Failed to load security questions:', error);
        Alert.alert('Error', 'Failed to load security questions. Make sure backend is running.');
      } finally {
        setLoadingQ(false);
      }
    };
    fetchQuestions();
  }, []);

  const goToStep = next => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(next), 120);
  };

  const handleNextStep1 = () => {
    if (!nama.trim()) { Alert.alert('Warning', 'Full name is required.'); return; }
    if (!nim.trim())  { Alert.alert('Warning', role === 'student' ? 'Student ID is required.' : 'Lecturer ID is required.'); return; }

    const idError = role === 'student' ? validateNIM(nim.trim()) : validateNIDN(nim.trim());
    if (idError) { setNimError(idError); return; }
    setNimError('');
    goToStep(2);
  };

  const passwordValid = passwordRules.every(r => r.test(password));

  const handleNextStep2 = () => {
    if (!passwordValid) { Alert.alert('Warning', 'Password does not meet all requirements.'); return; }
    if (password !== confirmPass) { Alert.alert('Warning', 'Passwords do not match.'); return; }
    goToStep(3);
  };

  const handleRegister = async () => {
    if (!q1Id || !q2Id || !q3Id) { Alert.alert('Warning', 'Please select all 3 security questions.'); return; }
    if (!a1.trim() || !a2.trim() || !a3.trim()) { Alert.alert('Warning', 'All security answers are required.'); return; }

    setLoading(true);
    try {
      const registrationData = {
        nim: nim.trim(), nama: nama.trim(), password, role,
        q1Id, a1: a1.trim(),
        q2Id, a2: a2.trim(),
        q3Id, a3: a3.trim(),
      };
      
      const res    = await fetch(API_ENDPOINTS.register, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(registrationData),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        Alert.alert(
          '✅ Registration Successful!',
          `Account for ${nama.trim()} has been created.\nPlease sign in.`,
          [{ text: 'Sign In Now', onPress: () => navigation.replace('Login') }]
        );
      } else {
        Alert.alert('Registration Failed', result.message || 'An error occurred.');
      }
    } catch (error) {
      console.warn('Registration failed:', error);
      Alert.alert('Connection Error', 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const getConfirmPasswordIconColor = () => {
    if (confirmPass.length > 0) {
      return password === confirmPass ? GREEN : RED;
    }
    return '#999';
  };

  const renderStepOne = () => (
    <View style={styles.card}>
      <Text style={styles.label}>Full Name</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name="account-outline" size={20} color={NAVY} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="e.g. Budi Santoso"
          placeholderTextColor="#999"
          value={nama}
          onChangeText={(text) => {
              const onlyLetters = text.replace(/[^a-zA-Z\s]/g, "");
              setNama(onlyLetters);
          }}
          autoCapitalize="words"
        />
      </View>

      <Text style={[styles.label, { marginTop: 16 }]}>
        {role === 'student' ? 'Student ID (NIM)' : 'Lecturer ID (NPK)'}
      </Text>
      <View style={[styles.inputWrapper, nimError ? styles.inputError : null]}>
        <MaterialCommunityIcons name="account-hard-hat-outline" size={20} color={NAVY} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={role === 'student' ? 'e.g. 0720240000' : 'e.g. 1306088704'}
          placeholderTextColor="#999"
          value={nim}
          onChangeText={t => { setNim(t); setNimError(''); }}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>
      {nimError ? (
        <Text style={styles.errorText}>{nimError}</Text>
      ) : (
        <Text style={styles.hintText}>
          {role === 'student'
            ? '10 digits — enrollment year at digits 3–6 (e.g. **2024****)'
            : '10 digits — standard NPK format'}
        </Text>
      )}

      <TouchableOpacity style={[styles.primaryBtn, { marginTop: 28 }]} onPress={handleNextStep1}>
        <View style={styles.btnInner}>
          <Text style={styles.primaryBtnText}>NEXT</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={NAVY} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderStepTwo = () => (
    <View style={styles.card}>
      <Text style={styles.label}>Password</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name="lock-outline" size={20} color={NAVY} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Create a strong password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
        />
        <TouchableOpacity onPress={() => setShowPass(p => !p)}>
          <MaterialCommunityIcons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <PasswordChecklist password={password} />

      <Text style={[styles.label, { marginTop: 8 }]}>Confirm Password</Text>
      <View style={[styles.inputWrapper, confirmPass.length > 0 && password !== confirmPass ? styles.inputError : null]}>
        <MaterialCommunityIcons name="lock-check-outline" size={20} color={NAVY} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Re-enter your password"
          placeholderTextColor="#999"
          value={confirmPass}
          onChangeText={setConfirmPass}
          secureTextEntry={!showConfirm}
        />
        <TouchableOpacity onPress={() => setShowConfirm(p => !p)}>
          <MaterialCommunityIcons
            name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20}
            color={getConfirmPasswordIconColor()}
          />
        </TouchableOpacity>
      </View>
      {confirmPass.length > 0 && password !== confirmPass && (
        <Text style={styles.errorText}>Passwords do not match.</Text>
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, { marginTop: 28, opacity: passwordValid ? 1 : 0.5 }]}
        onPress={handleNextStep2}
        disabled={!passwordValid}
      >
        <View style={styles.btnInner}>
          <Text style={styles.primaryBtnText}>NEXT</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={NAVY} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderStepThree = () => (
    <View>
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="shield-lock-outline" size={18} color={NAVY} />
          <Text style={styles.sectionTitle}>Security Questions</Text>
        </View>
        <Text style={styles.cardDesc}>
          These will be used to verify your identity if you forget your password.
          Answer honestly and memorably.
        </Text>

        {loadingQ ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator color={NAVY} />
            <Text style={{ color: '#666', marginTop: 8 }}>Loading questions...</Text>
          </View>
        ) : (
          <>
            <QuestionPicker
              label="Security Question 1"
              questions={questions}
              selectedId={q1Id}
              onSelect={setQ1Id}
              excludeIds={[q2Id, q3Id].filter(Boolean)}
            />
            <View style={[styles.inputWrapper, { marginBottom: 20 }]}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={NAVY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your answer..."
                placeholderTextColor="#999"
                value={a1}
                onChangeText={setA1}
              />
            </View>

            <QuestionPicker
              label="Security Question 2"
              questions={questions}
              selectedId={q2Id}
              onSelect={setQ2Id}
              excludeIds={[q1Id, q3Id].filter(Boolean)}
            />
            <View style={[styles.inputWrapper, { marginBottom: 20 }]}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={NAVY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your answer..."
                placeholderTextColor="#999"
                value={a2}
                onChangeText={setA2}
              />
            </View>

            <QuestionPicker
              label="Security Question 3"
              questions={questions}
              selectedId={q3Id}
              onSelect={setQ3Id}
              excludeIds={[q1Id, q2Id].filter(Boolean)}
            />
            <View style={[styles.inputWrapper, { marginBottom: 8 }]}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={NAVY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your answer..."
                placeholderTextColor="#999"
                value={a3}
                onChangeText={setA3}
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.hintBox}>
        <MaterialCommunityIcons name="information-outline" size={15} color="#555" />
        <Text style={styles.hintBoxText}>
          Answers are not case-sensitive. "Jakarta" and "jakarta" are treated the same.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, { opacity: loading ? 0.7 : 1 }]}
        onPress={handleRegister}
        disabled={loading || loadingQ}
      >
        {loading ? <ActivityIndicator color={NAVY} /> : (
          <View style={styles.btnInner}>
            <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
            <MaterialCommunityIcons name="account-check" size={20} color={NAVY} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => step === 1 ? navigation.goBack() : goToStep(step - 1)}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={NAVY} />
          </TouchableOpacity>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="account-plus" size={50} color={GOLD} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Polytechnic Astra · TAB Troubleshoot</Text>
        </View>

        {step === 1 && (
          <View style={styles.tabContainer}>
            {['student', 'lecturer'].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.tab, role === r && styles.tabActive]}
                onPress={() => { setRole(r); setNim(''); setNimError(''); }}
              >
                <MaterialCommunityIcons
                  name={r === 'student' ? 'school' : 'human-male-board'}
                  size={16} color={role === r ? NAVY : '#888'}
                />
                <Text style={[styles.tabText, role === r && styles.tabTextActive]}>
                  {r === 'student' ? 'Student' : 'Lecturer'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <StepIndicator current={step} />

        <Animated.View style={{ opacity: fadeAnim }}>
          {step === 1 && renderStepOne()}
          {step === 2 && renderStepTwo()}
          {step === 3 && renderStepThree()}
        </Animated.View>

        <View style={styles.loginRow}>
          <Text style={styles.loginHint}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:        { flexGrow: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 50 },
  headerSection:    { alignItems: 'center', marginBottom: 20 },
  backBtn:          { position: 'absolute', left: -5, top: 0, padding: 6 },
  iconBox:          { backgroundColor: NAVY, padding: 18, borderRadius: 25, marginBottom: 14, elevation: 5 },
  title:            { fontSize: 24, fontWeight: 'bold', color: NAVY, letterSpacing: 0.5 },
  subtitle:         { fontSize: 13, color: '#666', marginTop: 4 },
  tabContainer:     { flexDirection: 'row', backgroundColor: '#EEE', borderRadius: 14, padding: 5, marginBottom: 16 },
  tab:              { flex: 1, flexDirection: 'row', paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderRadius: 10, gap: 6 },
  tabActive:        { backgroundColor: GOLD, elevation: 2 },
  tabText:          { color: '#888', fontWeight: 'bold', fontSize: 14 },
  tabTextActive:    { color: NAVY },
  stepContainer:    { marginBottom: 20 },
  stepRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepGroup:        { flexDirection: 'row', alignItems: 'center' },
  stepDot:          { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepDotActive:    { backgroundColor: GOLD },
  stepDotInactive:  { backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD' },
  stepNum:          { fontSize: 13, fontWeight: 'bold' },
  stepLine:         { width: 50, height: 2, marginHorizontal: 4 },
  stepLineActive:   { backgroundColor: GOLD },
  stepLineInactive: { backgroundColor: '#DDD' },
  stepLabel:        { textAlign: 'center', fontSize: 13, fontWeight: 'bold', color: NAVY },
  card:             { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#EEE', elevation: 1 },
  cardDesc:         { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16 },
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle:     { fontSize: 14, fontWeight: 'bold', color: NAVY },
  label:            { marginBottom: 7, fontWeight: 'bold', color: NAVY, fontSize: 13 },
  inputWrapper:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#EEE', marginBottom: 4 },
  inputError:       { borderColor: RED },
  inputIcon:        { marginRight: 10 },
  input:            { flex: 1, paddingVertical: 14, fontSize: 15, color: '#000' },
  errorText:        { fontSize: 11, color: RED, marginBottom: 10, marginLeft: 4 },
  hintText:         { fontSize: 11, color: '#888', marginBottom: 4, marginLeft: 4 },
  checklist:        { marginVertical: 10, gap: 6 },
  checkRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkText:        { fontSize: 13 },
  pickerBtn:        { minHeight: 52, alignItems: 'flex-start', paddingVertical: 10 },
  pickerText:       { flex: 1, fontSize: 14, color: '#000', lineHeight: 20 },
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerModal:      { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', paddingBottom: 30 },
  pickerHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  pickerHeaderText: { fontSize: 16, fontWeight: 'bold', color: NAVY },
  pickerItem:       { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  pickerItemActive: { backgroundColor: '#FFFDE7' },
  pickerItemText:   { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  hintBox:          { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFF9C4', borderRadius: 12, padding: 12, marginBottom: 16 },
  hintBoxText:      { flex: 1, fontSize: 12, color: '#555', lineHeight: 18 },
  primaryBtn:       { backgroundColor: GOLD, padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 8 },
  primaryBtnText:   { color: NAVY, fontWeight: '900', fontSize: 16 },
  btnInner:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loginRow:         { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  loginHint:        { color: '#666', fontSize: 14 },
  loginLink:        { color: NAVY, fontWeight: 'bold', fontSize: 14, textDecorationLine: 'underline' },
});

export default RegisterScreen;