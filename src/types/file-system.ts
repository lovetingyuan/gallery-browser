export type MediaType = "image" | "video" | "unknown";

export interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: "file";
  getFile(): Promise<File>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: "directory";
  values(): AsyncIterableIterator<
    FileSystemHandle | FileSystemFileHandle | FileSystemDirectoryHandle
  >;
}

export interface MediaFile {
  id: string; // Unique identifier (e.g., path)
  name: string;
  type: MediaType;
  handle: FileSystemFileHandle;
  path: string; // Virtual path
  size?: number;
  lastModified?: number;
}

export interface DirectoryNode {
  name: string;
  path: string; // Virtual path
  handle: FileSystemDirectoryHandle;
  children: DirectoryNode[];
  files: MediaFile[]; // Files directly in this directory
}
