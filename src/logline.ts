'use strict';

// Imports
import * as moment from 'moment';

// Implementation
class LogLine {
    private readonly line: string;
    private readonly regexs: RegExp[];
    private timestamp: null | moment.Moment;

    public constructor(line: string, regexs: RegExp[]) {
        this.line = line;
        this.regexs = regexs;
        this.timestamp = null;
        for (let index: number = 0; index < this.regexs.length; index++) {
            let stringTimestamp = this.regexs[index].exec(this.line);
            if (stringTimestamp) {
//                let timestamp = moment(stringTimestamp[0].toString(), "YYYY-MM-DD HH:mm:ss.SSSSSSSSSSS");
                this.timestamp = moment(stringTimestamp[0].toString());
            }
        }
    }

    public getTimestamp(): null | moment.Moment {
        return this.timestamp;
    }
}

// Exports
export = LogLine;
