import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

type GlobeMode = 'conflicts' | 'cyber' | 'flights';

const CONFLICT_ZONES: [number, number, string][] = [
  [50.3, 30.5, 'Ukraine-Russia'],
  [31.9, 35.2, 'Gaza-Israel'],
  [16.9, 96.2, 'Myanmar Civil War'],
  [15.6, 30.8, 'Sudan Civil War'],
  [-2.3, 23.7, 'DR Congo'],
  [5.1, 46.2, 'Somalia'],
  [12.5, 8.2, 'Sahel Insurgency'],
  [9.1, 8.7, 'Nigeria'],
  [34.7, 36.7, 'Syria'],
  [34.8, 69.2, 'Afghanistan-Pakistan'],
  [33.3, 73.2, 'Kashmir'],
  [9.0, 38.7, 'Ethiopia'],
  [12.9, 28.3, 'Yemen'],
  [4.2, -71.9, 'Colombia'],
  [-0.6, -78.5, 'Ecuador'],
  [18.9, -72.3, 'Haiti'],
  [-6.3, 29.9, 'Central Africa'],
  [33.5, 36.3, 'Lebanon-Israel'],
  [15.9, 99.9, 'Thailand South'],
  [6.9, 79.9, 'Sri Lanka'],
];

const CYBER_HOTSPOTS: [number, number, string][] = [
  [39.9, 116.4, 'Beijing'],
  [55.7, 37.6, 'Moscow'],
  [37.5, -122.4, 'San Francisco'],
  [51.5, -0.1, 'London'],
  [35.6, 139.7, 'Tokyo'],
  [37.5, 127.0, 'Seoul'],
  [1.3, 103.8, 'Singapore'],
  [19.4, -99.1, 'Mexico City'],
  [28.6, 77.2, 'New Delhi'],
  [-23.5, -46.6, 'Sao Paulo'],
];

