import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ModuleDistrictsProps {
  progress: number; // 0 to 1
  filePath: string;
}

const MapResizer: React.FC<{ bounds: L.LatLngBounds | null }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [20, 20] });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [bounds, map]);
  return null;
};

export const ModuleDistricts: React.FC<ModuleDistrictsProps> = ({ progress, filePath }) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  useEffect(() => {
    fetch(filePath)
      .then((res) => res.json())
      .then((data) => {
        // Calculate unlocked districts
        const districts = data.features;
        const showEdge = 1 / districts.length;
        
        districts.forEach((feature: any, index: number) => {
          const edge = showEdge + index * showEdge;
          if (progress >= edge) {
            feature.properties.show = true;
          } else {
            feature.properties.show = false;
            feature.properties.neededPercent = Math.round((edge - progress) * 100);
          }
        });

        setGeoData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load districts data:', err);
        setLoading(false);
      });
  }, [filePath, progress]);

  if (loading || !geoData) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#0B0F19] rounded-xl border border-[#1E293B]">
        <div className="text-[#06B6D4] animate-pulse">Načítání regionální mapy...</div>
      </div>
    );
  }

  // Styles for polygons
  const districtStyle = (feature: any) => {
    const isShow = feature.properties.show;
    return {
      color: isShow ? '#059669' : '#E11D48',
      weight: isShow ? 2.5 : 2,
      opacity: 0.9,
      fillColor: isShow ? '#10B981' : '#F43F5E',
      fillOpacity: isShow ? 0.35 : 0.15,
      dashArray: isShow ? undefined : '5, 5'
    };
  };

  // Popup logic on click
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties;
    const isShow = props.show;
    
    let popupContent = '';

    if (isShow) {
      popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 190px; color: #0F172A; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <h4 style="margin: 0; color: #059669; font-weight: 800; font-size: 14px;">${props.name}</h4>
            <span style="font-size: 10px; font-weight: 700; background: #ECFDF5; color: #047857; padding: 2px 6px; border-radius: 9999px; border: 1px solid #A7F3D0;">🔓 Odemčeno</span>
          </div>
          <div style="font-size: 12px; line-height: 1.5; color: #334155;">
            <div><strong>Sídlo kraje:</strong> ${props.city || '-'}</div>
            <div><strong>Rozloha:</strong> ${props.area ? props.area.toLocaleString() : '-'} km²</div>
            <div><strong>Počet obyvatel:</strong> ${props.urban ? props.urban.toLocaleString() : '-'}</div>
            <div><strong>Hustota:</strong> ${props.density_km ? props.density_km.toLocaleString() : '-'} ob./km²</div>
          </div>
        </div>
      `;
    } else {
      popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 180px; color: #0F172A; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <h4 style="margin: 0; color: #E11D48; font-weight: 800; font-size: 14px;">${props.name || 'Zamčený kraj'}</h4>
            <span style="font-size: 10px; font-weight: 700; background: #FFF1F2; color: #BE123C; padding: 2px 6px; border-radius: 9999px; border: 1px solid #FECDD3;">🔒 Zamčeno</span>
          </div>
          <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.4;">
            Zbývá ujít ještě <strong style="color: #E11D48; font-weight: 800;">${props.neededPercent} %</strong> výzvy pro odemčení tohoto území.
          </p>
        </div>
      `;
    }

    layer.bindPopup(popupContent);

    // Mouse hover events for nice aesthetics
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: isShow ? 0.6 : 0.3,
          weight: 3.5,
        });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: isShow ? 0.35 : 0.15,
          weight: isShow ? 2.5 : 2,
        });
      },
    });
  };

  // Callback to grab bounds of the geojson layer
  const onEachFeatureLayer = (layer: any) => {
    if (layer && !bounds) {
      try {
        const geoJsonLayer = L.geoJSON(geoData);
        setBounds(geoJsonLayer.getBounds());
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <MapContainer
        key={filePath}
        center={[49.8, 15.5]} // Center of Czechia
        zoom={7.5}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GeoJSON
          key={`geojson-${progress}`}
          data={geoData}
          style={districtStyle}
          onEachFeature={onEachFeature}
          ref={onEachFeatureLayer}
        />

        {bounds && <MapResizer bounds={bounds} />}
      </MapContainer>
    </div>
  );
};
