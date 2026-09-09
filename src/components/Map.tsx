
import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

interface PropertyRecord {
  id: number;
  latitude: number;
  longitude: number;
  owner_name: string;
  address: string;
  amount: number;
}

interface HeatmapCluster {
  latitude: number;
  longitude: number;
  count: number;
  total_amount: number;
}

export default function Map() {
  const [data, setData] = useState<PropertyRecord[]>([]);
  const [clusters, setClusters] = useState<HeatmapCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPropertyData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      generateClusters();
    }
  }, [data]);

  useEffect(() => {
    if (clusters.length > 0) {
      renderClustersOnMap();
    }
  }, [clusters]);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch records within Alameda County bounds (limited to 1000 for performance)
      // Alameda coordinates: roughly 37.3-37.9 N, 121.9-122.4 W
      const { data: records, error: fetchError } = await supabase
        .from('ca_unclaimed_property')
        .select('id, latitude, longitude, owner_name, address, amount')
        .gte('latitude', 37.3)
        .lte('latitude', 37.9)
        .gte('longitude', -122.4)
        .lte('longitude', -121.9)
        .limit(1000);

      if (fetchError) {
        throw fetchError;
      }

      if (records) {
        setData(records as PropertyRecord[]);
        console.log(`Loaded ${records.length} property records`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      console.error('Error fetching property data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateClusters = () => {
    // Group records into clusters using a simple grid (0.01 degree cells ≈ 1km)
    const clusterMap = new Map<string, HeatmapCluster>();
    const cellSize = 0.01;

    data.forEach((record) => {
      const latCell = Math.floor(record.latitude / cellSize);
      const lngCell = Math.floor(record.longitude / cellSize);
      const key = `${latCell},${lngCell}`;

      if (clusterMap.has(key)) {
        const cluster = clusterMap.get(key)!;
        cluster.count += 1;
        cluster.total_amount += record.amount || 0;
      } else {
        clusterMap.set(key, {
          latitude: (latCell + 0.5) * cellSize,
          longitude: (lngCell + 0.5) * cellSize,
          count: 1,
          total_amount: record.amount || 0,
        });
      }
    });

    setClusters(Array.from(clusterMap.values()));
    console.log(`Generated ${clusterMap.size} clusters`);
  };

  const renderClustersOnMap = () => {
    // Access the Leaflet map instance
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.warn('Map element not found');
      return;
    }

    // If using Leaflet, the map is stored on the element
    const map = (mapElement as any).leafletMap;
    if (!map) {
      console.warn('Leaflet map not initialized');
      return;
    }

    // Find max count for normalization (color intensity)
    const maxCount = Math.max(...clusters.map((c) => c.count));

    // Add circles for each cluster
    clusters.forEach((cluster) => {
      const intensity = cluster.count / maxCount; // 0-1
      const radius = Math.sqrt(cluster.count) * 500; // Radius in meters based on count
      const fillColor = intensity > 0.7 ? '#ff4444' : intensity > 0.4 ? '#ffaa44' : '#44aa44'; // Red > Orange > Green

      // Using Leaflet.circle
      (window as any).L.circle([cluster.latitude, cluster.longitude], {
        radius: radius,
        color: fillColor,
        fillColor: fillColor,
        fillOpacity: 0.3 + intensity * 0.4, // 0.3-0.7 opacity
        weight: 2,
      })
        .bindPopup(
          `<strong>${cluster.count} properties</strong><br>$${(cluster.total_amount / 1000).toFixed(0)}k total`
        )
        .addTo(map);
    });

    console.log(`Rendered ${clusters.length} clusters on map`);
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10,
            background: 'rgba(0,0,0,0.7)',
            padding: '12px 16px',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '14px',
          }}
        >
          Loading property data...
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10,
            background: 'rgba(255,0,0,0.9)',
            padding: '12px 16px',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '14px',
          }}
        >
          Error: {error}
        </div>
      )}

      {clusters.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 10,
            background: 'rgba(0,0,0,0.8)',
            padding: '12px 16px',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
          }}
        >
          <div style={{ color: '#f0a700', fontWeight: 'bold', marginBottom: '4px' }}>
            {clusters.reduce((sum, c) => sum + c.count, 0)} properties found
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
            ${(clusters.reduce((sum, c) => sum + c.total_amount, 0) / 1000000).toFixed(1)}M total
          </div>
        </div>
      )}

      <div id="map" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
