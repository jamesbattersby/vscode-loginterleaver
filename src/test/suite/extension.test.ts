import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { CancellationTokenSource, FoldingRangeKind, Uri, WorkspaceConfiguration, window, workspace } from 'vscode';
import * as path from 'path';
import { LogLine } from '../../logline';
import { Interleaver } from '../../interleaver';
import { describeRun, summariseRun } from '../../duplicates';
import { isEqual, isValid, parseISO } from 'date-fns';

suite('Extension Test Suite', () => {
	window.showInformationMessage('Start all tests.');

	test('Log Line Tests', () => {
		interface TestElement {
			line: string;
			expression: undefined | string;
			format: IFormats[] | undefined;
			result: null | Date;
			newLine: null | string;
		}

		let defaultExpression: string = '^([\\d]{4}[-\\/][\\d]{2}[-\\/][\\d]{2}[\\sT]{1}[\\d]{2}:[\\d]{2}:[\\d]{2}(?:[\\.,]{1}\\d*)?(?:Z)?(?:(?<!Z)[\\+-]{1}[\\d]{2}:[\\d]{2})?)';
		let testData: TestElement[] = [
			{
				line: 'This line has no time stamp',
				expression: defaultExpression,
				result: null,
				format: undefined,
				newLine: 'This line has no time stamp'
			},
			{
				line: '2019-01-01 12:15:22Z With valid time stamp',
				expression: defaultExpression,
				format: undefined,
				result: parseISO('2019-01-01 12:15:22Z'),
				newLine: '2019-01-01T12:15:22.000Z With valid time stamp'
			},
			{
				line: '2019-08-11 15:22:32+02:00 With valid time stamp with offset',
				expression: defaultExpression,
				format: undefined,
				result: parseISO('2019-08-11 15:22:32+02:00'),
				newLine: '2019-08-11T13:22:32.000Z With valid time stamp with offset'
			},
			{
				// Regex will match okay up to the Z.  Might want to reject this.
				line: '2019-08-11 15:22:32Z+02:00 With invalid time stamp with offset',
				expression: defaultExpression,
				format: undefined,
				result: parseISO('2019-08-11 15:22:32Z'),
				newLine: '2019-08-11T15:22:32.000Z+02:00 With invalid time stamp with offset'
			},
			{
				line: '2019-51-01 12:15:22Z With invalid time stamp',
				expression: defaultExpression,
				format: undefined,
				result: parseISO('2019-51-01 12:15:22Z'),
				newLine: '2019-51-01 12:15:22Z With invalid time stamp'
			},
			{
				line: '2019-08-21 23:43:18,123Z With valid time stamp with sub-seconds',
				expression: defaultExpression,
				format: undefined,
				result: parseISO('2019-08-21 23:43:18,123Z'),
				newLine: '2019-08-21T23:43:18.123Z With valid time stamp with sub-seconds'
			},
			{
				line: '2019-08-21 23:43:18.123Z Custom regexp, no match',
				expression: 'abc',
				format: undefined,
				result: null,
				newLine: '2019-08-21 23:43:18.123 Custom regexp, no match'
			},
			{
				line: '2019-08-21T23:43:18.123Z Custom regexp',
				expression: '^([\\d-]+T[\\d:]*[.\\d]*Z?)',
				format: undefined,
				result: parseISO('2019-08-21T23:43:18.123Z'),
				newLine: '2019-08-21T23:43:18.123Z Custom regexp'
			},
			{
				line: 'blah2019-11-21 13:03:52.764Z match group',
				expression: '^(?:blah)([\\d-]+\\s[\\d:]*[.\\d]*Z?)',
				format: undefined,
				result: parseISO('2019-11-21 13:03:52.764Z'),
				newLine: 'blah2019-11-21T13:03:52.764Z match group'
			},
			{
				line: 'blah2019-11-21 13:03:52Z match group 2019-11-21 13:03:52Z',
				expression: '^(?:blah)([\\d-]+\\s[\\d:]*[.\\d]*Z?)',
				format: undefined,
				result: parseISO('2019-11-21 13:03:52Z'),
				newLine: 'blah2019-11-21T13:03:52.000Z match group 2019-11-21 13:03:52Z'
			},
			{
				line: 'blah2019-11-21 13:03:52Z match group 2019-11-21 13:03:52Z',
				expression: '^(?:blah)([\\d-]+\\s[\\d:]*[.\\d]*Z?)',
				format: undefined,
				result: parseISO('2019-11-21 13:03:52Z'),
				newLine: 'blah2019-11-21T13:03:52.000Z match group 2019-11-21 13:03:52Z'
			},
			{
				line: '[19/Apr/2023:01:10:14 +0000]  Custom format, exclude TZ',
				expression: '^\\[(\\d{2}\\/\\w+\\/\\d{4}:\\d{2}:\\d{2}:\\d{2})',
				format: [{name: "Test format", format: "dd/LLL/yyyy:hh:mm:ss"}],
				result: parseISO('2023-04-19T01:10:14.000'),
				newLine: null
			},
			{
				line: '[19/Apr/2023:01:10:14 +0000]  Custom format, include TZ',
				expression: '^\\[(\\d{2}\\/\\w+\\/\\d{4}:\\d{2}:\\d{2}:\\d{2}\\s[+-]\\d{4})',
				format: [{name: "Test format", format: "dd/LLL/yyyy:hh:mm:ss xxxx"}],
				result: parseISO('2023-04-19T01:10:14.000Z'),
				newLine: '[2023-04-19T01:10:14.000Z]  Custom format, include TZ'
			}
		];

		testData.forEach(function (test) {
			if (typeof test.expression === "undefined") {
				assert(false, "Error in test, expression undefined");
				return;
			}

			let uut: LogLine = new LogLine(test.line, [RegExp(test.expression)], true, test.format);
			let uutResult: null | Date = uut.getTimestamp();

			if (test.result && uutResult) {
				assert.equal(isValid(test.result), isValid(uutResult), test.line + " Validity");
				if (isValid(test.result)) {
					assert.equal(true, isEqual(test.result, uutResult), test.line + " Time");
				}
				if (test.newLine) {
					assert.equal(test.newLine, uut.getLine(), test.line + " Text");
				}
			}
			else {
				assert.equal(test.result, uutResult, test.line);
			}
		});
	});
});

