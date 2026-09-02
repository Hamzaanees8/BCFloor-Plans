import { useEffect } from 'react';
import { Files } from '../FileManagerContext';

export type PanoramaSubtype = 'panorama_360' | 'panorama_180' | null;

/**
 * Classify an image as 360 sphere or 180 wide panorama from its pixel dimensions.
 */
export function classifyImageFromDimensions(width: number, height: number): PanoramaSubtype {
  if (!width || !height) return null;
  const ratio = width / height;

  // 360° Spherical / Equirectangular images (standard 2:1 aspect ratio, e.g. 6000x3000, 4000x2000)
  if (ratio >= 1.85 && ratio <= 2.15) {
    return 'panorama_360';
  }

  // 180° / Wide Panoramas (aspect ratio 2.15:1 or wider)
  if (ratio > 2.15) {
    return 'panorama_180';
  }

  return null;
}

/**
 * Detects if a local File object is a panorama (360 or 180).
 */
export async function detectIsPanoramaFromFile(file: File): Promise<PanoramaSubtype> {
  if (!file.type.startsWith('image/')) return null;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(classifyImageFromDimensions(img.naturalWidth, img.naturalHeight));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

// Cache: url -> PanoramaSubtype
const detectionCache = new Map<string, PanoramaSubtype>();

/**
 * Detects if a remote URL is a panorama.
 */
export async function detectIsPanoramaFromUrl(url: string): Promise<PanoramaSubtype> {
  if (!url) return null;
  if (detectionCache.has(url)) return detectionCache.get(url)!;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const detected = classifyImageFromDimensions(img.naturalWidth, img.naturalHeight);
      detectionCache.set(url, detected);
      resolve(detected);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Returns true if a file is any type of panorama (360 sphere or 180 wide).
 */
export function isPanoramaFile(file: any): boolean {
  if (!file) return false;
  if (file.subtype === 'branded_floorplan' || file.subtype === 'unbranded_floorplan') return false;
  if (file.subtype === 'panorama_360' || file.subtype === 'panorama_180' || file.subtype === 'panorama') return true;
  if (file.isPanorama === true || file.is_panorama === true) return true;
  // Legacy support for previously tagged panoramas
  if (file.image_type === 'panorama' || file.image_type === 'wide_panorama' || file.image_type === '360' || file.image_type === '180') return true;
  if (file.type === 'panorama' || file.type === '360' || file.type === '180') return true;

  const sName = (file.service?.name || "").toLowerCase();
  const catName = (file.service?.category?.name || "").toLowerCase();
  const fileName = (file.name || file.file_name || "").toLowerCase();

  return (
    sName.includes("360") || sName.includes("panorama") || sName.includes("pano") || sName.includes("180") ||
    catName.includes("360") || catName.includes("panorama") || catName.includes("pano") || catName.includes("180") ||
    fileName.includes("360") || fileName.includes("pano") || fileName.includes("180")
  );
}

/**
 * Returns true if a file should render specifically as a 360° interactive sphere.
 */
export function is360SpherePanorama(file: any): boolean {
  if (!file) return false;
  if (file.subtype === 'panorama_360') return true;
  if (file.subtype === 'panorama_180') return false;
  // If subtype is generic 'panorama' or legacy, check if filename/service explicitly specifies 360
  const fileName = (file.name || file.file_name || "").toLowerCase();
  const sName = (file.service?.name || "").toLowerCase();
  if (fileName.includes("360") || sName.includes("360") || file.image_type === '360' || file.type === '360') return true;
  // Default generic panoramas to 360 if ratio is near 2:1
  return isPanoramaFile(file);
}

/**
 * Hook to auto-detect and classify all untagged image files in the background.
 * Updates filesData in context with detected panorama flags and subtypes.
 */
export function usePanoramaDetection(
  files: Files[] | undefined,
  setFilesData: React.Dispatch<React.SetStateAction<any>>,
  apiUrl: string | undefined
) {
  useEffect(() => {
    if (!files || files.length === 0) return;

    // Only process images that haven't been classified yet
    const unverified = files.filter(
      f =>
        f.subtype === undefined &&
        f.isPanorama === undefined &&
        !(f as any).image_type &&
        !f.type?.startsWith('video') &&
        !f.type?.startsWith('pdf') &&
        !f.file_path?.toLowerCase().endsWith('.pdf')
    );
    if (unverified.length === 0) return;

    let isMounted = true;

    const checkFiles = async () => {
      const updates: { uuid: string; isPanorama: boolean; subtype?: PanoramaSubtype }[] = [];

      for (const file of unverified) {
        const url =
          file.variant_urls?.landing ||
          file.variant_urls?.popup ||
          file.variant_urls?.slider ||
          file.url ||
          file.variant_urls?.thumb ||
          file.thumbnail_url ||
          (file.file_path && apiUrl ? `${apiUrl}/${file.file_path}` : '');

        if (url) {
          const detected = await detectIsPanoramaFromUrl(url);
          updates.push({
            uuid: file.uuid,
            isPanorama: detected !== null,
            subtype: detected,
          });
        }
      }

      if (isMounted && updates.length > 0) {
        setFilesData((prev: any) => {
          if (!prev) return prev;
          let changed = false;
          const newFiles = prev.files.map((f: any) => {
            const update = updates.find(u => u.uuid === f.uuid);
            if (update && f.subtype === undefined && f.isPanorama === undefined && !(f as any).image_type) {
              changed = true;
              return {
                ...f,
                isPanorama: update.isPanorama,
                subtype: f.subtype ?? update.subtype,
              };
            }
            return f;
          });
          return changed ? { ...prev, files: newFiles } : prev;
        });
      }
    };

    checkFiles();

    return () => {
      isMounted = false;
    };
  }, [files, setFilesData, apiUrl]);
}
