# Log Interleaver README

`Log Interleaver` can interleave log files based on their timestamp.

## Features

Combine multiple log files in to a single ordered log.

Where a log file contains some entries with no timestamp (or an invalid one), these can be optionally removed or have the previous valid timestamp applied.

## Requirements

There are no special requirements.

## Extension Settings


| timestampRegex       | The regular expression used to extract the timestamp from the logline.  Default `^[\\d-]+\\s[\\d:]*[,\\d]*`.                                                            |
| dropBlankLines       | Drop lines that only contain whitespace.  Default `true`.                                                                                                               |
| dropInvalidTimestamp | Drop lines where the timestamp cannot be extracted.  If set to `false` and the timestamp cannot be extracted, the  previous timestamp will be applied. Default `false`. |
| addFileName          | Add the originating filename to the merged log.  Options are `off`, `start` and `end`. Default `off`                                                                    |
| includeActiveEditor  | Include the contents of the active editor, if it is a log file.  Default `true`.                                                                                        |


## Usage

Select `Log Interleaver` from the command pallet, then select the files to interleave.  A new editor will be opened with the interleaved logs.  If the
currently active editor contains a log file, this will be included in the interleaved log.  This can be disabled in the settings.

## Known Issues

No known issues.

## Release Notes

Under development.
