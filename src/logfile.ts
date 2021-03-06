'use strict';

// Imports
import { WorkspaceConfiguration } from 'vscode';
import { LogLine } from './logline';
import moment = require('moment');

// Implementation
export class LogFile {
    private readonly filename: string;
    private readonly content: string[];
    private readonly size: number;
    private readonly gotTimestamps: boolean;
    private readonly replaceTimestamps: boolean;
    private readonly regExpList: RegExp[];
    private readonly dropBlank: boolean;
    private readonly dropInvalid: boolean;
    private readonly addFilename: string | undefined;
    private currentLocation: number;
    private currentLine: null | LogLine;
    private initalTimestamp: moment.Moment;
    private lastTimestamp: moment.Moment;
    private paddedFilename: string;


    public constructor(content: string, filename: string, settings: WorkspaceConfiguration) {
        this.regExpList = this.prepareRegularExpressions(settings.get("timestampRegex"));
        this.filename = filename;
        this.content = content.split(/\r?\n/);
        this.size = this.content.length;
        this.currentLocation = 0;
        this.initalTimestamp = moment();
        this.gotTimestamps = this.setFirstTimestamp();
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

    public getStartTimestamp(): moment.Moment {
        return this.initalTimestamp;
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
