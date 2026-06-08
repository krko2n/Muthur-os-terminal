import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { feature } from 'topojson-client';

type GlobeMode = 'conflicts' | 'cyber' | 'flights';

interface ConflictArea {
  lat: number;
  lng: number;
  count: number;
  country: string;
}

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

const occludedVertexShader = `
  varying float vVisibility;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize(worldPos.xyz);
    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
    vVisibility = dot(worldNormal, viewDir);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const occludedFragmentShader = `
  uniform vec3 uColor;
  uniform float uBaseOpacity;
  varying float vVisibility;
  void main() {
    if (vVisibility < 0.0) discard;
    float alpha = smoothstep(0.0, 0.15, vVisibility) * uBaseOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function OccludedLine({ points, color, opacity = 0.7 }: { points: THREE.Vector3[]; color: string; opacity?: number }) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: occludedVertexShader,
      fragmentShader: occludedFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uBaseOpacity: { value: opacity },
      },
      transparent: true,
      depthWrite: false,
    });
  }, [color, opacity]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return <primitive object={new THREE.Line(geometry, material)} />;
}

function OccludedDot({ position, color, size = 0.03 }: { position: THREE.Vector3; color: string; size?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!meshRef.current) return;
    const worldPos = new THREE.Vector3();
    meshRef.current.getWorldPosition(worldPos);
    const dirToCamera = camera.position.clone().normalize();
    const dotNormal = worldPos.clone().normalize();
    const d = dotNormal.dot(dirToCamera);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = d > 0.05 ? 0.9 : 0;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

function ConflictCircle({ center, radius: areaRadius, color, globeRadius }: { center: [number, number]; radius: number; color: string; globeRadius: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const lat = center[0] + Math.cos(angle) * areaRadius;
      const lng = center[1] + Math.sin(angle) * areaRadius / Math.cos(center[0] * Math.PI / 180);
      pts.push(latLngToVector3(lat, lng, globeRadius * 1.005));
    }
    return pts;
  }, [center, areaRadius, globeRadius]);

  return <OccludedLine points={points} color={color} opacity={0.6} />;
}

function RotatingGlobe({ mode, worldLines, conflicts }: { mode: GlobeMode; worldLines: THREE.Vector3[][]; conflicts: ConflictArea[] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  const radius = 2;

  const gridLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const segments = 72;

    for (let i = 1; i < 12; i++) {
      const lat = (i / 12 - 0.5) * Math.PI;
      const points = [];
      const r = Math.cos(lat) * radius;
      const y = Math.sin(lat) * radius;
      for (let j = 0; j <= segments; j++) {
        const lng = (j / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(lng) * r, y, Math.sin(lng) * r));
      }
      lines.push(points);
    }

    for (let i = 0; i < 24; i++) {
      const lng = (i / 24) * Math.PI * 2;
      const points = [];
      for (let j = 0; j <= segments; j++) {
        const lat = (j / segments - 0.5) * Math.PI;
        const r = Math.cos(lat) * radius;
        const y = Math.sin(lat) * radius;
        points.push(new THREE.Vector3(Math.cos(lng) * r, y, Math.sin(lng) * r));
      }
      lines.push(points);
    }

    return lines;
  }, []);

  return (
    <group ref={groupRef}>
      {gridLines.map((points, i) => (
        <OccludedLine key={`grid-${i}`} points={points} color="#00ff41" opacity={0.06} />
      ))}

      {worldLines.map((points, i) => (
        <OccludedLine key={`world-${i}`} points={points} color="#00ff41" opacity={0.7} />
      ))}

      {mode === 'conflicts' && conflicts.map((area, i) => (
        <ConflictCircle
          key={`conflict-${i}`}
          center={[area.lat, area.lng]}
          radius={Math.min(3, 0.8 + Math.log(area.count + 1) * 0.4)}
          color="#ff2020"
          globeRadius={radius}
        />
      ))}

      {mode === 'conflicts' && conflicts.map((area, i) => (
        <OccludedDot
          key={`cdot-${i}`}
          position={latLngToVector3(area.lat, area.lng, radius * 1.01)}
          color="#ff4444"
          size={0.03 + Math.min(0.04, area.count / 500)}
        />
      ))}

      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ff41" />
    </group>
  );
}

