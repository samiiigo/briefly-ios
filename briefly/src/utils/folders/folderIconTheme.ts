import type { ColorPalette } from '@/theme/colorPalettes';
/** Icon badge fill behind built-in / user folder glyphs. */
export function folderIconBadgeBackground(
  accent: string,
  isUser: boolean,
  colors: ColorPalette,
): string {
  if (isUser || accent.startsWith('rgba')) {
    return colors.folderUserIconBackground;
  }
  const h = accent.replace('#', '');
  if (h.length !== 6) return colors.folderUserIconBackground;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${isUser ? 0.1 : 0.14})`;
}
/** List-row circular background for folder icons. */
export function folderListIconBackground(
  accent: string,
  isUser: boolean,
  colors: ColorPalette,
): string {
  if (isUser || accent.startsWith('rgba')) {
    return colors.folderUserIconBackground;
  }
  return `${accent}33`;
}
/** Foreground color for a folder tile icon. */
export function folderIconColor(
  folderType: 'built-in' | 'user',
  accent: string,
  colors: ColorPalette,
): string {
  return folderType === 'user' ? colors.folderUserIcon : accent;
}
