<p align=center>
<a href="https://travis-ci.org/jamesbattersby/vscode-loginterleaver"><img src="https://travis-ci.org/jamesbattersby/vscode-loginterleaver.svg?branch=master" alt="Build Status"></a>
<a href="https://raw.githubusercontent.com/jamesbattersby/vscode-loginterleaver/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat"></a>
</p>


# Log Interleaver README

`Log Interleaver` can interleave log files based on their timestamp.

## Features

Combine multiple log files in to a single ordered log.

Where a log file contains some entries with no timestamp (or an invalid one), these can be optionally removed or have the previous valid timestamp applied.

## Requirements

There are no special requirements.

## Extension Settings

| Setting              | Description                                                                                                 |
|----------------------|-------------------------------------------------------------------------------------------------------------|
| dropBlankLines       | Drop lines that only contain whitespace. Default `true`.                                                    |
| dropInvalidTimestamp | Drop lines where the timestamp cannot be extracted. Default `true`.                                         |
| addFileName          | Add the originating filename to the merged log.  Options `off`, `start`, `end`.  Default `off`.             |
| timestampRegex       | The regular expressions used to extract the timestamp from the logline Multiple expressions can be added as a space seperated list. Each must have one match group.  Default `(^[\\d-]+\\s[\\d:]*[,\\d]*)`. |
| includeActiveEditor  | Include the contents of the active editor, if it is a log file. Default `true`.                             |

## Usage

Select `Log Interleaver` from the command pallet, then select the files to interleave.  A new editor will be opened with the interleaved logs.  If the
currently active editor contains a log file, this will be included in the interleaved log.  This can be disabled in the settings.

## Known Issues

No known issues.

## Release Notes

Under development.
