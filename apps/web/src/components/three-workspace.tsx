'use client';

import { ContactShadows, Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import * as THREE from 'three';

type CabinetProps = {
  width: number;
  height: number;
  depth: number;
  color: string;
  shelves: number;
};

function createWoodTexture(baseColor: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  context.fillStyle = baseColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < 48; index += 1) {
    context.strokeStyle = `rgba(90, 62, 32, ${0.06 + (index % 5) * 0.02})`;
    context.lineWidth = 1 + (index % 3);
    context.beginPath();
    const y = (index / 48) * canvas.height;
    context.moveTo(0, y);
    context.bezierCurveTo(64, y - 6, 160, y + 8, 256, y - 4);
    context.stroke();
  }

  for (let index = 0; index < 220; index += 1) {
    const alpha = 0.03 + (index % 4) * 0.01;
    context.fillStyle = `rgba(255,255,255,${alpha})`;
    context.fillRect(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      1 + Math.random() * 2,
      1 + Math.random() * 2,
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 8;
  return texture;
}

function Panel({
  position,
  size,
  texture,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  texture: THREE.CanvasTexture | null;
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} map={texture} roughness={0.62} metalness={0.04} />
    </mesh>
  );
}

function Handle({ position, rotation = [0, 0, Math.PI / 2] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.12, 16]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.95} roughness={0.16} />
      </mesh>
      <mesh position={[-0.035, 0, 0]} castShadow>
        <cylinderGeometry args={[0.0025, 0.0025, 0.022, 12]} />
        <meshStandardMaterial color="#f4f4f5" metalness={0.95} roughness={0.12} />
      </mesh>
      <mesh position={[0.035, 0, 0]} castShadow>
        <cylinderGeometry args={[0.0025, 0.0025, 0.022, 12]} />
        <meshStandardMaterial color="#f4f4f5" metalness={0.95} roughness={0.12} />
      </mesh>
    </group>
  );
}

function Hinge({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.016, 0.032, 0.004]} />
        <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0, 0.004]} castShadow>
        <cylinderGeometry args={[0.003, 0.003, 0.018, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.18} />
      </mesh>
    </group>
  );
}

function Cabinet({ width, height, depth, color, shelves }: CabinetProps) {
  const texture = useMemo(() => createWoodTexture(color), [color]);
  const panelThickness = 0.018;
  const gap = 0.003;
  const w = width / 1000;
  const h = height / 1000;
  const d = depth / 1000;
  const innerHeight = h - panelThickness * 2;
  const innerWidth = w - panelThickness * 2;
  const shelfSpacing = shelves > 0 ? innerHeight / (shelves + 1) : innerHeight / 2;
  const drawerModuleHeight = Math.min(0.72, h * 0.34);
  const drawerHeight = drawerModuleHeight / 3;
  const towerHeight = innerHeight - drawerModuleHeight;
  const doorHeight = Math.max(0.4, towerHeight - gap * 2);
  const doorWidth = innerWidth / 2 - gap * 1.5;
  const doorZ = d / 2 + panelThickness / 2 + gap;

  return (
    <group position={[0, h / 2, 0]}>
      <Panel position={[-(innerWidth / 2 + panelThickness / 2), 0, 0]} size={[panelThickness, h, d]} texture={texture} color={color} />
      <Panel position={[innerWidth / 2 + panelThickness / 2, 0, 0]} size={[panelThickness, h, d]} texture={texture} color={color} />
      <Panel position={[0, h / 2 - panelThickness / 2, 0]} size={[innerWidth, panelThickness, d]} texture={texture} color={color} />
      <Panel position={[0, -h / 2 + panelThickness / 2, 0]} size={[innerWidth, panelThickness, d]} texture={texture} color={color} />
      <Panel position={[0, 0, -(d / 2 - 0.004)]} size={[innerWidth, innerHeight, 0.006]} texture={null} color="#2f2f35" />

      {Array.from({ length: shelves }).map((_, index) => {
        const positionY = -h / 2 + drawerModuleHeight + shelfSpacing * (index + 1);
        return (
          <Panel
            key={`shelf-${index}`}
            position={[0, positionY, 0]}
            size={[innerWidth - 0.004, panelThickness, d - 0.02]}
            texture={texture}
            color={color}
          />
        );
      })}

      {Array.from({ length: 3 }).map((_, index) => {
        const drawerFrontHeight = drawerHeight - gap;
        const drawerY = -h / 2 + panelThickness + drawerFrontHeight / 2 + index * drawerHeight;
        return (
          <group key={`drawer-${index}`}>
            <mesh position={[0, drawerY, doorZ]} castShadow receiveShadow>
              <boxGeometry args={[innerWidth - gap * 2, drawerFrontHeight, panelThickness]} />
              <meshStandardMaterial color={color} map={texture} roughness={0.55} metalness={0.04} />
            </mesh>
            <Handle position={[0, drawerY, doorZ + 0.018]} rotation={[0, 0, 0]} />
          </group>
        );
      })}

      <mesh position={[-(doorWidth / 2 + gap / 2), drawerModuleHeight / 2, doorZ]} castShadow receiveShadow>
        <boxGeometry args={[doorWidth, doorHeight, panelThickness]} />
        <meshStandardMaterial color={color} map={texture} roughness={0.5} metalness={0.04} />
      </mesh>
      <mesh position={[doorWidth / 2 + gap / 2, drawerModuleHeight / 2, doorZ]} castShadow receiveShadow>
        <boxGeometry args={[doorWidth, doorHeight, panelThickness]} />
        <meshStandardMaterial color={color} map={texture} roughness={0.5} metalness={0.04} />
      </mesh>

      <Handle position={[-gap - 0.04, drawerModuleHeight / 2, doorZ + 0.018]} />
      <Handle position={[gap + 0.04, drawerModuleHeight / 2, doorZ + 0.018]} />

      {[-1, 1].flatMap((direction) =>
        [-doorHeight / 2 + 0.16, 0, doorHeight / 2 - 0.16].map((offset, index) => (
          <Hinge
            key={`${direction}-${index}`}
            position={[
              direction < 0 ? -(innerWidth / 2) + 0.01 : innerWidth / 2 - 0.01,
              drawerModuleHeight / 2 + offset,
              doorZ - 0.004,
            ]}
          />
        )),
      )}
    </group>
  );
}

