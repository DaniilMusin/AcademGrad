#!/usr/bin/env python3
"""
Concept Docs Import Script for AcademGrad RAG System

This script processes theoretical content and creates embeddings for concept chunks.
Usage: python import_concepts.py --file path/to/concept.md
       python import_concepts.py --directory path/to/concepts/
"""

import os
import re
import json
import argparse
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

class ConceptChunk:
    def __init__(self, chunk_md: str, embedding: List[float] = None):
        self.chunk_md = chunk_md
        self.embedding = embedding

class ConceptParser:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    def parse_concept_file(self, content: str, file_path: Path) -> Tuple[Dict, List[ConceptChunk]]:
        """
        Parse concept markdown file into metadata and chunks.
        
        Expected format:
        ---
        tag: "derivatives"
        title: "Производные функций"
        exam_type: "егэ"
        subject: "математика"
        ---
        
        # Производные функций
        
        ## Основные формулы
        Content here...
        
        ## Правила дифференцирования
        More content...
        """
        
        # Extract frontmatter if present
        metadata = {
            'tag': file_path.stem,
            'title': file_path.stem.replace('_', ' ').title(),
            'exam_type': 'егэ',
            'subject': 'математика'
        }
        
        content_text = content
        
        # Parse YAML frontmatter
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                frontmatter = parts[1].strip()
                content_text = parts[2].strip()
                
                # Simple YAML parsing
                for line in frontmatter.split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip().strip('"\'')
                        if key in metadata:
                            metadata[key] = value
        
        # Split content into chunks
        chunks = self._split_into_chunks(content_text)
        concept_chunks = [ConceptChunk(chunk) for chunk in chunks if chunk.strip()]
        
        return metadata, concept_chunks
    
    def _split_into_chunks(self, content: str, max_tokens: int = 150) -> List[str]:
        """Split content into semantic chunks of approximately max_tokens."""
        
        # Split by headers first
        sections = re.split(r'\n(?=##?\s)', content)
        chunks = []
        
        for section in sections:
            section = section.strip()
            if not section:
                continue
            
            # Estimate tokens (rough: 1 token ≈ 4 characters for Russian)
            estimated_tokens = len(section) // 4
            
            if estimated_tokens <= max_tokens:
                chunks.append(section)
            else:
                # Split large sections by paragraphs
                paragraphs = section.split('\n\n')
                current_chunk = ""
                
                for paragraph in paragraphs:
                    paragraph = paragraph.strip()
                    if not paragraph:
                        continue
                    
                    test_chunk = current_chunk + "\n\n" + paragraph if current_chunk else paragraph
                    test_tokens = len(test_chunk) // 4
                    
                    if test_tokens <= max_tokens:
                        current_chunk = test_chunk
                    else:
                        if current_chunk:
                            chunks.append(current_chunk)
                        current_chunk = paragraph
                
                if current_chunk:
                    chunks.append(current_chunk)
        
        return chunks
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts using OpenAI API."""
        
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {OPENAI_API_KEY}',
                'Content-Type': 'application/json'
            }
            
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
                
                await asyncio.sleep(0.1)
            
            return all_embeddings
    
    async def process_concept_file(self, file_path: Path) -> Dict:
        """Process a single concept file and upload to database."""
        
        print(f"Processing concept file: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse the markdown
        metadata, concept_chunks = self.parse_concept_file(content, file_path)
        
        if not concept_chunks:
            print(f"Warning: No chunks found in {file_path}")
            return {'status': 'skipped', 'reason': 'No chunks found'}
        
        # Generate embeddings
        chunk_texts = [chunk.chunk_md for chunk in concept_chunks]
        embeddings = await self.generate_embeddings(chunk_texts)
        
        # Assign embeddings
        for chunk, embedding in zip(concept_chunks, embeddings):
            chunk.embedding = embedding
        
        # Create or update concept doc in database
        concept_data = {
            **metadata,
            'content_md': content,
            'created_at': datetime.now().isoformat()
        }
        
        # Check if concept already exists
        existing = self.supabase.table('concept_docs').select('id').eq('tag', metadata['tag']).execute()
        
        if existing.data:
            concept_id = existing.data[0]['id']
            # Update existing
            result = self.supabase.table('concept_docs').update({
                **concept_data,
                'updated_at': datetime.now().isoformat()
            }).eq('id', concept_id).execute()
            print(f"Updated concept: {concept_id}")
        else:
            # Create new
            result = self.supabase.table('concept_docs').insert(concept_data).execute()
            if result.data:
                concept_id = result.data[0]['id']
                print(f"Created new concept with ID: {concept_id}")
            else:
                raise Exception("Failed to create concept")
        
        # Prepare chunks data for batch insert
        chunks_data = []
        for chunk in concept_chunks:
            chunks_data.append({
                'chunk_md': chunk.chunk_md,
                'embedding': chunk.embedding
            })
        
        # Insert chunks using the custom function
        result = self.supabase.rpc('insert_concept_chunks', {
            'p_concept_id': concept_id,
            'p_chunks': chunks_data
        }).execute()
        
        if result.data:
            print(f"Inserted {result.data} chunks for concept {concept_id}")
        else:
            print(f"Warning: No chunks inserted for concept {concept_id}")
        
        return {
            'status': 'success',
            'concept_id': concept_id,
            'chunks_count': len(concept_chunks),
            'file_path': str(file_path)
        }
    
    async def process_directory(self, directory: Path) -> List[Dict]:
        """Process all markdown files in a directory."""
        
        results = []
        md_files = list(directory.glob('*.md'))
        
        print(f"Found {len(md_files)} concept files in {directory}")
        
        for file_path in md_files:
            try:
                result = await self.process_concept_file(file_path)
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
    parser = argparse.ArgumentParser(description='Import concept docs for RAG system')
    parser.add_argument('--file', type=str, help='Single markdown file to process')
    parser.add_argument('--directory', type=str, help='Directory of markdown files to process')
    
    args = parser.parse_args()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY or not OPENAI_API_KEY:
        print("Error: Missing required environment variables")
        print("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY")
        return
    
    concept_parser = ConceptParser()
    
    if args.file:
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"Error: File not found: {file_path}")
            return
        
        result = await concept_parser.process_concept_file(file_path)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    elif args.directory:
        directory = Path(args.directory)
        if not directory.exists():
            print(f"Error: Directory not found: {directory}")
            return
        
        results = await concept_parser.process_directory(directory)
        
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