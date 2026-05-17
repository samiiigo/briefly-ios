/** Tab routes that show the floating tab pill and record FAB (kept in sync). */
export const TAB_CHROME_MAIN_ROUTES = new Set(['index', 'history']);

export function tabRouteShowsRecordButton(routeName: string | undefined): boolean {
  return routeName != null && TAB_CHROME_MAIN_ROUTES.has(routeName);
}
