#!/usr/bin/env python3
"""
Script to import tasks from Markdown files with YAML frontmatter into Supabase database.
Reads task files from specified directory and imports them into the tasks table.
"""

import os
import re
import yaml
from pathlib import Path
from typing import Optional, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    """Main function to import tasks from markdown files."""
    
    # Initialize Supabase client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        return
    
    supabase: Client = create_client(url, key)
    
    # Directory containing markdown task files
    tasks_dir = Path("./tasks")
    
    if not tasks_dir.exists():
        print(f"Error: Tasks directory '{tasks_dir}' does not exist")
        return
    
    imported_count = 0
    error_count = 0
    
    # Process each markdown file
    for md_file in tasks_dir.glob("*.md"):
        try:
            task_data = parse_markdown_file(md_file)
            if task_data:
                # Insert into database
                result = supabase.table("tasks").insert(task_data).execute()
                if result.data:
                    imported_count += 1
                    print(f"✓ Imported: {md_file.name}")
                else:
                    error_count += 1
                    print(f"✗ Failed to import: {md_file.name}")
            else:
                error_count += 1
                print(f"✗ Failed to parse: {md_file.name}")
        except Exception as e:
            error_count += 1
            print(f"✗ Error processing {md_file.name}: {e}")
    
    print(f"\nImport completed:")
    print(f"  ✓ Successfully imported: {imported_count}")
    print(f"  ✗ Errors: {error_count}")
    print(f"  📁 Total files processed: {imported_count + error_count}")

def parse_markdown_file(md_file: Path) -> Optional[Dict[str, Any]]:
    """Parse markdown file with YAML frontmatter and extract task data."""
    
    try:
        content = md_file.read_text(encoding='utf-8')
        
        # Check if file has YAML frontmatter
        if not content.startswith('---'):
            print(f"Warning: {md_file.name} does not have YAML frontmatter")
            return None
        
        # Split frontmatter and content
        parts = content.split('---', 2)
        if len(parts) < 3:
            print(f"Warning: Invalid frontmatter format in {md_file.name}")
            return None
        
        # Parse YAML frontmatter
        try:
            frontmatter = yaml.safe_load(parts[1])
        except yaml.YAMLError as e:
            print(f"Error parsing YAML in {md_file.name}: {e}")
            return None
        
        # Extract markdown content
        markdown_content = parts[2].strip()
        
        # Validate required frontmatter fields
        required_fields = ['exam', 'topic', 'difficulty', 'answer']
        missing_fields = [field for field in required_fields if field not in frontmatter]
        
        if missing_fields:
            print(f"Warning: Missing required fields in {md_file.name}: {missing_fields}")
            return None
        
        # Parse sections from markdown content
        sections = split_markdown_sections(markdown_content)
        
        if not all(key in sections for key in ['statement', 'solution']):
            print(f"Warning: Missing required sections in {md_file.name}")
            return None
        
        # Build task data
        task_data = {
            "exam": frontmatter['exam'].lower(),
            "topic": frontmatter['topic'],
            "subtopic": frontmatter.get('subtopic'),
            "difficulty": int(frontmatter['difficulty']),
            "statement_md": sections['statement'],
            "answer": str(frontmatter['answer']),
            "solution_md": sections['solution'],
            "tags": frontmatter.get('tags', []),
            "points": frontmatter.get('points', 1),
            "time_limit": frontmatter.get('time_limit', 30)  # minutes
        }
        
        # Validate exam type
        if task_data['exam'] not in ['ege', 'oge']:
            print(f"Warning: Invalid exam type '{task_data['exam']}' in {md_file.name}")
            return None
        
        # Validate difficulty
        if not 1 <= task_data['difficulty'] <= 5:
            print(f"Warning: Invalid difficulty '{task_data['difficulty']}' in {md_file.name}")
            return None
        
        return task_data
        
    except Exception as e:
        print(f"Error parsing {md_file.name}: {e}")
        return None

def split_markdown_sections(content: str) -> dict:
    """Split markdown content into sections based on headers."""
    
    sections = {}
    current_section = None
    current_content = []
    
    for line in content.split('\n'):
        # Check if line is a header
        if line.startswith('#'):
            # Save previous section
            if current_section:
                sections[current_section] = '\n'.join(current_content).strip()
            
            # Start new section
            header = line.strip('# ').lower()
            if 'условие' in header or 'statement' in header:
                current_section = 'statement'
            elif 'решение' in header or 'solution' in header:
                current_section = 'solution'
            else:
                current_section = header
            
            current_content = []
        else:
            current_content.append(line)
    
    # Save last section
    if current_section:
        sections[current_section] = '\n'.join(current_content).strip()
    
    return sections

def create_example_task_file():
    """Create an example task file with proper YAML frontmatter."""
    
    example_content = """---
exam: ege
topic: Тригонометрия
subtopic: Тригонометрические уравнения
difficulty: 3
answer: "pi/4"
points: 1
time_limit: 15
tags: ["тригонометрия", "уравнения", "синус", "косинус"]
---

# Условие

Найдите корень уравнения $\\sin x + \\cos x = \\sqrt{2}$ на интервале $[0; \\pi]$.

# Решение

Умножим обе части уравнения на $\\frac{1}{\\sqrt{2}}$:

$$\\frac{\\sin x}{\\sqrt{2}} + \\frac{\\cos x}{\\sqrt{2}} = 1$$

Это можно записать как:

$$\\sin x \\cdot \\frac{1}{\\sqrt{2}} + \\cos x \\cdot \\frac{1}{\\sqrt{2}} = 1$$

Заметим, что $\\frac{1}{\\sqrt{2}} = \\cos \\frac{\\pi}{4} = \\sin \\frac{\\pi}{4}$, поэтому:

$$\\sin x \\cos \\frac{\\pi}{4} + \\cos x \\sin \\frac{\\pi}{4} = 1$$

По формуле сложения синусов:

$$\\sin\\left(x + \\frac{\\pi}{4}\\right) = 1$$

Отсюда:

$$x + \\frac{\\pi}{4} = \\frac{\\pi}{2} + 2\\pi k$$

$$x = \\frac{\\pi}{4} + 2\\pi k$$

На интервале $[0; \\pi]$ единственное решение: $x = \\frac{\\pi}{4}$.
"""
    
    example_file = Path("./tasks/example_trigonometry.md")
    example_file.parent.mkdir(exist_ok=True)
    example_file.write_text(example_content, encoding='utf-8')
    
    print(f"Created example task file: {example_file}")
    print("Use this as a template for creating new task files.")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--create-example":
        create_example_task_file()
    else:
        main()
