import Timeout = NodeJS.Timeout;

export type Milliseconds = number;
export type MultipliedTime = number;

export type JobList = { [index: string]: Job }

export interface JobControl {
	stop: () => void,
	id: string,
	last: Date,
	duration: MultipliedTime
}

export interface Job {
	duration: MultipliedTime,
	last: Date | number,
	start: Date,
	resume: boolean,
	cb: Function
}

