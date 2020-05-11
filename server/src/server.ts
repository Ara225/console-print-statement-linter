
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
	regexToMatch: string;
	problemSeverity: string;
}
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExtensionSettings = { 
	maxNumberOfProblems: 1000, 
	regexToMatch: '\bconsole\\.(log|warn|error|debug)\b', 
	problemSeverity: 'Information' 
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
			(change.settings.consoleLogLinter || defaultSettings)
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
			section: 'consoleLogLinter'
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

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	let settings = await getDocumentSettings(textDocument.uri);
	// Somewhat lazy way of setting the DiagnosticSeverity based on the settings, can't come up with anything better
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
	let text = textDocument.getText();
	let pattern = new RegExp(settings.regexToMatch, 'g');
	let searchResults: RegExpExecArray | null;
	let problems = 0;
	let diagnostics: Diagnostic[] = [];
	// While there are strings matching the Regex in the document and the number of them is less than settings.maxNumberOfProblems
	while ((searchResults = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		let diagnostic: Diagnostic = {
			severity: problemSeverity,
			range: {
				start: textDocument.positionAt(searchResults.index),
				end: textDocument.positionAt(searchResults.index + searchResults[0].length)
			},
			message: `${searchResults[0]} statement found.`,
			source: 'Console Log Linter'
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
