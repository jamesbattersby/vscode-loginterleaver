// Imports
import * as vscode from 'vscode';
import Interleaver = require('./interleaver');

// Activation
export function activate(context: vscode.ExtensionContext) {
	console.log('LogInterleaver active');

	// Register command
	let disposable = vscode.commands.registerCommand('extension.loginterleaver', async () => {
		let settings = vscode.workspace.getConfiguration('loginterleaver');
		let what = await vscode.window.showOpenDialog( { canSelectFiles: true, canSelectFolders: false, canSelectMany: true});

		let document : null | vscode.TextDocument = null;
		if (what) {
			const interleaver = new Interleaver(settings, what);

			if (vscode.window.activeTextEditor) {
				const editor = vscode.window.activeTextEditor;
				if (editor.document.languageId === "log") {
					interleaver.add(editor.document.uri);
				}
			}
			interleaver.interleave();
		}
	});
	context.subscriptions.push(disposable);
}

// Deactivation
export function deactivate() {}
