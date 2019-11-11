'use strict';

// Imports
import * as vscode from 'vscode';
import LogLine = require('./logline');
import moment = require('moment');

// Implementation
class LogFile {
    private readonly filename: string;
    private readonly content: string[];
    private readonly size: number;
    private currentLocation: number;
    private currentLine: null | LogLine;
    private initalTimestamp: moment.Moment;
    private finalTimestamp: moment.Moment;
    private gotTimestamps: boolean;
    private lastTimestamp: moment.Moment;
    private dropBlank: boolean;
    private dropInvalid: boolean;
    private addFilename: string | undefined;
    private paddedFilename: string;
    private regExpList: RegExp[];
    private replaceTimestamps: boolean;

    public constructor(content: string, filename: string, settings: vscode.WorkspaceConfiguration) {
        this.regExpList = this.prepareRegularExpressions(settings.get("timestampRegex"));
        this.filename = filename;
        this.content = content.split(/\r?\n/);
        this.size = this.content.length;
        this.currentLocation = 0;
        this.initalTimestamp = moment();
        this.finalTimestamp = moment();
        let firstTimestampOk: boolean = this.setFirstTimestamp();
        let lastTimestampOk: boolean = this.setLastTimestamp();
        this.gotTimestamps = lastTimestampOk && firstTimestampOk;
        this.lastTimestamp = this.initalTimestamp;
        this.dropBlank = (settings.get("dropBlankLines") === true);
        this.dropInvalid = (settings.get("dropInvalidTimestamp") === true);
        this.replaceTimestamps = (settings.get("replaceTimestamps") === true);
        this.addFilename = settings.get("addFileName");
        this.paddedFilename = filename;
        this.currentLine = new LogLine(this.content[0], this.regExpList, this.replaceTimestamps);
    }

    public setMaxFilenameLength(filenamePadding: number) {
        this.paddedFilename = this.filename.padEnd(filenamePadding) + ' | ';
    }

    public hasGotTimestamps(): boolean {
        return this.gotTimestamps;
    }
    public setFirstTimestamp(): boolean {
        for (let i = 0; i < this.size; i++) {
            let logLine = new LogLine(this.content[i], this.regExpList, this.replaceTimestamps);
            let timestamp = logLine.getTimestamp();
            if (moment.isMoment(timestamp)) {
                this.initalTimestamp = timestamp;
                return true;
            }
        }
        return false;
    }

    public setLastTimestamp(): boolean {
        for (let i = this.size - 1; i >= 0; i--) {
            let logLine = new LogLine(this.content[i], this.regExpList, this.replaceTimestamps);
            let timestamp = logLine.getTimestamp();
            if (moment.isMoment(timestamp)) {
                this.finalTimestamp = timestamp;
                return true;
            }
        }
        return false;
    }

    public getStartTimestamp(): moment.Moment {
        return this.initalTimestamp;
    }

    public getEndTimestamp(): moment.Moment {
        return this.finalTimestamp;
    }

    public getTimestamp(): moment.Moment {
        if (this.currentLocation >= this.size || this.currentLine === null) {
            return this.lastTimestamp;
        }

        do {
            let timestamp = this.currentLine.getTimestamp();
            if (moment.isMoment(timestamp)) {
                this.lastTimestamp = timestamp;
                return timestamp;
            }
            // If we are not dropping invalid timestamp entries,
            // use the previous good one
            if (!this.dropInvalid) {
                return this.lastTimestamp;
            }
            // Got a bad timestamp to skip over, move to the next line
            this.nextLine();
            // Until we hit the end
        } while (!this.atEnd());
        return this.lastTimestamp;
    }

    public getLine(): null | string {
        if (this.currentLine === null) {
            return "";
        }

        let line: string = "";
        let content = this.currentLine.getLine();
        if (this.currentLocation >= this.size) {
            return null;
        }
        else if (this.addFilename === "start") {
            line = this.paddedFilename + content;
        }
        else if (this.addFilename === "end") {
            line = content + '    <-- ' + this.filename;
        }
        else {
            line = content;
        }
        this.nextLine();
        return line;
    }

    public atEnd(): Boolean {
        return (this.currentLocation >= this.size);
    }

    private nextLine() {
        if (this.currentLocation < this.size) {
            this.currentLocation++;
        }
        // Skip over any blank lines
        if (this.dropBlank) {
            while (this.currentLocation < this.size &&
                this.content[this.currentLocation].trim().length === 0) {
                this.currentLocation++;
            }
        }
        if (this.currentLocation < this.size) {
            this.currentLine = new LogLine(this.content[this.currentLocation], this.regExpList, this.replaceTimestamps);
        } else {
            this.currentLine = null;
        }
    }

    private prepareRegularExpressions(regex: undefined | string): RegExp[] {
        let regexs: RegExp[] = [/^[\d-]+\s[\d:]*[,\d]*/];

        if (typeof regex === "string") {
            if (regex.includes(" ")) {
                regexs = [];
                regex.split(" ").forEach(function (singleRegex) { regexs.push(RegExp(singleRegex)); });
            } else {
                regexs = [RegExp(regex)];
            }
        }
        return regexs;
    }
}

// Exports
export = LogFile;