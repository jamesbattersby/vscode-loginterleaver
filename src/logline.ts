'use strict';

// Imports
import * as moment from 'moment';

// Implementation
class LogLine {
    private readonly line: string;
    private readonly regexs: RegExp[];

    public constructor(line: string, regexs: RegExp[]) {
        this.line = line;
        this.regexs = regexs;
    }

    public getTimestamp(): null | moment.Moment {
        for (let index: number = 0; index < this.regexs.length; index++) {
            let stringTimestamp = this.regexs[index].exec(this.line);
            if (stringTimestamp) {
                let tsIndex: number = 1;
                if (stringTimestamp.length > 2) {
                    console.error("Got multiple match groups, expecting two");
                    console.error(this.regexs[index].source);
                } else if (stringTimestamp.length === 1) {
                    tsIndex = 0;
                }
                let timestamp = moment(stringTimestamp[tsIndex].toString());
                return timestamp;
            }
        }
        return null;
    }
}

// Exports
export = LogLine;
