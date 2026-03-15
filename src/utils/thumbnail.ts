import type { MediaFile } from "@/types/file-system";

const MAX_THUMBNAIL_DIMENSION = 400; // max width/height
const SIZE_THRESHOLD = 1 * 1024 * 1024; // 1MB threshold
const MAX_CACHE_SIZE = 500; // max number of thumbnails

const thumbnailCache = new Map<string, string>();
const inProgress = new Map<string, Promise<string>>();

class ConcurrencyQueue {
  private active = 0;
  private queue: (() => void)[] = [];

  constructor(private maxConcurrency: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrency) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active++;
    try {
      return await task();
    } finally {
      this.active--;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }
}

// Global queue for generating thumbnails
const queue = new ConcurrencyQueue(4); // 4 concurrent generations

function getCacheKey(file: MediaFile): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export async function getThumbnail(media: MediaFile): Promise<string> {
  const cacheKey = getCacheKey(media);

  // Check cache
  if (thumbnailCache.has(cacheKey)) {
    // Refresh LRU
    const url = thumbnailCache.get(cacheKey)!;
    thumbnailCache.delete(cacheKey);
    thumbnailCache.set(cacheKey, url);
    return url;
  }

  // Check if currently generating
  if (inProgress.has(cacheKey)) {
    return inProgress.get(cacheKey)!;
  }

  const promise = queue.run(async () => {
    try {
      const file = await media.handle.getFile();

      let objectUrl: string;

      // If small enough, just use original
      if (file.size < SIZE_THRESHOLD) {
        objectUrl = URL.createObjectURL(file);
      } else if (media.type === "video") {
        objectUrl = await generateVideoThumbnail(file);
      } else {
        objectUrl = await generateImageThumbnail(file);
      }

      manageCache(cacheKey, objectUrl);
      return objectUrl;
    } finally {
      inProgress.delete(cacheKey);
    }
  });

  inProgress.set(cacheKey, promise);
  return promise;
}

function manageCache(key: string, url: string) {
  if (thumbnailCache.size >= MAX_CACHE_SIZE) {
    const firstKey = thumbnailCache.keys().next().value;
    if (firstKey) {
      const oldUrl = thumbnailCache.get(firstKey)!;
      URL.revokeObjectURL(oldUrl);
      thumbnailCache.delete(firstKey);
    }
  }
  thumbnailCache.set(key, url);
}

async function generateImageThumbnail(file: File): Promise<string> {
  // Use createImageBitmap if supported
  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      // Need to handle resizing cleanly without breaking aspect ratio
      const bitmap = await window.createImageBitmap(file);
      const scale = Math.min(
        MAX_THUMBNAIL_DIMENSION / bitmap.width,
        MAX_THUMBNAIL_DIMENSION / bitmap.height,
        1,
      );

      if (scale === 1) {
        return URL.createObjectURL(file);
      }

      const width = bitmap.width * scale;
      const height = bitmap.height * scale;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("No 2d context");
      }

      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      return await canvasToBlobUrl(canvas);
    } catch (e) {
      console.warn("createImageBitmap failed, falling back to original", e);
      return URL.createObjectURL(file);
    }
  } else {
    // Fallback: regular image element
    return new Promise((resolve, reject) => {
      const img = new Image();
      const tempUrl = URL.createObjectURL(file);
      img.onload = async () => {
        URL.revokeObjectURL(tempUrl);
        const scale = Math.min(
          MAX_THUMBNAIL_DIMENSION / img.width,
          MAX_THUMBNAIL_DIMENSION / img.height,
          1,
        );
        if (scale === 1) {
          return resolve(URL.createObjectURL(file));
        }

        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("No 2d context"));
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          resolve(await canvasToBlobUrl(canvas));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        resolve(URL.createObjectURL(file)); // fallback to original
      };
      img.src = tempUrl;
    });
  }
}

async function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    let isCleanedUp = false;

    const cleanup = () => {
      if (isCleanedUp) {
        return;
      }
      isCleanedUp = true;
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };

    video.onloadeddata = () => {
      // Seek to 1s or 10% of the video to avoid black frames
      if (video.duration) {
        video.currentTime = Math.min(1, video.duration * 0.1);
      } else {
        video.currentTime = 0;
      }
    };

    video.onseeked = async () => {
      try {
        const scale = Math.min(
          MAX_THUMBNAIL_DIMENSION / video.videoWidth,
          MAX_THUMBNAIL_DIMENSION / video.videoHeight,
          1,
        );
        const width = video.videoWidth * scale || MAX_THUMBNAIL_DIMENSION;
        const height = video.videoHeight * scale || MAX_THUMBNAIL_DIMENSION;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("No 2d context");
        }

        ctx.drawImage(video, 0, 0, width, height);
        cleanup();

        resolve(await canvasToBlobUrl(canvas));
      } catch {
        cleanup();
        resolve(URL.createObjectURL(file)); // Fallback
      }
    };

    video.onerror = () => {
      cleanup();
      resolve(URL.createObjectURL(file)); // Fallback
    };

    video.src = url;
    video.load();
  });
}

function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error("Canvas toBlob failed"));
        }
      },
      "image/jpeg",
      0.8, // quality
    );
  });
}

export function clearThumbnailCache() {
  for (const url of thumbnailCache.values()) {
    URL.revokeObjectURL(url);
  }
  thumbnailCache.clear();
}
