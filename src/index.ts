import {Events}          from '@osmium/events';
import {iterateKeysSync} from '@osmium/iterate';
import {CryptTools}      from '@osmium/crypt';

async function delay(t: number) {
	return new Promise((resolve) => setTimeout(resolve, t));
}

export class RegularJob extends Events<string> {
	public eventsList = {
		ERROR     : 'error',
		ADD       : 'add',
		STOP      : 'stop',
		RUN_BEFORE: 'run before',
		RUN_AFTER : 'run after',
		LOCKED    : 'locked'
	};

	private readonly uidPrefix: string;
	private readonly durationMultiply: number;

	private readonly jobs: RegularJob.JobList = new Map();
	private readonly lockTable: Set<string> = new Set();

	/** @constructor */
	static createInstance(durationMultiply: RegularJob.Milliseconds = 1, uidPrefix: string = 'JOB-'): RegularJob {
		return new RegularJob(durationMultiply, uidPrefix);
	}

	constructor(durationMultiply: RegularJob.Milliseconds = 1, uidPrefix: string = 'JOB-') {
		super();

		this.uidPrefix = uidPrefix;
		this.durationMultiply = durationMultiply;
	}

	private async jobLoop(id: string): Promise<void> {
		while (true) {
			const jobInfo = this.jobs.get(id);
			if (!jobInfo) return;
			if (!jobInfo.resume) break;

			await delay(jobInfo.duration);

			if (!jobInfo.resume) break;

			await this.run(id);

			if (!jobInfo.resume) break;
		}

		this.jobs.delete(id);
	}

	public async add(duration: RegularJob.MultipliedTime, cb: (control: RegularJob.JobControl) => Promise<void> | void, andRun: boolean = false, jobId: string | null = null): Promise<string> {
		const currDuration = duration * this.durationMultiply;
		const id = jobId ?? CryptTools.UID(this.uidPrefix);

		if (this.jobs.get(id)) throw new Error('RegularJob :: job already exists :: by id');

		const job: RegularJob.Job = {
			duration: currDuration,
			last    : null,
			start   : new Date(),
			resume  : true,
			cb
		};

		this.jobs.set(id, job);

		this.emit(this.eventsList.ADD, id, job, andRun).then();

		if (andRun) {
			await this.run(id);
		}

		this.jobLoop(id).then();

		return id;
	}

	async run(jobId: string, noRepeat: boolean = false): Promise<boolean> {
		let curr = this.jobs.get(jobId);
		if (!curr) return false;

		if (this.lockTable.has(jobId)) {
			await this.emit(this.eventsList.LOCKED, jobId);
			return false;
		}

		this.lockTable.add(jobId);

		let returnState = true;

		let error;
		try {
			await this.emit(this.eventsList.RUN_BEFORE, jobId);


			curr = this.jobs.get(jobId);
			if (!curr) return false;

			await curr.cb({
				stop    : () => this.stop(jobId),
				id      : jobId,
				last    : curr.last,
				duration: curr.duration
			});

			await this.emit(this.eventsList.RUN_AFTER, jobId);
		} catch (e) {
			error = e;
			returnState = false;
		}

		this.lockTable.delete(jobId);

		curr = this.jobs.get(jobId);
		if (!curr) return false;

		curr.last = new Date();
		if (noRepeat) curr.resume = false;

		if (!returnState) this.emit(this.eventsList.ERROR, error, jobId).then();

		return returnState;
	}

	onError<ErrorType extends Error = Error>(callBack: (error: ErrorType, jobId: string) => Promise<void> | void): void {
		this.on(this.eventsList.ERROR, callBack);
	}

	stop(jobId: string): void {
		this.emit(this.eventsList.STOP, jobId).then();

		const curr = this.jobs.get(jobId);
		if (curr) curr.resume = false;
	}

	stopAll(): void {
		iterateKeysSync(this.jobs, (jobId: string) => this.stop(jobId));
	}
}

export namespace RegularJob {
	export type Milliseconds = number;
	export type MultipliedTime = number;

	export type JobList = Map<string, Job>

	export interface JobControl {
		stop: () => void,
		id: string,
		last: Date | null,
		duration: MultipliedTime
	}

	export interface Job {
		duration: MultipliedTime,
		last: Date | null,
		start: Date,
		resume: boolean,
		cb: Function
	}
}