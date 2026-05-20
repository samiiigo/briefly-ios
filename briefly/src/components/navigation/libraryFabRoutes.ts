export function folderIdFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/^\/folder\/([^/]+)$/);
  return match?.[1];
}

export function pathnameShowsLibraryFab(pathname: string): boolean {
  if (pathname === '/history' || pathname === '/folder') return true;
  return /^\/folder\/[^/]+$/.test(pathname);
}
