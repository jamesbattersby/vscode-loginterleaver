<p align=center>
<a href="https://circleci.com/gh/jamesbattersby/vscode-loginterleaver"><img src="https://circleci.com/gh/jamesbattersby/vscode-loginterleaver.svg?style=shield"></a>
<a href="https://raw.githubusercontent.com/jamesbattersby/vscode-loginterleaver/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat"></a>
<a href="https://snyk.io/test/github/jamesbattersby/vscode-loginterleaver?targetFile=package.json"><img src="https://snyk.io/test/github/jamesbattersby/vscode-loginterleaver/badge.svg?targetFile=package.json" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/jamesbattersby/vscode-loginterleaver?targetFile=package.json" style="max-width:100%;"></a>
</p>


# Log Interleaver

`Log Interleaver` can interleave log files based on their timestamp.

## Features

Combine multiple log files in to a single ordered log.

* Can use multiple regular expressions to extract the timestamps from log files, allowing files with different format times to be merged.
* Fully customised date formats can be specified using date-fns format specifiers, see https://date-fns.org/v2.30.0/docs/parse.
* Blank lines can be removed, enabling log files to be cleaned up.
* Repeated lines can be collapsed into a folded region, or dropped entirely.
* Lines with invalid or missing timestamps can be either removed, or have the timestamp of the immediatly preceeding line assigned.  If there is a block
of invalid or missing timestamps, these lines will be kept together in the merged output.
* Timestamps in the merged output can be re-written in ISO format.
* Can merge an arbitary number of log files at once.
* Can include the contents of the current active editor, if it is a log file.
* The merged output can contain the file names of the source files, either prefixed or appended to each line.

## Extension Settings

| Setting                  | Description                                                                                                                                                                                                                               | Default                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| duplicateLines           | How to handle repeated lines.  Options `keep`, `drop`, `fold`.  See [Repeated lines](#repeated-lines).                                                                                                                                    | `fold`                                                                                                                    |
| duplicateFoldThreshold   | The smallest number of repeats to collapse into a folded region.  Only applies when `duplicateLines` is `fold`.                                                                                                                           | `2`                                                                                                                       |
| foldDuplicatesOnOpen     | Collapse the folded regions when the merged log is opened.                                                                                                                                                                                | `true`                                                                                                                    |
| dropBlankLines           | Drop lines that only contain whitespace.                                                                                                                                                                                                  | `true`                                                                                                                    |
| dropInvalidTimestamp     | Drop lines where the timestamp cannot be extracted.                                                                                                                                                                                       | `false`                                                                                                                   |
| addFileName              | Add the original filename to the merged log.  Options `off`, `start`, `end`.                                                                                                                                                              | `off`                                                                                                                     |
| timestampRegex           | The regular expression used to extract the timestamp from the log file. Multiple expressions can be added as a space separated list.                                                                                                      | `^([\d]{4}[-/][\d]{2}[-/][\d]{2}[\sT]{1}[\d]{2}:[\d]{2}:[\d]{2}(?:[\.,]{1}\d*)?(?:Z)?(?:(?<!Z)[\+-]{1}[\d]{2}:[\d]{2})?)` |
| includeActiveEditor      | Include the contents of the active editor, if it is a log file.                                                                                                                                                                           | `true`                                                                                                                    |
| replaceTimestamps        | Replace timestamps with ISO formatted timestamps in the merged output.                                                                                                                                                                    | `false`                                                                                                                   |
| timeFormatSpecifications | An array of time format specification to be tried if the format is not an ISO standard. Consists of a "name" and "format".  The "name" is for reference only.  The "format" is as described here: https://date-fns.org/v2.30.0/docs/parse |                                                                                                                           |

### Repeated lines

Consecutive lines are considered repeats of each other when their content matches, ignoring the timestamp and any filename
decoration.  The same message logged at different times, or by different files, therefore still counts as a repeat.

`duplicateLines` controls what happens to them:

- `keep` - every line is written out unchanged.
- `drop` - the repeats are discarded and replaced by a single `Above line repeated 5 times between ... and ...` summary.
- `fold` - every line is kept, but the repeats are collapsed into a folded region.

In `fold` mode the summary is appended to the first line of the run, because that is the only line the editor leaves visible
once the region is collapsed:

``` text
2023-04-19 01:10:14 Connection retry  ⟨repeated 5 times over 2 minutes 13 seconds⟩
2023-04-19 01:10:45 Connection retry
2023-04-19 01:11:16 Connection retry
2023-04-19 01:11:54 Connection retry
2023-04-19 01:12:27 Connection retry
```

If every line in the run shares the same timestamp the summary is just `⟨repeated 5 times⟩`.  When `addFileName` is on and the
run spans more than one file, the file names are listed too.

### Notes on regular expressions

The `timestampRegex` is a space seperated list of expressions.  All expressions must have exactly one match group, this is expected to be the timestamp.
If your timestamps have some prefix, use a non-capturing group. For example: `(?:abc)`.

The default regex should be able to extract an ISO formatted timestamp.  So, all of the following should work by default:

- `2019-11-14 15:36:00`
- `2019-11-14 15:36:00Z`
- `2019-11-14 15:36:00+01:00`
- `2019-11-14 15:36:00.123`
- `2019-11-14 15:36:00.123-07:00`

The timestamps may include a `T` between the date and time.

Note that if no timezone information is supplied, the timezone will be assumed to be the same as the local machine.

### Adding custom date formats

Additional formats can be added in the `timeFormatSpecifications` settings, for example:

``` json
{
    "name": "My time format",
    "format": "dd/LLL/yyyy:HH:mm:ss xxxx"
}
```

Note that the `name` field is not used.  It simply for your reference.
You can test out formats interactivley here: https://date-fns-interactive.netlify.app/

## Usage

There are two ways to choose the files to merge.  Either way a new editor is opened with the interleaved logs.

### Log Interleaver

Select `Log Interleaver` from the command pallet, then select the files to interleave.  If the currently active editor contains a log file, this will be
included in the interleaved log.  This can be disabled in the settings.

### Log Interleaver: Interleave Open Files

Select `Log Interleaver: Interleave Open Files` from the command pallet to merge the files you already have open, without going near the file dialog.
Every open editor is listed and pre-selected, so pressing `Enter` merges the lot; deselect anything you do not want first.

This is the option to reach for if your platform's open dialog will not let you select more than one file.

Files are read from the editor rather than from disk, so unsaved changes are included, and untitled documents can be merged too.

## Known Issues

Pleaes see the project [issues page](https://github.com/jamesbattersby/vscode-loginterleaver/issues) for current issues.
