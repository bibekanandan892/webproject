"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import type { Group, Mesh } from "three";

function FloatingShape({
  position,
  color,
  shape = "ico",
}: {
  position: [number, number, number];
  color: string;
  shape?: "ico" | "torus" | "octa";
}) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * 0.15;
      ref.current.rotation.y += dt * 0.2;
    }
  });
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh ref={ref} position={position}>
        {shape === "ico" && <icosahedronGeometry args={[1.2, 0]} />}
        {shape === "torus" && <torusKnotGeometry args={[0.9, 0.28, 100, 16]} />}
        {shape === "octa" && <octahedronGeometry args={[1.1, 0]} />}
        <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={0.6} />
      </mesh>
    </Float>
  );
}

function ScrollDrivenGroup() {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    group.current.rotation.y = p * Math.PI * 2;
    group.current.position.z = -p * 4;
  });
  return (
    <group ref={group}>
      <FloatingShape position={[-3, 1.2, -2]} color="#5CC9FF" shape="ico" />
      <FloatingShape position={[3, -0.5, -1]} color="#FF6BD1" shape="torus" />
      <FloatingShape position={[0, 2.4, -4]} color="#B49DFF" shape="octa" />
      <FloatingShape position={[-2.5, -1.8, -3]} color="#FFD479" shape="ico" />
      <FloatingShape position={[2.6, 1.6, -5]} color="#5CE3A1" shape="octa" />
    </group>
  );
}

export function SceneBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#02030A"]} />
        <fog attach="fog" args={["#02030A", 6, 16]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[6, 6, 6]} intensity={1.4} color="#5CC9FF" />
        <pointLight position={[-6, -4, 2]} intensity={1.2} color="#FF6BD1" />
        <Suspense fallback={null}>
          <Stars radius={60} depth={50} count={2200} factor={3} saturation={0} fade speed={0.4} />
          <ScrollDrivenGroup />
        </Suspense>
      </Canvas>
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(80% 50% at 50% 0%, transparent, rgba(2,3,10,0.7))",
        }}
      />
    </div>
  );
}
