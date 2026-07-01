'use client';

import { OrbitControls, PerspectiveCamera, Grid, Environment } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import * as THREE from 'three';

type CabinetProps = {
  width: number;
  height: number;
  depth: number;
  color: string;
  shelves: number;
};

function Panel({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
    </mesh>
  );
}

function Cabinet({ width, height, depth, color, shelves }: CabinetProps) {
  const t = 0.018; // 18mm panel thickness in meters
  const w = width / 1000;
  const h = height / 1000;
  const d = depth / 1000;
  const innerH = h - t * 2;
  const innerW = w - t * 2;
  const shelfSpacing = innerH / (shelves + 1);

  const shelfItems = Array.from({ length: shelves }, (_, i) => i);

  return (
    <group>
      {/* Left side */}
      <Panel position={[-(innerW / 2 + t / 2), 0, 0]} size={[t, h, d]} color={color} />
      {/* Right side */}
      <Panel position={[innerW / 2 + t / 2, 0, 0]} size={[t, h, d]} color={color} />
      {/* Top */}
      <Panel position={[0, h / 2 - t / 2, 0]} size={[innerW, t, d]} color={color} />
      {/* Bottom */}
      <Panel position={[0, -h / 2 + t / 2, 0]} size={[innerW, t, d]} color={color} />
      {/* Back */}
      <Panel position={[0, 0, -(d / 2 - 0.003)]} size={[innerW, innerH, 0.006]} color="#333333" />
      {/* Shelves */}
      {shelfItems.map((i) => (
        <Panel
          key={i}
          position={[0, -innerH / 2 + shelfSpacing * (i + 1), 0]}
          size={[innerW - 0.004, t, d - 0.02]}
          color={color}
        />
      ))}
      {/* Door (left) */}
      <mesh
        position={[-(innerW / 4), 0, d / 2 + t / 2 + 0.001]}
        castShadow
      >
        <boxGeometry args={[innerW / 2 - 0.002, innerH - 0.002, t]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
      </mesh>
      {/* Door (right) */}
      <mesh
        position={[innerW / 4, 0, d / 2 + t / 2 + 0.001]}
        castShadow
      >
        <boxGeometry args={[innerW / 2 - 0.002, innerH - 0.002, t]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
      </mesh>
      {/* Handles */}
      <mesh position={[-(innerW / 4 - 0.06), 0, d / 2 + t + 0.008]}>
        <cylinderGeometry args={[0.006, 0.006, 0.1, 8]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[innerW / 4 + 0.06, 0, d / 2 + t + 0.008]}>
        <cylinderGeometry args={[0.006, 0.006, 0.1, 8]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

export function ThreeWorkspace() {
  const [width, setWidth] = useState(900);
  const [height, setHeight] = useState(2100);
  const [depth, setDepth] = useState(600);
  const [shelves, setShelves] = useState(3);
  const [color, setColor] = useState('#f0ede8');

  const cameraY = (height / 1000) / 2;
  const cameraZ = Math.max((height / 1000) * 1.2, (width / 1000) * 2);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:grid-cols-5">
        {[
          { label: 'Largura (mm)', value: width, set: setWidth, min: 300, max: 3000 },
          { label: 'Altura (mm)', value: height, set: setHeight, min: 500, max: 3000 },
          { label: 'Profundidade (mm)', value: depth, set: setDepth, min: 200, max: 700 },
          { label: 'Prateleiras', value: shelves, set: setShelves, min: 0, max: 8 },
        ].map(({ label, value, set, min, max }) => (
          <div key={label}>
            <label className="mb-1 block text-xs text-zinc-400">{label}</label>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-sm"
              type="number"
              min={min}
              max={max}
              value={value}
              onChange={(e) => set(Number(e.target.value))}
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Cor do MDF</label>
          <input
            className="h-10 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
      </div>

      <div className="h-[500px] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <Canvas shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
          <color attach="background" args={['#0a0a0a']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-4, 4, -4]} intensity={0.4} />
          <PerspectiveCamera makeDefault position={[0, cameraY, cameraZ]} fov={45} />
          <Cabinet width={width} height={height} depth={depth} color={color} shelves={shelves} />
          <Grid
            position={[0, -(height / 1000) / 2, 0]}
            args={[10, 10]}
            cellSize={0.1}
            cellThickness={0.5}
            cellColor="#3f3f3f"
            sectionSize={0.5}
            sectionThickness={1}
            sectionColor="#555555"
            fadeDistance={8}
            fadeStrength={1}
            infiniteGrid
          />
          <OrbitControls enablePan enableRotate enableZoom target={[0, 0, 0]} />
          <Environment preset="studio" />
        </Canvas>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-2 text-sm font-medium">Dimensões do armário</h2>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-300">
          <span>Largura: <strong>{width} mm</strong></span>
          <span>Altura: <strong>{height} mm</strong></span>
          <span>Profundidade: <strong>{depth} mm</strong></span>
          <span>Prateleiras internas: <strong>{shelves}</strong></span>
          <span>Volume: <strong>{((width * height * depth) / 1e9).toFixed(3)} m³</strong></span>
        </div>
      </div>
    </div>
  );
}