export default function Globe() {
  const [mode, setMode] = useState<GlobeMode>('conflicts');
  const [worldLines, setWorldLines] = useState<THREE.Vector3[][]>([]);
  const [conflicts, setConflicts] = useState<ConflictArea[]>([]);
  const [status, setStatus] = useState('LOADING...');

  useEffect(() => {
    loadGlobeData();
  }, []);

  const fetchData = async (url: string): Promise<any> => {
    // Try frontend fetch first (CSP disabled)
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    // Fallback to backend proxy
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const text = await invoke('fetch_json', { url }) as string;
      return JSON.parse(text);
    } catch {}
    return null;
  };

  const loadGlobeData = async () => {
    setStatus('FETCHING MAP...');
    const topo = await fetchData('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');

    if (!topo) {
      setStatus('MAP UNAVAILABLE');
      return;
    }

    const geo = feature(topo, topo.objects.countries) as any;
    const lines: THREE.Vector3[][] = [];
    const radius = 2;

    for (const f of geo.features) {
      const coords = f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;

      for (const polygon of coords) {
        for (const ring of polygon) {
          if (ring.length < 3) continue;
          const points = ring.map(([lng, lat]: [number, number]) =>
            latLngToVector3(lat, lng, radius)
          );
          lines.push(points);
        }
      }
    }
    setWorldLines(lines);
    setStatus('MAP LOADED');

    // Load conflicts
    setStatus('LOADING EVENTS...');
    const data = await fetchData('https://ucdpapi.pcr.uu.se/api/gedevents/24.1?pagesize=500&page=0');

    if (data?.Result) {
      const grouped: Map<string, ConflictArea> = new Map();
      for (const e of data.Result) {
        const lat = parseFloat(e.latitude);
        const lng = parseFloat(e.longitude);
        const key = `${Math.round(lat)},${Math.round(lng)}`;
        const existing = grouped.get(key);
        if (existing) {
          existing.count += parseInt(e.best) || 1;
        } else {
          grouped.set(key, { lat, lng, count: parseInt(e.best) || 1, country: e.country });
        }
      }
      const areas = Array.from(grouped.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 40);
      setConflicts(areas);
      setStatus(`${data.Result.length} EVENTS`);
    } else {
      setStatus('MAP ONLY');
    }
  };

  const modeLabels: Record<GlobeMode, string> = {
    conflicts: 'CONFLICTS',
    cyber: 'CYBER',
    flights: 'FLIGHTS',
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        {worldLines.length > 0 ? (
          <Canvas
            camera={{ position: [0, 0.5, 5.5], fov: 45 }}
            gl={{ alpha: true, antialias: true }}
            style={{ background: 'transparent' }}
          >
            <RotatingGlobe mode={mode} worldLines={worldLines} conflicts={conflicts} />
          </Canvas>
        ) : (
          <div className="flex items-center justify-center h-full text-[1.1vh] opacity-30">
            {status}
          </div>
        )}
      </div>

      <div className="flex gap-[0.5vh] justify-center shrink-0 py-[0.3vh]">
        {(Object.keys(modeLabels) as GlobeMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-[0.8vh] py-[0.2vh] text-[0.9vh] font-mono border transition-colors ${
              mode === m
                ? 'text-[#ff4444] border-[#ff4444] bg-[rgba(255,68,68,0.1)]'
                : 'border-[rgba(0,255,65,0.2)] text-muthur-primary opacity-40 hover:opacity-70'
            }`}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>
    </div>
  );
}
