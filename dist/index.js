"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = exports.RegularJob = void 0;
const nTools = require('@osmium/tools');
const { Events } = require('@osmium/events');
exports.Events = Events;
class RegularJob extends Events {
    /**
     * @param {Number} durationMultiply
     * @param {string} uidPrefix
     */
    constructor(durationMultiply = 1000, uidPrefix = 'JOB-') {
        super();
        this.events = {
            ERROR: 'error',
            ADD: 'add',
            STOP: 'stop',
            RUN_BEFORE: 'run before',
            RUN_AFTER: 'run after',
            LOCKED: 'locked'
        };
        /**
         * @private
         */
        this.jobs = {};
        /**
         * @private
         * @type {{[string]: boolean}}
         */
        this.lockTable = {};
        this.uidPrefix = uidPrefix;
        this.durationMultiply = durationMultiply;
    }
    /**
     * @constructor
     * @param {Number} durationMultiply
     * @param {string} uidPrefix
     * @returns {RegularJob}
     */
    static createInstance(durationMultiply = 1000, uidPrefix = 'JOB-') {
        return new RegularJob(durationMultiply, uidPrefix);
    }
    async jobLoop(id) {
        let resume = true;
        if (!this.jobs[id])
            return;
        while (resume) {
            const jobInfo = this.jobs[id];
            if (!jobInfo.resume) {
                resume = false;
                break;
            }
            await nTools.delay(jobInfo.duration);
            if (!jobInfo.resume) {
                resume = false;
                break;
            }
            await this.run(id);
            if (!jobInfo.resume) {
                resume = false;
                break;
            }
        }
        delete this.jobs[id];
    }
    /**
     * @param {Number} duration
     * @param {Function} cb
     * @param {boolean} andRun
     * @param {string|boolean} id
     * @returns {string|Promise<string>}
     */
    add(duration, cb, andRun = false, id = false) {
        const currDuration = duration * this.durationMultiply;
        const _id = id || nTools.UID(this.uidPrefix);
        if (this.jobs[_id])
            throw 'RegularJob :: duplicated id';
        this.jobs[_id] = {
            duration: currDuration,
            last: 0,
            start: new Date(),
            resume: true,
            cb
        };
        (async () => await this.emit(this.events.ADD, _id, this.jobs[_id], andRun))();
        if (andRun) {
            (async () => {
                await this.run(_id);
                await this.jobLoop(_id);
            })();
        }
        else {
            (async () => this.jobLoop(_id))();
        }
        return _id;
    }
    /**
     * @private
     * @param {string} jobId
     */
    getArgs(jobId) {
        const curr = this.jobs[jobId];
        return {
            stop: () => this.stop(jobId),
            id: jobId,
            last: curr.last,
            duration: curr.duration
        };
    }
    /**
     * @param {string} jobId
     * @param {boolean} noRepeat
     * @returns {Promise<boolean>}
     */
    async run(jobId, noRepeat = false) {
        const curr = this.jobs[jobId];
        if (!curr)
            return false;
        if (this.lockTable[jobId]) {
            await this.emit(this.events.LOCKED, jobId);
            return false;
        }
        this.lockTable[jobId] = true;
        let returnState = true;
        try {
            await this.emit(this.events.RUN_BEFORE, jobId);
            await curr.cb(this.getArgs(jobId));
            await this.emit(this.events.RUN_AFTER, jobId);
        }
        catch (e) {
            returnState = false;
            setImmediate(() => this.emit(this.events.ERROR, jobId, e)); //for update states below
        }
        delete this.lockTable[jobId];
        curr.last = new Date();
        if (noRepeat)
            curr.resume = false;
        return returnState;
    }
    /**
     * @param {Function} cb
     */
    onError(cb) {
        return this.on(this.events.ERROR, async (jobId, e) => await cb(jobId, e));
    }
    /**
     * @param {string} jobId
     */
    stop(jobId) {
        this.emit(this.events.STOP, jobId);
        const curr = this.jobs[jobId];
        if (curr)
            curr.resume = false;
    }
}
exports.RegularJob = RegularJob;
//# sourceMappingURL=index.js.map