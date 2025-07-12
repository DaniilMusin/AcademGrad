#!/usr/bin/env python3
"""
PDF generation script for weekly reports.
Creates beautiful PDF reports using WeasyPrint from HTML templates.
"""

import os
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv
import sys
from weasyprint import HTML, CSS
from jinja2 import Template
import json

# Load environment variables
load_dotenv()

def main():
    """Main function for PDF generation."""
    
    if not os.getenv("SUPABASE_DB_URL"):
        print("Error: SUPABASE_DB_URL must be set")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(os.getenv("SUPABASE_DB_URL"))
        cur = conn.cursor()
        
        # Get lesson reports that need PDF generation
        cur.execute("""
            SELECT id, user_id, week_start, week_end, tasks_solved, 
                   accuracy, topics_covered, weak_topics
            FROM lesson_reports
            WHERE pdf_url IS NULL
            ORDER BY created_at DESC
            LIMIT 10
        """)
        
        reports = cur.fetchall()
        
        if not reports:
            print("No reports to generate PDFs for")
            return
        
        generated_count = 0
        
        for report in reports:
            try:
                pdf_path = generate_report_pdf(report)
                
                if pdf_path:
                    # Update database with PDF URL
                    cur.execute("""
                        UPDATE lesson_reports 
                        SET pdf_url = %s 
                        WHERE id = %s
                    """, (pdf_path, report[0]))
                    
                    generated_count += 1
                    print(f"✓ Generated PDF for report {report[0]}")
                
            except Exception as e:
                print(f"✗ Error generating PDF for report {report[0]}: {e}")
                continue
        
        conn.commit()
        print(f"\nGenerated {generated_count} PDFs successfully!")
        
    except Exception as e:
        print(f"Error during PDF generation: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

def generate_report_pdf(report_data):
    """Generate PDF for a single report."""
    
    report_id, user_id, week_start, week_end, tasks_solved, accuracy, topics_covered, weak_topics = report_data
    
    # Create HTML content
    html_content = create_html_report(report_data)
    
    # Generate PDF
    pdf_filename = f"report_{report_id}_{user_id}_{week_start}.pdf"
    pdf_path = f"./reports/{pdf_filename}"
    
    # Create reports directory if it doesn't exist
    os.makedirs("./reports", exist_ok=True)
    
    # Generate PDF using WeasyPrint
    html = HTML(string=html_content)
    css = CSS(string=get_pdf_styles())
    
    html.write_pdf(pdf_path, stylesheets=[css])
    
    return pdf_path

def create_html_report(report_data):
    """Create HTML content for the report."""
    
    report_id, user_id, week_start, week_end, tasks_solved, accuracy, topics_covered, weak_topics = report_data
    
    # Parse JSON fields
    topics_covered = json.loads(topics_covered) if topics_covered else []
    weak_topics = json.loads(weak_topics) if weak_topics else []
    
    template = Template("""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Недельный отчет</title>
    </head>
    <body>
        <div class="header">
            <h1>📊 Недельный отчет</h1>
            <p class="period">{{ week_start }} - {{ week_end }}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h2>{{ tasks_solved }}</h2>
                <p>Задач решено</p>
            </div>
            
            <div class="stat-card">
                <h2>{{ accuracy_percent }}%</h2>
                <p>Точность</p>
            </div>
            
            <div class="stat-card">
                <h2>{{ topics_count }}</h2>
                <p>Тем изучено</p>
            </div>
        </div>
        
        <div class="section">
            <h2>🎯 Изученные темы</h2>
            {% if topics_covered %}
                <ul class="topics-list">
                {% for topic in topics_covered %}
                    <li>{{ topic }}</li>
                {% endfor %}
                </ul>
            {% else %}
                <p>В этом периоде темы не изучались</p>
            {% endif %}
        </div>
        
        {% if weak_topics %}
        <div class="section">
            <h2>⚠️ Слабые места</h2>
            <ul class="weak-topics-list">
            {% for topic in weak_topics %}
                <li>{{ topic }}</li>
            {% endfor %}
            </ul>
            <p class="recommendation">
                💡 Рекомендуем уделить больше внимания этим темам
            </p>
        </div>
        {% endif %}
        
        <div class="footer">
            <p>Отчет сгенерирован {{ generated_at }}</p>
        </div>
    </body>
    </html>
    """)
    
    return template.render(
        week_start=week_start,
        week_end=week_end,
        tasks_solved=tasks_solved,
        accuracy_percent=round(accuracy * 100, 1),
        topics_count=len(topics_covered),
        topics_covered=topics_covered,
        weak_topics=weak_topics,
        generated_at=datetime.now().strftime("%d.%m.%Y %H:%M")
    )

def get_pdf_styles():
    """Get CSS styles for PDF generation."""
    
    return """
    @page {
        size: A4;
        margin: 2cm;
    }
    
    body {
        font-family: 'DejaVu Sans', sans-serif;
        line-height: 1.6;
        color: #333;
    }
    
    .header {
        text-align: center;
        margin-bottom: 2rem;
        border-bottom: 2px solid #007bff;
        padding-bottom: 1rem;
    }
    
    .header h1 {
        color: #007bff;
        margin: 0;
    }
    
    .period {
        font-size: 1.2rem;
        color: #666;
        margin: 0.5rem 0;
    }
    
    .stats {
        display: flex;
        justify-content: space-around;
        margin: 2rem 0;
    }
    
    .stat-card {
        text-align: center;
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        min-width: 120px;
    }
    
    .stat-card h2 {
        font-size: 2rem;
        color: #007bff;
        margin: 0;
    }
    
    .stat-card p {
        margin: 0.5rem 0 0 0;
        color: #666;
    }
    
    .section {
        margin: 2rem 0;
    }
    
    .section h2 {
        color: #007bff;
        border-bottom: 1px solid #dee2e6;
        padding-bottom: 0.5rem;
    }
    
    .topics-list, .weak-topics-list {
        list-style: none;
        padding: 0;
    }
    
    .topics-list li, .weak-topics-list li {
        background: #e9ecef;
        margin: 0.5rem 0;
        padding: 0.75rem;
        border-radius: 4px;
        border-left: 4px solid #007bff;
    }
    
    .weak-topics-list li {
        border-left-color: #dc3545;
        background: #f8d7da;
    }
    
    .recommendation {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 4px;
        border-left: 4px solid #ffc107;
        margin-top: 1rem;
    }
    
    .footer {
        text-align: center;
        margin-top: 3rem;
        padding-top: 1rem;
        border-top: 1px solid #dee2e6;
        color: #666;
        font-size: 0.9rem;
    }
    """

if __name__ == "__main__":
    main()
