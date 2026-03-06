// BrieflyTranscriber.m — Objective-C bridge for React Native

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BrieflyTranscriber, RCTEventEmitter)

RCT_EXTERN_METHOD(transcribeFile:(NSString *)filePath)

RCT_EXTERN_METHOD(summarize:(NSString *)text
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
