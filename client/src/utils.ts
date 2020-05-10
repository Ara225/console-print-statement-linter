import vscode = require('vscode');

/**
 * Function to get lines matching the search term in the editor
 * @param {vscode.TextEditor} editor
 *   A text editor, should be the currently active one
 * @param {String} searchTerm
 *   A regular expression
 * @returns {Array}
 *   Array containing a list of ranges of the matching lines (item 0) and the text of them (item 1)
 */
function getMatchingLines(editor: vscode.TextEditor, searchTerm: string) {
	var currentLine: { text: any; rangeIncludingLineBreak: any; };
	var listOfRanges = [];
	var lineContent: string;
	try {
		// iterate though the lines in the document
		for (let index = 0; index < editor.document.lineCount; index++) {
			// Get the current line
			currentLine = editor.document.lineAt(index);
			// Get the text of the current line
			lineContent = currentLine.text;
			// If the regex provided in searchTerm matches part of the line
			if (lineContent.search(searchTerm) !== -1) {
				// Append the result to the list of ranges
				listOfRanges.push(currentLine.rangeIncludingLineBreak);
			}
		}
		if (listOfRanges === []) {
			vscode.window.showErrorMessage('No matches found');
			return null;
		}
		else {
			return listOfRanges;
		}
	}
	catch (e) {
		vscode.window.showErrorMessage('Unable to complete action due to unexpected error ' + e);
	}
	return null;
}

/**
 * This is the implementation of the commands for removing console statements
 * @param regexStringToDelete A regex matching the string we want to delete 
 */
export function commandsImplementation(regexStringToDelete:string) {
	var editor = vscode.window.activeTextEditor;
	try {
		var lines = getMatchingLines(editor, regexStringToDelete);    
		if (lines !== null) {
			// Delete lines
			editor.edit(function (builder) {
				for (let index = 0; index < lines.length; index++) {
					builder.delete(lines[index]);
				}
			});
					
			// Inform user of success
			vscode.window.showInformationMessage(String(lines.length) + ' lines were deleted');
		}
	}
	catch (e) {
		vscode.window.showErrorMessage('Unable to complete action due to unexpected error ' + e);
	}
}