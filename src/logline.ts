'use strict';

// Imports
import { compareAsc, format, parse, parseISO, isValid } from 'date-fns'

// Implementation
export class LogLine {
    private readonly line: string;
    private readonly regexs: RegExp[];
    private timestamp: null | Date;
    private required: string;

    public constructor(line: string, regexs: RegExp[], replaceTimestamp: boolean) {
        this.line = line;
        this.regexs = regexs;
        this.timestamp = null;
        this.required = line;
        for (let index: number = 0; index < this.regexs.length; index++) {
            let regexResult: null | RegExpExecArray = this.regexs[index].exec(this.line);
            if (regexResult && regexResult.length === 2) {
                this.timestamp = parseISO(regexResult[1].toString());
                let mytest2 = parse("19/Apr/2023:01:10:14 +0000", "dd/LLL/yyyy:HH:mm:ss xxxx", new Date())
                if (isValid(this.timestamp) && replaceTimestamp) {
                    this.required = this.line.replace(regexResult[1].toString(), this.timestamp.toISOString());
                }
                break;
            }
        }
    }

    public getTimestamp(): null | Date {
        return this.timestamp;
    }

    public getLine(): string {
        return this.required;
    }
}
