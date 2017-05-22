export declare class Report<T> {
    /**
     * @private
     * @member {Object}
     */
    private props;
    /**
     * @constructor
     * @param {Object} [params={}]
     */
    constructor(params?: Partial<T>);
    /**
     * @param {string} key
     * @return {*}
     */
    get<K extends keyof T>(key: K): T[K];
    /**
     * @param {string} key
     * @param {*} value
     */
    set<K extends keyof T>(key: string, value: T[K]): void;
    /**
     * @param {string} key
     * @return {boolean}
     */
    has<K extends keyof T>(key: K): boolean;
}
