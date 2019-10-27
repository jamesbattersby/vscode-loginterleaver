'use strict';

// Imports
import LogLine = require('./logline');
import moment = require('moment');

// Implementation
class LogFile {
    private readonly paddedFilename: string;
    private readonly filename: string;
    private readonly content: string[];
    private readonly size: number;
    private currentLocation: number;
    private initalTimestamp: moment.Moment;
    private finalTimestamp: moment.Moment;
    private gotTimestamps: boolean;
    private lastTimestamp: moment.Moment;

    public constructor(content: string, filename: string, filenamePadding: number) {
        this.paddedFilename = filename.padEnd(filenamePadding) + ' | ';
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
    }

    public hasGotTimestamps() : boolean {
        return this.gotTimestamps;
    }
    public setFirstTimestamp() : boolean {
        for(let i = 0; i < this.size; i++) {
            let logLine = new LogLine(this.content[i]);
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
            let logLine = new LogLine(this.content[i]);
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
        // Skip over any blank lines
        while (this.currentLocation < this.size && 
               this.content[this.currentLocation].trim().length === 0) {
            this.currentLocation++;
        }

        if (this.currentLocation >= this.size) {
            return this.lastTimestamp;
        }
        let logline = new LogLine(this.content[this.currentLocation]);
        let timestamp = logline.getTimestamp();
        if (moment.isMoment(timestamp)) {
            this.lastTimestamp = timestamp;
            return timestamp;
        }
        return this.lastTimestamp;
    }

    public getLine() : null | string {
        if (this.currentLocation >= this.size) {
            return null;
        }
        // todo: what to do about adding original file to result?
        //       Add file name at the beginning or end?
        
        // return this.paddedFilename + this.content[this.currentLocation++];
        // return this.content[this.currentLocation++] + '    <-- ' + this.filename;
        return this.content[this.currentLocation++];
    }

    public atEnd() : Boolean {
        return (this.currentLocation >= this.size);
    }
}

// Exports
export = LogFile;