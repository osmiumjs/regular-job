import { JobControl, Milliseconds, MultipliedTime } from './types';
declare const Events: any;
declare class RegularJob extends Events {
    /**
     * @constructor
     * @param {Number} durationMultiply
     * @param {string} uidPrefix
     * @returns {RegularJob}
     */
    static createInstance(durationMultiply?: Milliseconds, uidPrefix?: string): RegularJob;
    events: {
        ERROR: string;
        ADD: string;
        STOP: string;
        RUN_BEFORE: string;
        RUN_AFTER: string;
        LOCKED: string;
    };
    /**
     * @private
     */
    private jobs;
    /**
     * @private
     * @type {{[string]: boolean}}
     */
    private lockTable;
    /**
     * @param {Number} durationMultiply
     * @param {string} uidPrefix
     */
    constructor(durationMultiply?: Milliseconds, uidPrefix?: string);
    private jobLoop;
    /**
     * @param {Number} duration
     * @param {Function} cb
     * @param {boolean} andRun
     * @param {string|boolean} id
     * @returns {string|Promise<string>}
     */
    add(duration: MultipliedTime, cb: Function, andRun?: boolean, id?: boolean | string): string;
    /**
     * @private
     * @param {string} jobId
     */
    getArgs(jobId: string): JobControl;
    /**
     * @param {string} jobId
     * @param {boolean} noRepeat
     * @returns {Promise<boolean>}
     */
    run(jobId: string, noRepeat?: boolean): Promise<boolean | void>;
    /**
     * @param {Function} cb
     */
    onError(cb: Function): string;
    /**
     * @param {string} jobId
     */
    stop(jobId: string): void;
}
export { RegularJob, Events };
