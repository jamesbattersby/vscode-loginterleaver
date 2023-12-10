# Change Log

All notable changes to the "Log Interleaver" extension will be documented in this file.

## Unreleased

Features:

- Allow duplicate lines to be dropped (#572)

## 0.2.0: 29 May 2023

Features:

- Allow non-ISO formatted dates to be parsed (#485)

Updates:

- Remove moment and replace with date-fns

## 0.1.0: 29 December 2022

Features:

- Add progress indication (#425)

Updates:

- Package updates
- Improved performance

## 0.0.5: 12 April 2022

Updates:

- Package security updates

## 0.0.4: 26 July 2020

Updates:

- Package updated
- Removed depreciated calls

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
