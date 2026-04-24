import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Lock, Search, X } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BottomNavPill, type NavTab } from '../components/BottomNavPill';
import { NeuCard } from '../components/NeuCard';
import { colors, fontFamily, fontSize, neuRaised } from '../theme';
import { fetchStations, type Station } from '../services/stations';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

// --- Fake line catalog (only Blue is selectable for the MVP) ----------------
// The Go backend already returns line_code per station, so switching lines is
// mostly a matter of changing the filter below when the other lines are live.
const LINES: Array<{
  code: string;
  label: string;
  color: string;
  available: boolean;
}> = [
  { code: 'MRT-BLUE', label: 'MRT Blue Line', color: '#3F51B5', available: true },
  { code: 'BTS-SUKHUMVIT', label: 'BTS Sukhumvit', color: '#8BC34A', available: false },
  { code: 'BTS-SILOM', label: 'BTS Silom', color: '#2E7D32', available: false },
  { code: 'MRT-PURPLE', label: 'MRT Purple Line', color: '#7E57C2', available: false },
  { code: 'ARL', label: 'Airport Rail Link', color: '#E53935', available: false },
];

// Figma node 25:16. No Mapbox — the map comes back only on Navigation.
export const HomeScreen: React.FC<Props> = ({ navigation, route }) => {
  const pickMode = route.params?.pickMode ?? 'start';
  const start = route.params?.start;

  const [query, setQuery] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [lineCode, setLineCode] = useState('MRT-BLUE');
  const [lineModalOpen, setLineModalOpen] = useState(false);

  useEffect(() => {
    fetchStations()
      .then((rows) => setStations(rows))
      .catch(() => setStations([]))
      .finally(() => setLoading(false));
  }, []);

  // The blue line is the only live line right now. We still filter by
  // line_code so adding more lines later is a one-line change.
  const lineStations = useMemo(() => {
    if (lineCode === 'MRT-BLUE') {
      return stations.filter((s) => s.line_code.includes('BLUE'));
    }
    return stations.filter((s) => s.line_code === lineCode);
  }, [stations, lineCode]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return lineStations
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.name_local ?? '').toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [lineStations, query]);

  const handleOpenStation = (s: Station) => {
    setQuery('');
    navigation.navigate('StationDetail', { station: s, pickMode, start });
  };

  const handleNav = (tab: NavTab) => {
    if (tab === 'home') return;
    if (tab === 'planner') navigation.navigate('AITripPlanner');
    if (tab === 'saved') navigation.navigate('SaveTrip');
  };

  const activeLine = LINES.find((l) => l.code === lineCode) ?? LINES[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topStack}>
        <View style={[styles.search, neuRaised]}>
          <Search color={colors.textSecondary} size={20} />
          <TextInput
            placeholder="Search stations"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X color={colors.textMuted} size={18} />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.linePill, neuRaised]}
          onPress={() => setLineModalOpen(true)}
        >
          <View style={[styles.lineDot, { backgroundColor: activeLine.color }]} />
          <Text style={styles.linePillText}>{activeLine.label}</Text>
          <ChevronDown color={colors.textSecondary} size={16} />
        </Pressable>

        {pickMode === 'destination' && start ? (
          <View style={styles.pickBanner}>
            <Text style={styles.pickBannerText}>
              Start: <Text style={styles.pickBannerBold}>{start.name}</Text>
            </Text>
            <Text style={styles.pickBannerSub}>
              Now pick your destination station
            </Text>
          </View>
        ) : null}
      </View>

      {matches.length > 0 ? (
        <NeuCard radius={20} style={styles.resultsCard}>
          {matches.map((s) => (
            <Pressable
              key={s.id}
              style={styles.resultRow}
              onPress={() => handleOpenStation(s)}
            >
              <View
                style={[
                  styles.resultDot,
                  { borderColor: activeLine.color },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{s.name}</Text>
                {s.name_local ? (
                  <Text style={styles.resultSub}>{s.name_local}</Text>
                ) : null}
              </View>
              <Text style={styles.resultCode}>{s.code}</Text>
            </Pressable>
          ))}
        </NeuCard>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.stationsScroll}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading stations…</Text>
          </View>
        ) : lineStations.length === 0 ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>
              No stations yet — backend unreachable.
            </Text>
          </View>
        ) : (
          <View style={styles.lineColumn}>
            {lineStations.map((s, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === lineStations.length - 1;
              return (
                <Pressable
                  key={s.id}
                  style={styles.lineRow}
                  onPress={() => handleOpenStation(s)}
                >
                  <View style={styles.lineRail}>
                    <View
                      style={[
                        styles.railSegment,
                        { backgroundColor: activeLine.color },
                        isFirst && { opacity: 0 },
                      ]}
                    />
                    <View
                      style={[
                        styles.stationDot,
                        { borderColor: activeLine.color },
                      ]}
                    >
                      <View
                        style={[
                          styles.stationDotInner,
                          { backgroundColor: activeLine.color },
                        ]}
                      />
                    </View>
                    <View
                      style={[
                        styles.railSegment,
                        { backgroundColor: activeLine.color },
                        isLast && { opacity: 0 },
                      ]}
                    />
                  </View>

                  <View style={styles.stationText}>
                    <Text style={styles.stationName}>{s.name}</Text>
                    {s.name_local ? (
                      <Text style={styles.stationNameLocal}>
                        {s.name_local}
                      </Text>
                    ) : null}
                  </View>

                  <Text style={styles.stationCode}>{s.code}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <BottomNavPill current="home" onSelect={handleNav} />
      </View>

      {/* --- Line picker modal -------------------------------------------- */}
      <Modal
        animationType="fade"
        transparent
        visible={lineModalOpen}
        onRequestClose={() => setLineModalOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setLineModalOpen(false)}
        >
          <NeuCard radius={28} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select a line</Text>
            <Text style={styles.modalSubtitle}>
              Only MRT Blue Line is live right now.
            </Text>
            {LINES.map((line) => {
              const selected = line.code === lineCode;
              const disabled = !line.available;
              return (
                <Pressable
                  key={line.code}
                  disabled={disabled}
                  onPress={() => {
                    setLineCode(line.code);
                    setLineModalOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.lineOption,
                    selected && styles.lineOptionSelected,
                    disabled && styles.lineOptionDisabled,
                    pressed && !disabled && { opacity: 0.8 },
                  ]}
                >
                  <View
                    style={[styles.lineDot, { backgroundColor: line.color }]}
                  />
                  <Text
                    style={[
                      styles.lineOptionText,
                      disabled && { color: colors.textMuted },
                    ]}
                  >
                    {line.label}
                  </Text>
                  {disabled ? (
                    <Lock color={colors.textMuted} size={14} />
                  ) : selected ? (
                    <View style={styles.selectedPill}>
                      <Text style={styles.selectedPillText}>Selected</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </NeuCard>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgStart },
  topStack: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    padding: 0,
  },
  linePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  lineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  linePillText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  pickBanner: {
    backgroundColor: colors.tealWash,
    borderRadius: 14,
    padding: 12,
  },
  pickBannerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  pickBannerBold: {
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDeep,
  },
  pickBannerSub: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 2,
  },
  resultsCard: {
    marginHorizontal: 20,
    paddingVertical: 6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  resultDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    backgroundColor: colors.surface,
  },
  resultName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
  },
  resultSub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  resultCode: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  stationsScroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 140,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  lineColumn: {
    gap: 0,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 14,
  },
  lineRail: {
    width: 28,
    alignItems: 'center',
  },
  railSegment: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  stationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stationText: {
    flex: 1,
    paddingVertical: 2,
  },
  stationName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
  },
  stationNameLocal: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  stationCode: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  bottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 16, 42, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    padding: 24,
    gap: 10,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.primaryDeep,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  lineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 12,
    backgroundColor: colors.surface,
  },
  lineOptionSelected: {
    backgroundColor: colors.tealWash,
  },
  lineOptionDisabled: {
    opacity: 0.55,
  },
  lineOptionText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.primaryDeep,
  },
  selectedPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  selectedPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.textInverse,
  },
});
