import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import LogLine = require('../../logline');
import moment = require('moment');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Log Line Tests', () => {
		interface TestElement {
			line: string;
			expression: undefined | string;
			result: null | moment.Moment;
		}

		let defaultExpression: string = '^[\\d-]+\\s[\\d:]*[,\\d]*';
		let testData: TestElement[] = [
			{ line: 'This line has no time stamp', expression: defaultExpression, result: null },
			{ line: '2019-01-01 12:15:22 With valid time stamp', expression: defaultExpression, result: moment('2019-01-01 12:15:22') },
			{ line: '2019-51-01 12:15:22 With invalid time stamp', expression: defaultExpression, result: moment('2019-51-01 12:15:22') },
			{ line: '2019-08-21 23:43:18,123 With valid time stamp with sub-seconds', expression: defaultExpression, result: moment('2019-08-21 23:43:18,123') },
			{ line: '2019-08-21 23:43:18,123 Custom regexp, no match', expression: 'abc', result: null },
			{ line: '2019-08-21T23:43:18,123 Custom regexp', expression: '^[\\d-]+T[\\d:]*[,\\d]*', result: moment('2019-08-21T23:43:18,123') },
			{ line: 'blah2019-11-21 13:03:52,764 match group', expression: '^blah([\\d-]+\\s[\\d:]*[,\\d]*)', result: moment('2019-11-21 13:03:52,764') }
		];

		testData.forEach(function (test) {
			if (typeof test.expression === "undefined") {
				assert(false, "Error in test, expression undefined");
				return;
			}

			let uut: LogLine = new LogLine(test.line, [RegExp(test.expression)]);
			let uutResult: null | moment.Moment = uut.getTimestamp();

			if (moment.isMoment(test.result) && moment.isMoment(uutResult)) {
				assert.equal(test.result.isValid(), uutResult.isValid(), test.line + " Validity");
				if (test.result.isValid()) {
					assert.equal(true, test.result.isSame(uutResult), test.line);
				}
			}
			else {
				assert.equal(test.result, uutResult, test.line);
			}
		});
	});
});
