import './shim';
import { NativeModules, Platform } from 'react-native';
import InfinityGauntlet from './components/InfinityGauntlet';

const LINKING_ERROR =
  `The package 'react-native-thanos-snap-animation' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const ThanosSnapAnimation = NativeModules.ThanosSnapAnimation
  ? NativeModules.ThanosSnapAnimation
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function sayHello(): Promise<string> {
  return ThanosSnapAnimation.sayHello();
}

export { InfinityGauntlet };
