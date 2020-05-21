

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

suite('Diagnostics checks', () => {
	const docUri = getDocUri('diagnostics.js');

	test('Check that information message is thrown for all of the four console.* statements', async () => {
		await testDiagnostics(docUri, [
			{ message: 'console.log statement found.', range: toRange(0, 0, 0, 11), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' },
			{ message: 'console.warn statement found.', range: toRange(1, 0, 1, 12), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' },
			{ message: 'console.error statement found.', range: toRange(2, 0, 2, 13), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' },
			{ message: 'console.debug statement found.', range: toRange(3, 0, 3, 13), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' }
		], null);
	});
	test('Check delete console.debug statements command works', async () => {
		await testDiagnostics(docUri, [
			{ message: 'console.log statement found.', range: toRange(0, 0, 0, 11), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' },
			{ message: 'console.warn statement found.', range: toRange(1, 0, 1, 12), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' },
			{ message: 'console.error statement found.', range: toRange(2, 0, 2, 13), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' }
		], 'extension.removeConsoleDebug');
	});
	test('Check delete console.error statements command works', async () => {
		await testDiagnostics(docUri, [
			{ message: 'console.log statement found.', range: toRange(0, 0, 0, 11), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' },
			{ message: 'console.warn statement found.', range: toRange(1, 0, 1, 12), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' }
		], 'extension.removeConsoleError');
	});
	test('Check delete console.warn statements command works', async () => {
		await testDiagnostics(docUri, [
			{ message: 'console.log statement found.', range: toRange(0, 0, 0, 11), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' }
		], 'extension.removeConsoleWarn');
	});
	test('Check delete console.log statements command works', async () => {
		await testDiagnostics(docUri, [
		], 'extension.removeConsoleLog');
	});
	test('Check C pattern matching', async () => {
		await testDiagnostics(getDocUri('diagnostics.c'), [
			{ message: 'printf statement found.', range: toRange(0, 0, 0, 7), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' }
		], null);
	});
	test('Check delete printf statements command works', async () => {
		await testDiagnostics(getDocUri('diagnostics.c'), [
		], 'extension.removeAllPrintfStatements');
	});
	test('Check C++ pattern matching', async () => {
		await testDiagnostics(getDocUri('diagnostics.cpp'), [
			{ message: 'Console::Write statement found.', range: toRange(0, 0, 0, 14), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' }
		], null);
	});
	test('Check delete Console::Write statements command works', async () => {
		await testDiagnostics(getDocUri('diagnostics.cpp'), [
		], 'extension.removeAllCoutStatements');
	});
	test('Check C# pattern matching', async () => {
		await testDiagnostics(getDocUri('diagnostics.cs'), [
			{ message: 'Console.Write statement found.', range: toRange(0, 0, 0, 14), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' }
		], null);
	});
	test('Check delete Console.Write statements command works', async () => {
		await testDiagnostics(getDocUri('diagnostics.cs'), [
		], 'extension.removeAllConsoleWriteStatements');
	});
	test('Check Java pattern matching', async () => {
		await testDiagnostics(getDocUri('diagnostics.java'), [
			{ message: 'System.out.print statement found.', range: toRange(0, 0, 0, 17      ), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' }
		], null);
	});
	test('Check delete System.out.print statements command works', async () => {
		await testDiagnostics(getDocUri('diagnostics.java'), [
		], 'extension.removeAllSystemOutPrintStatements');
	});
	test('Check Python pattern matching', async () => {
		await testDiagnostics(getDocUri('diagnostics.py'), [
			{ message: 'print statement found.', range: toRange(0, 0, 0, 6), severity: vscode.DiagnosticSeverity.Information, source: 'Console and Print Statement Linter' }
		], null);
	});
	test('Check delete print statements command works', async () => {
		await testDiagnostics(getDocUri('diagnostics.py'), [
		], 'extension.removeAllPrintStatements');
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
			// There is a setting to change severity, but that shouldn't be set in a test environment
			console.log('Matching severity between actual & expected diagnostics');
			assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
			console.log('Matching source between actual & expected diagnostics');
			assert.equal(actualDiagnostic.source, expectedDiagnostic.source);
		});
	}, timeout);
}