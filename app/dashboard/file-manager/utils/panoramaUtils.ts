import { useEffect } from 'react';
import { Files } from '../FileManagerContext';

const PANORAMA_MIN_RATIO = 2.5;

/**
 * Classify an image as panorama from its pixel dimensions.
 */
export function classifyImageFromDimensions(width: number, height: number): boolean {
  if (!width || !height) return false;
  const ratio = width / height;
  return ratio >= PANORAMA_MIN_RATIO;
}

/**
 * Detects if a local File object is a panorama.
 */
export async function detectIsPanoramaFromFile(file: File): Promise<boolean> {
  if (!file.type.startsWith('image/')) return false;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(classifyImageFromDimensions(img.naturalWidth, img.naturalHeight));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

// Cache: url -> boolean
const detectionCache = new Map<string, boolean>();

/**
 * Detects if a remote URL is a panorama.
 */
export async function detectIsPanoramaFromUrl(url: string): Promise<boolean> {
  if (!url) return false;
  if (detectionCache.has(url)) return detectionCache.get(url)!;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const isPanorama = classifyImageFromDimensions(img.naturalWidth, img.naturalHeight);
      detectionCache.set(url, isPanorama);
      resolve(isPanorama);
    };
    img.onerror = () => {
      detectionCache.set(url, false);
      resolve(false);
    };
    img.src = url;
  });
}

/**
 * Returns true if a file should open in the panorama viewer.
 * Legacy "image_type" is still checked for backwards compatibility.
 */
export function isPanoramaFile(file: any): boolean {
  if (!file) return false;
  if (file.isPanorama === true) return true;
  // Legacy support for previously tagged panoramas
  if (file.image_type === 'panorama' || file.image_type === 'wide_panorama' || file.image_type === '360') return true;
  return false;
}

/**
 * Hook to auto-detect and classify all untagged image files in the background.
 * Updates filesData in context with the detected isPanorama flag.
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
        f.isPanorama === undefined &&
        !(f as any).image_type && // Skip if it already has the old image_type flag
        !f.type?.startsWith('video') &&
        !f.type?.startsWith('pdf') &&
        !f.file_path?.toLowerCase().endsWith('.pdf')
    );
    if (unverified.length === 0) return;

    let isMounted = true;

    const checkFiles = async () => {
      const updates: { uuid: string; isPanorama: boolean }[] = [];

      for (const file of unverified) {
        // Use thumb for speed, but we need natural dimensions so we load it
        const url =
          file.variant_urls?.thumb ||
          file.thumbnail_url ||
          file.url ||
          (file.file_path && apiUrl ? `${apiUrl}/${file.file_path}` : '');

        if (url) {
          const isPanorama = await detectIsPanoramaFromUrl(url);
          updates.push({ uuid: file.uuid, isPanorama });
        }
      }

      if (isMounted && updates.length > 0) {
        setFilesData((prev: any) => {
          if (!prev) return prev;
          let changed = false;
          const newFiles = prev.files.map((f: any) => {
            const update = updates.find(u => u.uuid === f.uuid);
            if (update && f.isPanorama === undefined && !(f as any).image_type) {
              changed = true;
              return { ...f, isPanorama: update.isPanorama };
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
