import os
import glob

def add_aria_hidden(directory):
    for filepath in glob.glob(os.path.join(directory, '**/*.tsx'), recursive=True):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Simple replace to add aria-hidden="true" to SVGs that don't have it
        if '<svg ' in content and 'aria-hidden="true"' not in content:
            new_content = content.replace('<svg ', '<svg aria-hidden="true" ')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")

add_aria_hidden('frontend/src')
