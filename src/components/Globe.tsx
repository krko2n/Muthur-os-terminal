import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

function RotatingGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const linesRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
    if (linesRef.current) {
      linesRef.current.rotation.y += delta * 0.15;
    }
  });

  // Generate latitude/longitude lines
  const generateLines = () => {
    const lines = [];
    const segments = 32;

    // Latitude lines
    for (let i = 0; i <= 8; i++) {
      const lat = (i / 8 - 0.5) * Math.PI;
      const points = [];
      const radius = Math.cos(lat) * 2;
      const y = Math.sin(lat) * 2;

      for (let j = 0; j <= segments; j++) {
        const lng = (j / segments) * Math.PI * 2;
        points.push(
          new THREE.Vector3(
            Math.cos(lng) * radius,
            y,
            Math.sin(lng) * radius
          )
        );
      }
      lines.push(points);
    }

    // Longitude lines
    for (let i = 0; i < 16; i++) {
      const lng = (i / 16) * Math.PI * 2;
      const points = [];

      for (let j = 0; j <= segments; j++) {
        const lat = (j / segments - 0.5) * Math.PI;
        const radius = Math.cos(lat) * 2;
        const y = Math.sin(lat) * 2;

        points.push(
          new THREE.Vector3(
            Math.cos(lng) * radius,
            y,
            Math.sin(lng) * radius
          )
        );
      }
      lines.push(points);
    }

    return lines;
  };

  const lines = generateLines();

  return (
    <>
      {/* Base sphere */}
      <Sphere ref={meshRef} args={[2, 32, 32]}>
        <meshBasicMaterial
          color="#001a0d"
          wireframe={false}
          transparent
          opacity={0.3}
        />
      </Sphere>

      {/* Grid lines */}
      <group ref={linesRef}>
        {lines.map((points, i) => (
          <Line
            key={i}
            points={points}
            color="#00ff41"
            lineWidth={1}
            transparent
            opacity={0.6}
          />
        ))}
      </group>

      {/* Ambient light */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00ff41" />
    </>
  );
}

export default function Globe() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <color attach="background" args={['transparent']} />
        <RotatingGlobe />
      </Canvas>
    </div>
  );
}
