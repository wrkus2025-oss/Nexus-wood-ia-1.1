'use client';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

export function ThreeWorkspace() {
  return (
    <div className="h-[520px] w-full rounded-xl border border-zinc-800 bg-zinc-950">
      <Canvas>
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 10, 6]} intensity={1.4} />
        <PerspectiveCamera makeDefault position={[6, 6, 8]} />
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[2.4, 1.2, 0.6]} />
          <meshStandardMaterial color="#c6a87a" metalness={0.1} roughness={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#202020" />
        </mesh>
        <OrbitControls enablePan enableRotate enableZoom />
      </Canvas>
    </div>
  );
}
