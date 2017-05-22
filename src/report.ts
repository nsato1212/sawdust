
export class Report<T> {

  /**
   * @private
   * @member {Object}
   */
  private props: T;

  /**
   * @constructor
   * @param {Object} [params={}]
   */
  constructor(params: Partial<T>={}) {
    if ('object' !== typeof params) {
      throw TypeError(`invalid parameter. [params: Object]: ${typeof params}`);
    }

    this.props = Object.assign({}, params as T);
  }

  /**
   * @param {string} key
   * @return {*}
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.props[key];
  }

  /**
   * @param {string} key
   * @param {*} value
   */
  set<K extends keyof T>(key: string, value: T[K]): void {
    this.props[key] = value;
  }

  /**
   * @param {string} key
   * @return {boolean}
   */
  has<K extends keyof T>(key: K): boolean {
    return this.props.hasOwnProperty(key);
  }
}
