/** Recording routes that use {@link BottomChromeOverlay} `variant="playback"` for bottom blur. */
export function pathnameUsesPlaybackBarBlur(pathname: string): boolean {
  if (pathname === '/recording/new') {
    return false;
  }
  return /^\/recording\/[^/]+$/.test(pathname);
}

/** Recording stack routes that mount their own bottom chrome (controls above the fade). */
export function pathnameHasOwnRecordingBottomChrome(pathname: string): boolean {
  return pathname === '/recording/new' || pathname.endsWith('/recording/new');
}

/** Layout-level bottom blur for the recording navigator. */
export function pathnameUsesRecordingNavigatorBlur(pathname: string): boolean {
  if (pathnameHasOwnRecordingBottomChrome(pathname)) return false;
  return !pathnameUsesPlaybackBarBlur(pathname);
}

/** Routes under the tabs layout (blur via {@link NavigatorBottomBlur} `scope="tabs"`). */
export function pathnameUsesTabsLayoutBlur(pathname: string): boolean {
  if (pathname.includes('(tabs)')) return true;
  return pathname === '/' || pathname === '/index' || pathname === '/history';
}

/** Root stack screens (blur via {@link NavigatorBottomBlur} `scope="root"`). */
export function pathnameUsesRootStackBlur(pathname: string): boolean {
  return (
    pathname === '/search' ||
    pathname === '/settings' ||
    pathname.includes('transcription-mode') ||
    pathname.includes('processing-mode') ||
    pathname.includes('folder-layout')
  );
}
