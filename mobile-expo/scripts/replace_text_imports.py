import re
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RN_IMPORT_RE = re.compile(
    r'import\s*\{([^}]+)\}\s*from\s*(["\'])react-native\2;?',
    re.DOTALL
)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    match = RN_IMPORT_RE.search(content)
    if not match:
        return False

    imports_str = match.group(1)
    quote_char = match.group(2)
    full_match = match.group(0)

    imports = [i.strip() for i in imports_str.split(',') if i.strip()]

    if 'Text' not in imports:
        return False

    apptext_import = f'import {{ AppText as Text }} from {quote_char}@/components/ui/AppText{quote_char};'

    remaining = [i for i in imports if i != 'Text']

    if remaining:
        multiline = '\n' in imports_str
        if multiline:
            new_imports_str = '\n  ' + ',\n  '.join(remaining) + ',\n'
        else:
            new_imports_str = ' ' + ', '.join(remaining) + ' '
        new_rn_import = f'import {{{new_imports_str}}} from {quote_char}react-native{quote_char};'
        replacement = new_rn_import + '\n' + apptext_import
    else:
        replacement = apptext_import

    new_content = content.replace(full_match, replacement, 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return True


changed = []
for root, dirs, files in os.walk(BASE_DIR):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.expo', '.git', 'scripts')]
    for fname in files:
        if fname.endswith(('.tsx', '.ts')):
            path = os.path.join(root, fname)
            if process_file(path):
                changed.append(path.replace(BASE_DIR + '/', ''))

print(f"Modified {len(changed)} files:")
for f in sorted(changed):
    print(f"  {f}")
