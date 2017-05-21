"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Report {
    /**
     * @constructor
     * @param {Object} [params={}]
     */
    constructor(params = {}) {
        if ('object' !== typeof params) {
            throw TypeError(`invalid parameter. [params: Object]: ${typeof params}`);
        }
        this.props = Object.assign({}, params);
    }
    /**
     * @param {string} key
     * @return {*}
     */
    get(key) {
        return this.props[key];
    }
    /**
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
        this.props[key] = value;
    }
    /**
     * @param {string} key
     * @return {boolean}
     */
    has(key) {
        return this.props.hasOwnProperty(key);
    }
}
exports.Report = Report;
//# sourceMappingURL=report.js.map