suite('Duplicate Run Test Suite', () => {

	test('Run Description Tests', () => {
		interface DescribeElement {
			name: string;
			count: number;
			first: Date;
			last: Date;
			files: string[] | undefined;
			expected: string;
		}

		let base: Date = new Date(2019, 0, 1, 12, 0, 0, 0);
		let describeData: DescribeElement[] = [
			{
				name: 'Identical timestamps',
				count: 2,
				first: base,
				last: base,
				files: undefined,
				expected: '  ⟨repeated 2 times⟩'
			},
			{
				name: 'Minutes and seconds',
				count: 5,
				first: base,
				last: new Date(2019, 0, 1, 12, 2, 13, 0),
				files: undefined,
				expected: '  ⟨repeated 5 times over 2 minutes 13 seconds⟩'
			},
			{
				name: 'Sub-second span falls back to milliseconds',
				count: 3,
				first: base,
				last: new Date(2019, 0, 1, 12, 0, 0, 500),
				files: undefined,
				expected: '  ⟨repeated 3 times over 500ms⟩'
			},
			{
				name: 'Days and hours',
				count: 9,
				first: base,
				last: new Date(2019, 0, 3, 15, 0, 0, 0),
				files: undefined,
				expected: '  ⟨repeated 9 times over 2 days 3 hours⟩'
			},
			{
				name: 'Single source file is not named',
				count: 4,
				first: base,
				last: base,
				files: ['a.log'],
				expected: '  ⟨repeated 4 times⟩'
			},
			{
				name: 'Several source files are named',
				count: 4,
				first: base,
				last: new Date(2019, 0, 1, 12, 0, 30, 0),
				files: ['a.log', 'b.log'],
				expected: '  ⟨repeated 4 times over 30 seconds in a.log, b.log⟩'
			}
		];

		describeData.forEach(function (test) {
			assert.equal(describeRun(test.count, test.first, test.last, test.files), test.expected, test.name);
		});
	});

	test('Drop Summary Tests', () => {
		assert.equal(summariseRun(4, '12:00:00', '12:03:00'),
			'Above line repeated 4 times between 12:00:00 and 12:03:00', 'Distinct timestamps');
		assert.equal(summariseRun(3, '12:00:00', '12:00:00'),
			'Above line repeated 3 times', 'Identical timestamps');
		assert.equal(summariseRun(2, '', ''),
			'Above line repeated 2 times', 'No timestamps');
	});
});

