'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Compass,
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface ThreeSixtyViewerProps {
  files: any[];
  isEmbedded?: boolean;
  initialIndex?: number;
  onClose?: () => void;
  onToggleFlatView?: () => void;
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_texture;
  uniform float u_yaw;
  uniform float u_pitch;
  uniform float u_fov;
  uniform float u_aspect;
  uniform int u_isCylinder;
  uniform float u_vCoverage;

  #define PI 3.1415926535897932384626433832795

  void main() {
    // Convert 2D screen coordinates to NDC [-1, 1]
    vec2 ndc = (v_uv - 0.5) * 2.0;
    ndc.x *= u_aspect;

    // Perspective camera ray direction based on FOV
    float tanHalfFov = tan(radians(u_fov) * 0.5);
    vec3 ray = normalize(vec3(ndc.x * tanHalfFov, ndc.y * tanHalfFov, -1.0));

    // Rotate pitch (around X axis)
    float cp = cos(u_pitch);
    float sp = sin(u_pitch);
    mat3 rotX = mat3(
      1.0, 0.0, 0.0,
      0.0, cp, -sp,
      0.0, sp, cp
    );
    ray = rotX * ray;

    // Rotate yaw (around Y axis)
    float cy = cos(u_yaw);
    float sy = sin(u_yaw);
    mat3 rotY = mat3(
      cy, 0.0, sy,
      0.0, 1.0, 0.0,
      -sy, 0.0, cy
    );
    ray = rotY * ray;

    // Horizontal angle phi in [-PI, PI]
    float phi = atan(ray.x, -ray.z);
    // Seamless infinite continuous 360 wrap around cylinder/sphere
    float u = fract(phi / (2.0 * PI) + 0.5);

    float v = 0.5;

    if (u_isCylinder == 1) {
      // 3D Cylindrical perspective projection
      float r = length(vec2(ray.x, ray.z));
      float y_cyl = ray.y / max(0.0001, r);
      v = (y_cyl / u_vCoverage) + 0.5;

      // Soft clamp for cylinder vertical bounds
      if (v < 0.0 || v > 1.0) {
        gl_FragColor = vec4(0.08, 0.08, 0.10, 1.0);
        return;
      }
    } else {
      // 3D Equirectangular spherical perspective projection
      float theta = asin(clamp(ray.y, -1.0, 1.0)); // [-PI/2, PI/2]
      v = theta / PI + 0.5;
    }

    gl_FragColor = texture2D(u_texture, vec2(u, v));
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function ThreeSixtyViewer({
  files,
  isEmbedded = false,
  initialIndex = 0,
  onClose,
  onToggleFlatView,
}: ThreeSixtyViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasWebGlError, setHasWebGlError] = useState(false);
  const [isCylinderMode, setIsCylinderMode] = useState(false);

  const currentPano = files && files.length > 0 ? files[currentIndex] : null;

  // Image projection metadata
  const imageMetaRef = useRef<{
    aspect: number;
    isCylinder: boolean;
    vCoverage: number;
    maxPitch: number;
  }>({
    aspect: 2.0,
    isCylinder: false,
    vCoverage: Math.PI,
    maxPitch: Math.PI / 2.1,
  });

  // View state refs for high-frequency render loop
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const fovRef = useRef(75);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const isAutoRotatingRef = useRef(true);
  const animationFrameIdRef = useRef<number | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const programInfoRef = useRef<any>(null);

  isAutoRotatingRef.current = isAutoRotating;

  const getPanoUrl = useCallback((file: any) => {
    if (!file) return '';
    if (typeof file === 'string') return file;
    if (file.file && typeof file.file === 'object') return URL.createObjectURL(file.file);
    if (file.variant_urls?.popup) return file.variant_urls.popup;
    if (file.variant_urls?.landing) return file.variant_urls.landing;
    if (file.file_path) return file.file_path;
    if (file.url) return file.url;
    return '';
  }, []);

  // WebGL initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false, antialias: true }) ||
               (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      console.error('WebGL not supported');
      setHasWebGlError(true);
      return;
    }

    glRef.current = gl;

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      setHasWebGlError(true);
      return;
    }

    const program = createProgram(gl, vs, fs);
    if (!program) {
      setHasWebGlError(true);
      return;
    }

    gl.useProgram(program);

    // Full-screen quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const aPosLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    programInfoRef.current = {
      program,
      attribs: { position: aPosLoc },
      uniforms: {
        texture: gl.getUniformLocation(program, 'u_texture'),
        yaw: gl.getUniformLocation(program, 'u_yaw'),
        pitch: gl.getUniformLocation(program, 'u_pitch'),
        fov: gl.getUniformLocation(program, 'u_fov'),
        aspect: gl.getUniformLocation(program, 'u_aspect'),
        isCylinder: gl.getUniformLocation(program, 'u_isCylinder'),
        vCoverage: gl.getUniformLocation(program, 'u_vCoverage'),
      },
    };

    // Render loop
    const render = () => {
      if (isAutoRotatingRef.current && !isDraggingRef.current) {
        yawRef.current += 0.0015;
        if (yawRef.current > Math.PI * 2) yawRef.current -= Math.PI * 2;
      }

      if (glRef.current && programInfoRef.current && textureRef.current) {
        const gl = glRef.current;
        const { uniforms } = programInfoRef.current;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }

        gl.uniform1f(uniforms.yaw, yawRef.current);
        gl.uniform1f(uniforms.pitch, pitchRef.current);
        gl.uniform1f(uniforms.fov, fovRef.current);
        gl.uniform1f(uniforms.aspect, width / Math.max(1, height));
        gl.uniform1i(uniforms.isCylinder, imageMetaRef.current.isCylinder ? 1 : 0);
        gl.uniform1f(uniforms.vCoverage, imageMetaRef.current.vCoverage);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
        gl.uniform1i(uniforms.texture, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (textureRef.current && glRef.current) {
        glRef.current.deleteTexture(textureRef.current);
      }
    };
  }, []);

  // Texture loading on currentPano change
  useEffect(() => {
    const rawUrl = getPanoUrl(currentPano);
    if (!rawUrl || !glRef.current) return;

    setIsLoading(true);

    const getProxiedUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/api/proxy-image')) {
        return url;
      }
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    };

    const proxiedUrl = getProxiedUrl(rawUrl);

    const loadTexture = (urlToLoad: string, isProxy: boolean) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!glRef.current) return;
        const gl = glRef.current;

        const aspect = (img.naturalWidth || 1) / Math.max(1, img.naturalHeight || 1);
        const isCyl = currentPano?.subtype === 'panorama_180' || aspect > 2.2;
        const vCoverage = isCyl ? (2.0 * Math.PI) / aspect : Math.PI;
        const maxPitch = isCyl
          ? Math.max(0.18, Math.min(Math.PI / 2.8, vCoverage * 0.46))
          : (Math.PI / 2.1);

        imageMetaRef.current = {
          aspect,
          isCylinder: isCyl,
          vCoverage,
          maxPitch,
        };
        setIsCylinderMode(isCyl);

        // Clamp existing pitch within the new photo bounds
        pitchRef.current = Math.max(-maxPitch, Math.min(maxPitch, pitchRef.current));

        if (textureRef.current) {
          gl.deleteTexture(textureRef.current);
        }

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        textureRef.current = texture;
        setIsLoading(false);
      };

      img.onerror = () => {
        if (isProxy && proxiedUrl !== rawUrl) {
          console.warn('Next.js proxy load failed, attempting direct S3 load:', rawUrl);
          loadTexture(rawUrl, false);
        } else {
          console.error('Failed to load 360 pano image:', rawUrl);
          setIsLoading(false);
        }
      };

      img.src = urlToLoad;
    };

    loadTexture(proxiedUrl, true);
  }, [currentPano, getPanoUrl]);

  // Pointer event handlers (Mouse / Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    const sensitivity = (fovRef.current / 75) * 0.0035;
    yawRef.current -= dx * sensitivity;
    const maxPitch = imageMetaRef.current.maxPitch;
    pitchRef.current = Math.max(
      -maxPitch,
      Math.min(maxPitch, pitchRef.current + dy * sensitivity)
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.05;
    fovRef.current = Math.max(35, Math.min(95, fovRef.current + zoomDelta));
  };

  const handleZoom = (delta: number) => {
    fovRef.current = Math.max(35, Math.min(95, fovRef.current + delta));
  };

  const handleReset = () => {
    yawRef.current = 0;
    pitchRef.current = 0;
    fovRef.current = 75;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!files || files.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center bg-gray-100 rounded-xl text-gray-500 font-alexandria">
        <Compass size={36} className="mb-2 text-gray-400" />
        <p className="font-semibold text-sm">No 360° panoramas available for this tour</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-black font-alexandria select-none transition-all ${
        isEmbedded ? 'rounded-2xl shadow-xl aspect-[16/9] max-h-[75vh]' : 'h-full min-h-[500px]'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium tracking-wide">Loading 360° View...</p>
        </div>
      )}

      {/* Fallback if WebGL unavailable */}
      {hasWebGlError && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center z-30">
          <Compass size={40} className="mb-3 text-red-400" />
          <h4 className="font-bold text-lg mb-1">WebGL Acceleration Required</h4>
          <p className="text-sm text-gray-300 max-w-md">
            Please enable hardware acceleration or WebGL in your browser settings to explore the interactive 360° tour.
          </p>
        </div>
      )}

      {/* Top Bar: Room Title & Controls */}
      <div className="absolute top-4 left-4 right-14 md:right-16 flex items-center justify-between pointer-events-none z-20">
        <div className="bg-black/65 backdrop-blur-md px-4 py-2 rounded-xl text-white border border-white/10 shadow-lg pointer-events-auto flex items-center gap-2.5">
          <Compass size={18} className="text-amber-400 animate-pulse shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs md:text-sm tracking-wide leading-tight truncate max-w-[140px] sm:max-w-[240px]">
                {currentPano?.name || `360° View ${currentIndex + 1}`}
              </span>
              <span className="text-[10px] bg-white/15 text-amber-300 px-1.5 py-0.5 rounded font-semibold shrink-0">
                {isCylinderMode ? '360° Panorama' : '360° Sphere'}
              </span>
            </div>
            {files.length > 1 && (
              <div className="text-[10px] text-gray-300 font-medium">
                Panorama {currentIndex + 1} of {files.length}
              </div>
            )}
          </div>
        </div>

        {/* Top-Right Control Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onToggleFlatView && (
            <button
              type="button"
              onClick={onToggleFlatView}
              className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/85 text-white text-xs font-alexandria font-medium backdrop-blur-md border border-white/15 transition shadow-md cursor-pointer hover:scale-105"
              title="Toggle View"
            >
              Toggle
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-105"
            title={isAutoRotating ? 'Pause Auto-Rotation' : 'Start Auto-Rotation'}
          >
            {isAutoRotating ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-105"
            title="Reset View"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-105"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-105 ml-1"
              title="Close 360° Viewer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Right Side Zoom Controls (positioned at top-20 to avoid arrow collision) */}
      <div className="absolute right-4 top-20 flex flex-col gap-2 z-20">
        <button
          type="button"
          onClick={() => handleZoom(-10)}
          className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-105"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(10)}
          className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-105"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
      </div>

      {/* Prev / Next Room Navigation Arrows (centered on sides) */}
      {files.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrentIndex((currentIndex - 1 + files.length) % files.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all shadow-md z-20 cursor-pointer hover:scale-110"
            title="Previous Room"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((currentIndex + 1) % files.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all shadow-md z-20 cursor-pointer hover:scale-110"
            title="Next Room"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Bottom Thumbnail Strip (if multiple rooms exist) */}
      {files.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[90%] px-3 py-2 bg-black/65 backdrop-blur-md rounded-2xl border border-white/15 flex items-center gap-2.5 overflow-x-auto z-10 scrollbar-none shadow-2xl">
          {files.map((file, idx) => {
            const isSelected = idx === currentIndex;
            const thumbSrc = getPanoUrl(file);
            return (
              <button
                key={file.uuid || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 scale-105 shadow-md ring-2 ring-amber-400/30'
                    : 'border-white/30 hover:border-white/70 opacity-70 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbSrc}
                  alt={file.name || `Room ${idx + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white font-medium px-1 py-0.5 truncate text-center">
                  {file.name ? file.name.split('.')[0] : `Pano ${idx + 1}`}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Hint Badge */}
      <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] text-gray-300 border border-white/10 pointer-events-none">
        <span>🖱️ Drag to look 360° | Scroll to Zoom</span>
      </div>
    </div>
  );
}
