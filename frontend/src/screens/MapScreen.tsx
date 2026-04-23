import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';

MapboxGL.setAccessToken('YOUR_MAPBOX_TOKEN');

const BASE_URL = 'http://localhost:8080';
const { width } = Dimensions.get('window');
const POI_RADIUS = 500;

// ── Types ──────────────────────────────────────────────────────
type Station = {
  id: number;
  name_en: string;
  name_th: string;
  line: string;
  lat: number;
  lng: number;
};

type Exit = {
  id: number;
  station_id: number;
  exit_number: string;
  description: string;
  lat: number;
  lng: number;
};

type POI = {
  id: number;
  name: string;
  category: string;
  price_level: number;
  distance?: number;
  lat?: number;
  lng?: number;
};

type POIDetail = POI & {
  description: string;
  rating?: number;
  image_url?: string;
  operating_hours?: Record<string, any>;
  google_place_id?: string;
};

type Route = {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  optimal_exit?: {
    exit_number: string;
    description: string;
    distance_meters: number;
  };
};

// ── Constants ──────────────────────────────────────────────────
const LINE_COLORS: Record<string, string> = {
  'MRT Blue': '#0101A5',
  'MRT Purple': '#7B2D8B',
  'BTS Sukhumvit': '#009945',
  'BTS Silom': '#78BE20',
};

const CATEGORY_EMOJI: Record<string, string> = {
  cafe: '☕',
  restaurant: '🍜',
  mall: '🛍️',
  convenience: '🏪',
  park: '🌳',
  hospital: '🏥',
  hotel: '🏨',
  bank: '🏦',
  default: '📍',
};

const priceLabel = (level: number) => '฿'.repeat(Math.max(1, level));

