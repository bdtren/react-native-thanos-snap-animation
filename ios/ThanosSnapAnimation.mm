#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ThanosSnapAnimation, NSObject)

RCT_EXTERN_METHOD(sayHello:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
