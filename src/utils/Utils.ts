/**
 * Util class
 */
export class Utils {
  /**
   * Returns the value of a query parameter
   * or the default value
   * @param {string} name of the parameter
   * @param {string} defaultValue value to return in case the parameter is absent
   * @return {string} value of the parameter or default value
   */
  static getParam(name: string, defaultValue: string): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || defaultValue;
  }
}
