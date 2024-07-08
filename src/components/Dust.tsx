import React from 'react';
import {ViewProps} from 'react-native';
import Canvas, {CanvasProps} from 'react-native-canvas';
import posed from 'react-native-pose';

const DustCanvas = posed.View({
  visible: {
    opacity: 1,
    transition: {duration: 2000},
    // filter: 'blur(0)',
    y: 0,
    x: 0,
    rotate: '0deg',
  },
  hidden: {
    opacity: 0,
    y: (props: any) => props.y,
    x: (props: any) => props.x,
    rotate: (props: any) => props?.rotate + 'deg',
    transition: {duration: 2000},
    // filter: 'blur(2px)',
  },
});

export default function Dust({
  canvasProps,
  ...props
}: ViewProps & {canvasProps: CanvasProps}) {
  return (
    <DustCanvas {...props}>
      <Canvas {...canvasProps} ref={canvasProps?.ref} />
    </DustCanvas>
  );
}
