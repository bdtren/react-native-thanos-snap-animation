import Canvas, { ImageData } from 'react-native-canvas';
import AppHelper from './AppHelper';
import { PNG } from 'pngjs';

const MAX_EXTEND = 221;
const MAX_EXTEND_SQUARE = MAX_EXTEND * MAX_EXTEND;
export default class FileHelper {
  static base64File = async (url: string) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data =
          typeof reader.result === 'string'
            ? reader.result
            : Buffer.from(reader.result).toString(); //reader.result;
        resolve(base64data);
      };
    });
  };

  /**
   * Use canvas context to fetch image data, really slow
   * @param canvas {Canvas}
   * @returns {number[]} the array of pixel rgba [r0, g0, b0, a0, r1, g1, b1, a1, ...]
   */
  static getCanvasImageData = async (canvas: Canvas) => {
    const w = Math.floor(canvas.width) * 3;
    const h = Math.floor(canvas.height) * 3;
    const ctx = canvas.getContext('2d');
    let data: number[] = Array.from({ length: 4 * w * h }, (_) => 0);

    let x = 0,
      y = 0,
      count = 0;
    const promiseMap = new Map<number, Promise<ImageData>>();
    while (/*x < w ||*/ y <= h) {
      const currW = MAX_EXTEND_SQUARE > w ? w : MAX_EXTEND_SQUARE;
      const currH = Math.floor(
        MAX_EXTEND_SQUARE / currW + y > h ? h : MAX_EXTEND_SQUARE / currW
      );

      // const dt = await ctx.getImageData(x, y, currW, currH);
      // const vals = Object.values(dt.data);
      // vals?.forEach((it, idx) => {
      //   data[idx + count] = it;
      // });
      promiseMap.set(count, ctx.getImageData(x, y, currW, currH));

      x = currW < w ? x + currW : 0;
      y = currW < w ? currH : y + currH;
      count += currW * currH * 4;
    }

    await Promise.all([
      ...[...(promiseMap?.keys() ?? [])]?.map(async (prmK) => {
        const dt = await promiseMap.get(prmK);
        const vals = Object.values(dt?.data ?? {});
        vals?.forEach((it, idx) => {
          data[idx + prmK] = it;
        });
      }),
    ]);

    // return new ImageData(canvas, data, w, h);
    return data;
  };

  /**
   * Use base64 image to fetch image data, fast
   * @param imgBase64 {string} base64 string of view snapshot
   * @returns {number[]} the array of pixel rgba [r0, g0, b0, a0, r1, g1, b1, a1, ...]
   */
  static base64PNGToByteArray = async (imgBase64: string) => {
    let parts = imgBase64.split(';');
    // let mimeType = parts[0].split(':')[1];
    let imageData = parts[1]?.split(',')[1] ?? '';

    const png = PNG.sync.read(Buffer.from(imageData, 'base64'));
    const data = Uint8ClampedArray.from(png.data);

    let finalData: number[] = Object.values(data);
    await AppHelper.delay(1);
    return finalData;
  };
}
