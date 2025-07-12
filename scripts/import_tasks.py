#!/usr/bin/env python3
"""
Script to import tasks from Markdown files into Supabase database.
Reads task files from specified directory and imports them into the tasks table.
"""

import os
import re
import json
from pathlib import Path
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
                    print(f"✗ Failed to import: {md_file.name}")
        except Exception as e:
            print(f"✗ Error processing {md_file.name}: {e}")
    
    print(f"\nImported {imported_count} tasks successfully!")

def parse_markdown_file(md_file: Path) -> dict:
    """Parse markdown file and extract task data."""
    
    content = md_file.read_text(encoding='utf-8')
    
    # Extract metadata from filename or content
    # Expected format: topic_subtopic_difficulty.md
    filename_parts = md_file.stem.split('_')
    
    if len(filename_parts) < 3:
        print(f"Warning: Invalid filename format for {md_file.name}")
        return None
    
    # Parse sections from markdown
    sections = split_markdown_sections(content)
    
    if not all(key in sections for key in ['statement', 'answer', 'solution']):
        print(f"Warning: Missing required sections in {md_file.name}")
        return None
    
    # Determine exam type from topic
    exam = "ege" if "ege" in md_file.name.lower() else "oge"
    
    task_data = {
        "exam": exam,
        "topic": filename_parts[0],
        "subtopic": filename_parts[1] if len(filename_parts) > 1 else None,
        "difficulty": int(filename_parts[2]) if filename_parts[2].isdigit() else 3,
        "statement_md": sections['statement'],
        "answer": sections['answer'],
        "solution_md": sections['solution']
    }
    
    return task_data

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
            elif 'ответ' in header or 'answer' in header:
                current_section = 'answer'
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

if __name__ == "__main__":
    main()