const FLIGHT_HUBS: [number, number, string][] = [
  [40.6, -73.8, 'JFK'],
  [51.5, -0.5, 'LHR'],
  [25.3, 55.4, 'DXB'],
  [1.4, 104.0, 'SIN'],
  [35.5, 139.8, 'HND'],
  [33.9, -118.4, 'LAX'],
  [50.0, 8.6, 'FRA'],
  [13.7, 100.7, 'BKK'],
  [22.3, 113.9, 'HKG'],
  [-33.9, 151.2, 'SYD'],
  [41.9, -87.9, 'ORD'],
  [49.0, 2.5, 'CDG'],
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function generateContinentOutlines(radius: number): THREE.Vector3[][] {
  const outlines: THREE.Vector3[][] = [];

  const continents: [number, number][][] = [
    // North America (simplified)
    [[60,-140],[65,-168],[72,-157],[71,-135],[60,-120],[50,-127],[48,-124],[37,-122],[32,-117],[25,-110],[20,-105],[15,-92],[18,-88],[21,-87],[25,-80],[30,-81],[33,-78],[37,-76],[40,-74],[42,-70],[45,-66],[47,-60],[50,-55],[52,-56],[55,-60],[58,-64],[60,-65],[63,-75],[65,-85],[68,-100],[70,-120],[68,-140],[60,-140]],
    // South America
    [[12,-72],[10,-75],[8,-77],[5,-77],[2,-80],[-1,-80],[-5,-81],[-6,-77],[-4,-70],[-3,-60],[0,-50],[2,-50],[5,-53],[7,-60],[10,-68],[12,-72]],
    [[-5,-81],[-10,-78],[-15,-75],[-18,-70],[-22,-65],[-25,-58],[-28,-52],[-30,-50],[-33,-52],[-35,-57],[-40,-62],[-43,-65],[-46,-67],[-50,-70],[-53,-70],[-55,-67],[-52,-60],[-48,-55],[-42,-50],[-38,-48],[-35,-43],[-30,-40],[-25,-35],[-20,-35],[-15,-39],[-10,-37],[-5,-35],[-2,-44],[-1,-50],[-3,-55],[-5,-60],[-4,-70],[-5,-81]],
    // Europe
    [[36,-6],[37,-2],[38,0],[40,1],[43,3],[44,8],[44,12],[41,14],[38,15],[36,12],[35,25],[37,27],[39,26],[41,29],[42,32],[43,28],[44,34],[46,30],[46,15],[48,17],[50,14],[52,14],[54,10],[55,8],[57,10],[58,12],[60,18],[62,20],[65,25],[68,28],[70,27],[71,25],[70,20],[67,15],[63,10],[60,5],[58,5],[56,8],[55,7],[53,5],[52,4],[51,2],[50,-5],[48,-5],[47,-2],[44,-1],[43,-8],[37,-8],[36,-6]],
    // Africa
    [[35,-6],[37,10],[36,12],[33,12],[31,32],[27,34],[22,37],[15,42],[12,44],[11,50],[2,45],[-2,41],[-10,40],[-15,41],[-25,35],[-30,31],[-34,26],[-34,18],[-30,16],[-20,12],[-15,12],[-10,14],[-5,12],[0,10],[5,1],[5,-5],[0,-2],[-5,8],[-5,12],[-10,14],[-15,12],[-12,14],[-15,17],[-17,16],[-17,12],[-8,5],[5,0],[10,-15],[15,-17],[20,-17],[25,-15],[30,-10],[35,-6]],
    // Asia (simplified)
    [[42,32],[45,40],[42,52],[38,57],[35,60],[25,60],[25,66],[28,68],[30,75],[28,80],[22,80],[20,88],[22,97],[18,100],[10,105],[5,105],[1,104],[-5,106],[-8,115],[-8,120],[-5,120],[0,110],[5,118],[10,120],[15,120],[20,110],[22,108],[25,105],[30,105],[35,110],[38,117],[40,120],[42,130],[45,135],[50,140],[53,142],[55,137],[60,140],[63,135],[65,130],[68,140],[70,150],[72,140],[73,130],[70,100],[68,80],[65,70],[60,60],[55,55],[50,40],[47,37],[44,35],[42,32]],
    // Australia
    [[-12,130],[-15,129],[-17,123],[-20,119],[-22,114],[-25,113],[-28,114],[-30,115],[-33,116],[-35,117],[-35,138],[-37,140],[-38,145],[-38,148],[-35,150],[-33,152],[-28,153],[-24,152],[-20,149],[-18,146],[-16,145],[-14,142],[-12,137],[-12,130]],
  ];

  for (const continent of continents) {
    const points = continent.map(([lat, lng]) => latLngToVector3(lat, lng, radius));
    outlines.push(points);
  }

  return outlines;
}

function HotspotDot({ position, color, pulse, groupRef }: { position: THREE.Vector3; color: string; pulse: boolean; groupRef: React.RefObject<THREE.Group> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (pulse) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.4;
      meshRef.current.scale.setScalar(scale);
    }
    const worldPos = new THREE.Vector3();
    meshRef.current.getWorldPosition(worldPos);
    const dirToCamera = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();
    const dotNormal = worldPos.clone().normalize();
    const dot = dotNormal.dot(dirToCamera);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = dot > 0.05 ? 0.9 : 0;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

function ArcLine({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) {
  const points = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(2.4);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(20);
  }, [start, end]);

  return <Line points={points} color={color} lineWidth={1} transparent opacity={0.4} />;
}

const backFaceVertexShader = `
  varying float vVisibility;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize(worldPos.xyz);
    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
    vVisibility = dot(worldNormal, viewDir);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const backFaceFragmentShader = `
  uniform vec3 uColor;
  uniform float uBaseOpacity;
  varying float vVisibility;
  void main() {
    if (vVisibility < 0.0) discard;
    float alpha = smoothstep(0.0, 0.2, vVisibility) * uBaseOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function OccludedLine({ points, color, opacity = 0.7, lineWidth = 1.5 }: { points: THREE.Vector3[]; color: string; opacity?: number; lineWidth?: number }) {
  const ref = useRef<THREE.Line>(null);
  const material = useMemo(() => {
    const col = new THREE.Color(color);
    return new THREE.ShaderMaterial({
      vertexShader: backFaceVertexShader,
      fragmentShader: backFaceFragmentShader,
      uniforms: {
        uColor: { value: col },
        uBaseOpacity: { value: opacity },
      },
      transparent: true,
      depthWrite: false,
    });
  }, [color, opacity]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return <primitive object={new THREE.Line(geometry, material)} ref={ref} />;
}

function RotatingGlobe({ mode }: { mode: GlobeMode }) {
  const groupRef = useRef<THREE.Group>(null!) as React.RefObject<THREE.Group>;

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  const radius = 2;
  const continentOutlines = useMemo(() => generateContinentOutlines(radius), []);

  const gridLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const segments = 64;

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

    for (let i = 0; i < 18; i++) {
      const lng = (i / 18) * Math.PI * 2;
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

  const hotspots = useMemo(() => {
    if (mode === 'conflicts') {
      return CONFLICT_ZONES.map(([lat, lng]) => ({
        pos: latLngToVector3(lat, lng, radius * 1.01),
        color: '#ff2020',
      }));
    } else if (mode === 'cyber') {
      return CYBER_HOTSPOTS.map(([lat, lng]) => ({
        pos: latLngToVector3(lat, lng, radius * 1.01),
        color: '#ff00ff',
      }));
    } else {
      return FLIGHT_HUBS.map(([lat, lng]) => ({
        pos: latLngToVector3(lat, lng, radius * 1.01),
        color: '#00d4ff',
      }));
    }
  }, [mode]);

  const arcs = useMemo(() => {
    if (mode === 'flights') {
      const lines: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
      for (let i = 0; i < FLIGHT_HUBS.length - 1; i += 2) {
        const s = latLngToVector3(FLIGHT_HUBS[i][0], FLIGHT_HUBS[i][1], radius * 1.01);
        const e = latLngToVector3(FLIGHT_HUBS[i + 1][0], FLIGHT_HUBS[i + 1][1], radius * 1.01);
        lines.push({ start: s, end: e });
      }
      return lines;
    }
    if (mode === 'cyber') {
      const lines: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
      for (let i = 0; i < CYBER_HOTSPOTS.length - 1; i++) {
        const s = latLngToVector3(CYBER_HOTSPOTS[i][0], CYBER_HOTSPOTS[i][1], radius * 1.01);
        const e = latLngToVector3(CYBER_HOTSPOTS[i + 1][0], CYBER_HOTSPOTS[i + 1][1], radius * 1.01);
        lines.push({ start: s, end: e });
      }
      return lines;
    }
    return [];
  }, [mode]);

  const dotColor = mode === 'conflicts' ? '#ff2020' : mode === 'cyber' ? '#ff00ff' : '#00d4ff';
  const arcColor = mode === 'cyber' ? '#ff00ff' : '#00d4ff';

  return (
    <group ref={groupRef}>
      {/* Grid lines (hidden on back side) */}
      {gridLines.map((points, i) => (
        <OccludedLine key={`grid-${i}`} points={points} color="#00ff41" opacity={0.12} lineWidth={0.5} />
      ))}

      {/* Continent outlines (hidden on back side) */}
      {continentOutlines.map((points, i) => (
        <OccludedLine key={`cont-${i}`} points={points} color="#00ff41" opacity={0.8} lineWidth={1.5} />
      ))}

      {/* Hotspot dots */}
      {hotspots.map((h, i) => (
        <HotspotDot key={`dot-${i}`} position={h.pos} color={h.color} pulse={mode === 'conflicts'} groupRef={groupRef} />
      ))}

      {/* Arc connections */}
      {arcs.map((a, i) => (
        <ArcLine key={`arc-${i}`} start={a.start} end={a.end} color={arcColor} />
      ))}

      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ff41" />
    </group>
  );
}

export default function Globe() {
  const [mode, setMode] = useState<GlobeMode>('conflicts');

  const modeLabels: Record<GlobeMode, string> = {
    conflicts: 'CONFLICTS',
    cyber: 'CYBER',
    flights: 'FLIGHTS',
  };

  const modeColors: Record<GlobeMode, string> = {
    conflicts: 'text-red-500',
    cyber: 'text-fuchsia-400',
    flights: 'text-cyan-400',
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <Canvas
          camera={{ position: [0, 0.5, 5.5], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent' }}
        >
          <RotatingGlobe mode={mode} />
        </Canvas>
      </div>

      <div className="flex gap-1 px-2 pb-1 justify-center shrink-0">
        {(Object.keys(modeLabels) as GlobeMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${
              mode === m
                ? `${modeColors[m]} border-current bg-current/10`
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
