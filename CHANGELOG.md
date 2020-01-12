# Change Log

All notable changes to the "Log Interleaver" extension will be documented in this file.

## Unreleased

Package Updates:
- typescript 3.7.2 -> 3.7.4
- node 12.12.14 -> 13.1.4
- vscode 1.40.0 -> 1.41.0
- vscode-test 1.2.3 -> 1.3.0
- webpack 4.41.2 -> 4.41.5
- mocha 6.2.2 -> 7.0.0

## 0.0.3: 8 December 2019

Bug Fixes:
- Corrected the `includeActiveEditor` setting.

Package Updates:
- vscode 1.39.0 -> 1.40.0
- node 10.17.3 -> 12.12.14
- tslist 5.20.0 -> 5.20.1
- vscode-test 1.2.2 -> 1.2.3
- glob 7.1.5 -> 7.1.6
- typescript 3.6.4 -> 3.7.2

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
