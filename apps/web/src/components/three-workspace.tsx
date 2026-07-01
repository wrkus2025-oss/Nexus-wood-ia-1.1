'use client';

import { queryKeys, useProject } from '@/lib/hooks';
import { useAuthStore } from '@/store/auth';
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

type ThreeWorkspaceProps = {
  projectId?: string;
};

type CabinetProps = {
  width: number;
  height: number;
  depth: number;
  color: string;
  shelves: number;
  doorCount: number;
  drawerCount: number;
  doorOpen: boolean;
  drawerOpen: boolean;
  explode: boolean;
  isolateDoors: boolean;
  showHardware: boolean;
  showMeasurements: boolean;
};

function createWoodTexture(baseColor: string) {
  if (typeof document === 'undefined') {
    return null;
  }

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

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function Panel({
  position,
  size,
  texture,
  color,
  hidden = false,
}: {
  position: [number, number, number];
  size: [number, number, number];
  texture: THREE.CanvasTexture | null;
  color: string;
  hidden?: boolean;
}) {
  if (hidden) {
    return null;
  }
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} map={texture} roughness={0.62} metalness={0.04} />
    </mesh>
  );
}

function Handle({
  position,
  rotation = [0, 0, Math.PI / 2],
  hidden = false,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  hidden?: boolean;
}) {
  if (hidden) {
    return null;
  }
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.12, 16]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.95} roughness={0.16} />
      </mesh>
    </group>
  );
}

function Hinge({
  position,
  hidden = false,
}: {
  position: [number, number, number];
  hidden?: boolean;
}) {
  if (hidden) {
    return null;
  }
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.016, 0.032, 0.004]} />
        <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.22} />
      </mesh>
    </group>
  );
}

