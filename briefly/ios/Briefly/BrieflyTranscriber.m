// BrieflyTranscriber.m — Objective-C bridge for React Native

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BrieflyTranscriber, RCTEventEmitter)

// Live transcription (records + transcribes simultaneously, on-device)
RCT_EXTERN_METHOD(startLiveTranscription:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(pauseLiveTranscription:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(resumeLiveTranscription:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopLiveTranscription:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Post-recording file transcription
RCT_EXTERN_METHOD(transcribeFile:(NSString *)filePath)

// On-device summarization
RCT_EXTERN_METHOD(summarize:(NSString *)text
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
