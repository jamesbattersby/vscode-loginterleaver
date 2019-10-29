'use strict';

// Imports
import * as moment from 'moment';

// Implementation
class LogLine {
    private readonly line: string;
    private readonly regex: string | undefined;

    public constructor(line: string, regex: string | undefined) {
        this.line = line;
        this.regex = regex;
    }

    public getTimestamp() : null | moment.Moment {
        let regex = /^[\d-]+\s[\d:]*[,\d]*/;
        if (typeof this.regex === "string") {
            regex = RegExp(this.regex);
        }
        let stringTimestamp = regex.exec(this.line);
        if (stringTimestamp) {
            let timestamp = moment(stringTimestamp[0].toString());
            return timestamp;
        }
        return null;
    }
}

// Exports
export = LogLine;