function Cabinet({
  width,
  height,
  depth,
  color,
  shelves,
  doorCount,
  drawerCount,
  doorOpen,
  drawerOpen,
  explode,
  isolateDoors,
  showHardware,
  showMeasurements,
}: CabinetProps) {
  const texture = useMemo(() => createWoodTexture(color), [color]);
  const panelThickness = 0.018;
  const gap = 0.003;
  const w = width / 1000;
  const h = height / 1000;
  const d = depth / 1000;
  const innerHeight = h - panelThickness * 2;
  const innerWidth = w - panelThickness * 2;
  const shelfSpacing = shelves > 0 ? innerHeight / (shelves + 1) : innerHeight / 2;
  const drawerModuleHeight = Math.min(0.9, h * Math.min(0.48, 0.2 + drawerCount * 0.04));
  const drawerHeight = drawerCount > 0 ? drawerModuleHeight / drawerCount : 0;
  const towerHeight = Math.max(0.2, innerHeight - drawerModuleHeight);
  const doorHeight = Math.max(0.3, towerHeight - gap * 2);
  const doorWidth = Math.max(0.2, innerWidth / Math.max(1, doorCount) - gap * 1.5);
  const doorZ = d / 2 + panelThickness / 2 + gap;
  const explodeOffset = explode ? 0.12 : 0;
  const drawerPull = drawerOpen ? 0.18 : 0;
  const doorAngle = doorOpen ? Math.PI / 5 : 0;

  return (
    <group position={[0, h / 2, 0]}>
      <Panel
        position={[-(innerWidth / 2 + panelThickness / 2) - explodeOffset, 0, 0]}
        size={[panelThickness, h, d]}
        texture={texture}
        color={color}
        hidden={isolateDoors}
      />
      <Panel
        position={[innerWidth / 2 + panelThickness / 2 + explodeOffset, 0, 0]}
        size={[panelThickness, h, d]}
        texture={texture}
        color={color}
        hidden={isolateDoors}
      />
      <Panel
        position={[0, h / 2 - panelThickness / 2 + explodeOffset, 0]}
        size={[innerWidth, panelThickness, d]}
        texture={texture}
        color={color}
        hidden={isolateDoors}
      />
      <Panel
        position={[0, -h / 2 + panelThickness / 2 - explodeOffset, 0]}
        size={[innerWidth, panelThickness, d]}
        texture={texture}
        color={color}
        hidden={isolateDoors}
      />
      <Panel
        position={[0, 0, -(d / 2 - 0.004) - explodeOffset]}
        size={[innerWidth, innerHeight, 0.006]}
        texture={null}
        color="#2f2f35"
        hidden={isolateDoors}
      />

      {Array.from({ length: shelves }).map((_, index) => {
        const positionY = -h / 2 + drawerModuleHeight + shelfSpacing * (index + 1);
        return (
          <Panel
            key={`shelf-${index}`}
            position={[0, positionY, 0]}
            size={[innerWidth - 0.004, panelThickness, d - 0.02]}
            texture={texture}
            color={color}
            hidden={isolateDoors}
          />
        );
      })}

      {Array.from({ length: drawerCount }).map((_, index) => {
        const drawerFrontHeight = Math.max(0.12, drawerHeight - gap);
        const drawerY = -h / 2 + panelThickness + drawerFrontHeight / 2 + index * drawerHeight;
        return (
          <group key={`drawer-${index}`}>
            <mesh position={[0, drawerY, doorZ + drawerPull]} castShadow receiveShadow>
              <boxGeometry args={[innerWidth - gap * 2, drawerFrontHeight, panelThickness]} />
              <meshStandardMaterial color={color} map={texture} roughness={0.55} metalness={0.04} />
            </mesh>
            <Handle position={[0, drawerY, doorZ + 0.018 + drawerPull]} rotation={[0, 0, 0]} />
          </group>
        );
      })}

      {Array.from({ length: doorCount }).map((_, index) => {
        const direction = index % 2 === 0 ? -1 : 1;
        const centerX = -innerWidth / 2 + doorWidth / 2 + index * (doorWidth + gap);
        return (
          <group
            key={`door-${index}`}
            position={[centerX + direction * explodeOffset * 0.4, drawerModuleHeight / 2, doorZ]}
            rotation={[0, direction * doorAngle, 0]}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry args={[doorWidth, doorHeight, panelThickness]} />
              <meshStandardMaterial color={color} map={texture} roughness={0.5} metalness={0.04} />
            </mesh>
            <Handle position={[direction * 0.04, 0, 0.018]} />
          </group>
        );
      })}

      {showHardware &&
        Array.from({ length: doorCount }).flatMap((_, doorIndex) =>
          [-doorHeight / 2 + 0.16, 0, doorHeight / 2 - 0.16].map((offset, index) => (
            <Hinge
              key={`hinge-${doorIndex}-${index}`}
              position={[
                doorIndex % 2 === 0 ? -(innerWidth / 2) + 0.01 : innerWidth / 2 - 0.01,
                drawerModuleHeight / 2 + offset,
                doorZ - 0.004,
              ]}
            />
          )),
        )}

      {showMeasurements ? (
        <group>
          <mesh position={[0, h + 0.08, 0]}>
            <boxGeometry args={[w, 0.01, 0.01]} />
            <meshStandardMaterial color="#22d3ee" />
          </mesh>
          <mesh position={[innerWidth / 2 + 0.08, 0, 0]}>
            <boxGeometry args={[0.01, h, 0.01]} />
            <meshStandardMaterial color="#34d399" />
          </mesh>
          <mesh position={[0, 0.04, d / 2 + 0.08]}>
            <boxGeometry args={[0.01, 0.01, d]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

export function ThreeWorkspace({ projectId }: ThreeWorkspaceProps) {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const projectQuery = useProject(token, projectId ?? '');
  const project = projectQuery.data;

  const projectParts = useMemo(
    () =>
      project
        ? project.spaces.flatMap((space) =>
            space.units.flatMap((unit) =>
              unit.modules.flatMap((module) => module.parts),
            ),
          )
        : [],
    [project],
  );

  const detectedDoors = projectParts
    .filter((part) => part.type === 'DOOR')
    .reduce((sum, part) => sum + part.quantity, 0);
  const detectedDrawers = projectParts
    .filter((part) => part.type === 'DRAWER_FRONT')
    .reduce((sum, part) => sum + part.quantity, 0);
  const detectedShelves = projectParts
    .filter((part) => part.type === 'SHELF')
    .reduce((sum, part) => sum + part.quantity, 0);

  const [width, setWidth] = useState(project?.widthMm ?? 1200);
  const [height, setHeight] = useState(project?.heightMm ?? 2400);
  const [depth, setDepth] = useState(project?.depthMm ?? 620);
  const [shelves, setShelves] = useState(detectedShelves > 0 ? detectedShelves : 3);
  const [doorCount, setDoorCount] = useState(detectedDoors > 0 ? detectedDoors : 2);
  const [drawerCount, setDrawerCount] = useState(detectedDrawers > 0 ? detectedDrawers : 3);
  const [color, setColor] = useState('#d7c3a5');
  const [doorOpen, setDoorOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [explode, setExplode] = useState(false);
  const [isolateDoors, setIsolateDoors] = useState(false);
  const [showHardware, setShowHardware] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);

  useEffect(() => {
    if (!project) {
      return;
    }
    setWidth(project.widthMm);
    setHeight(project.heightMm);
    setDepth(project.depthMm);
    if (detectedShelves > 0) setShelves(detectedShelves);
    if (detectedDoors > 0) setDoorCount(detectedDoors);
    if (detectedDrawers > 0) setDrawerCount(detectedDrawers);
  }, [
    detectedDoors,
    detectedDrawers,
    detectedShelves,
    project,
  ]);

  const cameraY = height / 1000 / 2;
  const cameraZ = Math.max((height / 1000) * 1.25, (width / 1000) * 2.2);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
        {project ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Projeto ativo: {project.code} · {project.name}</span>
            <button
              className="rounded-lg border border-zinc-700 px-3 py-1 hover:bg-zinc-800"
              onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.project(project.id) })}
              type="button"
            >
              Atualizar dados do projeto
            </button>
          </div>
        ) : (
          <span>Modo manual: sem projeto selecionado. Use a IA para gerar e abrir o projeto automaticamente.</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:grid-cols-5">
        {[
          { label: 'Largura (mm)', value: width, setter: setWidth, min: 600, max: 4000 },
          { label: 'Altura (mm)', value: height, setter: setHeight, min: 1200, max: 3600 },
          { label: 'Profundidade (mm)', value: depth, setter: setDepth, min: 300, max: 1200 },
          { label: 'Prateleiras', value: shelves, setter: setShelves, min: 0, max: 12 },
          { label: 'Portas', value: doorCount, setter: setDoorCount, min: 0, max: 8 },
          { label: 'Gavetas', value: drawerCount, setter: setDrawerCount, min: 0, max: 12 },
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

      <div className="flex flex-wrap gap-2 text-sm">
        <button className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-800" onClick={() => setDoorOpen((value) => !value)} type="button">
          {doorOpen ? 'Fechar portas' : 'Abrir portas'}
        </button>
        <button className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-800" onClick={() => setDrawerOpen((value) => !value)} type="button">
          {drawerOpen ? 'Fechar gavetas' : 'Abrir gavetas'}
        </button>
        <button className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-800" onClick={() => setExplode((value) => !value)} type="button">
          {explode ? 'Modo montado' : 'Explodir móvel'}
        </button>
        <button className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-800" onClick={() => setIsolateDoors((value) => !value)} type="button">
          {isolateDoors ? 'Mostrar todas as peças' : 'Isolar portas'}
        </button>
        <button className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-800" onClick={() => setShowHardware((value) => !value)} type="button">
          {showHardware ? 'Ocultar ferragens' : 'Mostrar ferragens'}
        </button>
        <button className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-800" onClick={() => setShowMeasurements((value) => !value)} type="button">
          {showMeasurements ? 'Ocultar cotas' : 'Mostrar cotas'}
        </button>
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

          <Cabinet
            width={width}
            height={height}
            depth={depth}
            color={color}
            shelves={shelves}
            doorCount={doorCount}
            drawerCount={drawerCount}
            doorOpen={doorOpen}
            drawerOpen={drawerOpen}
            explode={explode}
            isolateDoors={isolateDoors}
            showHardware={showHardware}
            showMeasurements={showMeasurements}
          />
          <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={6} blur={2.4} far={5} />
          <OrbitControls enablePan enableRotate enableZoom minDistance={1.2} maxDistance={8} target={[0, 1.1, 0]} />
          <Environment preset="warehouse" />
        </Canvas>
      </div>
    </div>
  );
}
