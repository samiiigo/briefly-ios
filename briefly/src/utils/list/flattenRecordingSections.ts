import { Recording } from '@/types';

export const RECORDING_LIST_ITEM_GAP = 8;
/** Space between a group label (Today, Yesterday, …) and the first card below it. */
export const RECORDING_LIST_HEADER_GAP = 7;
export const RECORDING_LIST_SECTION_GAP = 8;

export type FlatRecordingListItem =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'recording'; id: string; item: Recording }
  | { kind: 'spacer'; id: string; height: number };

/** Flattens SectionList-style sections into rows for FlashList. */
export function flattenRecordingSections(
  sections: ReadonlyArray<{ title: string; data: Recording[] }>,
  sectionGap = RECORDING_LIST_SECTION_GAP,
): FlatRecordingListItem[] {
  const rows: FlatRecordingListItem[] = [];

  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) {
      rows.push({
        kind: 'spacer',
        id: `section-gap-${sectionIndex}`,
        height: sectionGap,
      });
    }

    if (section.title) {
      rows.push({
        kind: 'header',
        id: `header-${sectionIndex}-${section.title}`,
        title: section.title,
      });
    }

    for (const item of section.data) {
      rows.push({ kind: 'recording', id: item.id, item });
    }
  });

  return rows;
}
