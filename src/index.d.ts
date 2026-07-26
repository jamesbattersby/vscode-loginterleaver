interface IFormats {
    name: string;
    format: string
}

interface ILineParts {
    prefix: string;
    timestampText: string;
    content: string | null;
    postfix: string;
    // The timestamp this line sorts by.  When the line has no parseable
    // timestamp of its own this is the last good one, carried forward.
    timestamp: Date;
    filename: string;
}

interface IDupInfo {
    // Index in the merged output of the first line of the run.
    headerIndex: number;
    // The line content the run is made of, trimmed and without its timestamp.
    key: string;
    // Number of occurrences, including the first.
    count: number;
    first: Date;
    last: Date;
    // The timestamps as they appeared in the source, for the drop summary.
    firstText: string;
    lastText: string;
    files: string[]
}
