import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Keyboard,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import ScreenWrapper from '../components/ScreenWrapper';
import GlassCard from '../components/GlassCard';
import NeonButton from '../components/NeonButton';
import RiskMeter from '../components/RiskMeter';
import {COLORS, SIZES} from '../theme';

const MessageInputScreen = ({navigation}) => {
  const [message, setMessage] = useState('');

  const handleAnalyze = () => {
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please enter a message to analyze.');
      return;
    }
    Keyboard.dismiss();
    navigation.navigate('Processing', {message: message.trim(), type: 'text'});
  };

  const handleUploadScreenshot = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick image');
        return;
      }

      const imageFile = result.assets?.[0];
      if (imageFile) {
        navigation.navigate('Processing', {imageFile, type: 'image'});
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🛡️</Text>
            </View>
            <Text style={styles.logo}>CYBERBAIT</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Message</Text>
          <Text style={styles.titleGreen}>Intelligence</Text>
          <Text style={styles.subtitle}>
            Deploy advanced OCR and linguistic heuristics to scan suspicious
            communications for phishing signatures.
          </Text>
        </View>

        {/* Input Area */}
        <GlassCard style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={styles.inputLabel}>
              <View style={styles.inputDot} />
              <Text style={styles.inputLabelText}>INPUT STREAM</Text>
            </View>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Paste suspicious message here..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
        </GlassCard>

        {/* Action Buttons */}
        <NeonButton
          title="⚡ Analyze Message"
          onPress={handleAnalyze}
          style={styles.analyzeBtn}
        />

        <NeonButton
          title="📸 Upload Screenshot"
          variant="outline"
          onPress={handleUploadScreenshot}
          style={styles.uploadBtn}
        />

        {/* Protocol Tips */}
        <GlassCard style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Text style={styles.tipsIcon}>🛡️</Text>
            <Text style={styles.tipsTitle}>Protocol Tips</Text>
          </View>
          <View style={styles.tipItem}>
            <View style={[styles.tipDot, {backgroundColor: COLORS.primary}]} />
            <Text style={styles.tipText}>
              Include URLs and sender metadata for 40% higher accuracy.
            </Text>
          </View>
          <View style={styles.tipItem}>
            <View style={[styles.tipDot, {backgroundColor: COLORS.primary}]} />
            <Text style={styles.tipText}>
              Screenshots are processed via local neural OCR layers.
            </Text>
          </View>
        </GlassCard>

        {/* Encrypted Badge */}
        <View style={styles.encryptedBadge}>
          <View style={styles.encryptedIcon}>
            <Text style={styles.lockEmoji}>🔒</Text>
          </View>
          <Text style={styles.encryptedText}>END-TO-END ENCRYPTED</Text>
        </View>

        {/* Threat Assessment Score */}
        <GlassCard style={styles.assessmentCard}>
          <Text style={styles.assessmentLabel}>ANALYSIS STANDBY</Text>
          <Text style={styles.assessmentTitle}>
            Threat Assessment{'\n'}Score
          </Text>
          <View style={styles.assessmentContent}>
            <RiskMeter score={0} size={100} />
            <View style={styles.assessmentStats}>
              <View style={styles.assessmentStat}>
                <View style={[styles.assessmentDot, {backgroundColor: COLORS.primary}]} />
                <Text style={styles.assessmentStatText}>Linguistic{'\n'}anomalies: 0</Text>
              </View>
              <View style={styles.assessmentStat}>
                <View style={[styles.assessmentDot, {backgroundColor: COLORS.danger}]} />
                <Text style={styles.assessmentStatText}>Malicious{'\n'}domains: 0</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        <View style={{height: 120}} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,255,65,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryGlow,
  },
  logoEmoji: {
    fontSize: 16,
  },
  logo: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  bellIcon: {
    fontSize: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  titleGreen: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 10,
    lineHeight: 22,
  },
  inputCard: {
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  inputLabelText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  textInput: {
    backgroundColor: 'rgba(10, 14, 23, 0.5)',
    borderRadius: 12,
    padding: 16,
    color: COLORS.textPrimary,
    fontSize: 14,
    minHeight: 130,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 65, 0.08)',
  },
  analyzeBtn: {
    marginBottom: 12,
  },
  uploadBtn: {
    marginBottom: 20,
  },
  tipsCard: {
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tipsTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  encryptedBadge: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  encryptedIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,255,65,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  lockEmoji: {
    fontSize: 24,
  },
  encryptedText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
  },
  assessmentCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  assessmentLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    marginBottom: 8,
  },
  assessmentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  assessmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  assessmentStats: {
    marginLeft: 16,
  },
  assessmentStat: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assessmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginRight: 8,
  },
  assessmentStatText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});

export default MessageInputScreen;
