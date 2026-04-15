import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenWrapper from '../components/ScreenWrapper';
import GlassCard from '../components/GlassCard';
import {COLORS} from '../theme';

const SettingsScreen = ({navigation}) => {
  const [settings, setSettings] = useState({
    autoScan: true,
    notifications: true,
    biometric: false,
    darkMode: true,
    dataSaver: false,
    analytics: false,
  });

  const toggleSetting = key => {
    setSettings(prev => ({...prev, [key]: !prev[key]}));
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scan history? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('scan_history');
              Alert.alert('Success', 'History cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history');
            }
          },
        },
      ],
    );
  };

  const handleResetOnboarding = async () => {
    await AsyncStorage.removeItem('onboarding_complete');
    navigation.replace('Splash');
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </View>

        {/* Security Section */}
        <Text style={styles.sectionTitle}>🔒 Security</Text>
        <GlassCard style={styles.settingsCard}>
          <SettingToggle
            label="Auto-scan Messages"
            description="Automatically scan incoming messages"
            value={settings.autoScan}
            onToggle={() => toggleSetting('autoScan')}
          />
          <View style={styles.divider} />
          <SettingToggle
            label="Biometric Lock"
            description="Require fingerprint to open app"
            value={settings.biometric}
            onToggle={() => toggleSetting('biometric')}
          />
        </GlassCard>

        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>🔔 Notifications</Text>
        <GlassCard style={styles.settingsCard}>
          <SettingToggle
            label="Push Notifications"
            description="Get alerts for detected threats"
            value={settings.notifications}
            onToggle={() => toggleSetting('notifications')}
          />
        </GlassCard>

        {/* Privacy Section */}
        <Text style={styles.sectionTitle}>🛡️ Privacy</Text>
        <GlassCard style={styles.settingsCard}>
          <SettingToggle
            label="Data Saver Mode"
            description="Minimize data sent to servers"
            value={settings.dataSaver}
            onToggle={() => toggleSetting('dataSaver')}
          />
          <View style={styles.divider} />
          <SettingToggle
            label="Usage Analytics"
            description="Help improve the app (anonymous)"
            value={settings.analytics}
            onToggle={() => toggleSetting('analytics')}
          />
        </GlassCard>

        {/* Appearance */}
        <Text style={styles.sectionTitle}>🎨 Appearance</Text>
        <GlassCard style={styles.settingsCard}>
          <SettingToggle
            label="Dark Mode"
            description="Use dark cyber theme"
            value={settings.darkMode}
            onToggle={() => toggleSetting('darkMode')}
          />
        </GlassCard>

        {/* Data Management */}
        <Text style={styles.sectionTitle}>💾 Data</Text>
        <GlassCard style={styles.settingsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={handleClearHistory}>
            <Text style={styles.actionLabel}>Clear Scan History</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={handleResetOnboarding}>
            <Text style={styles.actionLabel}>Reset Onboarding</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* About */}
        <Text style={styles.sectionTitle}>ℹ️ About</Text>
        <GlassCard style={styles.settingsCard}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>Production</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Engine</Text>
            <Text style={styles.aboutValue}>Gemini AI</Text>
          </View>
        </GlassCard>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Kinetic Vault — AI-Powered Security</Text>
          <Text style={styles.footerSubtext}>Your data never leaves your control.</Text>
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const SettingToggle = ({label, description, value, onToggle}) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleContent}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Text style={styles.toggleDesc}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{false: 'rgba(255,255,255,0.1)', true: 'rgba(0, 255, 65, 0.3)'}}
      thumbColor={value ? COLORS.primary : COLORS.textMuted}
    />
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  version: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginTop: 8,
  },
  settingsCard: {
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  actionArrow: {
    color: COLORS.textMuted,
    fontSize: 24,
    fontWeight: '300',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  aboutLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  aboutValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  footerSubtext: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
});

export default SettingsScreen;
