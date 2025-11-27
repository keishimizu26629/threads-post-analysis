#!/usr/bin/env python3
"""
シンプルなTypeScript→JavaScript変換スクリプト
"""

import re
import os
import shutil

def convert_typescript_to_javascript(content):
    """TypeScriptをJavaScriptに変換"""
    
    # 1. インターフェース定義を削除
    content = re.sub(r'interface\s+\w+\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    
    # 2. import/export文を削除
    content = re.sub(r'^\s*import\s+.*?;\s*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*export\s+', '', content, flags=re.MULTILINE)
    
    # 3. 関数定義の型注釈を削除（複数行対応）
    # function name(...): ReturnType { を function name(...) { に変換
    content = re.sub(
        r'(function\s+\w+\s*\([^)]*\))\s*:\s*[^{]+\{',
        r'\1 {',
        content,
        flags=re.DOTALL
    )
    
    # 4. パラメータの型注釈を削除（行単位）
    lines = content.split('\n')
    result_lines = []
    
    for line in lines:
        # パラメータの型注釈を削除（文字列リテラル以外）
        # postDateString: string, を postDateString, に変換
        if ':' in line and not line.strip().startswith('//') and not line.strip().startswith('*'):
            # 文字列リテラル内ではない: を検出して削除
            if "'" not in line and '"' not in line and '`' not in line:
                line = re.sub(r'\b(\w+)\s*\??\s*:\s*[^,)=]+', r'\1', line)
        
        # 変数宣言の型注釈を削除
        if re.match(r'^\s*(const|let|var)\s+\w+\s*:', line):
            line = re.sub(r'(const|let|var)\s+(\w+)\s*:\s*[^=]+\s*=', r'\1 \2 =', line)
        
        result_lines.append(line)
    
    content = '\n'.join(result_lines)
    
    # 4. as Type型アサーションを削除
    content = re.sub(r'\s+as\s+any\[\]', '', content)
    content = re.sub(r'\s+as\s+any', '', content)
    content = re.sub(r'\s+as\s+\w+(\[\])?', '', content)
    
    # 5. 残った [] を削除（型アサーション削除後の残骸）
    content = re.sub(r'\.data\[\]', '.data', content)
    content = re.sub(r'\.result\[\]', '.result', content)
    
    # 5. アクセス修飾子を削除
    content = re.sub(r'\b(private|public|protected|readonly)\s+', '', content)
    
    return content

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    src_dir = os.path.join(project_root, 'src')
    dist_dir = os.path.join(project_root, 'dist')
    
    # distディレクトリを作成
    os.makedirs(dist_dir, exist_ok=True)
    
    print('🔧 TypeScript → JavaScript 変換開始...\n')
    
    # .tsファイルを変換
    for filename in os.listdir(src_dir):
        if filename.endswith('.ts'):
            src_path = os.path.join(src_dir, filename)
            dst_filename = filename.replace('.ts', '.js')
            dst_path = os.path.join(dist_dir, dst_filename)
            
            print(f'📝 処理中: {filename}')
            
            with open(src_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            content = convert_typescript_to_javascript(content)
            
            with open(dst_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f'✅ 完了: {dst_filename}')
            
        elif filename.endswith('.html'):
            # HTMLファイルはそのままコピー
            src_path = os.path.join(src_dir, filename)
            dst_path = os.path.join(dist_dir, filename)
            shutil.copy2(src_path, dst_path)
            print(f'📄 コピー: {filename}')
    
    # appsscript.jsonをコピー
    appsscript_src = os.path.join(project_root, 'appsscript.json')
    appsscript_dst = os.path.join(dist_dir, 'appsscript.json')
    if os.path.exists(appsscript_src):
        shutil.copy2(appsscript_src, appsscript_dst)
        print('⚙️  appsscript.json コピー完了')
    
    print('\n🎉 変換完了！')

if __name__ == '__main__':
    main()
