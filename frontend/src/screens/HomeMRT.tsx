import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';

MapboxGL.setAccessToken('YOUR_MAPBOX_TOKEN');

const BASE_URL = 'http://localhost:8080';
const { width } = Dimensions.get('window');

type Station = {
  id: number;
  name_en: string;
  name_th: string;
  line: string;
  lat: number;
  lng: number;
};

// สีแต่ละสาย
const LINE_COLORS: Record<string, string> = {
  'MRT Blue': '#0101A5',
  'MRT Purple': '#7B2D8B',
  'BTS Sukhumvit': '#009945',
  'BTS Silom': '#78BE20',
};

export const MapScreen = ({ navigation }: any) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [exits, setExits] = useState<any[]>([]);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await fetch(`${BASE_URL}/stations`);
      const data = await res.json();
      setStations(data.stations || []);
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    }
  };

  const fetchExits = async (stationId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/station-exits?station_id=${stationId}`);
      const data = await res.json();
      setExits(data.exits || []);
    } catch {
      setExits([]);
    }
  };

  const handleStationPress = (station: Station) => {
    setSelectedStation(station);
    fetchExits(station.id);
    cameraRef.current?.setCamera({
      centerCoordinate: [station.lng, station.lat],
      zoomLevel: 15,
      animationDuration: 800,
    });
  };

  // จัดกลุ่ม stations ตามสาย
  const groupedByLine = stations.reduce<Record<string, Station[]>>((acc, s) => {
    if (!acc[s.line]) acc[s.line] = [];
    acc[s.line].push(s);
    return acc;
  }, {});

  // แปลงแต่ละสายเป็น GeoJSON LineString
  const lineGeoJSON = (stationList: Station[]): GeoJSON.Feature => ({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: stationList.map(s => [s.lng, s.lat]),
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <MapboxGL.MapView style={styles.map}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={[100.5018, 13.7563]}
        />

        
        {Object.entries(groupedByLine).map(([line, stationList]) => (
          <MapboxGL.ShapeSource
            key={`line-${line}`}
            id={`line-${line}`}
            shape={lineGeoJSON(stationList)}
          >
            <MapboxGL.LineLayer
              id={`layer-${line}`}
              style={{
                lineColor: LINE_COLORS[line] ?? '#888888',
                lineWidth: 4,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
          </MapboxGL.ShapeSource>
        ))}

        {/* Station markers */}
        {stations.map((station) => (
          <MapboxGL.PointAnnotation
            key={`station-${station.id}`}
            id={`station-${station.id}`}
            coordinate={[station.lng, station.lat]}
            onSelected={() => handleStationPress(station)}
          >
            <View style={[
              styles.stationMarker,
              { borderColor: LINE_COLORS[station.line] ?? '#000099' },
              selectedStation?.id === station.id && styles.stationMarkerSelected,
            ]} />
          </MapboxGL.PointAnnotation>
        ))}

        {/* Exit markers */}
        {exits.map((exit) => (
          <MapboxGL.PointAnnotation
            key={`exit-${exit.id}`}
            id={`exit-${exit.id}`}
            coordinate={[exit.lng, exit.lat]}
          >
            <View style={styles.exitMarker}>
              <Text style={styles.exitMarkerText}>{exit.exit_number}</Text>
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      {/* Station info card */}
      {selectedStation && (
        <View style={styles.infoCard}>
          <View style={[styles.lineTag, { backgroundColor: LINE_COLORS[selectedStation.line] ?? '#000099' }]}>
            <Text style={styles.lineTagText}>{selectedStation.line}</Text>
          </View>
          <Text style={styles.infoTitle}>{selectedStation.name_en}</Text>
          <Text style={styles.infoSubTitle}>{selectedStation.name_th}</Text>

          {exits.length > 0 && (
            <>
              <Text style={styles.exitsTitle}>Exits</Text>
              {exits.map((exit) => (
                <Text key={exit.id} style={styles.exitItem}>
                  Exit {exit.exit_number} — {exit.description}
                </Text>
              ))}
            </>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => { setSelectedStation(null); setExits([]); }}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.navItemInset]}>
          <View style={styles.navIconHeart} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemShadow]}>
          <View style={styles.navIconMap} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, styles.navItemShadow]}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.navIconProfile} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EAF6' },
  map: { flex: 1 },
  stationMarker: {
    width: 14,
    height: 14,
    backgroundColor: '#E7ECF6',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#000099',
  },
  stationMarkerSelected: {
    backgroundColor: '#3377FF',
    width: 18,
    height: 18,
  },
  exitMarker: {
    width: 22,
    height: 22,
    backgroundColor: '#00F5D4',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitMarkerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000099',
  },
  infoCard: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: '#E8EAF6',
    borderRadius: 24,
    padding: 20,
    zIndex: 10,
    shadowColor: '#C5C7D1',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  lineTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  lineTagText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3F487B',
  },
  infoSubTitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 2,
    marginBottom: 8,
  },
  exitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F487B',
    marginBottom: 4,
  },
  exitItem: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 2,
  },
  closeButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#3F51B5',
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    width: width - 48,
    height: 66,
    backgroundColor: '#E8EAF6',
    borderRadius: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#C5C7D1',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  navItem: {
    width: 43,
    height: 43,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemInset: {
    shadowColor: '#C5D9D5',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  navItemShadow: {
    shadowColor: '#C5C7D1',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  navIconHeart: { width: 19, height: 19, backgroundColor: '#F78BC9', borderRadius: 2 },
  navIconMap: { width: 17, height: 22, backgroundColor: '#F78BC9', borderRadius: 2 },
  navIconProfile: { width: 13, height: 18, backgroundColor: '#F78BC9', borderRadius: 2 },
});