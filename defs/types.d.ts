export declare type Milliseconds = number;
export declare type MultipliedTime = number;
export declare type JobList = {
    [index: string]: Job;
};
export interface JobControl {
    stop: () => void;
    id: string;
    last: Date;
    duration: MultipliedTime;
}
export interface Job {
    duration: MultipliedTime;
    last: Date | number;
    start: Date;
    resume: boolean;
    cb: Function;
}
