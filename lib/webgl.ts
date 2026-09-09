// three.js/WebGL fails to get a context at all on some real machines — a
// software-rendered Mesa/llvmpipe setup throws "Could not create a WebGL
// context" rather than falling back gracefully. WebGL being a browser-native
// API doesn't guarantee a context is actually available (see
// components/diagrams/GalaxyComparison.tsx, which hit the identical failure
// and moved to Canvas 2D for this reason). Any component that depends on
// WebGL should check this first and render a non-WebGL fallback rather than
// let the library throw.
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}
