'use strict';

// Imports
import { Uri, WorkspaceConfiguration, window, workspace, commands, CancellationToken, FoldingRange, FoldingRangeKind } from 'vscode';
import path = require('path');
import { LogFile } from './logfile';
import { DuplicateFoldingProvider } from './foldingProvider';
import { describeRun, summariseRun } from './duplicates';
import { readFile } from 'fs/promises';
import { isBefore, isEqual } from 'date-fns';

// Implementation
export class Interleaver {
    private readonly fileList: Uri[];
    private readonly settings: WorkspaceConfiguration;
    private readonly percentIncrement: number = 5;
    private readonly lineUpdate: number = 500;
    private readonly duplicateLines: string;
    private readonly duplicateFoldThreshold: number;
    private readonly foldOnOpen: boolean;
    private readonly namingFiles: boolean;
    private readonly foldingProvider: DuplicateFoldingProvider | null;

    private cancellationToken: CancellationToken | null = null;
    private toInterleave: LogFile[] = [];
    private completed: number = 0;
    private merged: string[] = []
    private foldRanges: FoldingRange[] = [];
    private totalSize: number = 0;
    private progress: number = 0;
    private progressIndicator: any | null = null;
    private lastPercentage: number = 0;
    private progressUpdateInterval: number = 0
    private currentRun: IDupInfo | null = null;

    public constructor(settings: WorkspaceConfiguration, fileList: Uri[], foldingProvider: DuplicateFoldingProvider | null = null) {
        this.fileList = fileList;
        this.settings = settings;
        this.foldingProvider = foldingProvider;
        this.totalSize = 0;
        this.progress = 0;
        this.lastPercentage = 0;
        this.progressUpdateInterval = this.lineUpdate
        this.currentRun = null;

        this.duplicateLines = settings.get("duplicateLines") ?? "keep";
        this.duplicateFoldThreshold = Math.max(2, settings.get("duplicateFoldThreshold") ?? 2);
        this.foldOnOpen = (settings.get("foldDuplicatesOnOpen") !== false);
        this.namingFiles = (settings.get("addFileName") !== "off");
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
            let in_file = await this.readContent(this.fileList[i])
            let selectedLogFile = new LogFile(in_file,
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

    /**
     * Read a file, preferring the copy VS Code already has open.  That picks up
     * unsaved changes, and is the only way to get at an untitled document -
     * neither of which have anything useful on disk.
     */
    private async readContent(file: Uri): Promise<string> {
        let open = workspace.textDocuments.find(document => document.uri.toString() === file.toString());
        if (open) {
            return open.getText();
        }
        return (await readFile(file.fsPath)).toString();
    }

    async interleave() {
        while (this.toInterleave.length > this.completed) {
            if (this.cancellationToken?.isCancellationRequested) {
                return
            }
            await this.processLine()
        }
        // The last lines of the merge can be a run of their own.
        this.flushRun()
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
                let line: ILineParts = this.toInterleave[activeFile].getLine();
                await this.doneLine();
                if (line.content) {
                    this.emitLine(line);
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

    /**
     * Add a line to the merged output, tracking runs of repeats as we go.
     *
     * Lines are compared on their content alone - the timestamp and any
     * filename decoration are excluded - so the same message logged at
     * different times, or by different files, still counts as a repeat.
     */
    private emitLine(line: ILineParts) {
        let key: string = (line.content ?? "").trim();

        if (this.currentRun && this.currentRun.key === key) {
            this.currentRun.count++;
            this.currentRun.last = line.timestamp;
            this.currentRun.lastText = line.timestampText;
            if (!this.currentRun.files.includes(line.filename)) {
                this.currentRun.files.push(line.filename);
            }
            // In drop mode the repeats are replaced by a summary when the run
            // ends, so there is nothing to write out here.
            if (this.duplicateLines === "drop") {
                return;
            }
        } else {
            this.flushRun();
            this.currentRun = {
                headerIndex: this.merged.length,
                key,
                count: 1,
                first: line.timestamp,
                last: line.timestamp,
                firstText: line.timestampText,
                lastText: line.timestampText,
                files: [line.filename]
            };
        }

        this.merged.push(`${line.prefix}${line.timestampText}${line.content}${line.postfix}`);
    }

    /**
     * Close off the run in progress, annotating or summarising it if it was
     * long enough to be worth reporting.
     */
    private flushRun() {
        let run: IDupInfo | null = this.currentRun;
        this.currentRun = null;

        if (!run || run.count < 2) {
            return;
        }

        if (this.duplicateLines === "drop") {
            // The threshold does not apply here: emitLine has already discarded
            // the repeats, so they must always be accounted for.
            this.merged.push(summariseRun(run.count, run.firstText, run.lastText));
        } else if (this.duplicateLines === "fold" && run.count >= this.duplicateFoldThreshold) {
            // Only the first line of a folded region stays visible, so the
            // summary has to go on it.  The run occupies a contiguous block of
            // the merged output because nothing else is written while it runs.
            this.merged[run.headerIndex] += describeRun(run.count, run.first, run.last,
                this.namingFiles ? run.files : []);
            this.foldRanges.push(new FoldingRange(run.headerIndex, run.headerIndex + run.count - 1,
                FoldingRangeKind.Region));
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

    public getMerged(): string[] {
        return this.merged;
    }

    public getFoldRanges(): FoldingRange[] {
        return this.foldRanges;
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

        // Register before showing: the document may already have been asked for
        // its folding ranges, and registering fires the change event that
        // discards that empty answer.
        if (this.foldingProvider && this.foldRanges.length > 0) {
            this.foldingProvider.register(document.uri, this.foldRanges);
        }

        await window.showTextDocument(document);

        if (this.foldOnOpen && this.foldRanges.length > 0) {
            // Give the editor a turn to ask for the ranges before folding them.
            await new Promise<void>(r => setTimeout(r, 0));
            await commands.executeCommand('editor.foldAllMarkerRegions');
        }
    }
}
