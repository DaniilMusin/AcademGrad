#!/usr/bin/env python3
"""
Generate demo tutors with embeddings for testing AI matching functionality.
Creates realistic tutor profiles with vector representations for semantic search.
"""

import os
import psycopg2
import openai
from dotenv import load_dotenv
import sys
import time

def generate_demo_tutors_with_embeddings():
    """Generate demo tutors and their bio embeddings."""
    
    load_dotenv()
    
    # Check required environment variables
    required_vars = ["SUPABASE_DB_URL", "OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(os.getenv("SUPABASE_DB_URL"))
        cur = conn.cursor()
        openai.api_key = os.getenv("OPENAI_API_KEY")
    except Exception as e:
        print(f"Error initializing connections: {e}")
        sys.exit(1)
    
    # Check if tutors table exists (if not, we might need to create it)
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'tutors'
        );
    """)
    
    table_exists = cur.fetchone()[0]
    
    if not table_exists:
        print("Creating tutors table...")
        cur.execute("""
            CREATE TABLE public.tutors (
                id BIGSERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                bio TEXT NOT NULL,
                subjects TEXT[] NOT NULL,
                bio_embedding VECTOR(1536),
                experience_years INTEGER DEFAULT 1,
                rating DECIMAL(3,2) DEFAULT 5.0,
                price_per_hour INTEGER DEFAULT 1000,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        conn.commit()
    
    demo_tutors = [
        {
            "name": "Анна Петрова",
            "bio": "Опытный преподаватель математики с 10-летним стажем. Специализируется на подготовке к ЕГЭ по алгебре и геометрии. Индивидуальный подход к каждому ученику. Помогла более 200 ученикам поступить в престижные вузы.",
            "subjects": ["математика", "алгебра", "геометрия"],
            "experience_years": 10,
            "rating": 4.9,
            "price_per_hour": 2000
        },
        {
            "name": "Сергей Иванов", 
            "bio": "Кандидат физико-математических наук. Преподаватель физики в лицее. Помогает ученикам понять сложные концепции через практические примеры. Специализируется на механике, термодинамике и электродинамике.",
            "subjects": ["физика", "механика", "термодинамика"],
            "experience_years": 8,
            "rating": 4.8,
            "price_per_hour": 1800
        },
        {
            "name": "Елена Смирнова",
            "bio": "Магистр химических наук, преподаватель с 6-летним опытом. Специализируется на органической и неорганической химии. Использует интерактивные методы обучения и современные технологии.",
            "subjects": ["химия", "органическая химия", "неорганическая химия"],
            "experience_years": 6,
            "rating": 4.7,
            "price_per_hour": 1600
        },
        {
            "name": "Дмитрий Козлов",
            "bio": "Учитель информатики высшей категории. Эксперт в области программирования на Python и алгоритмов. Готовит к ЕГЭ по информатике и олимпиадам. Автор образовательных курсов.",
            "subjects": ["информатика", "программирование", "алгоритмы"],
            "experience_years": 12,
            "rating": 4.9,
            "price_per_hour": 2200
        },
        {
            "name": "Мария Волкова",
            "bio": "Кандидат биологических наук. Преподаватель биологии и экологии. Специализируется на подготовке к ЕГЭ по биологии. Использует наглядные материалы и практические занятия.",
            "subjects": ["биология", "экология", "анатомия"],
            "experience_years": 7,
            "rating": 4.8,
            "price_per_hour": 1700
        }
    ]
    
    print("Generating embeddings for demo tutors...")
    
    for i, tutor in enumerate(demo_tutors):
        print(f"Processing tutor {i+1}/{len(demo_tutors)}: {tutor['name']}")
        
        try:
            # Generate embedding for bio
            response = openai.embeddings.create(
                model="text-embedding-3-small",
                input=tutor["bio"]
            )
            embedding = response.data[0].embedding
            
            # Check if tutor already exists
            cur.execute("SELECT id FROM tutors WHERE name = %s", (tutor["name"],))
            existing = cur.fetchone()
            
            if existing:
                print(f"  Updating existing tutor: {tutor['name']}")
                cur.execute("""
                    UPDATE tutors 
                    SET bio = %s, subjects = %s, bio_embedding = %s, 
                        experience_years = %s, rating = %s, price_per_hour = %s
                    WHERE name = %s
                """, (tutor["bio"], tutor["subjects"], embedding, 
                     tutor["experience_years"], tutor["rating"], 
                     tutor["price_per_hour"], tutor["name"]))
            else:
                print(f"  Creating new tutor: {tutor['name']}")
                cur.execute("""
                    INSERT INTO tutors (name, bio, subjects, bio_embedding, 
                                      experience_years, rating, price_per_hour) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (tutor["name"], tutor["bio"], tutor["subjects"], embedding,
                     tutor["experience_years"], tutor["rating"], tutor["price_per_hour"]))
            
            # Small delay to avoid rate limiting
            time.sleep(0.5)
            
        except Exception as e:
            print(f"  Error processing {tutor['name']}: {e}")
            continue
    
    conn.commit()
    conn.close()
    print("\n✅ Demo tutors with embeddings created successfully!")
    print("You can now test AI-powered tutor matching functionality.")

def validate_embeddings_consistency():
    """Validate that all embeddings have correct dimensions."""
    load_dotenv()
    
    try:
        conn = psycopg2.connect(os.getenv("SUPABASE_DB_URL"))
        cur = conn.cursor()
        
        print("Validating embeddings consistency...")
        
        # Check task_chunks embeddings
        cur.execute("SELECT id, array_length(embedding, 1) as dim FROM task_chunks WHERE embedding IS NOT NULL")
        chunks = cur.fetchall()
        
        invalid_chunks = 0
        for chunk_id, dim in chunks:
            if dim != 1536:
                print(f"⚠️  WARNING: task_chunk {chunk_id} has embedding dimension {dim}, expected 1536")
                invalid_chunks += 1
        
        # Check tutors embeddings if table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'tutors'
            );
        """)
        
        if cur.fetchone()[0]:
            cur.execute("SELECT id, array_length(bio_embedding, 1) as dim FROM tutors WHERE bio_embedding IS NOT NULL")
            tutors = cur.fetchall()
            
            invalid_tutors = 0
            for tutor_id, dim in tutors:
                if dim != 1536:
                    print(f"⚠️  WARNING: tutor {tutor_id} has embedding dimension {dim}, expected 1536")
                    invalid_tutors += 1
            
            print(f"📊 Tutors embeddings: {len(tutors)} total, {invalid_tutors} invalid")
        
        print(f"📊 Task chunks embeddings: {len(chunks)} total, {invalid_chunks} invalid")
        
        if invalid_chunks == 0 and (not tutors or invalid_tutors == 0):
            print("✅ All embeddings have correct dimensions!")
        
        conn.close()
        
    except Exception as e:
        print(f"Error validating embeddings: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate demo tutors with embeddings")
    parser.add_argument("--validate", action="store_true", help="Validate embeddings consistency")
    args = parser.parse_args()
    
    if args.validate:
        validate_embeddings_consistency()
    else:
        generate_demo_tutors_with_embeddings()