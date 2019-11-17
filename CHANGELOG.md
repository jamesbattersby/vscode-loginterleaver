# Change Log

All notable changes to the "Log Interleaver" extension will be documented in this file.

## Unreleased


## 0.0.2: 17 November 2019

Updates:
- Updated extension name.
- Added more description around the default regex.
- Removed unused code.

## 0.0.1: 12 November 2019

Features:
- Can use multiple regular expressions to extract the timestamps from log files, allowing files with different format times to be merged.
- Blank lines can be removed, enabling log files to be cleaned up.
- Lines with invalid or missing timestamps can be either removed, or have the timestamp of the immediatly preceeding line assigned. If there is a block of invalid or missing timestamps, these lines will be kept together in the merged output
- Timestamps in the merged output can be re-written in ISO format.
- Can merge an arbitary number of of files at once.
- Can include the contents of the current active editor, if it is a log file.
- The merged output can contain the file names of the source files, either prefixed or appended to each line.
