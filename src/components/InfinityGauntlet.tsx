import React, { useState, useEffect, useRef, useMemo, createRef } from 'react';
import {
  InteractionManager,
  LayoutRectangle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import Canvas, { Image as CanvasImage, ImageData } from 'react-native-canvas';
import posed from 'react-native-pose';
import {
  createBlankImageData,
  generateBlankCanvas,
  weightedRandomDistrib,
} from '../helpers/Utils';
import FileHelper from '../helpers/FileHelper';
import AppHelper from '../helpers/AppHelper';
import type { UIState } from './types/common.types';
import WebView from 'react-native-webview';

const DEFAULT_CANVAS_COUNT = 32;

const CanvasContainer = posed.View({
  visible: {
    delayChildren: 200,
    staggerChildren: 35,
    // filter: 'blur(0)',
  },
  hidden: {
    delayChildren: 200,
    staggerChildren: 35,
    // filter: 'blur(1px)',
  },
});

const OriginalElement = posed.View({
  visible: {
    opacity: 1,
    // filter: 'blur(0)',
    transition: {
      // visible staggerChildren * numberofCanvas + dust duration + delayChildren
      // 35*32 + 2000+200
      delay: 3320,
      duration: 1500,
    },
  },
  hidden: {
    opacity: 0,
    transition: { duration: 1000 },
    // filter: 'blur(1px)',
  },
});

export type InfinityGauntletProps = {
  children?: React.ReactNode;
  /**
   * (optional), default: `32`
   * Number of canvas use for dust animation, the more canvas the more smooth look on the animation, but also more lagging and slower initial
   */
  canvasCount?: number;
  /**
   * (optional), default: `2`
   * Index of the component in UI stack, use this if you want to bring your UI to front
   */
  zIndex?: number;
  /**
   * (optional)
   * Set the snap animation state
   */
  snap?: boolean;
  /**
   * (optional)
   * Flag to reduce re-init the animation canvas when you update the main component
   */
  disablePrepareOnReload?: boolean;
  /**
   * (optional), default: `true`
   * Move some heavy function to webview, this can reduce some time but may not supported in big components or some devices with low memory heap
   */
  useWebViewHandler?: boolean;
  /**
   * (optional)
   * Trigger when dust animation initialization start
   */
  onAnimationPrepare?: () => any;
  /**
   * (optional)
   * Trigger when dust animation is ready to use
   */
  onAnimationReady?: () => any;
  /**
   * (optional)
   * Trigger when there is an error in the component functions
   */
  onError?: (error?: any) => any;
  /**
   * (optional)
   * Trigger when snap animation is completed
   */
  onAnimationCompleted?: (state?: UIState) => any;
  /**
   * (optional)
   * Style of the Wrapper
   */
  style?: StyleProp<ViewStyle>;
  /**
   * (optional)
   * Style of the Main UI component
   */
  originalElementStyle?: StyleProp<ViewStyle>;
  /**
   * (optional)
   * Style of the dust canvas list
   */
  canvasContainerStyle?: StyleProp<ViewStyle>;
};

const InfinityGauntlet: React.FC<InfinityGauntletProps> = ({
  children,
  canvasCount = DEFAULT_CANVAS_COUNT,
  zIndex = 2,
  snap = false,
  disablePrepareOnReload,
  useWebViewHandler = true,
  onAnimationPrepare,
  onAnimationReady,
  onError,
  onAnimationCompleted,
  style,
  originalElementStyle,
  canvasContainerStyle,
}) => {
  //States
  const [imgUrl, setImgUrl] = useState('');
  const [imgBase64, setImgBase64] = useState('');
  const [snapLayout, setSnapLayout] = useState<LayoutRectangle>();
  const [state, setState] = useState<UIState>('visible');
  const [drawComplete, setDrawComplete] = useState(false); //Draw view sanpshot to canvas
  const [_particleVisibility, setParticleVisibility] = useState(true);
  const [animationReady, setAnimationReady] = useState(false);
  const [error, setError] = useState<any>('');
  //Refs
  const webviewRef = useRef<WebView>(null);
  const webViewReceivedValueRef = useRef('');
  const viewshotRef = useRef<ViewShot>(null);
  const imgUrlRef = useRef(imgUrl);
  const canvasRef = useRef<Canvas>();
  const particleRefs = useRef(
    Array.from({ length: canvasCount }, (_) => createRef<Canvas>())
  );
  const imageDataArrayRef = useRef<number[][]>([]);

  const canvases = useMemo(() => {
    return generateBlankCanvas(particleRefs, state, canvasCount, zIndex);
  }, [state, canvasCount, zIndex]);
  //Effects
  useEffect(() => {
    if (!disablePrepareOnReload || !imgUrlRef.current) {
      //FIXME: to prevent it reload multiple times
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          viewshotRef.current
            ?.capture?.()
            ?.then((url) => {
              // console.log('capture img --,>', url);
              setImgUrl(url);
              imgUrlRef.current = url;
            })
            ?.catch((e) => {
              // console.log('capture err --,>', e);
              setError(e);
            });
        }, 300);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    loadSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgUrl, snapLayout]);
  useEffect(() => {
    if (!!canvasRef.current && drawComplete) {
      setError('');
      handleSnap(canvasRef.current, snap, imgBase64);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawComplete, imgBase64, snap]);
  useEffect(() => {
    if (animationReady) {
      onAnimationReady?.();
    } else {
      onAnimationPrepare?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationReady]);
  useEffect(() => {
    if (!error && (error + '')?.length) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleCanvas = (canvas: Canvas) => {
    if (!canvas) {
      return;
    }
    canvasRef.current = canvas;
  };

  const loadSnapshot = async () => {
    setError('');
    if (canvasRef.current && imgUrl && snapLayout?.width) {
      canvasRef.current.width = snapLayout?.width;
      canvasRef.current.height = snapLayout?.height;

      const image = new CanvasImage(canvasRef.current);
      // image.crossOrigin = 'Anonymous';
      image.src = await FileHelper.base64File(imgUrl);
      setImgBase64(image.src);
      const context = canvasRef.current?.getContext('2d');

      image.addEventListener('error', (props) => {
        console.log('image load error --,>', props);
        setError(props);
      });

      image.addEventListener('load', async (_props) => {
        context.drawImage(image, 0, 0, snapLayout?.width, snapLayout?.height);
        setTimeout(() => {
          setError('');
          setDrawComplete(true);
        }, 20);
      });
    }
  };

  async function handleSnap(
    canvas: Canvas,
    lSnap: boolean,
    lImgBase64: string
  ) {
    try {
      setParticleVisibility(true);
      if (!imageDataArrayRef.current?.length) {
        setAnimationReady(false);
        const w = Math.floor(canvas.width) * 3;
        const h = Math.floor(canvas.height) * 3;

        const pixelArrLength = h * w * 4; // pixelArr?.length;
        var pixelArr = await FileHelper.base64PNGToByteArray(lImgBase64); //await FileHelper.getCanvasImageData(canvas);

        if (useWebViewHandler) {
          webViewReceivedValueRef.current = '';
          await fetch('https://chancejs.com/chance.min.js')
            .then((res) => res.text())
            .then((res) => {
              webviewRef.current?.injectJavaScript(res);
            })
            .catch(console.log);

          webviewRef.current?.injectJavaScript(`
            const chance = new Chance();
            function weightedRandomDistrib(peak, canvasCount) {
              var prob = [],
                seq = [];
              for (let i = 0; i < canvasCount; i++) {
                prob.push(Math.pow(canvasCount - Math.abs(peak - i), 3));
                seq.push(i);
              }
              return chance.weighted(seq, prob);
            }

            setTimeout(() => {
              let pixelArr = JSON.parse("${JSON.stringify(pixelArr)}");
              const imageDataArray = Array.from({ length: ${canvasCount} }, (_) =>
                Array.from({ length: ${pixelArrLength} }, (__) => 0)
              );

              for (let i = 0; i < ${pixelArrLength}; i += 4) {
                //Find the highest probability canvas the pixel should be in
                let p = Math.floor((i / ${pixelArrLength}) * ${canvasCount});

                const rand = weightedRandomDistrib(p, ${canvasCount});

                let a = imageDataArray[rand];

                if (a) {
                  a[i] = pixelArr[i] ?? 0;
                  a[i + 1] = pixelArr[i + 1] ?? 0;
                  a[i + 2] = pixelArr[i + 2] ?? 0;
                  a[i + 3] = pixelArr[i + 3] ?? 0;
                }
              }

              try {
                const resStr = JSON.stringify(imageDataArray);
                // alert('str length: ' + resStr?.length)
                const charsPerChunk = 150000;
                let len = 0;
                let index = 0;
                while (len < resStr?.length) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    index,
                    value: resStr?.slice(len, len + charsPerChunk),
                    isEnd: (len + charsPerChunk) >= resStr?.length
                  }));

                  index++;
                  len += charsPerChunk;
                }
              } catch (e) {
                // alert(12, e, e?.message);
              }
            }, 450);
          `);
          return;
        } else {
          imageDataArrayRef.current = createBlankImageData(
            pixelArrLength,
            canvasCount
          );
          // console.log('len --,>', pixelArr?.length, pixelArrLength);

          for (let i = 0; i < pixelArrLength; i += 4) {
            //Find the highest probability canvas the pixel should be in
            let p = Math.floor((i / pixelArrLength) * canvasCount);
            const rand = weightedRandomDistrib(p, canvasCount);
            let a = imageDataArrayRef.current[rand];
            if (a) {
              a[i] = pixelArr[i] ?? 0;
              a[i + 1] = pixelArr[i + 1] ?? 0;
              a[i + 2] = pixelArr[i + 2] ?? 0;
              a[i + 3] = pixelArr[i + 3] ?? 0;
            }
          }

          await Promise.all([
            ...particleRefs.current.map(async (ref, idx) => {
              if (ref.current) {
                ref.current.width = w / 3;
                ref.current.height = h / 3;
                const ctx2 = ref.current.getContext('2d');
                try {
                  ctx2.putImageData(
                    new ImageData(
                      ref.current,
                      imageDataArrayRef.current[idx] as any,
                      w,
                      h
                    ),
                    0,
                    0
                  );
                  // console.log('putImageData s--,>', idx, imageDataArray[idx]?.length % 4);
                } catch (e) {
                  // console.log('putImageData e--,>', idx, imageDataArray[idx]?.length % 4);
                }
              }
              await AppHelper.delay(1);
            }),
          ]);
          setAnimationReady(true);
        }
      } else {
        setAnimationReady(true);
      }
      if (!lSnap || !canvasRef.current) {
        setState('visible');
      } else {
        setState('hidden');
      }
    } catch (e) {
      console.log('handleSnap error --,>', e);
      setError(e);
    }
  }

  const renderHiddenWebview = () => {
    return (
      <WebView
        ref={webviewRef}
        style={styles.hiddenWebview}
        containerStyle={styles.hiddenWebview}
        source={{
          html: `<body></body>`,
        }}
        onMessage={async (e) => {
          let data: any = {};
          try {
            data = JSON.parse(e?.nativeEvent?.data);
            webViewReceivedValueRef.current += data?.value;
          } catch (err) {}
          // console.log('received --,>', data?.index, data?.isEnd);
          if (data?.isEnd && canvasRef?.current) {
            imageDataArrayRef.current = JSON.parse(
              webViewReceivedValueRef.current
            );
            await AppHelper.delay(1);
            const w = Math.floor(canvasRef.current.width) * 3;
            const h = Math.floor(canvasRef.current.height) * 3;

            await Promise.all([
              ...particleRefs.current.map(async (ref, idx) => {
                if (ref.current) {
                  ref.current.width = w / 3;
                  ref.current.height = h / 3;
                  const ctx2 = ref.current.getContext('2d');
                  try {
                    ctx2.putImageData(
                      new ImageData(
                        ref.current,
                        imageDataArrayRef.current[idx] as any,
                        w,
                        h
                      ),
                      0,
                      0
                    );
                    // console.log('putImageData s--,>', idx, imageDataArray[idx]?.length % 4);
                  } catch (err) {
                    // console.log('putImageData e--,>', idx, imageDataArray[idx]?.length % 4);
                  }
                }
                await AppHelper.delay(1);
              }),
            ]);
            setAnimationReady(true);
          }
        }}
        injectedJavaScript={''}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: snapLayout?.width ?? 'auto',
          height: snapLayout?.height ?? 'auto',
        },
        style,
      ]}
    >
      <OriginalElement
        pose={state}
        onPoseComplete={() => {
          //FIXME: there is 1.4s animation left somewhere when the onPoseComplete is triggered
          setTimeout(
            () => {
              if (state === 'visible') {
                setParticleVisibility(false);
              }
              onAnimationCompleted?.(state);
            },
            state === 'visible' ? 0 : 1400
          );
        }}
        style={[styles.originalElement, { zIndex }, originalElementStyle]}
      >
        <Canvas
          ref={handleCanvas}
          originWhitelist={['*']}
          style={[
            styles.image,
            {
              width: snapLayout?.width ?? 'auto',
            },
          ]}
        />
        <ViewShot
          ref={viewshotRef}
          options={{
            fileName: 'InfinityGauntlet-snapshot',
            format: 'png',
            quality: 1,
          }}
          style={styles.snapshot}
          onLayout={(l) => {
            setSnapLayout(l?.nativeEvent?.layout);
          }}
        >
          {children}
        </ViewShot>
      </OriginalElement>
      <CanvasContainer
        style={[
          {
            // display: _particleVisibility ? 'block' : 'none', //FIXME: view accidently disappear on set to visible
          },
          canvasContainerStyle,
        ]}
        key={1}
        pose={state}
      >
        {canvases}
      </CanvasContainer>
      {useWebViewHandler ? renderHiddenWebview() : undefined}
    </View>
  );
};

export default InfinityGauntlet;

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  container: {
    // flex: 1,
  },
  originalElement: {
    position: 'absolute',
    // zIndex: 2,
  },
  snapshot: {
    position: 'absolute',
  },
  image: {},
  hiddenWebview: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
});
