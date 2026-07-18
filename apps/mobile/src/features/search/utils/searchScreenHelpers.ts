import { Keyboard, PanResponder } from 'react-native';
export const SEARCH_KEYBOARD_DISMISS_MOVE_THRESHOLD = 4;
export function formatRecordingResultCount(count: number): string {
  return count === 1 ? '1 result' : `${count} results`;
}
export function createSearchKeyboardDismissHandlers(
  onDismiss: () => void,
): ReturnType<typeof PanResponder.create>['panHandlers'] {
  return PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
      const moved =
        Math.abs(gestureState.dx) > SEARCH_KEYBOARD_DISMISS_MOVE_THRESHOLD ||
        Math.abs(gestureState.dy) > SEARCH_KEYBOARD_DISMISS_MOVE_THRESHOLD;
      if (moved) {
        onDismiss();
      }
      return false;
    },
  }).panHandlers;
}
export function dismissSearchKeyboard(onSubmit: () => void): void {
  onSubmit();
  Keyboard.dismiss();
}
