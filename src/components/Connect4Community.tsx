
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

export default function Connect4Community() {
  const [data, setData] = useState<PropertyRecord[]>([]);
  const [clusters, setClusters] = useState<HeatmapCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalStats, setTotalStats] = useState({ count: 0, amount: 0 });

  useEffect(() => {
    fetchPropertyData();
  }, []);

  useEffect(() => {
    if (data.length > 0) generateClusters();
  }, [data]);

  useEffect(() => {
    if (clusters.length > 0) {
      renderClustersOnMap();
      const count = clusters.reduce((sum, c) => sum + c.count, 0);
      const amount = clusters.reduce((sum, c) => sum + c.total_amount, 0);
      setTotalStats({ count, amount });
    }
  }, [clusters]);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      const { data: records, error: fetchError } = await supabase
        .from('ca_unclaimed_property')
        .select('id, latitude, longitude, owner_name, address, amount')
        .gte('latitude', 37.3)
        .lte('latitude', 37.9)
        .gte('longitude', -122.4)
        .lte('longitude', -121.9)
        .limit(5000);

      if (fetchError) throw fetchError;
      if (records) {
        setData(records as PropertyRecord[]);
        console.log(`Connect4Community: Loaded ${records.length} records`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load';
      setError(msg);
      console.error('Connect4Community error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateClusters = () => {
    const clusterMap = new Map<string, HeatmapCluster>();
    const cellSize = 0.0018;

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
  };

  const renderClustersOnMap = () => {
    const mapElement = document.getElementById('c4c-map');
    if (!mapElement) return;

    const map = (mapElement as any).leafletMap;
    if (!map) return;

    map.eachLayer((layer: any) => {
      if (layer.setRadius) map.removeLayer(layer);
    });

    const maxAmount = Math.max(...clusters.map((c) => c.total_amount));

    clusters.forEach((cluster) => {
      const intensity = cluster.total_amount / maxAmount;
      const radius = Math.sqrt(cluster.total_amount / 10000) * 300;

      let color: string;
      if (intensity > 0.8) color = '#ff2c2c';
      else if (intensity > 0.6) color = '#ff7c2c';
      else if (intensity > 0.4) color = '#ffcc2c';
      else color = '#2cff7c';

      (window as any).L.circle([cluster.latitude, cluster.longitude], {
        radius: Math.max(radius, 150),
        color: color,
        fillColor: color,
        fillOpacity: 0.4 + intensity * 0.5,
        weight: 2,
      })
        .bindPopup(`<strong>${cluster.count} properties</strong><br/>$${(cluster.total_amount / 1000).toFixed(0)}k`)
        .addTo(map);
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1a1a1a', padding: '16px 20px', borderBottom: '1px solid rgba(240,167,0,0.2)', color: '#f0a700' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Connect4Community</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          {loading ? 'Loading...' : `${totalStats.count} properties | $${(totalStats.amount / 1000000).toFixed(1)}M unclaimed`}
        </div>
      </div>

      <div id="c4c-map" style={{ flex: 1, width: '100%' }} />

      {loading && <div style={{ position: 'absolute', top: '80px', left: '20px', zIndex: 10, background: 'rgba(0,0,0,0.8)', padding: '12px', borderRadius: '4px', color: '#f0a700' }}>🔥 Mapping...</div>}
      {error && <div style={{ position: 'absolute', top: '80px', left: '20px', zIndex: 10, background: 'rgba(255,0,0,0.9)', padding: '12px', borderRadius: '4px', color: '#fff' }}>Error: {error}</div>}
    </div>
  );
}
