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
    private initalTimestamp: moment.Moment;
    private finalTimestamp: moment.Moment;
    private gotTimestamps: boolean;
    private lastTimestamp: moment.Moment;
    private regex: string | undefined;
    private dropBlank: boolean;
    private dropInvalid: boolean;
    private addFilename: string | undefined;
    private paddedFilename: string;

    public constructor(content: string, filename: string, settings: vscode.WorkspaceConfiguration) {
        this.filename = filename;
        this.content = content.split(/\r?\n/);
        this.size = this.content.length;
        this.currentLocation = 0;
        this.initalTimestamp = moment();
        this.finalTimestamp = moment();
        let firstTimestampOk : boolean = this.setFirstTimestamp();
        let lastTimestampOk : boolean = this.setLastTimestamp();
        this.gotTimestamps = lastTimestampOk && firstTimestampOk;
        this.lastTimestamp = this.initalTimestamp;
        this.regex = settings.get("timestampRegex");
        this.dropBlank = (settings.get("dropBlankLines") === "true");
        this.dropInvalid = (settings.get("dropInvalidTimestamp") === "true");
        this.addFilename = settings.get("addFileName");
        this.paddedFilename = filename;
    }

    public setMaxFilenameLength(filenamePadding: number) {
        this.paddedFilename = this.filename.padEnd(filenamePadding) + ' | ';
    }

    public hasGotTimestamps() : boolean {
        return this.gotTimestamps;
    }
    public setFirstTimestamp() : boolean {
        for(let i = 0; i < this.size; i++) {
            let logLine = new LogLine(this.content[i], this.regex);
            let timestamp = logLine.getTimestamp();
            if (moment.isMoment(timestamp)) {
                this.initalTimestamp = timestamp;
                return true;
            }
        }
        return false;
    }

    public setLastTimestamp() : boolean {
        for(let i = this.size - 1; i >= 0; i--) {
            let logLine = new LogLine(this.content[i], this.regex);
            let timestamp = logLine.getTimestamp();
            if (moment.isMoment(timestamp)) {
                this.finalTimestamp = timestamp;
                return true;
            }
        }
        return false;
    }

    public getStartTimestamp() : moment.Moment {
        return this.initalTimestamp;
    }

    public getEndTimestamp() : moment.Moment {
        return this.finalTimestamp;
    }

    public getTimestamp() : moment.Moment {
        if (this.currentLocation >= this.size) {
            return this.lastTimestamp;
        }

        do {
            let logline = new LogLine(this.content[this.currentLocation], this.regex);
            let timestamp = logline.getTimestamp();
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

    public getLine() : null | string {
        let line : string = "";

        if (this.currentLocation >= this.size) {
            return null;
        }
        else if (this.addFilename === "start") {
            line = this.paddedFilename + this.content[this.currentLocation];
        }
        else if (this.addFilename === "end") {
            line = this.content[this.currentLocation] + '    <-- ' + this.filename;
        }
        else {
            line = this.content[this.currentLocation];
        }
        this.nextLine();
        return line;
    }

    public atEnd() : Boolean {
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
    }
}

// Exports
export = LogFile;