// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const path = require('path');
const fs = require('fs');
export default function replaceLang(): void {
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
				"1",
				"2",
				"3",
				"4"
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

		const languageId = vscode.window.activeTextEditor?.document.languageId;
		if (languageId === 'json') {
			vscode.window.showInformationMessage('不可以在json文件中使用!');
			return;
		};
		const { selection, _text, lineEnd } = getSelection();
		if (selection.isEmpty) {
			vscode.window.showInformationMessage('未选择任何文字!');
			return;
		}
		const { module, moduleDir } = getCurrFileInfo();
		const langFile = getTargetFile(moduleDir);
		try {
			let data = fs.readFileSync(langFile, 'utf-8');
			let jsondata = JSON.parse(data.toString());
			let { hasLang, langKey, langJson } = handleLangData(jsondata, _text || '', module);
			if (!hasLang) {
				let afertStringData = JSON.stringify(langJson, null, '\t')
				fs.writeFileSync(langFile, afertStringData)
			}
			const isInObject = getIsInObject(selection.end);
			let comm = '';
			if (isInObject) {
				langKey = `this.state.json['${langKey}']`;
				comm = ` /*多语: ${_text} */`;
			} else {
				langKey = `{this.state.json['${langKey}']}`;
				comm = ` {/*多语: ${_text} */}`;
			}
			editBuilder.replace(selection, langKey);
			//@ts-ignore
			editBuilder.insert(lineEnd, comm);
		} catch (err) {
			// 出错了
			console.log(err);
		}
	});
}

/**
 * 获取选中的文字
 * 需要判断文字是否在对象中，是否需要加{}
 */
function getSelection() {
	//@ts-ignore
	const selection: vscode.Selection = vscode.window.activeTextEditor?.selection;
	if (selection.isEmpty) {
		return { selection }
	}
	//先判断选中的是否包含引号
	let curText = vscode.window.activeTextEditor?.document.getText(selection);
	const reg = /^['|"](.*)['|"]$/;
	let curFlag = false;
	if (curText?.startsWith('\'') || curText?.startsWith('\"')) {
		curFlag = true;
		curText = curText.replace(reg, '$1')
	}
	//获取选中前后+1位的文字，判断是否在引号内,如果本身就包含引号，则不再判断
	if (!curFlag) {
		//@ts-ignore
		const newRange = new vscode.Range(new vscode.Position(selection.start.line, selection.start.character - 1), new vscode.Position(selection.end.line, selection.end.character + 1));
		let newText = vscode.window.activeTextEditor?.document.getText(newRange);
		let newFlag = false;
		if (newText?.startsWith('\'') || newText?.startsWith('\"')) {
			newFlag = true;
			newText = newText.replace(reg, '$1');
		}
		if (newFlag) {
			return {
				selection: newRange,
				_text: newText,
				lineEnd: vscode.window.activeTextEditor?.document.lineAt(selection.start).range.end
			};
		}
	}
	return {
		selection,
		_text: curText,
		lineEnd: vscode.window.activeTextEditor?.document.lineAt(selection.start).range.end
	};
}

/**
 * 获取当前文件信息
 * 需要解析出module,当前模块路径等信息
 */
function getCurrFileInfo() {
	const fileName = vscode.window.activeTextEditor?.document.fileName;
	const workFileDir = path.dirname(fileName);
	let module = '', moduleDir = '';
	const [workSpace, moduleSpace] = workFileDir.split('src');
	module = moduleSpace.split('\\')[1];
	moduleDir = workSpace + 'src\\' + module;
	return { module, moduleDir }
}

/**
 * 获取目标多语文件
 * @param moduleDir 
 */
function getTargetFile(moduleDir: String): String {
	return moduleDir + '\\public\\lang\\standard\\simpchn\\hihr6007.json';
}

/**
 * 处理多语，如果当前有改多语，返回key值，如果没有，添加多语后，写文件，返回key值
 * @param langJson	当前多语文件的json
 * @param _text 需要替换的文字
 * @param module 当前模块
 */
function handleLangData(langJson: any = {}, _text: String, module: String) {
	let curKey = '';
	for (let key in langJson) {
		if (langJson[key] === _text) {
			curKey = key;
			break;
		}
	}
	if (curKey) {
		return {
			hasLang: true,
			langKey: curKey
		}
	};
	const allKeys = Object.keys(langJson);
	const lastKey = allKeys[allKeys.length - 1];
	let nextKey = '';
	if (!lastKey) {
		nextKey = module + '-' + '000001';
		langJson[nextKey] = _text;
	} else {
		nextKey = getNextKey(lastKey);
		langJson[nextKey] = _text;
	}
	return {
		hasLang: false,
		langKey: nextKey,
		langJson
	};
}

/**
 * 获取下一个key值
 * @param key 
 */
function getNextKey(key: String) {
	const leng = 6;
	const [module, keyNum] = key.split('-');
	const nkeyNum = Number(keyNum);
	const nextKeyNum = nkeyNum + 1;
	return module + '-' + (Array(leng).join('0') + nextKeyNum).slice(-leng);
}

/**
 * 判断需要替换的字符串是否在对象中
 * 判断下一个出现的字符是'<'还是'}'
 * @param selEnd 
 */
function getIsInObject(selEnd: any) {
	//@ts-ignore
	const fileEnd = new vscode.Position(vscode.window.activeTextEditor.document.lineCount + 1, 0);
	//@ts-ignore
	const fileText = vscode.window.activeTextEditor?.document.getText(new vscode.Range(selEnd, fileEnd)) || '';
	const reg = /<|}/;
	let result = reg.exec(fileText);
	return result && result[0] === "}"
}