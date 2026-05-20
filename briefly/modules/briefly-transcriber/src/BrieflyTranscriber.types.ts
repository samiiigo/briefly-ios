export type SummarizeResult = {
  summary: string;
  keyInsights: string[];
};

export type BrieflyTranscriberModuleEvents = {
  onPartialTranscript: (event: { text: string }) => void;
  onFinalTranscript: (event: { text: string }) => void;
  onStreamingState: (event: { state: string; reason?: string | null }) => void;
  onTranscriptSegment: (event: Record<string, unknown>) => void;
  onTranscriptionComplete: (event: Record<string, unknown>) => void;
  onTranscriptionError: (event: { message: string }) => void;
  onPCMChunk: (event: { data: string }) => void;
};
