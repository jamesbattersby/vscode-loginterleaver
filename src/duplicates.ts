'use strict';

// Imports
import { differenceInMilliseconds, formatDuration, intervalToDuration, isEqual, isValid } from 'date-fns';

// Implementation

// The units formatDuration is allowed to use.  Without this it stops at the
// largest non-zero unit and we lose the smaller ones.
const durationUnits: ("years" | "months" | "days" | "hours" | "minutes" | "seconds")[] =
    ["years", "months", "days", "hours", "minutes", "seconds"];

/**
 * Describe how long a run of repeated lines lasted.
 *
 * date-fns has no sub-second resolution, so anything under a second formats as
 * an empty string.  Fall back to milliseconds in that case.
 */
export function describeSpan(first: Date, last: Date): string {
    if (!isValid(first) || !isValid(last)) {
        return "";
    }
    let span: string = formatDuration(intervalToDuration({ start: first, end: last }), { format: durationUnits });
    if (!span) {
        span = `${differenceInMilliseconds(last, first)}ms`;
    }
    return span;
}

/**
 * The annotation appended to the first line of a folded run.  This is the only
 * text visible once the region is collapsed, so it has to carry the whole
 * summary.
 */
export function describeRun(count: number, first: Date, last: Date, files: string[] = []): string {
    let summary: string = `repeated ${count} times`;

    if (isValid(first) && isValid(last) && !isEqual(first, last)) {
        let span: string = describeSpan(first, last);
        if (span) {
            summary += ` over ${span}`;
        }
    }

    // With addFileName on, the visible line only carries the first file's name.
    // Name them all so a collapsed cross-file run is not misleading.
    if (files.length > 1) {
        summary += ` in ${files.join(', ')}`;
    }

    return `  ⟨${summary}⟩`;
}

/**
 * The line emitted in place of the repeats that were discarded.
 */
export function summariseRun(count: number, firstText: string, lastText: string): string {
    let summary: string = `Above line repeated ${count} times`;
    if (firstText && lastText && firstText !== lastText) {
        summary += ` between ${firstText} and ${lastText}`;
    }
    return summary;
}
