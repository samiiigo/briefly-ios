using Microsoft.ReactNative.Managed;
using System;
using System.Collections.Generic;

namespace Briefly.Windows
{
    [ReactModule("BrieflySpeechModule")]
    public sealed class BrieflySpeechModule
    {
        private DateTimeOffset _startedAt;

        [ReactMethod("isAvailable")]
        public bool IsAvailable() => true;

        [ReactMethod("startTranscription")]
        public void StartTranscription()
        {
            _startedAt = DateTimeOffset.UtcNow;
        }

        [ReactMethod("stopTranscription")]
        public Dictionary<string, object> StopTranscription()
        {
            var duration = (int)(DateTimeOffset.UtcNow - _startedAt).TotalSeconds;
            return new Dictionary<string, object>
            {
                ["text"] = "Windows transcription placeholder from speech bridge",
                ["durationSeconds"] = duration
            };
        }
    }
}
