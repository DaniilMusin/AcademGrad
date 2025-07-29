#!/usr/bin/env python3
"""
Task Import Script for AcademGrad RAG System

This script processes markdown task files and creates embeddings for each solution step.
Usage: python import_tasks.py --file path/to/task.md --task-id uuid
       python import_tasks.py --directory path/to/tasks/ --batch
"""

import os
import re
import json
import argparse
import hashlib
from typing import List, Dict, Tuple
from pathlib import Path
import asyncio
import aiohttp
from supabase import create_client, Client
from datetime import datetime

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

class TaskChunk:
    def __init__(self, step_idx: int, chunk_md: str, embedding: List[float] = None):
        self.step_idx = step_idx
        self.chunk_md = chunk_md
        self.embedding = embedding

class TaskParser:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    def parse_markdown_task(self, content: str) -> Tuple[Dict, List[TaskChunk]]:
        """
        Parse markdown task file into metadata and solution chunks.
        
        Expected format:
        # Task Title
        ## Условие
        Task statement here...
        
        ## Решение
        ### Шаг 1
        First step content...
        
        ### Шаг 2
        Second step content...
        
        ## Ответ
        Final answer...
        """
        
        # Extract task metadata
        lines = content.strip().split('\n')
        title = ""
        statement = ""
        answer = ""
        solution_steps = []
        
        current_section = None
        current_content = []
        
        for line in lines:
            line = line.strip()
            
            if line.startswith('# '):
                title = line[2:].strip()
            elif line.startswith('## Условие'):
                current_section = 'statement'
                current_content = []
            elif line.startswith('## Решение'):
                if current_section == 'statement':
                    statement = '\n'.join(current_content).strip()
                current_section = 'solution'
                current_content = []
            elif line.startswith('## Ответ'):
                current_section = 'answer'
                current_content = []
            elif line.startswith('### Шаг '):
                if current_content:
                    # Save previous step
                    step_match = re.search(r'### Шаг (\d+)', '\n'.join(current_content))
                    if step_match:
                        step_idx = int(step_match.group(1))
                        step_content = re.sub(r'### Шаг \d+\s*\n?', '', '\n'.join(current_content), count=1).strip()
                        if step_content:
                            solution_steps.append(TaskChunk(step_idx, step_content))
                
                current_content = [line]
            else:
                current_content.append(line)
        
        # Handle last section
        if current_section == 'answer' and current_content:
            answer = '\n'.join(current_content).strip()
        elif current_section == 'solution' and current_content:
            # Handle last step
            step_text = '\n'.join(current_content)
            step_match = re.search(r'### Шаг (\d+)', step_text)
            if step_match:
                step_idx = int(step_match.group(1))
                step_content = re.sub(r'### Шаг \d+\s*\n?', '', step_text, count=1).strip()
                if step_content:
                    solution_steps.append(TaskChunk(step_idx, step_content))
        
        task_metadata = {
            'title': title,
            'statement_md': statement,
            'solution_md': content,
            'answer': answer
        }
        
        return task_metadata, solution_steps
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts using OpenAI API."""
        
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {OPENAI_API_KEY}',
                'Content-Type': 'application/json'
            }
            
            # Process in batches to avoid rate limits
            batch_size = 100
            all_embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                
                payload = {
                    'model': 'text-embedding-3-small',
                    'input': batch
                }
                
                async with session.post(
                    'https://api.openai.com/v1/embeddings',
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"OpenAI API error: {response.status} - {error_text}")
                    
                    result = await response.json()
                    embeddings = [item['embedding'] for item in result['data']]
                    all_embeddings.extend(embeddings)
                
                # Add delay to respect rate limits
                await asyncio.sleep(0.1)
            
            return all_embeddings
    
    async def process_task_file(self, file_path: Path, task_id: str = None) -> Dict:
        """Process a single task file and upload to database."""
        
        print(f"Processing task file: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse the markdown
        task_metadata, solution_chunks = self.parse_markdown_task(content)
        
        if not solution_chunks:
            print(f"Warning: No solution steps found in {file_path}")
            return {'status': 'skipped', 'reason': 'No solution steps'}
        
        # Generate embeddings for all chunks
        chunk_texts = [chunk.chunk_md for chunk in solution_chunks]
        embeddings = await self.generate_embeddings(chunk_texts)
        
        # Assign embeddings to chunks
        for chunk, embedding in zip(solution_chunks, embeddings):
            chunk.embedding = embedding
        
        # Create or update task in database
        if not task_id:
            # Create new task
            task_data = {
                **task_metadata,
                'exam': 'егэ',  # Default, should be configurable
                'topic': 'математика',  # Default, should be configurable
                'difficulty': 3,  # Default
                'is_public': True,
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('tasks').insert(task_data).execute()
            if result.data:
                task_id = result.data[0]['id']
                print(f"Created new task with ID: {task_id}")
            else:
                raise Exception("Failed to create task")
        else:
            # Update existing task
            task_data = {
                **task_metadata,
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('tasks').update(task_data).eq('id', task_id).execute()
            if not result.data:
                raise Exception(f"Failed to update task {task_id}")
            print(f"Updated task: {task_id}")
        
        # Prepare chunks data for batch insert
        chunks_data = []
        for chunk in solution_chunks:
            chunks_data.append({
                'step_idx': chunk.step_idx,
                'chunk_md': chunk.chunk_md,
                'embedding': chunk.embedding
            })
        
        # Insert chunks using the custom function
        result = self.supabase.rpc('insert_task_chunks', {
            'p_task_id': task_id,
            'p_chunks': chunks_data
        }).execute()
        
        if result.data:
            print(f"Inserted {result.data} chunks for task {task_id}")
        else:
            print(f"Warning: No chunks inserted for task {task_id}")
        
        return {
            'status': 'success',
            'task_id': task_id,
            'chunks_count': len(solution_chunks),
            'file_path': str(file_path)
        }
    
    async def process_directory(self, directory: Path) -> List[Dict]:
        """Process all markdown files in a directory."""
        
        results = []
        md_files = list(directory.glob('*.md'))
        
        print(f"Found {len(md_files)} markdown files in {directory}")
        
        for file_path in md_files:
            try:
                result = await self.process_task_file(file_path)
                results.append(result)
            except Exception as e:
                print(f"Error processing {file_path}: {str(e)}")
                results.append({
                    'status': 'error',
                    'file_path': str(file_path),
                    'error': str(e)
                })
        
        return results

async def main():
    parser = argparse.ArgumentParser(description='Import tasks for RAG system')
    parser.add_argument('--file', type=str, help='Single markdown file to process')
    parser.add_argument('--directory', type=str, help='Directory of markdown files to process')
    parser.add_argument('--task-id', type=str, help='Specific task ID to update')
    parser.add_argument('--batch', action='store_true', help='Process all files in directory')
    
    args = parser.parse_args()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY or not OPENAI_API_KEY:
        print("Error: Missing required environment variables")
        print("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY")
        return
    
    task_parser = TaskParser()
    
    if args.file:
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"Error: File not found: {file_path}")
            return
        
        result = await task_parser.process_task_file(file_path, args.task_id)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    elif args.directory:
        directory = Path(args.directory)
        if not directory.exists():
            print(f"Error: Directory not found: {directory}")
            return
        
        results = await task_parser.process_directory(directory)
        
        # Print summary
        successful = sum(1 for r in results if r['status'] == 'success')
        errors = sum(1 for r in results if r['status'] == 'error')
        
        print(f"\nProcessing complete:")
        print(f"✅ Successful: {successful}")
        print(f"❌ Errors: {errors}")
        
        if errors > 0:
            print("\nErrors:")
            for result in results:
                if result['status'] == 'error':
                    print(f"  {result['file_path']}: {result['error']}")
    
    else:
        parser.print_help()

if __name__ == '__main__':
    asyncio.run(main())