export function ThreeWorkspace() {
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(2400);
  const [depth, setDepth] = useState(620);
  const [shelves, setShelves] = useState(3);
  const [color, setColor] = useState('#d7c3a5');

  const cameraY = height / 1000 / 2;
  const cameraZ = Math.max((height / 1000) * 1.25, (width / 1000) * 2.2);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:grid-cols-5">
        {[
          { label: 'Largura (mm)', value: width, setter: setWidth, min: 600, max: 3200 },
          { label: 'Altura (mm)', value: height, setter: setHeight, min: 1200, max: 3200 },
          { label: 'Profundidade (mm)', value: depth, setter: setDepth, min: 300, max: 900 },
          { label: 'Prateleiras', value: shelves, setter: setShelves, min: 0, max: 8 },
        ].map(({ label, value, setter, min, max }) => (
          <div key={label}>
            <label className="mb-1 block text-xs text-zinc-400">{label}</label>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-sm"
              type="number"
              min={min}
              max={max}
              value={value}
              onChange={(event) => setter(Number(event.target.value))}
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Tom MDF</label>
          <input
            className="h-10 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </div>
      </div>

      <div className="h-[700px] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[radial-gradient(circle_at_top,#1f2937,transparent_45%),linear-gradient(180deg,#09090b,#111827)]">
        <Canvas shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
          <color attach="background" args={['#09090b']} />
          <fog attach="fog" args={['#09090b', 5, 12]} />
          <ambientLight intensity={0.45} />
          <spotLight
            position={[3.5, 5, 3]}
            angle={0.35}
            penumbra={0.8}
            intensity={80}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-4, 3, -2]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
          <pointLight position={[0, 2, 2]} intensity={18} color="#fef3c7" />
          <PerspectiveCamera makeDefault position={[0, cameraY, cameraZ]} fov={40} />

          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[8, 8]} />
            <shadowMaterial opacity={0.25} />
          </mesh>

          <Cabinet width={width} height={height} depth={depth} color={color} shelves={shelves} />
          <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={6} blur={2.4} far={5} />
          <OrbitControls enablePan enableRotate enableZoom minDistance={1.2} maxDistance={8} target={[0, 1.1, 0]} />
          <Environment preset="warehouse" />
        </Canvas>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-2 text-sm font-medium">Recursos visuais</h2>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-300">
          <span>Viewport ampliado</span>
          <span>Textura MDF procedural</span>
          <span>Folgas de porta</span>
          <span>Frentes de gaveta</span>
          <span>Dobradiças posicionadas</span>
          <span>Puxadores metálicos</span>
          <span>Iluminação e sombras realistas</span>
        </div>
      </div>
    </div>
  );
}
