export const DEFAULT_RECORDING_FLASH_LIST_DRAW_DISTANCE = 400;
export function recordingFlashListScrollProps(options: {
  drawDistance?: number;
  onScrollBeginDrag?: () => void;
  onMomentumScrollBegin?: () => void;
}) {
  return {
    drawDistance: options.drawDistance ?? DEFAULT_RECORDING_FLASH_LIST_DRAW_DISTANCE,
    showsVerticalScrollIndicator: false as const,
    onScrollBeginDrag: options.onScrollBeginDrag,
    onMomentumScrollBegin: options.onMomentumScrollBegin,
  };
}
