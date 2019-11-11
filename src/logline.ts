'use strict';

// Imports
import * as moment from 'moment';

// Implementation
class LogLine {
    private readonly line: string;
    private readonly regexs: RegExp[];
    private timestamp: null | moment.Moment;
    private required: string;

    public constructor(line: string, regexs: RegExp[], replaceTimestamp: boolean) {
        this.line = line;
        this.regexs = regexs;
        this.timestamp = null;
        this.required = line;
        for (let index: number = 0; index < this.regexs.length; index++) {
            let stringTimestamp = this.regexs[index].exec(this.line);
            if (stringTimestamp) {
                this.timestamp = moment(stringTimestamp[0].toString());
                if (this.timestamp.isValid() && replaceTimestamp) {
                    this.required = this.line.replace(this.regexs[index], this.timestamp.toISOString());
                }
                break;
            }
        }
    }

    public getTimestamp(): null | moment.Moment {
        return this.timestamp;
    }

    public getLine(): string {
        return this.required;
    }
}

// Exports
export = LogLine;