const formatDuration = (seconds: number) => {
  const mins = Math.round(seconds / 60);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}min`;
};

// ── API ────────────────────────────────────────────────────────
const api = {
  getStations: async (q?: string): Promise<Station[]> => {
    const url = q
      ? `${BASE_URL}/stations?q=${encodeURIComponent(q)}`
      : `${BASE_URL}/stations`;
    const res = await fetch(url);
    const data = await res.json();
    return data.stations || [];
  },

  getExits: async (stationId: number): Promise<Exit[]> => {
    const res = await fetch(`${BASE_URL}/station-exits?station_id=${stationId}`);
    const data = await res.json();
    return data.exits || [];
  },

  getPOIs: async (lat: number, lng: number, radius = POI_RADIUS): Promise<POI[]> => {
    const res = await fetch(`${BASE_URL}/pois?lat=${lat}&lng=${lng}&radius=${radius}`);
    const data = await res.json();
    return data.pois || [];
  },

  getPOIDetail: async (id: number): Promise<POIDetail> => {
    const res = await fetch(`${BASE_URL}/pois/detail?id=${id}`);
    if (!res.ok) throw new Error('POI not found');
    return res.json();
  },

  getDirections: async (
    destLat: number,
    destLng: number,
    stationId: number
  ): Promise<Route> => {
    const res = await fetch(
      `${BASE_URL}/directions?dest_lat=${destLat}&dest_lng=${destLng}&station_id=${stationId}`
    );
    if (!res.ok) throw new Error('Directions failed');
    const data = await res.json();
    return {
      coordinates: data.route.geometry.coordinates,
      distance: data.route.distance,
      duration: data.route.duration,
      optimal_exit: data.optimal_exit,
    };
  },
};

// ── Component ──────────────────────────────────────────────────
export const MapScreen = ({ navigation }: any) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [exits, setExits] = useState<Exit[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POIDetail | null>(null);
  const [loadingPOI, setLoadingPOI] = useState(false);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const cameraRef = useRef<MapboxGL.Camera>(null);

  useEffect(() => {
    api.getStations().then(setStations).catch(console.error);
  }, []);

  // จัดกลุ่ม stations ตามสาย สำหรับวาดเส้น
  const groupedByLine = stations.reduce<Record<string, Station[]>>((acc, s) => {
    if (!acc[s.line]) acc[s.line] = [];
    acc[s.line].push(s);
    return acc;
  }, {});

  const lineGeoJSON = (stationList: Station[]): GeoJSON.Feature => ({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: stationList.map(s => [s.lng, s.lat]),
    },
  });

  // ── Search ──────────────────────────────────────────────────
  const handleSearch = async (text: string) => {
    setSearch(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await api.getStations(text);
      setSearchResults(results);
    } catch (e) {
      console.error('Search failed:', e);
    }
  };

  // ── เลือกสถานี ───────────────────────────────────────────────
  const selectStation = async (station: Station) => {
    setSearch(station.name_en);
    setSearchResults([]);
    setSelectedStation(station);
    setSelectedPOI(null);
    setActiveRoute(null);
    setLoadingDetail(true);

    cameraRef.current?.setCamera({
      centerCoordinate: [station.lng, station.lat],
      zoomLevel: 16,
      animationDuration: 800,
    });

    try {
      const [exitData, poiData] = await Promise.all([
        api.getExits(station.id),
        api.getPOIs(station.lat, station.lng),
      ]);
      setExits(exitData);
      setPois(poiData);
    } catch (e) {
      console.error('Failed to load station detail:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── เลือก POI ───────────────────────────────────────────────
  const selectPOI = async (poi: POI) => {
    setLoadingPOI(true);
    setActiveRoute(null);
    try {
      const detail = await api.getPOIDetail(poi.id);
      setSelectedPOI(detail);
    } catch (e) {
      console.error('Failed to load POI detail:', e);
    } finally {
      setLoadingPOI(false);
    }
  };

  // ── Navigate ────────────────────────────────────────────────
  const getDirections = async (poi: POIDetail) => {
    if (!selectedStation || !poi.lat || !poi.lng) return;
    setLoadingRoute(true);
    try {
      const route = await api.getDirections(poi.lat, poi.lng, selectedStation.id);
      setActiveRoute(route);
      cameraRef.current?.setCamera({
        centerCoordinate: [poi.lng, poi.lat],
        zoomLevel: 15,
        animationDuration: 800,
      });
    } catch (e) {
      console.error('Directions failed:', e);
    } finally {
      setLoadingRoute(false);
    }
  };

  const clearSelection = () => {
    setSelectedStation(null);
    setSelectedPOI(null);
    setActiveRoute(null);
    setExits([]);
    setPois([]);
    setSearch('');
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ── Map ── */}
      <MapboxGL.MapView style={styles.map} logoEnabled={false}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={[100.5018, 13.7563]}
        />

        {/* เส้นสาย */}
        {Object.entries(groupedByLine).map(([line, stationList]) => (
          <MapboxGL.ShapeSource
            key={`line-${line}`}
            id={`line-source-${line}`}
            shape={lineGeoJSON(stationList)}
          >
            <MapboxGL.LineLayer
              id={`line-layer-${line}`}
              style={{
                lineColor: LINE_COLORS[line] ?? '#888888',
                lineWidth: 4,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
          </MapboxGL.ShapeSource>
        ))}

        {/* เส้น route navigation */}
        {activeRoute && (
          <MapboxGL.ShapeSource
            id="route-source"
            shape={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: activeRoute.coordinates,
              },
            }}
          >
            <MapboxGL.LineLayer
              id="route-layer"
              style={{
                lineColor: '#3F51B5',
                lineWidth: 5,
                lineJoin: 'round',
                lineCap: 'round',
                lineDasharray: [2, 1],
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Station pins */}
        {stations.map((station) => (
          <MapboxGL.PointAnnotation
            key={`station-${station.id}`}
            id={`station-${station.id}`}
            coordinate={[station.lng, station.lat]}
            onSelected={() => selectStation(station)}
          >
            <View style={[
              styles.stationPin,
              { borderColor: LINE_COLORS[station.line] ?? '#000099' },
              selectedStation?.id === station.id && styles.stationPinSelected,
            ]} />
          </MapboxGL.PointAnnotation>
        ))}

        {/* Exit pins */}
        {exits.map((exit) => (
          <MapboxGL.PointAnnotation
            key={`exit-${exit.id}`}
            id={`exit-${exit.id}`}
            coordinate={[exit.lng, exit.lat]}
          >
            <View style={styles.exitPin}>
              <Text style={styles.exitPinText}>{exit.exit_number}</Text>
            </View>
          </MapboxGL.PointAnnotation>
        ))}

        {/* POI pins */}
        {pois.map((poi) => (
          <MapboxGL.PointAnnotation
            key={`poi-${poi.id}`}
            id={`poi-${poi.id}`}
            coordinate={[poi.lng!, poi.lat!]}
            onSelected={() => selectPOI(poi)}
          >
            <View style={[
              styles.poiPin,
              selectedPOI?.id === poi.id && styles.poiPinSelected,
            ]}>
              <Text style={styles.poiPinEmoji}>
                {CATEGORY_EMOJI[poi.category] ?? CATEGORY_EMOJI.default}
              </Text>
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      {/* ── Search bar ── */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIconText}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stations..."
          placeholderTextColor="#6C757D"
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={clearSelection}>
            <Text style={{ color: '#6C757D', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search dropdown ── */}
      {searchResults.length > 0 && (
        <View style={styles.searchDropdown}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchItem}
                onPress={() => selectStation(item)}
              >
                <Text style={styles.searchItemName}>{item.name_en}</Text>
                {item.name_th ? (
                  <Text style={styles.searchItemSub}>{item.name_th}</Text>
                ) : null}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ── Station info card ── */}
      {selectedStation && !selectedPOI && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoName}>{selectedStation.name_en}</Text>
              {selectedStation.name_th ? (
                <Text style={styles.infoNameTh}>{selectedStation.name_th}</Text>
              ) : null}
              <View style={[
                styles.lineTag,
                { backgroundColor: LINE_COLORS[selectedStation.line] ?? '#000099' },
              ]}>
                <Text style={styles.lineTagText}>{selectedStation.line}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={clearSelection}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loadingDetail ? (
            <ActivityIndicator color="#3F51B5" style={{ marginTop: 12 }} />
          ) : (
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {exits.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🚪 Exits</Text>
                  {exits.map((exit) => (
                    <Text key={exit.id} style={styles.sectionItem}>
                      Exit {exit.exit_number}
                      {exit.description ? ` — ${exit.description}` : ''}
                    </Text>
                  ))}
                </View>
              )}

              {pois.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    📍 Nearby ({pois.length} places)
                  </Text>
                  {pois.slice(0, 6).map((poi) => (
                    <TouchableOpacity
                      key={poi.id}
                      style={styles.poiRow}
                      onPress={() => selectPOI(poi)}
                    >
                      <Text style={styles.poiRowEmoji}>
                        {CATEGORY_EMOJI[poi.category] ?? CATEGORY_EMOJI.default}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.poiRowName}>{poi.name}</Text>
                        <Text style={styles.poiRowMeta}>
                          {poi.distance ? `${Math.round(poi.distance)}m` : ''}
                          {poi.distance && poi.price_level ? ' · ' : ''}
                          {poi.price_level ? priceLabel(poi.price_level) : ''}
                        </Text>
                      </View>
                      <Text style={styles.poiRowChevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                  {pois.length > 6 && (
                    <Text style={styles.sectionMore}>+{pois.length - 6} more places nearby</Text>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* ── POI detail card ── */}
      {selectedPOI && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoName}>
                {CATEGORY_EMOJI[selectedPOI.category] ?? '📍'} {selectedPOI.name}
              </Text>
              <Text style={styles.infoLine}>
                {selectedPOI.category}
                {selectedPOI.price_level ? ` · ${priceLabel(selectedPOI.price_level)}` : ''}
                {selectedPOI.rating ? ` · ⭐ ${selectedPOI.rating.toFixed(1)}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => { setSelectedPOI(null); setActiveRoute(null); }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loadingPOI ? (
            <ActivityIndicator color="#3F51B5" style={{ marginTop: 12 }} />
          ) : (
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {/* รูปภาพ */}
              {selectedPOI.image_url && (
                <Image
                  source={{ uri: selectedPOI.image_url }}
                  style={styles.poiImage}
                  resizeMode="cover"
                />
              )}

              {selectedPOI.description ? (
                <Text style={styles.poiDescription}>{selectedPOI.description}</Text>
              ) : null}

              {selectedPOI.operating_hours && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🕐 Hours</Text>
                  {Object.entries(selectedPOI.operating_hours).map(([day, hours]) => (
                    <Text key={day} style={styles.sectionItem}>
                      {day}: {String(hours)}
                    </Text>
                  ))}
                </View>
              )}

              {/* Route info หรือปุ่ม navigate */}
              {activeRoute ? (
                <View style={styles.routeInfo}>
                  <Text style={styles.routeInfoText}>
                    📍 {Math.round(activeRoute.distance)}m · {formatDuration(activeRoute.duration)} walk
                  </Text>
                  {activeRoute.optimal_exit && (
                    <Text style={styles.routeExitText}>
                      Use Exit {activeRoute.optimal_exit.exit_number} — {activeRoute.optimal_exit.description}
                    </Text>
                  )}
                  <TouchableOpacity onPress={() => setActiveRoute(null)}>
                    <Text style={styles.clearRouteText}>✕ Clear route</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.navigateBtn}
                  onPress={() => getDirections(selectedPOI)}
                  disabled={loadingRoute}
                >
                  {loadingRoute
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.navigateBtnText}>🧭 Navigate here</Text>
                  }
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.backToStation}
                onPress={() => { setSelectedPOI(null); setActiveRoute(null); }}
              >
                <Text style={styles.backToStationText}>
                  ← Back to {selectedStation?.name_en}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}

            <View style={styles.bottomNav}>
        {/* Map — active */}
        <TouchableOpacity style={[styles.navItem, styles.navItemInset]}>
            <View style={[styles.navIcon, { backgroundColor: '#3F51B5' }]} />
        </TouchableOpacity>

        {/* AI Trip */}
        <TouchableOpacity
            style={[styles.navItem, styles.navItemShadow]}
            onPress={() => navigation.navigate('TripPlan')}
        >
            <View style={[styles.navIcon, { backgroundColor: '#F78BC9' }]} />
        </TouchableOpacity>

        {/* Save Trip */}
        <TouchableOpacity
            style={[styles.navItem, styles.navItemShadow]}
            onPress={() => navigation.navigate('SavedTrips')}
        >
            <View style={[styles.navIcon, { backgroundColor: '#F78BC9' }]} />
        </TouchableOpacity>

        {/* Profile — รูปกลม */}
        <TouchableOpacity
            style={[styles.navItem, styles.navItemShadow]}
            onPress={() => navigation.navigate('Profile')}
        >
            <Image
            source={{ uri: 'https://i.pravatar.cc/150' }} // เปลี่ยนเป็น user avatar จริง
            style={styles.profileAvatar}
            />
        </TouchableOpacity>
        </View>

    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EAF6' },
  map: { flex: 1 },

  stationPin: {
    width: 14, height: 14, borderRadius: 999,
    backgroundColor: '#E7ECF6', borderWidth: 2, borderColor: '#000099',
  },
  stationPinSelected: {
    width: 20, height: 20, backgroundColor: '#3377FF',
  },

  exitPin: {
    width: 26, height: 26, borderRadius: 999,
    backgroundColor: '#00F5D4', borderWidth: 1.5, borderColor: '#000099',
    justifyContent: 'center', alignItems: 'center',
  },
  exitPinText: { fontSize: 9, fontWeight: '700', color: '#000099' },

  poiPin: {
    width: 34, height: 34, borderRadius: 999,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#C5C7D1',
    justifyContent: 'center', alignItems: 'center', elevation: 3,
  },
  poiPinSelected: { borderColor: '#3F51B5', borderWidth: 2.5, backgroundColor: '#EEF0FB' },
  poiPinEmoji: { fontSize: 16 },

  searchBar: {
    position: 'absolute', top: 26, left: 22, width: width - 44,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#E6EFF7', borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    zIndex: 10,
    shadowColor: '#C5D9D5', shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 4,
  },
  searchIconText: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 13, color: '#3F487B' },
  searchDropdown: {
    position: 'absolute', top: 72, left: 22, width: width - 44,
    backgroundColor: '#F0F1F9', borderRadius: 12,
    zIndex: 10, maxHeight: 220,
    shadowColor: '#C5C7D1', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 6,
  },
  searchItem: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  searchItemName: { fontSize: 13, fontWeight: '500', color: '#3F487B' },
  searchItemSub: { fontSize: 11, color: '#6C757D', marginTop: 2 },

  infoCard: {
    position: 'absolute', bottom: 96, left: 16, right: 16,
    backgroundColor: '#E8EAF6', borderRadius: 24, padding: 20,
    zIndex: 10,
    shadowColor: '#C5C7D1', shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  infoName: { fontSize: 18, fontWeight: '700', color: '#3F487B' },
  infoNameTh: { fontSize: 13, color: '#6C757D', marginTop: 2 },
  infoLine: { fontSize: 12, color: '#6C757D', marginTop: 4 },
  lineTag: {
    alignSelf: 'flex-start', marginTop: 6,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
  },
  lineTagText: { fontSize: 11, color: 'white', fontWeight: '600' },
  closeBtn: { padding: 4, marginLeft: 8 },
  closeBtnText: { fontSize: 18, color: '#6C757D' },

  section: { marginTop: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#3F487B', marginBottom: 6 },
  sectionItem: { fontSize: 12, color: '#6C757D', marginBottom: 3, lineHeight: 18 },
  sectionMore: { fontSize: 12, color: '#3F51B5', marginTop: 6 },

  poiRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#EBEBEB', gap: 10,
  },
  poiRowEmoji: { fontSize: 20, width: 28 },
  poiRowName: { fontSize: 13, fontWeight: '500', color: '#3F487B' },
  poiRowMeta: { fontSize: 11, color: '#6C757D', marginTop: 1 },
  poiRowChevron: { fontSize: 18, color: '#C5C7D1' },

  poiImage: { width: '100%', height: 160, borderRadius: 16, marginBottom: 10 },
  poiDescription: { fontSize: 13, color: '#6C757D', lineHeight: 20, marginBottom: 10 },

  navigateBtn: {
    marginTop: 12, backgroundColor: '#3F51B5',
    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
  },
  navigateBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },

  routeInfo: {
    marginTop: 12, backgroundColor: '#EEF0FB',
    borderRadius: 12, padding: 12, gap: 4,
  },
  routeInfoText: { fontSize: 13, fontWeight: '600', color: '#3F487B' },
  routeExitText: { fontSize: 12, color: '#3F51B5', marginTop: 2 },
  clearRouteText: { fontSize: 12, color: '#6C757D', marginTop: 6 },

  backToStation: { marginTop: 12, paddingVertical: 4 },
  backToStationText: { fontSize: 13, color: '#3F51B5', fontWeight: '500' },

  bottomNav: {
    position: 'absolute', bottom: 20, left: 24, width: width - 48,
    height: 66, backgroundColor: '#E8EAF6', borderRadius: 50,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    shadowColor: '#C5C7D1', shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 8,
  },
  navItem: {
    width: 43, height: 43, borderRadius: 999,
    justifyContent: 'center', alignItems: 'center',
  },
  navItemInset: {
    shadowColor: '#C5D9D5', shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  navItemShadow: {
    shadowColor: '#C5C7D1', shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 4,
  },
    navIcon: { width: 22, height: 22, borderRadius: 4 },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#E8EAF6',
  },
});
;