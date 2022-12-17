'use strict';

// Imports
import { Uri, WorkspaceConfiguration, window, workspace, CancellationToken } from 'vscode';
import path = require('path');
import { LogFile } from './logfile';
import { readFile } from 'fs/promises';

// Implementation
export class Interleaver {
    private readonly fileList: Uri[];
    private readonly settings: WorkspaceConfiguration;
    private readonly percentIncrement: number = 5;
    private readonly lineUpdate: number = 500;
    private cancellationToken: CancellationToken | null = null;
    private toInterleave: LogFile[] = [];
    private completed: number = 0;
    private merged: string[] = []
    private totalSize: number = 0;
    private progress: number = 0;
    private lastPercentage: number = 0;

    public constructor(settings: WorkspaceConfiguration, fileList: Uri[]) {
        this.fileList = fileList;
        this.settings = settings;
        this.totalSize = 0;
        this.progress = 0;
        this.lastPercentage = 0;
    }

    public async doInterleaving(progress: any, cancelToken : CancellationToken) {
        this.cancellationToken = cancelToken
        var maxFilenameLen: number = 0;
        progress.report({ message: "Loading files..." })
        for (let i = 0; i < this.fileList.length; i++) {
            let selectedLogFilename = path.parse(this.fileList[i].fsPath);
            let in_file = await readFile(this.fileList[i].fsPath)
            let selectedLogFile = new LogFile(in_file.toString(),
                selectedLogFilename.base, this.settings);

            console.log('Inserting file:' + this.fileList[i].path.toString());
            this.totalSize += selectedLogFile.getSize()
            this.toInterleave.push(selectedLogFile);
            if (selectedLogFilename.base.length > maxFilenameLen) {
                maxFilenameLen = selectedLogFilename.base.length;
            }
        }

        for (let i = 0; i < this.toInterleave.length; i++) {
            this.toInterleave[i].setMaxFilenameLength(maxFilenameLen);
        }

        progress.report({ increment: 0, message: "Progress: " })
        return await this.interleave(progress)
    }

    async interleave(progress: any) {
        let progressUpdateInterval: number = this.lineUpdate;
        while (this.toInterleave.length > this.completed) {
            if (this.cancellationToken?.isCancellationRequested) {
                return
            }
            await this.processLine()
            progressUpdateInterval--
            if (progressUpdateInterval == 0) {
                let percent: number = (this.progress / this.totalSize) * 100;
                let increment: number = 0;
                if (percent > this.percentIncrement + this.lastPercentage) {
                    this.lastPercentage = percent;
                    increment = this.percentIncrement;
                }
                progress.report({ increment: increment, message: "Interleaving files... (" + percent.toFixed(2) + "%)" });
                await new Promise<void>(r => setTimeout(r, 0));
                progressUpdateInterval = this.lineUpdate;
            }
        }
        progress.report({ increment: this.percentIncrement, message: "Interleaving files... (100%)" });
        await new Promise<void>(r => setTimeout(r, 0))
        await this.openInUntitled(this.merged.join('\n'), "log")
    }

    private async processLine() {
        // Find the file with the earliest timestamp
        let activeFile: number = -1;
        for (let currentFile = 0; currentFile < this.toInterleave.length; currentFile++) {
            if (this.toInterleave[currentFile]) {
                if (activeFile !== -1) {
                    if (this.toInterleave[currentFile].getTimestamp().isBefore(this.toInterleave[activeFile].getTimestamp())) {
                        activeFile = currentFile;
                    }
                } else {
                    activeFile = currentFile;
                }
            }
        }

        if (activeFile !== -1) {
            // Keep adding lines from the current file until we pass the current time
            let currentTimestamp = this.toInterleave[activeFile].getTimestamp();
            while (currentTimestamp.isSame(this.toInterleave[activeFile].getTimestamp()) &&
                !this.toInterleave[activeFile].atEnd()) {
                let myLine = this.toInterleave[activeFile].getLine();
                this.progress += 1
                if (myLine) {
                    this.merged = this.merged.concat(myLine);
                }
            }

            // If we got to the end, then delete this file
            if (this.toInterleave[activeFile].atEnd()) {
                delete this.toInterleave[activeFile];
                this.completed++;
            }
        } else {
            // How odd, nothing found, delete everything
            console.log("Unable to find the next timestamp - aborting");
            this.completed = this.toInterleave.length;
            this.toInterleave = [];
        }

    }
    public add(newFile: Uri) {
        this.fileList.push(newFile);
        console.log('Adding new file:' + newFile.path.toString());
    }

    public async openInUntitled(content: string, language?: string) {
        const document = await workspace.openTextDocument({
            language,
            content,
        });
        window.showTextDocument(document);
    }
}
