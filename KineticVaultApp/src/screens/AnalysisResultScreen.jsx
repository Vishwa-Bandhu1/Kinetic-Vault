import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import GlassCard from '../components/GlassCard';
import NeonButton from '../components/NeonButton';
import RiskMeter from '../components/RiskMeter';
import KeywordBadge from '../components/KeywordBadge';
import {COLORS} from '../theme';

const AnalysisResultScreen = ({route, navigation}) => {
  const {result} = route.params;

  const getThreatColor = () => {
    if (result.riskScore <= 40) return COLORS.riskLow;
    if (result.riskScore <= 60) return COLORS.riskMedium;
    if (result.riskScore <= 80) return COLORS.riskHigh;
    return COLORS.riskCritical;
  };

  const threatColor = getThreatColor();

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Threat Analysis</Text>
          <View style={{width: 60}} />
        </View>

        {/* Warning Banner */}
        <GlassCard style={styles.warningCard} glowColor={threatColor}>
          <View style={styles.warningContent}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <View style={styles.warningTextContainer}>
              <Text style={[styles.warningTitle, {color: threatColor}]}>
                THREAT DETECTED
              </Text>
              <Text style={styles.warningSubtitle}>
                Risk Level: {result.threatLevel}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Risk Score */}
        <View style={styles.riskSection}>
          <RiskMeter score={result.riskScore} size={140} />
          <Text style={styles.riskLabel}>Risk Score</Text>
        </View>

        {/* Confidence */}
        <GlassCard style={styles.confidenceCard}>
          <View style={styles.confidenceRow}>
            <View style={styles.confidenceItem}>
              <Text style={styles.confidenceValue}>{result.riskScore}%</Text>
              <Text style={styles.confidenceLabel}>Confidence</Text>
            </View>
            <View style={styles.confidenceDivider} />
            <View style={styles.confidenceItem}>
              <Text style={[styles.confidenceValue, {color: threatColor}]}>
                {result.threatLevel}
              </Text>
              <Text style={styles.confidenceLabel}>Threat Level</Text>
            </View>
            <View style={styles.confidenceDivider} />
            <View style={styles.confidenceItem}>
              <Text style={styles.confidenceValue}>
                {result.keywords?.length || 0}
              </Text>
              <Text style={styles.confidenceLabel}>Keywords</Text>
            </View>
          </View>
        </GlassCard>

        {/* Keywords */}
        {result.keywords && result.keywords.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🔑 Detected Keywords</Text>
            <View style={styles.keywordsContainer}>
              {result.keywords.map((kw, index) => (
                <KeywordBadge
                  key={index}
                  word={kw.word}
                  confidence={kw.confidence}
                  type={kw.type}
                />
              ))}
            </View>
          </>
        )}

        {/* Entities */}
        {result.entities && (
          <>
            <Text style={styles.sectionTitle}>🔗 Extracted Entities</Text>
            <GlassCard style={styles.entitiesCard}>
              <EntityRow
                label="URLs"
                items={result.entities.urls || []}
                emptyText="No URLs detected"
              />
              <EntityRow
                label="Phone Numbers"
                items={result.entities.phoneNumbers || []}
                emptyText="No phone numbers detected"
              />
              <EntityRow
                label="UPI IDs"
                items={result.entities.upiIds || []}
                emptyText="No UPI IDs detected"
              />
            </GlassCard>
          </>
        )}

        {/* AI Explanation */}
        <Text style={styles.sectionTitle}>🤖 AI Analysis</Text>
        <GlassCard style={styles.explanationCard}>
          <Text style={styles.explanationText}>{result.explanation}</Text>
        </GlassCard>

        {/* Actions */}
        <NeonButton
          title="📄 Generate Report"
          onPress={() => navigation.navigate('ThreatReport', {result})}
          style={styles.reportBtn}
        />
        <NeonButton
          title="🔍 Scan Another"
          variant="outline"
          onPress={() => navigation.navigate('ScanTab')}
          style={styles.scanBtn}
        />

        <View style={{height: 40}} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const EntityRow = ({label, items, emptyText}) => (
  <View style={styles.entityRow}>
    <Text style={styles.entityLabel}>{label}</Text>
    {items.length > 0 ? (
      items.map((item, idx) => (
        <Text key={idx} style={styles.entityValue}>
          • {item}
        </Text>
      ))
    ) : (
      <Text style={styles.entityEmpty}>{emptyText}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 16,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  warningCard: {
    marginBottom: 24,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  warningTextContainer: {},
  warningTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  warningSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  riskSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  riskLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    letterSpacing: 1,
  },
  confidenceCard: {
    marginBottom: 24,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  confidenceItem: {
    alignItems: 'center',
    flex: 1,
  },
  confidenceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  confidenceLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  confidenceDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  entitiesCard: {
    marginBottom: 24,
  },
  entityRow: {
    marginBottom: 12,
  },
  entityLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  entityValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    marginLeft: 8,
    marginBottom: 2,
  },
  entityEmpty: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  explanationCard: {
    marginBottom: 24,
  },
  explanationText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  reportBtn: {
    marginBottom: 12,
  },
  scanBtn: {
    marginBottom: 12,
  },
});

export default AnalysisResultScreen;
