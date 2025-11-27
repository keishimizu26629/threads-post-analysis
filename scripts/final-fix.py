#!/usr/bin/env python3
"""
Code.jsの全構文エラーを修正する最終スクリプト
"""

import re
import sys

def fix_code_js(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. 関数定義の戻り値型を削除
    # function name() { type: value; ... } { → function name() {
    content = re.sub(
        r'function\s+(\w+)\s*\(([^)]*)\)\s*\{[^{]+\{',
        r'function \1(\2) {',
        content
    )
    
    # 2. doGet関数のtryを追加
    content = re.sub(
        r'function doGet\(e\) \{(\s*)// eがundefinedの場合',
        r'function doGet(e) {\1try {\1  // eがundefinedの場合',
        content
    )
    
    # 3. doPost関数のtryを追加  
    content = re.sub(
        r'function doPost\(e\) \{(\s*)// eがundefinedの場合',
        r'function doPost(e) {\1try {\1  // eがundefinedの場合',
        content
    )
    
    # 4. include関数のtryを追加
    content = re.sub(
        r'function include\(filename\) \{(\s*)return HtmlService',
        r'function include(filename) {\1try {\1  return HtmlService',
        content
    )
    
    # 5. 短縮プロパティを展開
    content = content.replace(
        'JSON.stringify({ success, data })',
        'JSON.stringify({ success: true, data: result })'
    )
    content = content.replace(
        'JSON.stringify({\n        success,\n        error,\n      })',
        'JSON.stringify({\n        success: false,\n        error: errorMessage,\n      })'
    )
    
    # 6. default) を default: に修正
    content = re.sub(r'\bdefault\)', 'default:', content)
    
    # 7. HTMLタグを修正
    content = content.replace(
        'エラーが発生しました</h1>',
        '<h1>エラーが発生しました</h1>'
    )
    content = content.replace(
        '${errorMessage}</p>',
        '<p>${errorMessage}</p>'
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print('✅ Code.jsの修正が完了しました')

if __name__ == '__main__':
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    code_js_path = os.path.join(script_dir, '../dist/Code.js')
    fix_code_js(code_js_path)
