import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { window } from 'vscode';
import { LogLine } from '../../logline';
import { isEqual, isValid, parseISO } from 'date-fns';

suite('Extension Test Suite', () => {
	window.showInformationMessage('Start all tests.');

	test('Log Line Tests', () => {
		interface TestElement {
			line: string;
			expression: undefined | string;
			result: null | Date;
			newLine: string;
		}

		let defaultExpression: string = '^([\\d]{4}[-\\/][\\d]{2}[-\\/][\\d]{2}[\\sT]{1}[\\d]{2}:[\\d]{2}:[\\d]{2}(?:[\\.,]{1}\\d*)?(?:Z)?(?:(?<!Z)[\\+-]{1}[\\d]{2}:[\\d]{2})?)';
		let testData: TestElement[] = [
			{
				line: 'This line has no time stamp',
				expression: defaultExpression,
				result: null,
				newLine: 'This line has no time stamp'
			},
			{
				line: '2019-01-01 12:15:22Z With valid time stamp',
				expression: defaultExpression,
				result: parseISO('2019-01-01 12:15:22Z'),
				newLine: '2019-01-01T12:15:22.000Z With valid time stamp'
			},
			{
				line: '2019-08-11 15:22:32+02:00 With valid time stamp with offset',
				expression: defaultExpression,
				result: parseISO('2019-08-11 15:22:32+02:00'),
				newLine: '2019-08-11T13:22:32.000Z With valid time stamp with offset'
			},
			{
				// Regex will match okay up to the Z.  Might want to reject this.
				line: '2019-08-11 15:22:32Z+02:00 With invalid time stamp with offset',
				expression: defaultExpression,
				result: parseISO('2019-08-11 15:22:32Z'),
				newLine: '2019-08-11T15:22:32.000Z+02:00 With invalid time stamp with offset'
			},
			{
				line: '2019-51-01 12:15:22Z With invalid time stamp',
				expression: defaultExpression,
				result: parseISO('2019-51-01 12:15:22Z'),
				newLine: '2019-51-01 12:15:22Z With invalid time stamp'
			},
			{
				line: '2019-08-21 23:43:18,123Z With valid time stamp with sub-seconds',
				expression: defaultExpression,
				result: parseISO('2019-08-21 23:43:18,123Z'),
				newLine: '2019-08-21T23:43:18.123Z With valid time stamp with sub-seconds'
			},
			{
				line: '2019-08-21 23:43:18.123Z Custom regexp, no match',
				expression: 'abc',
				result: null,
				newLine: '2019-08-21 23:43:18.123 Custom regexp, no match'
			},
			{
				line: '2019-08-21T23:43:18.123Z Custom regexp',
				expression: '^([\\d-]+T[\\d:]*[.\\d]*Z?)',
				result: parseISO('2019-08-21T23:43:18.123Z'),
				newLine: '2019-08-21T23:43:18.123Z Custom regexp'
			},
			{
				line: 'blah2019-11-21 13:03:52.764Z match group',
				expression: '^(?:blah)([\\d-]+\\s[\\d:]*[.\\d]*Z?)',
				result: parseISO('2019-11-21 13:03:52.764Z'),
				newLine: 'blah2019-11-21T13:03:52.764Z match group'
			},
			{
				line: 'blah2019-11-21 13:03:52Z match group 2019-11-21 13:03:52Z',
				expression: '^(?:blah)([\\d-]+\\s[\\d:]*[.\\d]*Z?)',
				result: parseISO('2019-11-21 13:03:52Z'),
				newLine: 'blah2019-11-21T13:03:52.000Z match group 2019-11-21 13:03:52Z'
			}
		];

		testData.forEach(function (test) {
			if (typeof test.expression === "undefined") {
				assert(false, "Error in test, expression undefined");
				return;
			}

			let uut: LogLine = new LogLine(test.line, [RegExp(test.expression)], true, undefined);
			let uutResult: null | Date = uut.getTimestamp();

			if (test.result && uutResult) {
				assert.equal(isValid(test.result), isValid(uutResult), test.line + " Validity");
				if (isValid(test.result)) {
					assert.equal(true, isEqual(test.result, uutResult), test.line + " Time");
				}
				assert.equal(test.newLine, uut.getLine(), test.line + " Text");
			}
			else {
				assert.equal(test.result, uutResult, test.line);
			}
		});
	});
});
