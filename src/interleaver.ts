'use strict';

// Imports
import { Uri, WorkspaceConfiguration, window, workspace, CancellationToken } from 'vscode';
import path = require('path');
import { LogFile } from './logfile';
import { readFile } from 'fs/promises';
import { isBefore, isEqual } from 'date-fns';

// Implementation
export class Interleaver {
    private readonly fileList: Uri[];
    private readonly settings: WorkspaceConfiguration;
    private readonly percentIncrement: number = 5;
    private readonly lineUpdate: number = 500;
    private readonly dropDuplicateLines: boolean;

    private cancellationToken: CancellationToken | null = null;
    private toInterleave: LogFile[] = [];
    private completed: number = 0;
    private merged: string[] = []
    private totalSize: number = 0;
    private progress: number = 0;
    private progressIndicator: any | null = null;
    private lastPercentage: number = 0;
    private progressUpdateInterval: number = 0
    private lastLine: string | null = null;
    private duplicationInfo: IDupInfo = { count: 0, initial: "", files: [] };

    public constructor(settings: WorkspaceConfiguration, fileList: Uri[]) {
        this.fileList = fileList;
        this.settings = settings;
        this.totalSize = 0;
        this.progress = 0;
        this.lastPercentage = 0;
        this.progressUpdateInterval = this.lineUpdate
        this.lastLine = null;
        this.duplicationInfo = { count: 0, initial: "", files: [] };

        this.dropDuplicateLines = (settings.get("dropDuplicateLines") === true);
    }

    public async doInterleaving(progressIndicator: any, cancelToken: CancellationToken) {
        this.cancellationToken = cancelToken
        var maxFilenameLen: number = 0;
        this.progressIndicator = progressIndicator
        await this.updateProgress('Loading files...')
        for (let i = 0; i < this.fileList.length; i++) {
            if (this.cancellationToken?.isCancellationRequested) {
                return
            }
            let selectedLogFilename = path.parse(this.fileList[i].fsPath);
            await this.updateProgress(`Loading files... : ${selectedLogFilename.base}`)
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
        return await this.interleave()
    }

    async interleave() {
        while (this.toInterleave.length > this.completed) {
            if (this.cancellationToken?.isCancellationRequested) {
                return
            }
            await this.processLine()
        }
        await this.updateProgress("Interleaving files... (100%)", this.percentIncrement)
        await this.openInUntitled(this.merged.join('\n'), "log")
    }

    private async processLine() {
        // Find the file with the earliest timestamp
        let activeFile: number = -1;
        for (let currentFile = 0; currentFile < this.toInterleave.length; currentFile++) {
            if (this.cancellationToken?.isCancellationRequested) {
                return
            }
            if (this.toInterleave[currentFile]) {
                if (activeFile !== -1) {
                    if (isBefore(this.toInterleave[currentFile].getTimestamp(), this.toInterleave[activeFile].getTimestamp())) {
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
            while (isEqual(currentTimestamp, this.toInterleave[activeFile].getTimestamp()) &&
                !this.toInterleave[activeFile].atEnd()) {
                if (this.cancellationToken?.isCancellationRequested) {
                    return
                }
                let [prefix, time, content, postfix] = this.toInterleave[activeFile].getLine();
                await this.doneLine();
                if (content) {
                    if (content.trim() !== this.lastLine || !this.dropDuplicateLines) {
                        if (this.duplicationInfo.count != 0) {
                            this.merged.push(`Above line duplicated ${this.duplicationInfo.count} time${this.duplicationInfo.count === 1 ? "" : "s"} between ${this.duplicationInfo.initial} and ${time}`);
                        }
                        this.duplicationInfo = { count: 0, initial: "", files: [] }
                        this.merged.push(`${prefix}${time}${content}${postfix}`);
                    } else {
                        this.duplicationInfo.count++
                        if (this.duplicationInfo.count === 1) {
                            this.duplicationInfo.initial = time;
                        }
                        // duplicationInfo.files.includes("")
                    }
                    this.lastLine = content.trim();
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

    private async doneLine() {
        this.progress += 1;
        this.progressUpdateInterval--;
        if (this.progressUpdateInterval == 0) {
            let percent: number = (this.progress / this.totalSize) * 100;
            let increment: number = 0;
            if (percent > this.percentIncrement + this.lastPercentage) {
                this.lastPercentage = percent;
                increment = this.percentIncrement;
            }
            await this.updateProgress("Interleaving files... (" + percent.toFixed(2) + "%)", increment);
            this.progressUpdateInterval = this.lineUpdate;
        }
    }


    private async updateProgress(message: string, increment: number | null = null) {
        if (this.progressIndicator) {
            this.progressIndicator.report({ increment: increment, message: message });
            await new Promise<void>(r => setTimeout(r, 0));
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
