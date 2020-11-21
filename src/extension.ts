// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-plugin-ncchr-lang" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-plugin-ncchr-lang.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-plugin-ncchr-lang!');
	});

	let replaceTest = vscode.commands.registerCommand('vscode-plugin-ncchr-lang.replace', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.activeTextEditor?.edit(editBuilder => {
			// 从开始到结束，全量替换
			/* const end = new vscode.Position(vscode.window.activeTextEditor.document.lineCount + 1, 0);
			const text = '新替换的内容';
			editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), end), text); */
			/* const panel = vscode.window.createWebviewPanel(
				'testWebview', // viewType
				"WebView演示", // 视图标题
				{ viewColumn: vscode.ViewColumn.One, preserveFocus: false }
				, // 显示在编辑器的哪个部位
				{
					enableScripts: true, // 启用JS，默认禁用
					retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
				}
			);
			panel.webview.html = `<html><body>你好，我是Webview</body></html>` */
			/* vscode.window.showInputBox(
				{ // 这个对象中所有参数都是可选参数
					password: false, // 输入内容是否是密码
					ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
					placeHolder: '你到底想输入什么？', // 在输入框内的提示信息
					prompt: '赶紧输入，不输入就赶紧滚', // 在输入框下方的提示信息
					validateInput: function (text) { return text; } // 对输入内容进行验证并返回
				}).then(function (msg) {
					console.log("用户输入：" + msg);
				}); */
			/* vscode.window.showOpenDialog(
				{ // 可选对象
					canSelectFiles:true, // 是否可选文件
					canSelectFolders:false, // 是否可选文件夹
					canSelectMany:true, // 是否可以选择多个
					defaultUri:vscode.Uri.file("/D:/"), // 默认打开本地路径
					openLabel:'按钮文字说明'
				}).then(function(msg){
					//@ts-ignore
					console.log(msg.path);
				}) */
			/* vscode.window.showQuickPick(
				[
					"哈哈哈，你是傻逼吗",
					"哈哈哈，你是二逼么",
					"你他妈有病吧",
					"乖，你是妈的智障"
				],
				{
					canPickMany:true,
					ignoreFocusOut:true,
					matchOnDescription:true,
					matchOnDetail:true,
					placeHolder:'温馨提示，请选择你是哪种类型？'
				})
				.then(function(msg){
				console.log(msg);
			}) */

			//@ts-ignore
			const selection: vscode.Selection = vscode.window.activeTextEditor?.selection;
			const text = '替换后的内容';
			editBuilder.replace(selection, text);
		});
	});


	context.subscriptions.push(disposable);
	context.subscriptions.push(replaceTest);
}

// this method is called when your extension is deactivated
export function deactivate() { }
