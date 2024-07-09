export default class AppHelper {
  static delay = (ms: any) => new Promise((res) => setTimeout(res, ms));
}
