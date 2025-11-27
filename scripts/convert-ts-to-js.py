#!/usr/bin/env python3
"""
TypeScriptからJavaScriptへの完全な変換スクリプト
"""

import re
import os

def remove_typescript_types(content):
    """TypeScriptの型注釈を削除してJavaScriptに変換"""
    
    # 1. インターフェース定義を削除
    content = re.sub(r'interface\s+\w+\s*\{[^}]*\}', '', content, flags=re.MULTILINE | re.DOTALL)
    
    # 2. import/export文を削除
    content = re.sub(r'^\s*import\s+.*?;?\s*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*export\s+', '', content, flags=re.MULTILINE)
    
    # 3. 関数の戻り値型を削除
    # function name(...): ReturnType { を function name(...) { に変換
    content = re.sub(
        r'(function\s+\w+\s*\([^)]*\))\s*:\s*[^{]+\{',
        r'\1 {',
        content
    )
    
    # 4. 関数パラメータの型注釈を削除
    # (param: Type) を (param) に変換
    def remove_param_types(match):
        params = match.group(1)
        # 文字列リテラル内のコロンは保護
        if '"' in params or "'" in params or '`' in params:
            return match.group(0)
        # param: Type または param?: Type を param に変換
        params = re.sub(r'(\w+)\s*\??\s*:\s*[^,)]+', r'\1', params)
        return f'({params})'
    
    # 関数定義内のパラメータのみ対象
    content = re.sub(r'function\s+\w+\s*\(([^)]*)\)', lambda m: f'function {m.group(0).split("(")[0].split()[-1]}({remove_param_types(re.match(r"\(([^)]*)\)", "(" + m.group(1) + ")")).strip("()")})', content)
    
    # 5. 変数宣言の型注釈を削除
    # const name: Type = を const name = に変換
    content = re.sub(
        r'(const|let|var)\s+(\w+)\s*:\s*[^=]+\s*=',
        r'\1 \2 =',
        content
    )
    
    # 6. as Type型アサーションを削除
    content = re.sub(r'\s+as\s+[A-Za-z_][A-Za-z0-9_.<>[\]|&\s]*', '', content)
    
    # 7. ジェネリクスを削除
    content = re.sub(r'<[A-Za-z_][A-Za-z0-9_,\s<>[\]|&]*>', '', content)
    
    # 8. アクセス修飾子を削除
    content = re.sub(r'\b(private|public|protected|readonly)\s+', '', content)
    
    # 9. クラスプロパティの型宣言を削除
    content = re.sub(r'^\s*(private|public|protected|readonly)?\s*\w+\s*:\s*[^=;]+;\s*$', '', content, flags=re.MULTILINE)
    
    return content

def convert_file(src_path, dst_path):
    """ファイルを変換"""
    print(f'変換中: {os.path.basename(src_path)}')
    
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # TypeScript型注釈を削除
    content = remove_typescript_types(content)
    
    # .tsファイル名を.jsに変更
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
    
    # .tsファイルを変換
    for filename in os.listdir(src_dir):
        if filename.endswith('.ts'):
            src_path = os.path.join(src_dir, filename)
            dst_filename = filename.replace('.ts', '.js')
            dst_path = os.path.join(dist_dir, dst_filename)
            convert_file(src_path, dst_path)
        elif filename.endswith('.html'):
            # HTMLファイルはそのままコピー
            src_path = os.path.join(src_dir, filename)
            dst_path = os.path.join(dist_dir, filename)
            with open(src_path, 'r', encoding='utf-8') as f:
                content = f.read()
            with open(dst_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'📄 コピー完了: {filename}')
    
    # appsscript.jsonをコピー
    appsscript_src = os.path.join(project_root, 'appsscript.json')
    appsscript_dst = os.path.join(dist_dir, 'appsscript.json')
    if os.path.exists(appsscript_src):
        with open(appsscript_src, 'r', encoding='utf-8') as f:
            content = f.read()
        with open(appsscript_dst, 'w', encoding='utf-8') as f:
            f.write(content)
        print('⚙️  appsscript.json コピー完了')
    
    print('\n🎉 変換完了！')

if __name__ == '__main__':
    main()
