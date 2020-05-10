# Console Log Linter

A slick extension that flags console.log, console.debug, console.error and console.warn statements with information
messages (blue squiggly line). It also provides commands to easily remove either all console statements or all 
of each type.

## Details

Activated on opening of JavaScript, JavaScript React, TypeScript React, and HTML files or on issuing one of the commands
Based on the Microsoft language server example in the https://github.com/Microsoft/vscode-extension-samples repo.
This is a bit overkill but it prevents VSCode from locking up when you open very large files.

The regex used to match the console statements to flag them is configurable, so you could adopt it to only match some.
However, the regex for the commands isn't. Has full tests as well which might be interesting to some

## Commands 

* Remove all console.log statements
* Remove all console.error statements
* Remove all console.debug statements
* Remove all console.warn statements
* Remove all console.* statements