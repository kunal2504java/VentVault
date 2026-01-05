import { Effects } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Particles } from "./particles";
import { VignetteShader } from "./shaders/vignetteShader";
import { useParticleSettings } from "@/lib/particle-context";

export const GL = ({ hovering }: { hovering: boolean }) => {
  const { settings } = useParticleSettings();

  return (
    <div id="webgl" style={{ pointerEvents: 'none' }}>
      <Canvas
        style={{ pointerEvents: 'none' }}
        camera={{
          position: [
            1.2629783123314589, 2.664606471394044, -1.8178993743288914,
          ],
          fov: 50,
          near: 0.01,
          far: 300,
        }}
      >
        <color attach="background" args={["#000"]} />
        <Particles
          speed={settings.speed}
          aperture={settings.aperture}
          focus={settings.focus}
          size={settings.size}
          noiseScale={settings.noiseScale}
          noiseIntensity={settings.noiseIntensity}
          timeScale={settings.timeScale}
          pointSize={settings.pointSize}
          opacity={settings.opacity}
          planeScale={settings.planeScale}
          useManualTime={settings.useManualTime}
          manualTime={settings.manualTime}
          introspect={hovering}
        />
        <Effects multisamping={0} disableGamma>
          <shaderPass
            args={[VignetteShader]}
            uniforms-darkness-value={settings.vignetteDarkness}
            uniforms-offset-value={settings.vignetteOffset}
          />
        </Effects>
      </Canvas>
    </div>
  );
};