suite('Interleaver Test Suite', () => {
	// test.log and test2.log hold the same six messages an hour apart in
	// different timezones, so merging them yields six runs of two lines five
	// seconds apart.
	const logOne: Uri = Uri.file(path.resolve(__dirname, '../../../src/test/test.log'));
	const logTwo: Uri = Uri.file(path.resolve(__dirname, '../../../src/test/test2.log'));

	function stubSettings(overrides: { [key: string]: any }): WorkspaceConfiguration {
		const values: { [key: string]: any } = {
			timestampRegex: '^([\\d]{4}[-\\/][\\d]{2}[-\\/][\\d]{2}[\\sT]{1}[\\d]{2}:[\\d]{2}:[\\d]{2}(?:[\\.,]{1}\\d*)?(?:Z)?(?:(?<!Z)[\\+-]{1}[\\d]{2}:[\\d]{2})?)',
			timeFormatSpecifications: undefined,
			duplicateLines: 'keep',
			duplicateFoldThreshold: 2,
			foldDuplicatesOnOpen: false,
			dropBlankLines: true,
			dropInvalidTimestamp: false,
			replaceTimestamps: false,
			addFileName: 'off',
			...overrides
		};
		return { get: (key: string) => values[key] } as WorkspaceConfiguration;
	}

	async function merge(overrides: { [key: string]: any }): Promise<Interleaver> {
		const interleaver = new Interleaver(stubSettings(overrides), [logOne, logTwo]);
		await interleaver.doInterleaving(null, new CancellationTokenSource().token);
		return interleaver;
	}

	test('Keeps duplicates untouched', async () => {
		const uut = await merge({ duplicateLines: 'keep' });
		assert.equal(uut.getMerged().length, 12, 'Line count');
		assert.equal(uut.getFoldRanges().length, 0, 'No fold ranges');
		assert.equal(uut.getMerged().filter(l => l.includes('repeated')).length, 0, 'No annotations');
	});

	test('Folds duplicates and annotates the header line', async () => {
		const uut = await merge({ duplicateLines: 'fold' });
		const merged = uut.getMerged();
		const ranges = uut.getFoldRanges();

		assert.equal(merged.length, 12, 'Every line is kept');
		assert.equal(ranges.length, 6, 'One region per run');

		ranges.forEach(function (range, index) {
			assert.equal(range.start, index * 2, `Region ${index} start`);
			assert.equal(range.end, index * 2 + 1, `Region ${index} end`);
			assert.equal(range.kind, FoldingRangeKind.Region, `Region ${index} kind`);
			assert.ok(merged[range.start].endsWith('  ⟨repeated 2 times over 5 seconds⟩'),
				`Region ${index} header: ${merged[range.start]}`);
			assert.ok(!merged[range.end].includes('repeated'), `Region ${index} body is unannotated`);
		});
	});

	test('Honours the fold threshold', async () => {
		const uut = await merge({ duplicateLines: 'fold', duplicateFoldThreshold: 3 });
		assert.equal(uut.getMerged().length, 12, 'Every line is kept');
		assert.equal(uut.getFoldRanges().length, 0, 'Runs of two are below the threshold');
		assert.equal(uut.getMerged().filter(l => l.includes('repeated')).length, 0, 'No annotations');
	});

	test('Names the source files when addFileName is on', async () => {
		const uut = await merge({ duplicateLines: 'fold', addFileName: 'end' });
		const merged = uut.getMerged();
		assert.ok(merged[0].includes('in test2.log, test.log'), `Header names both files: ${merged[0]}`);
	});

	test('Drops duplicates and summarises the run', async () => {
		const uut = await merge({ duplicateLines: 'drop' });
		const merged = uut.getMerged();

		assert.equal(uut.getFoldRanges().length, 0, 'Drop mode produces no fold ranges');
		// Six kept lines, each followed by a summary of the repeat it replaced.
		assert.equal(merged.length, 12, 'Line count');
		assert.equal(merged.filter(l => l.startsWith('Above line repeated 2 times')).length, 6, 'Summary count');
	});

	test('Reads an untitled document that has nothing on disk', async () => {
		const scratch = await workspace.openTextDocument({
			language: 'log',
			content: '2019-11-10 17:14:25+01:00 SCRATCH\n2019-11-10 17:14:35+01:00 SCRATCH'
		});
		const uut = new Interleaver(stubSettings({ duplicateLines: 'fold' }), [scratch.uri]);
		await uut.doInterleaving(null, new CancellationTokenSource().token);

		assert.equal(uut.getMerged().length, 2, 'Both lines read from the buffer');
		assert.ok(uut.getMerged()[0].includes('SCRATCH'), uut.getMerged()[0]);
		assert.equal(uut.getFoldRanges().length, 1, 'Duplicates still folded');
	});

	test('Flushes a run that ends the merge', async () => {
		// The final run is the last thing written, so it is only summarised if
		// interleave() closes the run off after the loop.
		const uut = await merge({ duplicateLines: 'drop' });
		const merged = uut.getMerged();
		assert.ok(merged[merged.length - 1].startsWith('Above line repeated 2 times'),
			`Trailing summary present: ${merged[merged.length - 1]}`);
	});
});
