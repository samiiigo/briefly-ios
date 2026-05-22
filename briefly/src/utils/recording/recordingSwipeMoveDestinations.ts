import { BUILTIN_MOVE_ORDER } from '@/constants/builtInFolders';
import type { RecordingFolder , UserFolder } from '@/types';

export type MoveDestination =
  | { type: 'built-in'; id: RecordingFolder }
  | { type: 'user'; id: string; name: string };
export function buildRecordingMoveDestinations(folders: UserFolder[]): MoveDestination[] {
  const builtIn: MoveDestination[] = BUILTIN_MOVE_ORDER.map((id) => ({
    type: 'built-in' as const,
    id,
  }));
  const user = folders.map((folder) => ({
    type: 'user' as const,
    id: folder.id,
    name: folder.name,
  }));
  return [...builtIn, ...user];
}
