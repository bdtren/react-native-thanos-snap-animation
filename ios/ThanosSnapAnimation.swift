@objc(ThanosSnapAnimation)
class ThanosSnapAnimation: NSObject {

@objc(sayHello:withRejecter:)
  func sayHello(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    resolve("BDtren: Hello world!")
  }
}
