import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { feature } from 'topojson-client';

type GlobeMode = 'conflicts' | 'cyber' | 'flights';

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const UCDP_API_URL = 'https://ucdpapi.pcr.uu.se/api/gedevents/24.1?pagesize=500&page=0';

interface ConflictEvent {
  latitude: number;
  longitude: number;
  country: string;
  type_of_violence: number;
  best: number;
}

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
      groupRef.current.rotation.y += delta * 0.025;
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
        <OccludedLine key={`grid-${i}`} points={points} color="#00ff41" opacity={0.08} />
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
  const [conflictStats, setConflictStats] = useState<{ total: number; countries: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch(WORLD_TOPO_URL)
      .then(res => res.json())
      .then(topo => {
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
      })
      .catch((e) => { setLoadError('Map data unavailable'); console.error(e); });
  }, []);

  useEffect(() => {
    fetch(UCDP_API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.Result) {
          const events: ConflictEvent[] = data.Result.map((e: any) => ({
            latitude: parseFloat(e.latitude),
            longitude: parseFloat(e.longitude),
            country: e.country,
            type_of_violence: e.type_of_violence,
            best: parseInt(e.best) || 1,
          }));

          const grouped: Map<string, ConflictArea> = new Map();
          for (const evt of events) {
            const key = `${Math.round(evt.latitude)},${Math.round(evt.longitude)}`;
            const existing = grouped.get(key);
            if (existing) {
              existing.count += evt.best;
            } else {
              grouped.set(key, { lat: evt.latitude, lng: evt.longitude, count: evt.best, country: evt.country });
            }
          }

          const areas = Array.from(grouped.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 40);

          setConflicts(areas);

          const countries = new Set(events.map(e => e.country));
          setConflictStats({ total: events.length, countries: countries.size });
        }
      })
      .catch((e) => { console.error('UCDP fetch failed:', e); });
  }, []);

  const modeLabels: Record<GlobeMode, string> = {
    conflicts: 'CONFLICTS',
    cyber: 'CYBER',
    flights: 'FLIGHTS',
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <Canvas
          camera={{ position: [0, 0.5, 5.5], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent' }}
        >
          <RotatingGlobe mode={mode} worldLines={worldLines} conflicts={conflicts} />
        </Canvas>
      </div>

      {/* Info overlay */}
      {mode === 'conflicts' && conflictStats && (
        <div className="px-2 py-1 text-[10px] text-muthur-border font-mono">
          {conflictStats.total} events / {conflictStats.countries} countries / {conflicts.length} zones
        </div>
      )}

      {loadError && (
        <div className="px-2 text-[10px] text-red-500">{loadError}</div>
      )}

      <div className="flex gap-1 px-2 pb-1 justify-center shrink-0">
        {(Object.keys(modeLabels) as GlobeMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${
              mode === m
                ? 'text-red-500 border-current bg-red-500/10'
                : 'text-muthur-border border-muthur-border hover:text-muthur-secondary'
            }`}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>
    </div>
  );
}
