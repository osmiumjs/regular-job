import {RegularJob} from '../src';

const {assert} = require('chai');

const schedule = new RegularJob(1);

describe('RegularJob::ErrorHandling', function () {
	let flag = false;

	it('should throw an error and emit "error" event', async function () {
		schedule.onError(() => {
			flag = true;
		});
		schedule.add(1, () => {
			throw Error('test');
		});
		await wait(40);

		assert(flag === true, 'Error was throwen, but "error" event was not emited');
	});
});

describe('RegularJob::Schedule', function () {
	let count = {
		first : 0,
		second: 0
	};
	let id: string;

	it('should register new event and repeat it', async function () {
		id = await schedule.add(5, () => {
			if (count.first < 3) count.first++;
		});

		await wait();

		assert(count.first === 3, `Schedule counting wrong number, expected more than/or 3, got ${count.first}`);
	});

	it('should register new event and immediatly run it, then repeat', async function () {
		id = await schedule.add(5, () => {
			if (count.second < 4) count.second++;
		}, true);

		await wait(1);

		assert(count.second >= 1, 'Job is not started immediatly');

		await wait();

		assert(count.second === 4, `Schedule counting wrong number, expected more than/or 4, got ${count.second}`);
	});
});

describe('RegularJob::Schedule', function () {
	let count = {
		first : 0,
		second: 0
	};

	let id: string;

	it('should run scheduled job instantly, and then repeat', async function () {
		id = await schedule.add(100000, () => {count.second++;});

		await schedule.run(id);

		assert(count.second !== 0, `Job was not executed instantly, excpected change in value, but got ${count.second}`);
	});

	it('should run scheduled job instantly, and then stop', async function () {
		id = await schedule.add(20, () => {count.second++;});

		await schedule.run(id, true);

		assert(count.second !== 0, `Job was not executed instantly, excpected change in value, but got ${count.second}`);

		await wait(50);

		assert(count.second === 2, `Job was not stopped after, excpected 2, but got ${count.second}`);
	});

	it('should register scheduled work and stop it', async function () {
		id = await schedule.add(10, () => {
			count.first++;
		}, true);

		await wait(22);

		schedule.stop(id);

		await wait(20);

		assert(count.first === 2, `For some reasons job was not stopped, expected 2, got ${count.first}`);

		process.exit();
	});
});

function wait(time = 42) {
	return new Promise(resolve => setTimeout(() => { resolve(null); }, time));
}
