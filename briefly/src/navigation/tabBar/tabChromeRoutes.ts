export const TAB_CHROME_MAIN_ROUTES = new Set(['index', 'history']);
/** Recents tab only; Library uses {@link LibraryFabChromeOverlay} at the root. */
export function tabRouteShowsRecordButton(routeName: string | undefined): boolean {
  return routeName === 'index';
}
