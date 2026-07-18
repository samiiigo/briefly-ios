import type { Recording, UserFolder } from '@/shared/types';

function recordingUpdatedAt(recording: Recording): number {
  return recording.updatedAt ?? recording.deletedAt ?? recording.createdAt;
}

function folderUpdatedAt(folder: UserFolder): number {
  return folder.updatedAt ?? folder.pinnedAt ?? 0;
}

export function mergeRecordingsByUpdatedAt(local: Recording[], remote: Recording[]): Recording[] {
  const byId = new Map<string, Recording>();
  for (const recording of local) {
    byId.set(recording.id, recording);
  }
  for (const remoteRecording of remote) {
    const existing = byId.get(remoteRecording.id);
    if (!existing || recordingUpdatedAt(remoteRecording) >= recordingUpdatedAt(existing)) {
      byId.set(remoteRecording.id, remoteRecording);
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function mergeFoldersByUpdatedAt(local: UserFolder[], remote: UserFolder[]): UserFolder[] {
  const byId = new Map<string, UserFolder>();
  for (const folder of local) {
    byId.set(folder.id, folder);
  }
  for (const remoteFolder of remote) {
    const existing = byId.get(remoteFolder.id);
    if (!existing || folderUpdatedAt(remoteFolder) >= folderUpdatedAt(existing)) {
      byId.set(remoteFolder.id, remoteFolder);
    }
  }
  return Array.from(byId.values());
}

export { recordingUpdatedAt, folderUpdatedAt };
