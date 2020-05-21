# Console/Print Statement Linter

A slick extension that flags console.* statements in JS/TS and their equivalent statements in other languages. It also provides 
commands to easily remove either all console statements or all of each type. I additionally have a simpler JS/TS only extension:
https://marketplace.visualstudio.com/items?itemName=ara225.console-log-linter

## Details

Activated on opening of JavaScript, JavaScript React, TypeScript React, HTML, C, C++, C#, Java & Python files or on issuing one 
of the commands

You can turn matching on and off for each individual language.The regex used to match the statements to flag them is configurable, 
so you could adopt it to only match some. However, the regex for the commands isn't. Additionally, you can the configure what error 
level the messages it throws are at.

Based on the Microsoft language server example in the https://github.com/Microsoft/vscode-extension-samples repo.
This is a bit overkill but it prevents VSCode from locking up when you open very large files.

## Commands 

* Remove all console.log statements
* Remove all console.error statements
* Remove all console.debug statements
* Remove all console.warn statements
* Remove all console.* statements
* Remove all cout/Console::Write* statements
* Remove all print statements
* Remove all System.out.print statements
* Remove all Console.Write statements
* Remove all printf statements