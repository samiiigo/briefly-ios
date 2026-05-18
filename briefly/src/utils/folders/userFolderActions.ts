import { Alert, Platform } from 'react-native';

export interface UserFolderActionHandlers {
  onRename: (newName: string) => void | Promise<void>;
  onDelete: () => void;
  onTogglePin: () => void | Promise<void>;
}

/**
 * Shows a folder action menu. On iOS, rename uses Alert.prompt inline.
 * On Android, calls `onPromptRename` so the caller can render a TextInputDialog.
 */
export function showUserFolderActions(
  folderName: string,
  pinned: boolean,
  handlers: UserFolderActionHandlers,
  onPromptRename?: () => void,
): void {
  const buttons: {
    text: string;
    style?: 'destructive' | 'cancel';
    onPress?: () => void;
  }[] = [
    {
      text: 'Rename',
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
            folderName
          );
        } else if (onPromptRename) {
          onPromptRename();
        }
      },
    },
    {
      text: pinned ? 'Unpin' : 'Pin',
      onPress: () => void handlers.onTogglePin(),
    },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: handlers.onDelete,
    },
    { text: 'Cancel', style: 'cancel' },
  ];

  Alert.alert(folderName, undefined, buttons);
}
