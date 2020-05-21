
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult
} from 'vscode-languageserver';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
});

// The example settings
interface ExtensionSettings {
	maxNumberOfProblems: number;
	regexToMatchJS: string;
	regexToMatchCpp: string;
	JavaScriptMatchingEnabled: boolean;
	CppMatchingEnabled: boolean;
	problemSeverity: string;
	regexToMatchPython: string;
	pythonMatchingEnabled: boolean;
	regexToMatchCsharp: string;
	csharpMatchingEnabled: boolean;
	javaMatchingEnabled: boolean;
	regexToMatchJava: string;
	regexToMatchC: string;
	CMatchingEnabled: boolean;
}
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExtensionSettings = { 
	maxNumberOfProblems: 1000, 
	regexToMatchJS: '\bconsole\\.(log|warn|error|debug)\b', 
	regexToMatchCpp: "(cout|Console::Write)",
	problemSeverity: 'Information',
	JavaScriptMatchingEnabled: true,
	CppMatchingEnabled: true,
	regexToMatchC: "printf\\(",
	CMatchingEnabled: true,
	regexToMatchPython: "print\\(",
	pythonMatchingEnabled: true,
	regexToMatchCsharp: "(Console\\.Write\\(|Console\\.WriteLine\\()",
	csharpMatchingEnabled: true,
	javaMatchingEnabled: true,
	regexToMatchJava: "(System\\.out\\.print\\(|System\\.out\\.println\\()"
};

let globalSettings: ExtensionSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExtensionSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExtensionSettings>(
			(change.settings.consoleAndPrintStatementLinter || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ExtensionSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'consoleAndPrintStatementLinter'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

/**
 * Set the severity of the problems/diagnostics we report
 * @param textDocument 
 * @param settings 
 */
function setProblemSeverity(textDocument: TextDocument, settings: ExtensionSettings) {
	let problemSeverity:DiagnosticSeverity;
	if (settings.problemSeverity === 'Hint') {
		problemSeverity = DiagnosticSeverity.Hint;
	}
	else if (settings.problemSeverity === 'Information') {
		problemSeverity = DiagnosticSeverity.Information;
	}
	else if (settings.problemSeverity === 'Warning') {
		problemSeverity = DiagnosticSeverity.Warning;
	}
	else {
		problemSeverity = DiagnosticSeverity.Error;
	}
	return problemSeverity
}

/**
 * Set what Regex pattern we need to use based on the document language. e.g. print( for Python
 * @param textDocument 
 * @param settings 
 */
function setPattern(textDocument: TextDocument, settings: ExtensionSettings) {
	let pattern;
	if (['html', 'javascript', 'javascriptreact', 'typescriptreact', 'typescript'].indexOf(textDocument.languageId) >= 0 && settings.JavaScriptMatchingEnabled) {
		pattern = new RegExp(settings.regexToMatchJS, 'g');
	}
	else if ('cpp' == textDocument.languageId && settings.CppMatchingEnabled) {
		pattern = new RegExp(settings.regexToMatchCpp, 'g');
	}
	else if ('c' == textDocument.languageId && settings.CMatchingEnabled) {
		pattern = new RegExp(settings.regexToMatchC, 'g');
	}
	else if ("python" == textDocument.languageId && settings.pythonMatchingEnabled) {
		pattern = new RegExp(settings.regexToMatchPython, 'g');
	}
	else if ("csharp" == textDocument.languageId && settings.csharpMatchingEnabled) {
		pattern = new RegExp(settings.regexToMatchCsharp, 'g');
	}
	else if ("java" == textDocument.languageId && settings.javaMatchingEnabled) {
		pattern = new RegExp(settings.regexToMatchJava, 'g');
	}
	return pattern;
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	let settings = await getDocumentSettings(textDocument.uri);
	let problemSeverity = setProblemSeverity(textDocument, settings)
	let pattern = setPattern(textDocument, settings)
	if (!pattern) {
		return
	}
	let searchResults: RegExpExecArray | null;
	let problems = 0;
	let diagnostics: Diagnostic[] = [];
	let text = textDocument.getText();
	// While there are strings matching the Regex in the document and the number of them is less than settings.maxNumberOfProblems
	while ((searchResults = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		let diagnostic: Diagnostic = {
			severity: problemSeverity,
			range: {
				start: textDocument.positionAt(searchResults.index),
				end: textDocument.positionAt(searchResults.index + searchResults[0].length)
			},
			message: `${searchResults[0].replace('(','')} statement found.`,
			source: 'Console and Print Statement Linter'
		};
		diagnostics.push(diagnostic);
	}
	
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
