/**
 * In-memory transit store for complex navigation params that can't be
 * URL-serialized (e.g. arrays of objects). Set before navigation,
 * consume on the destination screen.
 */
import type { TranscriptSegment } from '@/types';
interface TransitData {
  preTranscript?: TranscriptSegment[];
}
let _transit: TransitData = {};
export function setTransitData(data: Partial<TransitData>) {
  _transit = { ..._transit, ...data };
}
export function consumeTransitData(): TransitData {
  const data = _transit;
  _transit = {};
  return data;
}
