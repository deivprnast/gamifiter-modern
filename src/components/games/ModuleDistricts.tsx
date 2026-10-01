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
      color: isShow ? '#10B981' : '#F43F5E',
      weight: 2,
      opacity: 0.8,
      fillColor: isShow ? '#10B981' : '#F43F5E',
      fillOpacity: isShow ? 0.35 : 0.1,
    };
  };

  // Popup logic on click
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties;
    const isShow = props.show;
    
    let popupContent = '';

    if (isShow) {
      popupContent = `
        <div style="font-family: var(--font-sans); min-width: 180px;">
          <h4 style="margin: 0 0 8px 0; color: #10B981; font-weight: 700;">🔓 ${props.name}</h4>
          <p style="margin: 2px 0; font-size: 13px; color: #E2E8F0;"><strong>Sídlo kraje:</strong> ${props.city || '-'}</p>
          <p style="margin: 2px 0; font-size: 13px; color: #E2E8F0;"><strong>Rozloha:</strong> ${props.area ? props.area.toLocaleString() : '-'} km²</p>
          <p style="margin: 2px 0; font-size: 13px; color: #E2E8F0;"><strong>Počet obyvatel:</strong> ${props.urban ? props.urban.toLocaleString() : '-'}</p>
          <p style="margin: 2px 0; font-size: 13px; color: #E2E8F0;"><strong>Hustota zalidnění:</strong> ${props.density_km ? props.density_km.toLocaleString() : '-'} ob./km²</p>
        </div>
      `;
    } else {
      popupContent = `
        <div style="font-family: var(--font-sans);">
          <h4 style="margin: 0 0 6px 0; color: #F43F5E; font-weight: 700;">🔒 Kraj je zamčený</h4>
          <p style="margin: 0; font-size: 13px; color: #94A3B8;">
            Zbývá ujít ještě <strong style="color: #F43F5E;">${props.neededPercent} %</strong> z celkové výzvy pro odemčení tohoto území a jeho statistik.
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
          fillOpacity: isShow ? 0.6 : 0.25,
          weight: 3,
        });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: isShow ? 0.35 : 0.1,
          weight: 2,
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
