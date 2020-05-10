/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

suite('Should get diagnostics', () => {
	const docUri = getDocUri('diagnostics.js');

	test('Check that information message is thrown for all of the four console.* statements', async () => {
		await testDiagnostics(docUri, [
			{ message: 'console.log statement found.', range: toRange(0, 0, 0, 11), severity: vscode.DiagnosticSeverity.Information, source: 'ex' },
			{ message: 'console.warn statement found.', range: toRange(1, 0, 1, 12), severity: vscode.DiagnosticSeverity.Information, source: 'ex' },
			{ message: 'console.error statement found.', range: toRange(2, 0, 2, 13), severity: vscode.DiagnosticSeverity.Information, source: 'ex' },
			{ message: 'console.debug statement found.', range: toRange(3, 0, 3, 13), severity: vscode.DiagnosticSeverity.Information, source: 'ex' }
		], null);
	});
	test('Check delete console.debug statements command works', async () => {
		await testDiagnostics(docUri, [
			{ message: 'console.log statement found.', range: toRange(0, 0, 0, 11), severity: vscode.DiagnosticSeverity.Information, source: 'ex' },
			{ message: 'console.warn statement found.', range: toRange(1, 0, 1, 12), severity: vscode.DiagnosticSeverity.Information, source: 'ex' },
			{ message: 'console.error statement found.', range: toRange(2, 0, 2, 13), severity: vscode.DiagnosticSeverity.Information, source: 'ex' }
		], 'extension.removeConsoleDebug');
	});
	test('Check delete console.error statements command works', async () => {
		await testDiagnostics(docUri, [
			{ message: 'console.log statement found.', range: toRange(0, 0, 0, 11), severity: vscode.DiagnosticSeverity.Information, source: 'ex' },
			{ message: 'console.warn statement found.', range: toRange(1, 0, 1, 12), severity: vscode.DiagnosticSeverity.Information, source: 'ex' }
		], 'extension.removeConsoleError');
	});
	test('Check delete console.warn statements command works', async () => {
		await testDiagnostics(docUri, [
			{ message: 'console.log statement found.', range: toRange(0, 0, 0, 11), severity: vscode.DiagnosticSeverity.Information, source: 'ex' }
		], 'extension.removeConsoleWarn');
	});
	test('Check delete console.log statements command works', async () => {
		await testDiagnostics(docUri, [
		], 'extension.removeConsoleLog');
	});
});

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
	const start = new vscode.Position(sLine, sChar);
	const end = new vscode.Position(eLine, eChar);
	return new vscode.Range(start, end);
}

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[], command:string|null) {
	await activate(docUri);
	var timeout:number;
	// Execute command if requested. We need a small timeout to be safe 
	if (command !== null) {
		vscode.commands.executeCommand(command);
		timeout = 2000;
	}
	else {
		timeout = 10;
	}
	setTimeout(() => {
		const actualDiagnostics = vscode.languages.getDiagnostics(docUri);
		console.log('Matching length between actual & expected diagnostics');
		assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

		expectedDiagnostics.forEach((expectedDiagnostic, i) => {
			const actualDiagnostic = actualDiagnostics[i];
			console.log('Matching message between actual & expected diagnostics');
			assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
			console.log('Matching range between actual & expected diagnostics');
			assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
			console.log('Matching severity between actual & expected diagnostics');
			assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
		});
	}, timeout);
}