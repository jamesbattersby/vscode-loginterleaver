<p align=center>
<a href="https://travis-ci.org/jamesbattersby/vscode-loginterleaver"><img src="https://travis-ci.org/jamesbattersby/vscode-loginterleaver.svg?branch=master" alt="Build Status"></a>
<a href="https://raw.githubusercontent.com/jamesbattersby/vscode-loginterleaver/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat"></a>
</p>


# Log Interleaver

`Log Interleaver` can interleave log files based on their timestamp.

## Features

Combine multiple log files in to a single ordered log.

* Can use multiple regular expressions to extract the timestamps from log files, allowing files with different format times to be merged.
* Blank lines can be removed, enabling log files to be cleaned up.
* Lines with invalid or missing timestamps can be either removed, or have the timestamp of the immediatly preceeding line assigned.  If there is a block
of invalid or missing timestamps, these lines will be kept together in the merged output
* Timestamps in the merged output can be re-written in ISO format.
* Can merge an arbitary number of of files at once.
* Can include the contents of the current active editor, if it is a log file.
* The merged output can contain the file names of the source files, either prefixed or appended to each line.

## Requirements

There are no special requirements.

## Extension Settings

| Setting              | Description                                                                                                 |
|----------------------|-------------------------------------------------------------------------------------------------------------|
| dropBlankLines       | Drop lines that only contain whitespace. Default `true`.                                                    |
| dropInvalidTimestamp | Drop lines where the timestamp cannot be extracted. Default `true`.                                         |
| addFileName          | Add the originating filename to the merged log.  Options `off`, `start`, `end`.  Default `off`.             |
| timestampRegex       | The regular expressions used to extract the timestamp from the logline Multiple expressions can be added as a space seperated list. Each must have one match group.  Default `(^[\\d]{4}[-\/][\\d]{2}[-\/][\\d]{2}(\\s\|T){1}[\\d]{2}:[\\d]{2}:[\\d]{2}(\\.\\d*)?((\\+\|-)?[\\d]{2}:[\\d]{2})?)`. |
| includeActiveEditor  | Include the contents of the active editor, if it is a log file. Default `true`.                             |
| replaceTimestamps    | Replace timestamps with ISO formatted timestamps in merged output. Default `false`.                         |

## Usage

Select `Log Interleaver` from the command pallet, then select the files to interleave.  A new editor will be opened with the interleaved logs.  If the
currently active editor contains a log file, this will be included in the interleaved log.  This can be disabled in the settings.

## Known Issues

No known issues.

## Release Notes

Under development.
