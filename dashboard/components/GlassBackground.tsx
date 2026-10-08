"use client";

import { useEffect, useRef } from "react";

/**
 * Fondo 3D ligero con WebGL crudo (sin three.js ni OGL).
 * - Un shader de aurora lenta (esmeralda/teal/azul profundo) aporta profundidad.
 * - Respeta prefers-reduced-motion (renderiza 1 frame y detiene el loop).
 * - Se pausa cuando la pestaña no está visible.
 * - DPR limitado a 1.5 para no penalizar la velocidad.
 */

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.06;

  vec3 col = vec3(0.016, 0.024, 0.045);
  vec3 emerald = vec3(0.10, 0.55, 0.42);
  vec3 teal    = vec3(0.06, 0.38, 0.50);
  vec3 blue    = vec3(0.10, 0.20, 0.48);

  float d1 = length(p - vec2(sin(t) * 0.55,        cos(t * 0.8) * 0.35));
  float d2 = length(p - vec2(cos(t * 0.7 + 1.3) * 0.65, sin(t * 0.5 + 0.5) * 0.45));
  float d3 = length(p - vec2(sin(t * 0.45 + 2.1) * 0.5,  cos(t * 0.6 + 1.7) * 0.55));

  col += emerald * (0.30 / (d1 * 3.2 + 0.9)) * 0.55;
  col += teal    * (0.28 / (d2 * 3.2 + 0.9)) * 0.45;
  col += blue    * (0.26 / (d3 * 3.2 + 0.9)) * 0.40;

  float v = smoothstep(1.15, 0.25, length(p));
  col *= mix(0.5, 1.0, v);

  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.015;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

export default function GlassBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
      gl!.viewport(0, 0, w, h);
      gl!.uniform2f(uRes, w, h);
    }
    resize();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let running = true;
    const start = performance.now();

    function frame(now: number) {
      if (!running) return;
      gl!.uniform1f(uTime, (now - start) / 1000);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }

    if (reduce) {
      gl.uniform1f(uTime, 8.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    function onVis() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduce) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <canvas ref={ref} className="h-full w-full" />
      {/* Scrim para legibilidad del contenido sobre el fondo */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-ink-950/20 to-ink-950/70" />
    </div>
  );
}
