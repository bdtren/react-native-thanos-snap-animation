import React from 'react';
import Chance from 'chance';
import Dust from '../components/Dust';
import { UIState } from '../components/types/common.types';
import Canvas from 'react-native-canvas';
const chance = new Chance();

export function weightedRandomDistrib(peak: number, canvasCount: number) {
  var prob = [],
    seq = [];
  for (let i = 0; i < canvasCount; i++) {
    prob.push(Math.pow(canvasCount - Math.abs(peak - i), 3));
    seq.push(i);
  }
  return chance.weighted(seq, prob);
}

export function createBlankImageData(length: number, canvasCount: number) {
  const imageDataArray: number[][] = Array.from({ length: canvasCount }, (_) =>
    Array.from({ length }, (__) => 0)
  );
  return imageDataArray;
}

export function generateBlankCanvas(
  refs: React.MutableRefObject<React.RefObject<Canvas>[]>,
  state: UIState,
  canvasCount: number,
  zIndex: number
) {
  const canvases = [];
  for (let a = 0; a < canvasCount; a++) {
    const canvasStyle = {
      position: 'absolute',
      zIndex: zIndex - 1,
    };

    const dustProps: any = {
      key: a,
      style: canvasStyle,
      pose: state,
      x: 75,
      y: -75,
      rotate: chance.integer({ min: -20, max: 20 }),
      forwardedRef: refs.current[a],
    };

    canvases.push(
      <Dust
        {...dustProps}
        canvasProps={{
          ref: refs.current[a],
        }}
      />
    );
  }
  return canvases;
}
