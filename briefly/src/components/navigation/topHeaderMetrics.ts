/** Top padding on RecentsHeader / LibraryHeader. */
export const TOP_HEADER_PADDING_TOP = 8;

/** Circular action button row height. */
export const TOP_HEADER_BUTTON_ROW_HEIGHT = 44;

/** Bottom padding below the header action row. */
export const TOP_HEADER_PADDING_BOTTOM = 8;

export const TOP_HEADER_BODY_HEIGHT =
  TOP_HEADER_PADDING_TOP + TOP_HEADER_BUTTON_ROW_HEIGHT + TOP_HEADER_PADDING_BOTTOM;

export function getScrollPaddingTop(safeAreaTop: number): number {
  return safeAreaTop + TOP_HEADER_BODY_HEIGHT;
}
