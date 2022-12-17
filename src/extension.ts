// Imports
import { resolve } from 'path';
import { commands, workspace, window, ExtensionContext, ProgressLocation } from 'vscode';
import { Interleaver } from './interleaver';

// Activation
export function activate(context: ExtensionContext) {
	console.log('LogInterleaver active');

	// Register command
	let disposable = commands.registerCommand('extension.loginterleaver', async () => {
		let settings = workspace.getConfiguration('loginterleaver');
		let what = await window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: true });

		if (what) {
			const interleaver = new Interleaver(settings, what);

			if (settings.get("includeActiveEditor") === true) {
				if (window.activeTextEditor) {
					const editor = window.activeTextEditor;
					if (editor.document.languageId === "log") {
						interleaver.add(editor.document.uri);
					}
				}
			}
			window.withProgress({
				location: ProgressLocation.Notification,
				title: "Interleaving",
				cancellable: true
			},
			 	async (progress, token) => { await interleaver.doInterleaving(progress, token); resolve()}
			)
		}
	});
	context.subscriptions.push(disposable);
}

// Deactivation
export function deactivate() { }
