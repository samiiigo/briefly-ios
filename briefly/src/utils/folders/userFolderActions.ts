import { Alert, Platform } from 'react-native';
import type { AnchoredMenuItem } from '@/components/ui/AnchoredOverflowMenu';

export interface UserFolderActionHandlers {
  onRename: (newName: string) => void | Promise<void>;
  onDelete: () => void;
  onTogglePin: () => void | Promise<void>;
}

/**
 * Folder long-press / options menu items. On iOS, rename uses Alert.prompt inline.
 * On Android, calls `onPromptRename` so the caller can render a TextInputDialog.
 */
export function buildUserFolderMenuItems(
  folderName: string,
  pinned: boolean,
  handlers: UserFolderActionHandlers,
  onPromptRename?: () => void,
): AnchoredMenuItem[] {
  return [
    {
      label: 'Rename',
      onPress: () => {
        if (Platform.OS === 'ios') {
          Alert.prompt(
            'Rename Folder',
            undefined,
            (text) => {
              const trimmed = text?.trim();
              if (trimmed) void handlers.onRename(trimmed);
            },
            'plain-text',
            folderName,
          );
        } else if (onPromptRename) {
          onPromptRename();
        }
      },
    },
    {
      label: pinned ? 'Unpin' : 'Pin',
      onPress: () => void handlers.onTogglePin(),
    },
    {
      label: 'Delete',
      onPress: handlers.onDelete,
    },
  ];
}
