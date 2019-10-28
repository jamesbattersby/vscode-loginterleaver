'use strict';

// Imports
import * as moment from 'moment';

// Implementation
class LogLine {
    private readonly line: string;

    public constructor(line: string){
        this.line = line;
    }

    public getTimestamp() {
        // ^([\d-]*\s[\d:]*)\s.*$
        let regex = /^[\d-]+\s[\d:]*[,\d]*/;
        let stringTimestamp = regex.exec(this.line);
        if (stringTimestamp) {
            let timestamp = moment(stringTimestamp[0].toString());
            if (timestamp.isValid()) {
                return timestamp;
            }
        }
        return null;
    }
}

// Exports
export = LogLine;
