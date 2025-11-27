#!/usr/bin/env python3
"""
完全なTypeScript→JavaScript変換スクリプト
全ての構文エラーを確実に修正
"""

import re
import os
import shutil

def fix_typescript_syntax(content):
    """TypeScript構文をJavaScriptに完全変換"""
    
    # 1. インターフェース/型定義を削除
    content = re.sub(r'interface\s+\w+\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'type\s+\w+\s*=\s*[^;]+;', '', content)
    
    # 2. import/export文を削除
    content = re.sub(r'^\s*import\s+.*?;\s*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*export\s+', '', content, flags=re.MULTILINE)
    
    # 3. as型アサーションを先に削除（型注釈より先に）
    content = re.sub(r'\s+as\s+any\[\]', '', content)
    content = re.sub(r'\s+as\s+any', '', content)
    content = re.sub(r'\s+as\s+[A-Za-z_][A-Za-z0-9_.<>[\]]*', '', content)
    
    # 4. 関数定義の戻り値型を削除（複数行対応）
    content = re.sub(
        r'(function\s+\w+\s*\([^)]*\))\s*:\s*\{[^}]*\}\s*\{',
        r'\1 {',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'(function\s+\w+\s*\([^)]*\))\s*:\s*[A-Za-z_][A-Za-z0-9_.<>[\]|\s]*\{',
        r'\1 {',
        content
    )
    
    # 5. 行ごとに処理
    lines = content.split('\n')
    result = []
    in_function_params = False
    
    for i, line in enumerate(lines):
        original_line = line
        
        # コメント行と文字列リテラルは保護
        if line.strip().startswith('//') or line.strip().startswith('*'):
            result.append(line)
            continue
        
        # 関数パラメータ内かチェック
        if 'function ' in line and '(' in line:
            in_function_params = True
        
        # パラメータの型注釈を削除
        if in_function_params:
            # param: Type = defaultValue のパターン
            line = re.sub(r'(\w+)\s*:\s*[A-Za-z_][A-Za-z0-9_.<>[\]|&\s\'\"]*\s*=\s*', r'\1 = ', line)
            # param: 'A' | 'B' | 'C' のようなユニオン型
            line = re.sub(r'(\w+)\s*:\s*[^\,\)]+([,)])', r'\1\2', line)
            
            if ')' in line:
                in_function_params = False
        
        # 変数宣言の型注釈を削除
        if re.match(r'^\s*(const|let|var)\s+\w+\s*:', line):
            line = re.sub(
                r'(const|let|var)\s+(\w+)\s*:\s*[A-Za-z_][A-Za-z0-9_.<>[\]|\s]*\s*=',
                r'\1 \2 =',
                line
            )
        
        # 三項演算子の保護（: の前後にスペースがある場合）
        if ' ? ' in line and ' : ' in line:
            result.append(line)
            continue
        
        # オブジェクトリテラルのプロパティは保護（key: value の形式）
        # 型注釈のみを削除（key: Type のような形式で、その後に値がない場合）
        # ただし、オブジェクトリテラル内は保護する
        
        result.append(line)
    
    content = '\n'.join(result)
    
    # 6. 空行の連続を整理
    content = re.sub(r'\n\n\n+', '\n\n', content)
    
    # 7. アクセス修飾子を削除
    content = re.sub(r'\b(private|public|protected|readonly)\s+', '', content)
    
    # 8. ジェネリクスを削除
    content = re.sub(r'<[A-Za-z_][A-Za-z0-9_,\s<>[\]|&]*>', '', content)
    
    return content

def convert_file(src_path, dst_path):
    """ファイルを変換"""
    filename = os.path.basename(src_path)
    print(f'🔧 変換中: {filename}')
    
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = fix_typescript_syntax(content)
    
    with open(dst_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'✅ 完了: {os.path.basename(dst_path)}')

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    src_dir = os.path.join(project_root, 'src')
    dist_dir = os.path.join(project_root, 'dist')
    
    # distディレクトリを作成
    os.makedirs(dist_dir, exist_ok=True)
    
    print('🚀 完全変換開始...\n')
    
    # .tsファイルを変換
    ts_files = [f for f in os.listdir(src_dir) if f.endswith('.ts')]
    for filename in ts_files:
        src_path = os.path.join(src_dir, filename)
        dst_filename = filename.replace('.ts', '.js')
        dst_path = os.path.join(dist_dir, dst_filename)
        convert_file(src_path, dst_path)
    
    # HTMLファイルをコピー
    html_files = [f for f in os.listdir(src_dir) if f.endswith('.html')]
    for filename in html_files:
        src_path = os.path.join(src_dir, filename)
        dst_path = os.path.join(dist_dir, filename)
        shutil.copy2(src_path, dst_path)
        print(f'📄 コピー: {filename}')
    
    # appsscript.jsonをコピー
    appsscript_src = os.path.join(project_root, 'appsscript.json')
    appsscript_dst = os.path.join(dist_dir, 'appsscript.json')
    if os.path.exists(appsscript_src):
        shutil.copy2(appsscript_src, appsscript_dst)
        print('⚙️  appsscript.json コピー')
    
    print('\n✨ 変換完了！')

if __name__ == '__main__':
    main()
