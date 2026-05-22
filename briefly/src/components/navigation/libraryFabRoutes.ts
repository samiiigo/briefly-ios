export function folderIdFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/(?:^|\/)folder\/([^/]+)\/?$/);
  return match?.[1];
}

export function routeParamString(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Library tab and folder list; folder detail uses {@link FolderChromeOverlay}. */
export function pathnameShowsLibraryFab(pathname: string): boolean {
  return pathname === '/history' || pathname === '/folder';
}
