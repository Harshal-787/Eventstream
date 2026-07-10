import os
import re

directory = '/home/aspl96/eventstream/Frontend/src'

to_remove = [
    r'(?:hover:|active:)?shadow-\[[^\]]*var\(--color-brutal-shadow\)[^\]]*\]',
    r'hover:-translate-y-1',
    r'hover:-translate-x-1',
    r'hover:translate-x-\[2px\]',
    r'hover:translate-y-\[2px\]',
    r'active:translate-y-\[1px\]',
    r'active:translate-x-\[1px\]',
    r'hover:shadow-none',
    r'active:shadow-none'
]

combined_pattern = re.compile('|'.join(to_remove))

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.jsx', '.js')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            if combined_pattern.search(content):
                def replacer(match):
                    m = match.group(0)
                    if 'shadow-[' in m and not ('hover:' in m or 'active:' in m):
                        return 'shadow-md'
                    return ''
                
                new_content = combined_pattern.sub(replacer, content)
                
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
