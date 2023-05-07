'use strict';

// Imports
import { parse, parseISO, isValid } from 'date-fns'

// Implementation
export class LogLine {
    private readonly line: string;
    private readonly regexs: RegExp[];
    private timestamp: null | Date;
    private required: string;
    private lastFormatUsed: string | null

    public constructor(line: string, regexs: RegExp[], replaceTimestamp: boolean, formats: IFormats[] | undefined) {
        this.line = line;
        this.regexs = regexs;
        this.timestamp = null;
        this.required = line;
        this.lastFormatUsed = null;
        for (let index: number = 0; index < this.regexs.length; index++) {
            let regexResult: null | RegExpExecArray = this.regexs[index].exec(this.line);
            if (regexResult && regexResult.length === 2) {
                let inputTime: string = regexResult[1].toString()
                // Use the last used format, if there was one
                if (this.lastFormatUsed) {
                    this.timestamp = parse(inputTime, this.lastFormatUsed, new Date());
                }
                if (!isValid(this.timestamp)) {
                    this.timestamp = parseISO(inputTime);
                }
                if (!isValid(this.timestamp) && formats) {
                    for (let format of formats) {
                        this.timestamp = parse(inputTime, format.format, new Date());
                        if (isValid(this.timestamp)) {
                            this.lastFormatUsed = format.format;
                            break;
                        }
                    }
                }
                if (isValid(this.timestamp) && this.timestamp && replaceTimestamp) {
                    this.required = this.line.replace(inputTime, this.timestamp.toISOString());
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
