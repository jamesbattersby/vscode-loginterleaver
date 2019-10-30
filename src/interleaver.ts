'use strict';

// Imports
import * as vscode from 'vscode';
import { readFile, readFileSync } from 'fs';
import moment = require('moment');
import path = require('path');
import LogFile = require('./logfile');

// Implementation
class Interleaver {
    private readonly fileList: vscode.Uri[];
    private readonly settings: vscode.WorkspaceConfiguration;

    public constructor(settings:vscode.WorkspaceConfiguration, fileList: vscode.Uri[]) {
        this.fileList = fileList;
        this.settings = settings;
    }

    public async interleave() {
        var maxFilenameLen : number = 0;
        let toInterleave : LogFile[] = [];

        for (let i = 0; i < this.fileList.length; i++) {
            let selectedLogFilename = path.parse(this.fileList[i].fsPath);
            let selectedLogFile = new LogFile(readFileSync(this.fileList[i].fsPath).toString(),
                                              selectedLogFilename.base, this.settings);

            console.log('Inserting file:' + this.fileList[i].path.toString());
            toInterleave.push(selectedLogFile);
            if (selectedLogFilename.base.length > maxFilenameLen) {
                maxFilenameLen = selectedLogFilename.base.length;
            }
        }

        for (let i = 0; i < toInterleave.length; i++) {
            toInterleave[i].setMaxFilenameLength(maxFilenameLen);
        }

        let merged: string[] = [];
        let completed : number = 0;
        while (toInterleave.length > completed) {
            // Find the file with the earliest timestamp
            let activeFile : number = -1;
            for (let currentFile = 0; currentFile < toInterleave.length; currentFile++){
                if (toInterleave[currentFile]) {
                    if (activeFile !== -1) {
                        if (toInterleave[currentFile].getTimestamp().isBefore(toInterleave[activeFile].getTimestamp())) {
                            activeFile = currentFile;
                        }
                    } else {
                        activeFile = currentFile;
                    }
                }
            }

            if (activeFile !== -1) {
                // Keep adding lines from the current file until we pass the current time
                let currentTimestamp = toInterleave[activeFile].getTimestamp();
                while (currentTimestamp.isSame(toInterleave[activeFile].getTimestamp()) &&
                    !toInterleave[activeFile].atEnd()) {
                    let myLine = toInterleave[activeFile].getLine();
                    if (myLine) {
                        merged = merged.concat(myLine);
                    }
                }

                // If we got to the end, then delete this file
                if (toInterleave[activeFile].atEnd()) {
                    delete toInterleave[activeFile];
                    completed++;
                }
            } else {
                // How odd, nothing found, delete everything
                console.log("Unable to find the next timestamp - aborting");
                completed = toInterleave.length;
                toInterleave = [];
            }
        }
        this.openInUntitled(merged.join('\n'), "log");
    }

    public add(newFile : vscode.Uri) {
        this.fileList.push(newFile);
        console.log('Adding new file:' + newFile.path.toString());
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