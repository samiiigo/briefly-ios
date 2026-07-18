import type { EventSubscription } from 'expo-modules-core';

import type { BrieflyTranscriberModuleEvents, SummarizeResult } from './src/BrieflyTranscriber.types';
import { getBrieflyTranscriberModule } from './src/BrieflyTranscriberModule';

export type { SummarizeResult, BrieflyTranscriberModuleEvents } from './src/BrieflyTranscriber.types';
export { getBrieflyTranscriberModule } from './src/BrieflyTranscriberModule';

type EventfulModule = {
  addListener<EventName extends keyof BrieflyTranscriberModuleEvents>(
    eventName: EventName,
    listener: BrieflyTranscriberModuleEvents[EventName]
  ): EventSubscription;
};

export function addBrieflyTranscriberListener<EventName extends keyof BrieflyTranscriberModuleEvents>(
  eventName: EventName,
  listener: BrieflyTranscriberModuleEvents[EventName]
): EventSubscription {
  const module = getBrieflyTranscriberModule() as EventfulModule | null;
  if (!module?.addListener) {
    throw new Error('BrieflyTranscriber is not available.');
  }
  return module.addListener(eventName, listener);
}

export async function summarize(text: string): Promise<SummarizeResult> {
  const module = getBrieflyTranscriberModule();
  if (!module) {
    throw new Error(
      'BrieflyTranscriber is not available. Rebuild the dev client after `npx expo prebuild --clean`.'
    );
  }
  return module.summarize(text);
}

/** @deprecated Use `getBrieflyTranscriberModule()` — may be null before native rebuild. */
export default getBrieflyTranscriberModule();
