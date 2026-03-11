import { ref, shallowRef, computed } from "vue";
import type {
  DirectoryNode,
  MediaFile,
  FileSystemDirectoryHandle,
  FileSystemFileHandle,
  MediaType,
} from "@/types/file-system";

// Define the global window method if typescript doesn't know it
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      id?: string;
      mode?: "read" | "readwrite";
      startIn?: string;
    }): Promise<any>;
  }
}

export type SortOption =
  | "name_asc"
  | "name_desc"
  | "time_desc"
  | "time_asc"
  | "size_desc"
  | "size_asc";

export function useFileSystem() {
  const isScanning = ref(false);
  const error = ref<string | null>(null);
  const rootNode = ref<DirectoryNode | null>(null);

  // Use shallowRef for performance with large arrays
  const allMediaFiles = shallowRef<MediaFile[]>([]);
  const selectedDirectoryPath = ref<string | null>(null);
  const searchQuery = ref("");
  const selectedExtensions = ref<string[]>([]);
  const sortBy = ref<SortOption>("time_desc");

  const availableExtensions = computed(() => {
    const exts = new Set<string>();
    allMediaFiles.value.forEach((file) => {
      const parts = file.name.split(".");
      if (parts.length > 1) {
        exts.add(parts.pop()!.toLowerCase());
      }
    });
    return Array.from(exts).sort();
  });

  const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"]);
  const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "ogg", "mov"]);

  const getMediaType = (filename: string): MediaType => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!ext) {
      return "unknown";
    }
    if (IMAGE_EXTENSIONS.has(ext)) {
      return "image";
    }
    if (VIDEO_EXTENSIONS.has(ext)) {
      return "video";
    }
    return "unknown";
  };

  const traverseDirectory = async (
    dirHandle: FileSystemDirectoryHandle,
    pathPrefix: string,
  ): Promise<{ node: DirectoryNode; files: MediaFile[] }> => {
    const currentPath = pathPrefix ? `${pathPrefix}/${dirHandle.name}` : dirHandle.name;
    const node: DirectoryNode = {
      name: dirHandle.name,
      path: currentPath,
      handle: dirHandle,
      children: [],
      files: [],
    };

    let collectedFiles: MediaFile[] = [];

    const fileEntries: FileSystemFileHandle[] = [];
    const dirEntries: FileSystemDirectoryHandle[] = [];

    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file") {
        const fileHandle = entry as FileSystemFileHandle;
        if (getMediaType(fileHandle.name) !== "unknown") {
          fileEntries.push(fileHandle);
        }
      } else if (entry.kind === "directory") {
        dirEntries.push(entry as FileSystemDirectoryHandle);
      }
    }

    // Process files concurrently for fast metadata extraction
    const filePromises = fileEntries.map(async (fileHandle) => {
      const mediaType = getMediaType(fileHandle.name);
      let size = 0;
      let lastModified = 0;
      try {
        const fileData = await fileHandle.getFile();
        size = fileData.size;
        lastModified = fileData.lastModified;
      } catch (e) {
        console.warn(`Could not read metadata for ${fileHandle.name}`, e);
      }

      return {
        id: `${currentPath}/${fileHandle.name}`,
        name: fileHandle.name,
        type: mediaType,
        handle: fileHandle,
        path: currentPath,
        size,
        lastModified,
      } as MediaFile;
    });

    const resolvedFiles = await Promise.all(filePromises);
    for (const file of resolvedFiles) {
      node.files.push(file);
      collectedFiles.push(file);
    }

    // Process subdirectories sequentially to avoid too many open file handles
    for (const childDirHandle of dirEntries) {
      const { node: childNode, files: childFiles } = await traverseDirectory(
        childDirHandle,
        currentPath,
      );
      if (childNode.children.length > 0 || childNode.files.length > 0) {
        node.children.push(childNode);
      }
      collectedFiles = collectedFiles.concat(childFiles);
    }

    return { node, files: collectedFiles };
  };

  const openDirectory = async () => {
    try {
      if (!("showDirectoryPicker" in window)) {
        throw new Error("File System Access API is not supported in this browser.");
      }

      const dirHandle = (await window.showDirectoryPicker({
        mode: "read",
      })) as FileSystemDirectoryHandle;

      isScanning.value = true;
      error.value = null;
      allMediaFiles.value = [];
      rootNode.value = null;
      selectedDirectoryPath.value = null;
      selectedExtensions.value = [];

      const { node, files } = await traverseDirectory(dirHandle, "");

      rootNode.value = node;
      allMediaFiles.value = files;
      // Default selection to root if not empty
      if (node) {
        selectedDirectoryPath.value = node.path;
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error opening directory:", err);
        error.value = err.message || "Failed to open directory";
      }
    } finally {
      isScanning.value = false;
    }
  };

  const selectDirectory = (path: string) => {
    selectedDirectoryPath.value = path;
  };

  const filteredFiles = computed(() => {
    let files = allMediaFiles.value;

    if (searchQuery.value) {
      const lowerQuery = searchQuery.value.toLowerCase();
      files = files.filter((f) => f.name.toLowerCase().includes(lowerQuery));
    } else if (selectedDirectoryPath.value) {
      // Filter by selected directory and its subdirectories
      files = files.filter((f) => f.path.startsWith(selectedDirectoryPath.value!));
    }

    if (selectedExtensions.value.length > 0) {
      files = files.filter((f) => {
        const parts = f.name.split(".");
        if (parts.length > 1) {
          const ext = parts.pop()!.toLowerCase();
          return selectedExtensions.value.includes(ext);
        }
        return false;
      });
    }

    // Sort files
    files = [...files].sort((a, b) => {
      switch (sortBy.value) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "size_desc":
          return (b.size || 0) - (a.size || 0);
        case "size_asc":
          return (a.size || 0) - (b.size || 0);
        case "time_asc":
          return (a.lastModified || 0) - (b.lastModified || 0);
        case "time_desc":
        default:
          return (b.lastModified || 0) - (a.lastModified || 0);
      }
    });

    return files;
  });

  return {
    isScanning,
    error,
    rootNode,
    allMediaFiles,
    selectedDirectoryPath,
    searchQuery,
    selectedExtensions,
    sortBy,
    availableExtensions,
    filteredFiles,
    openDirectory,
    selectDirectory,
  };
}
