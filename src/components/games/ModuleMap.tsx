import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon paths in React
import 'leaflet/dist/leaflet.css';

interface ModuleMapProps {
  progress: number; // 0 to 1
  filePath: string;
  students: Array<{ name: string; steps: number }>;
  targetSteps: number;
}

// Sub-component to center map when bounds or center changes
const MapResizer: React.FC<{ bounds: L.LatLngBounds | null }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [40, 40] });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [bounds, map]);
  return null;
};

export const ModuleMap: React.FC<ModuleMapProps> = ({ progress, filePath, students, targetSteps }) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(filePath)
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load map data:', err);
        setLoading(false);
      });
  }, [filePath]);

  if (loading || !geoData) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#0B0F19] rounded-xl border border-[#1E293B]">
        <div className="text-[#06B6D4] animate-pulse">Načítání trasy...</div>
      </div>
    );
  }

  // Find the full road
  const fullRoadFeature = geoData.features.find((f: any) => f.properties.info === 'full_road');
  const cityFeatures = geoData.features.filter((f: any) => f.geometry.type === 'Point');

  if (!fullRoadFeature) {
    return <div className="text-red-500 p-4">Chyba: Trasa nebyla nalezena v GeoJSON souboru.</div>;
  }

  const coordinates: [number, number][] = fullRoadFeature.geometry.coordinates.map((coord: number[]) => [
    coord[1], // latitude
    coord[0], // longitude
  ]);

  // Slice walked coordinates based on group progress
  const walkedPointsCount = Math.max(2, Math.floor(coordinates.length * progress));
  const walkedCoordinates = coordinates.slice(0, walkedPointsCount);
  const remainingCoordinates = coordinates.slice(walkedPointsCount - 1);

  // Calculate active student avatars along the path
  const studentMarkers = students
    .filter(s => s.steps > 0)
    .map((student) => {
      const studentProgress = Math.min(1, student.steps / targetSteps);
      const index = Math.min(
        coordinates.length - 1,
        Math.floor(coordinates.length * studentProgress)
      );
      const pos = coordinates[index] || coordinates[0];
      return {
        name: student.name,
        pos,
        progressPercent: Math.round(studentProgress * 100),
        steps: student.steps
      };
    });

  // Calculate bounds
  const bounds = L.latLngBounds(coordinates);

  // Custom DivIcon creator for premium look
  const createCityIcon = (city: any) => {
    const cityRoadIndex = city.properties.road; // e.g. 0, 1, 2...
    // Total cities count in data is 10 (indices 0 to 9)
    const isUnlocked = progress * 9.0 >= cityRoadIndex;
    const flagCode = city.properties.code?.toLowerCase();
    
    const html = isUnlocked
      ? `<div class="city-marker unlocked" style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #10B981;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
          overflow: hidden;
          background: #1E293B;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        ">
          <img src="https://flagcdn.com/w40/${flagCode}.png" style="width: 130%; height: 130%; object-fit: cover;" />
        </div>`
      : `<div class="city-marker locked" style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #F43F5E;
          background: #1E293B;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #F43F5E;
          font-size: 10px;
          box-shadow: 0 0 5px rgba(244, 63, 94, 0.4);
        ">🔒</div>`;

    return L.divIcon({
      html,
      className: 'custom-leaflet-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  const createStudentIcon = (initials: string) => {
    return L.divIcon({
      html: `<div class="student-marker" style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #06B6D4, #8B5CF6);
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 8px rgba(6, 182, 212, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 11px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        animation: pulse 1.5s infinite alternate;
      ">${initials}</div>`,
      className: 'custom-leaflet-student',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <MapContainer
        key={filePath}
        center={[50.075, 14.437]}
        zoom={4}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Remaining (to walk) path in warning red/rose */}
        {remainingCoordinates.length > 1 && (
          <Polyline
            positions={remainingCoordinates}
            pathOptions={{ color: '#F43F5E', weight: 4, opacity: 0.6, dashArray: '8, 8' }}
          />
        )}

        {/* Walked path in success emerald green */}
        {walkedCoordinates.length > 1 && (
          <Polyline
            positions={walkedCoordinates}
            pathOptions={{ color: '#10B981', weight: 5, opacity: 0.95 }}
          />
        )}

        {/* City Destinations */}
        {cityFeatures.map((city: any, idx: number) => {
          const lat = city.geometry.coordinates[1];
          const lng = city.geometry.coordinates[0];
          const cityRoadIndex = city.properties.road;
          const isUnlocked = progress * 9.0 >= cityRoadIndex;
          
          return (
            <Marker
              key={`city-${idx}`}
              position={[lat, lng]}
              icon={createCityIcon(city)}
            >
              <Popup>
                <div style={{ fontFamily: 'var(--font-sans)', minWidth: '220px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: isUnlocked ? '#10B981' : '#F43F5E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isUnlocked ? '🔓' : '🔒'} {city.properties.city_cs || city.properties.city}, {city.properties.country_cs || city.properties.country}
                  </h4>
                  {isUnlocked ? (
                    <div>
                      <p style={{ fontSize: '13px', lineHeight: '1.4', margin: '0 0 10px 0', color: '#E2E8F0' }}>
                        {city.properties.content}
                      </p>
                      <div style={{ fontSize: '11px', textAlign: 'right', fontStyle: 'italic', color: '#94A3B8' }}>
                        Zdroj: <a href={city.properties.link} target="_blank" rel="noreferrer" style={{ color: '#06B6D4', textDecoration: 'none' }}>{city.properties.reference}</a>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', margin: '0', color: '#94A3B8' }}>
                      Toto město je uzamčeno. Zvyšte krok v týmu, abyste jej odemkli! Odemkne se při splnění{' '}
                      <strong>{Math.round((cityRoadIndex / 9) * 100)} %</strong> výzvy.
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Students' avatars on map */}
        {studentMarkers.map((student, idx) => (
          <Marker
            key={`student-map-${idx}`}
            position={student.pos}
            icon={createStudentIcon(getInitials(student.name))}
          >
            <Popup>
              <div style={{ fontFamily: 'var(--font-sans)' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#06B6D4', fontWeight: 700 }}>{student.name}</h4>
                <p style={{ margin: '0', fontSize: '13px', color: '#E2E8F0' }}>
                  Kroky: <strong>{student.steps.toLocaleString()}</strong> ({student.progressPercent} % výzvy)
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapResizer bounds={bounds} />
      </MapContainer>
    </div>
  );
};
