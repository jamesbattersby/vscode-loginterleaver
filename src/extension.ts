// Imports
import * as vscode from 'vscode';
import Interleaver = require('./interleaver');

// Activation
export function activate(context: vscode.ExtensionContext) {
	console.log('LogInterleaver active');

	// Register command
	let disposable = vscode.commands.registerCommand('extension.loginterleaver', async () => {
		// We need one open editor - this is the first log file
		if (!vscode.window.activeTextEditor) {
			vscode.window.showErrorMessage('Need open editor containing a log file.');
			return; // no editor
		}
		// todo: Allow multi-file open
		let what = await vscode.window.showOpenDialog( { canSelectFiles: true, canSelectFolders: false, canSelectMany: false});

		if (what) {
			let { document } = vscode.window.activeTextEditor;
			const interleaver = new Interleaver(document.uri, what[0].path);
			interleaver.interleave();
		}
	});
	context.subscriptions.push(disposable);
}

// Deactivation
export function deactivate() {}
