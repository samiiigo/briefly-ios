export type RecordingSession = {
  id: string;
  startedAt: string;
};

export async function startRecording(): Promise<RecordingSession> {
  return {
    id: `${Date.now()}`,
    startedAt: new Date().toISOString(),
  };
}

export async function pauseRecording(): Promise<void> {
  return;
}

export async function stopRecording(): Promise<void> {
  return;
}
