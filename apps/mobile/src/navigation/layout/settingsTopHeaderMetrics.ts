/** Compact navigation metrics used only by the Settings stack. */
export const SETTINGS_TOP_HEADER_PADDING_TOP = 0;
export const SETTINGS_TOP_HEADER_TITLE_FONT_SIZE = 20;
export const SETTINGS_TOP_HEADER_BUTTON_ROW_HEIGHT = 36;
export const SETTINGS_TOP_HEADER_PADDING_BOTTOM = 8;

export const SETTINGS_TOP_HEADER_BODY_HEIGHT =
  SETTINGS_TOP_HEADER_PADDING_TOP +
  SETTINGS_TOP_HEADER_BUTTON_ROW_HEIGHT +
  SETTINGS_TOP_HEADER_PADDING_BOTTOM;

/** Trimmed off the safe-area gap so the settings title sits closer to the top edge. */
export const SETTINGS_TOP_HEADER_SAFE_AREA_TRIM = 20;

/** Inset between the screen's top edge and the settings header row. */
export function getSettingsHeaderTopInset(safeAreaTop: number): number {
  return Math.max(0, safeAreaTop - SETTINGS_TOP_HEADER_SAFE_AREA_TRIM);
}

/** Breathing room between the bottom of the settings header and the first scroll content. */
export const SETTINGS_TOP_HEADER_CONTENT_GAP = 8;

export function getSettingsScrollPaddingTop(safeAreaTop: number): number {
  return (
    getSettingsHeaderTopInset(safeAreaTop) +
    SETTINGS_TOP_HEADER_BODY_HEIGHT +
    SETTINGS_TOP_HEADER_CONTENT_GAP
  );
}

export function getSettingsTopChromeFadeHeight(safeAreaTop: number): number {
  return getSettingsHeaderTopInset(safeAreaTop) + SETTINGS_TOP_HEADER_BODY_HEIGHT;
}
