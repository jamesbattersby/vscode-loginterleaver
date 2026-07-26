'use strict';

// Imports
import { Event, EventEmitter, FoldingContext, FoldingRange, FoldingRangeProvider, TextDocument, Uri } from 'vscode';

// Implementation

/**
 * Supplies the folding ranges for the merged logs this extension produces.
 *
 * The ranges cannot be derived from the document text, so they are worked out
 * during the merge and stashed here against the URI of the untitled document
 * they belong to.  Keying on the URI is also what stops this provider claiming
 * log files it knows nothing about.
 */
export class DuplicateFoldingProvider implements FoldingRangeProvider {
    private readonly ranges: Map<string, FoldingRange[]> = new Map();
    private readonly changed: EventEmitter<void> = new EventEmitter<void>();

    public readonly onDidChangeFoldingRanges: Event<void> = this.changed.event;

    public provideFoldingRanges(document: TextDocument, _context: FoldingContext): FoldingRange[] {
        return this.ranges.get(document.uri.toString()) ?? [];
    }

    /**
     * The document may already have been asked for its folding ranges by the
     * time the merge has any to give, so registering also fires the change
     * event to throw away that empty answer.
     */
    public register(uri: Uri, ranges: FoldingRange[]) {
        this.ranges.set(uri.toString(), ranges);
        this.changed.fire();
    }

    public clear(uri: Uri) {
        if (this.ranges.delete(uri.toString())) {
            this.changed.fire();
        }
    }

    public dispose() {
        this.ranges.clear();
        this.changed.dispose();
    }
}
