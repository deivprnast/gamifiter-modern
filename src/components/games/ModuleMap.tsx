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
  // Custom DivIcon creator for premium look
  const createCityIcon = (city: any) => {
    const cityRoadIndex = city.properties.road; // e.g. 0, 1, 2...
    const isStart = city.properties.start || cityRoadIndex === 0;
    const isUnlocked = isStart || (progress * 9.0 >= cityRoadIndex);
    const flagCode = city.properties.code?.toLowerCase();
    
    let html = '';
    if (isStart) {
      html = `<div class="city-marker start" style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2.5px solid #007CA6;
          box-shadow: 0 0 12px rgba(0, 124, 166, 0.6), 0 2px 6px rgba(0,0,0,0.2);
          overflow: hidden;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <img src="https://flagcdn.com/w40/${flagCode}.png" style="width: 100%; height: 100%; object-fit: cover;" alt="Start" />
        </div>`;
    } else if (isUnlocked) {
      html = `<div class="city-marker unlocked" style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2.5px solid #10B981;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5), 0 2px 6px rgba(0,0,0,0.15);
          overflow: hidden;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <img src="https://flagcdn.com/w40/${flagCode}.png" style="width: 100%; height: 100%; object-fit: cover;" alt="${city.properties.city}" />
        </div>`;
    } else {
      html = `<div class="city-marker locked" style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #94A3B8;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          font-size: 11px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          cursor: pointer;
        ">🔒</div>`;
    }

    return L.divIcon({
      html,
      className: 'custom-leaflet-icon',
      iconSize: isStart ? [32, 32] : [28, 28],
      iconAnchor: isStart ? [16, 16] : [14, 14],
    });
  };

  const createStudentIcon = (initials: string, name: string) => {
    return L.divIcon({
      html: `<div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div class="student-marker" style="
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #007CA6;
          border: 2.5px solid #FFFFFF;
          box-shadow: 0 4px 12px rgba(0, 124, 166, 0.4), 0 0 0 3px rgba(0, 124, 166, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: -0.5px;
          cursor: pointer;
        ">${initials}</div>
        <div style="
          margin-top: 2px;
          white-space: nowrap;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(4px);
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">${name.split(' ')[0]}</div>
      </div>`,
      className: 'custom-leaflet-student',
      iconSize: [34, 50],
      iconAnchor: [17, 17],
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
    <div style={{ position: 'relative', width: '100%', height: '520px', zIndex: 0, isolation: 'isolate' }}>
      <MapContainer
        key={filePath}
        center={[50.075, 14.437]}
        zoom={4}
        style={{ width: '100%', height: '100%', borderRadius: '16px', zIndex: 0 }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
          const isStart = city.properties.start || cityRoadIndex === 0;
          const isUnlocked = isStart || (progress * 9.0 >= cityRoadIndex);
          const flagCode = city.properties.code?.toLowerCase();
          
          return (
            <Marker
              key={`city-${idx}`}
              position={[lat, lng]}
              icon={createCityIcon(city)}
            >
              <Popup>
                <div style={{ minWidth: '240px', maxWidth: '320px', color: '#0F172A' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <img 
                        src={`https://flagcdn.com/w20/${flagCode}.png`} 
                        alt={city.properties.country_cs || ''} 
                        style={{ width: '18px', height: 'auto', borderRadius: '2px', border: '1px solid rgba(0,0,0,0.1)' }} 
                      />
                      <h4 style={{ margin: 0, color: '#0F172A', fontWeight: 800, fontSize: '14px' }}>
                        {city.properties.city_cs || city.properties.city}
                      </h4>
                    </div>
                    {isStart ? (
                      <span style={{ fontSize: '10px', fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #BFDBFE' }}>
                        🏁 Start
                      </span>
                    ) : isUnlocked ? (
                      <span style={{ fontSize: '10px', fontWeight: 700, background: '#ECFDF5', color: '#047857', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #A7F3D0' }}>
                        ✓ Odemčeno
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: 700, background: '#FFF1F2', color: '#BE123C', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #FECDD3' }}>
                        🔒 Zamčeno
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  {isUnlocked ? (
                    <div>
                      <p style={{ fontSize: '12.5px', lineHeight: '1.55', margin: '0 0 10px 0', color: '#334155' }}>
                        {city.properties.content ? city.properties.content.replace(/^["']|["']$/g, '') : 'Zajímavost o tomto evropském městě.'}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748B', paddingTop: '6px', borderTop: '1px solid #F8FAFC' }}>
                        <span>{city.properties.country_cs || city.properties.country}</span>
                        {city.properties.link ? (
                          <a 
                            href={city.properties.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ color: '#007CA6', fontWeight: 600, textDecoration: 'none' }}
                          >
                            {city.properties.reference || 'Wikipedie'} →
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#475569' }}>
                      <p style={{ margin: '0 0 8px 0' }}>
                        Město <strong>{city.properties.city_cs || city.properties.city}</strong> leží na trase výzvy.
                      </p>
                      <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Odemkne se při splnění:</div>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>
                          {Math.round((cityRoadIndex / 9) * targetSteps).toLocaleString()} kroků ({Math.round((cityRoadIndex / 9) * 100)} % trasy)
                        </div>
                      </div>
                    </div>
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
            icon={createStudentIcon(getInitials(student.name), student.name)}
          >
            <Popup>
              <div style={{ minWidth: '200px', color: '#0F172A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#007CA6', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>
                    {getInitials(student.name)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#0F172A', fontWeight: 800, fontSize: '13px' }}>{student.name}</h4>
                    <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>🟢 Reálná telemetrie FTK UP</span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#334155', background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ marginBottom: '3px' }}>Kroky celkem: <strong style={{ color: '#007CA6' }}>{student.steps.toLocaleString()} kroků</strong></div>
                  <div style={{ marginBottom: '3px' }}>Ušlá vzdálenost: <strong>{(student.steps * 0.00075).toFixed(2)} km</strong></div>
                  <div>Postup ve výzvě: <strong>{student.progressPercent} %</strong></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapResizer bounds={bounds} />
      </MapContainer>
    </div>
  );
};
