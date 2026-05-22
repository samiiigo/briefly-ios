import type { AnchoredMenuItem } from '@/components/ui/AnchoredOverflowMenu';
import { BUILT_IN_FOLDERS } from '@/constants/builtInFolders';
import type { MoveDestination } from './recordingSwipeMoveDestinations';
export interface RecordingRowMenuParams {
  isRecentlyDeleted: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  shareBusy: boolean;
  hasRename: boolean;
  hasRestore: boolean;
  onRename: () => void;
  onRestore: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onMove: () => void;
  onDelete: () => void;
}
export function buildRecordingRowMenuItems(params: RecordingRowMenuParams): AnchoredMenuItem[] {
  const deleteLabel = params.isRecentlyDeleted ? 'Delete Forever' : 'Delete';
  const items: AnchoredMenuItem[] = [];
  if (params.isRecentlyDeleted) {
    if (params.hasRename) {
      items.push({ label: 'Rename', onPress: params.onRename });
    }
    if (params.hasRestore) {
      items.push({ label: 'Recover', onPress: params.onRestore });
    }
    items.push({ label: 'Share', onPress: params.onShare, disabled: params.shareBusy });
    items.push({ label: deleteLabel, onPress: params.onDelete });
    return items;
  }
  items.push({
    label: params.isFavorite ? 'Unfavorite' : 'Favorite',
    onPress: params.onToggleFavorite,
  });
  items.push({ label: 'Share', onPress: params.onShare, disabled: params.shareBusy });
  if (params.hasRename) {
    items.push({ label: 'Rename', onPress: params.onRename });
  }
  items.push({
    label: params.isArchived ? 'Unarchive' : 'Archive',
    onPress: params.isArchived ? params.onUnarchive : params.onArchive,
  });
  items.push({ label: 'Move to…', onPress: params.onMove });
  items.push({ label: deleteLabel, onPress: params.onDelete });
  return items;
}
export function moveDestinationLabel(dest: MoveDestination): string {
  if (dest.type === 'built-in') {
    return BUILT_IN_FOLDERS.find((f) => f.id === dest.id)!.name;
  }
  return dest.name;
}
