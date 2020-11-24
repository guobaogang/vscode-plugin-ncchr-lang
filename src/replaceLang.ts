// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const path = require('path');
const fs = require('fs');
let activeText: vscode.TextEditor | undefined = undefined;
export default function replaceLang(): void {
	vscode.window.activeTextEditor?.edit(editBuilder => {
		activeText = vscode.window.activeTextEditor;
		if (!activeText) return;
		const languageId = activeText.document.languageId;
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
	const selection = activeText.selection;
	if (selection.isEmpty) {
		return { selection }
	}
	//先判断选中的是否包含引号
	//@ts-ignore
	let curText = activeText?.document.getText(selection);
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
		//@ts-ignore
		let newText = activeText.document.getText(newRange);
		let newFlag = false;
		if (newText?.startsWith('\'') || newText?.startsWith('\"')) {
			newFlag = true;
			newText = newText.replace(reg, '$1');
		}
		if (newFlag) {
			return {
				selection: newRange,
				_text: newText,
				//@ts-ignore
				lineEnd: activeText.document.lineAt(selection.start).range.end
			};
		}
	}
	return {
		selection,
		_text: curText,
		//@ts-ignore
		lineEnd: activeText.document.lineAt(selection.start).range.end
	};
}

/**
 * 获取当前文件信息
 * 需要解析出module,当前模块路径等信息
 */
function getCurrFileInfo() {
	//@ts-ignore
	const fileName = activeText.document.fileName;
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
		nextKey = module + '-' + '000000';
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
	const fileEnd = new vscode.Position(activeText.document.lineCount + 1, 0);
	//@ts-ignore
	const fileText = activeText.document.getText(new vscode.Range(selEnd, fileEnd)) || '';
	const reg = /<|}/;
	let result = reg.exec(fileText);
	return result && result[0] === "}"
}