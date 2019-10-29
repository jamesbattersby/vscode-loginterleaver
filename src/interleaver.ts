'use strict';

// Imports
import * as vscode from 'vscode';
import { readFile, readFileSync } from 'fs';
import moment = require('moment');
import path = require('path');
import LogFile = require('./logfile');

// Implementation
class Interleaver {
    private readonly file1: vscode.Uri;
    private readonly file2: string;
    private readonly settings: vscode.WorkspaceConfiguration;

    public constructor(settings:vscode.WorkspaceConfiguration, file1: vscode.Uri, file2: string) {
        this.file1 = file1;
        this.file2 = file2;
        this.settings = settings;
    }

    public async interleave() {
        vscode.workspace.openTextDocument(this.file1).then((document) => {
            var filename1 = path.parse(this.file1.fsPath).base;
            var filename2 = path.parse(this.file2).base;
            var maxFilenameLen = filename1.length;
            if (filename2.length > maxFilenameLen) {
                maxFilenameLen = filename2.length;
            }
            let logFile1 = new LogFile(document.getText(), filename1, maxFilenameLen, this.settings);
            let logFile2 = new LogFile(readFileSync(this.file2).toString(), filename2, maxFilenameLen, this.settings);
            let merged: string[] = [];

            while (!logFile1.atEnd() && !logFile2.atEnd()) {
                let file1Timestamp = logFile1.getTimestamp();
                while (!logFile2.atEnd() && (file1Timestamp >= logFile2.getTimestamp() || logFile1.atEnd())) {
                    let myLine = logFile2.getLine();
                    if (myLine) {
                        merged = merged.concat(myLine);
                    }
                }

                let file2Timestamp = logFile2.getTimestamp();
                while (!logFile1.atEnd() && (file2Timestamp >= logFile1.getTimestamp() || logFile2.atEnd())) {
                    let myLine = logFile1.getLine();
                    if (myLine) {
                        merged = merged.concat(myLine);
                    }
                }
            }
            this.openInUntitled(merged.join('\n'), "log");
        });
    }

    public async openInUntitled(content: string, language?: string) {
        const document = await vscode.workspace.openTextDocument({
            language,
            content,
        });
        vscode.window.showTextDocument(document);
    }

}

// Exports
export = Interleaver;