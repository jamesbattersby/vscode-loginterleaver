// Imports
import { commands, languages, workspace, window, ExtensionContext, ProgressLocation, QuickPickItem, TabInputText, Uri } from 'vscode';
import { Interleaver } from './interleaver';
import { DuplicateFoldingProvider } from './foldingProvider';

interface IOpenFile extends QuickPickItem {
	uri: Uri;
}

// Activation
export function activate(context: ExtensionContext) {
	console.log('LogInterleaver active');

	// Folding for the merged logs.  The provider only answers for documents it
	// has been given ranges for, so the selector can be broad.
	const foldingProvider = new DuplicateFoldingProvider();
	context.subscriptions.push(foldingProvider);
	context.subscriptions.push(languages.registerFoldingRangeProvider({ scheme: 'untitled', language: 'log' }, foldingProvider));
	context.subscriptions.push(workspace.onDidCloseTextDocument(document => foldingProvider.clear(document.uri)));

	// Pick the files from disk.
	context.subscriptions.push(commands.registerCommand('extension.loginterleaver', async () => {
		let settings = workspace.getConfiguration('loginterleaver');
		let what = await window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: true });

		if (what) {
			const interleaver = new Interleaver(settings, what, foldingProvider);

			if (settings.get("includeActiveEditor") === true) {
				if (window.activeTextEditor) {
					const editor = window.activeTextEditor;
					if (editor.document.languageId === "log") {
						interleaver.add(editor.document.uri);
					}
				}
			}
			await runInterleaver(interleaver);
		}
	}));

	// Pick the files from the open editors.  The open dialog cannot select
	// multiple files on every platform, and this avoids it entirely.
	context.subscriptions.push(commands.registerCommand('extension.loginterleaveopenfiles', async () => {
		let settings = workspace.getConfiguration('loginterleaver');
		let what = await pickOpenFiles();

		if (what) {
			await runInterleaver(new Interleaver(settings, what, foldingProvider));
		}
	}));
}

function runInterleaver(interleaver: Interleaver): Thenable<void> {
	return window.withProgress({
		location: ProgressLocation.Notification,
		title: "Log Interleaver",
		cancellable: true
	},
		async (progress, token) => { await interleaver.doInterleaving(progress, token); }
	);
}

/**
 * Offer up everything open in an editor, pre-selected, so the whole lot can be
 * merged with a single keypress but anything irrelevant can still be dropped.
 */
async function pickOpenFiles(): Promise<Uri[] | undefined> {
	const seen: Set<string> = new Set();
	const openFiles: IOpenFile[] = [];

	for (const group of window.tabGroups.all) {
		for (const tab of group.tabs) {
			// Anything that is not a plain text editor - diffs, notebooks,
			// terminals - has no single file to read.
			if (!(tab.input instanceof TabInputText) || seen.has(tab.input.uri.toString())) {
				continue;
			}
			seen.add(tab.input.uri.toString());
			openFiles.push({
				label: tab.label,
				description: tab.input.uri.scheme === 'file' ? workspace.asRelativePath(tab.input.uri) : tab.input.uri.scheme,
				uri: tab.input.uri,
				picked: true
			});
		}
	}

	if (openFiles.length === 0) {
		window.showInformationMessage('Log Interleaver: there are no open files to interleave.');
		return undefined;
	}

	const chosen = await window.showQuickPick(openFiles, {
		canPickMany: true,
		title: 'Interleave Open Files',
		placeHolder: 'Select the files to interleave'
	});

	if (!chosen || chosen.length === 0) {
		return undefined;
	}
	return chosen.map(openFile => openFile.uri);
}

// Deactivation
export function deactivate() { }
