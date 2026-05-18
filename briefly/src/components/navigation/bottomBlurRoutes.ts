/** Recording routes that use {@link BottomChromeOverlay} `variant="playback"` for bottom blur. */
export function pathnameUsesPlaybackBarBlur(pathname: string): boolean {
  if (pathname === '/recording/transcript') return true;
  if (pathname === '/recording/new' || pathname.endsWith('/summarizing')) {
    return false;
  }
  return /^\/recording\/[^/]+$/.test(pathname);
}

/** Routes under the tabs layout (blur via {@link NavigatorBottomBlur} `scope="tabs"`). */
export function pathnameUsesTabsLayoutBlur(pathname: string): boolean {
  if (pathname.includes('(tabs)')) return true;
  return pathname === '/' || pathname === '/index' || pathname === '/history';
}

/** Root stack screens (blur via {@link NavigatorBottomBlur} `scope="root"`). */
export function pathnameUsesRootStackBlur(pathname: string): boolean {
  return (
    pathname === '/settings' ||
    pathname.includes('transcription-mode') ||
    pathname.includes('processing-mode') ||
    pathname.includes('folder-layout')
  );
}
