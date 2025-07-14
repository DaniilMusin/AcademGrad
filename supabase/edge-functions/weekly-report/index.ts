import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Generate weekly reports for all users
    const { data: users } = await supabase.auth.admin.listUsers();
    
    if (!users?.users?.length) {
      return new Response("No users found", { status: 404 });
    }

    const reports = [];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEnd = new Date();

    for (const user of users.users) {
      const report = await generateUserReport(supabase, user.id, weekStart, weekEnd);
      if (report && user.email) {
        // Generate PDF and send via email
        await sendReportEmail(user.email, report);
        reports.push(report);
      }
    }

    return new Response(JSON.stringify({ 
      status: "success", 
      reports_generated: reports.length,
      emails_sent: reports.length
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in weekly-report:", error);
    return new Response("Error generating reports", { status: 500 });
  }
});

async function generateUserReport(supabase: any, userId: string, weekStart: Date, weekEnd: Date) {
  try {
    // Get user's attempts for the week
    const { data: attempts } = await supabase
      .from("attempts")
      .select(`
        is_correct,
        time_spent_s,
        tasks (
          topic,
          difficulty
        )
      `)
      .eq("user_id", userId)
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", weekEnd.toISOString());

    if (!attempts?.length) {
      return null; // No activity this week
    }

    // Calculate statistics
    const correctAttempts = attempts.filter(a => a.is_correct).length;
    const totalAttempts = attempts.length;
    const accuracy = (correctAttempts / totalAttempts) * 100;
    const totalTimeSpent = attempts.reduce((sum, a) => sum + (a.time_spent_s || 0), 0);
    const avgDifficulty = attempts.reduce((sum, a) => sum + (a.tasks?.difficulty || 0), 0) / totalAttempts;

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const report = {
      userId,
      userName: profile?.full_name || "Пользователь",
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalAttempts,
      correctAttempts,
      accuracy: Math.round(accuracy),
      totalTimeSpent: Math.round(totalTimeSpent / 60), // minutes
      avgDifficulty: Math.round(avgDifficulty * 10) / 10,
      topicStats: getTopicStats(attempts),
    };

    return report;
  } catch (error) {
    console.error(`Error generating report for user ${userId}:`, error);
    return null;
  }
}

function getTopicStats(attempts: any[]) {
  const topicMap = new Map();
  
  attempts.forEach(attempt => {
    const topic = attempt.tasks?.topic || "Неизвестная тема";
    if (!topicMap.has(topic)) {
      topicMap.set(topic, { total: 0, correct: 0 });
    }
    const stats = topicMap.get(topic);
    stats.total++;
    if (attempt.is_correct) {
      stats.correct++;
    }
  });

  return Array.from(topicMap.entries()).map(([topic, stats]) => ({
    topic,
    total: stats.total,
    correct: stats.correct,
    accuracy: Math.round((stats.correct / stats.total) * 100),
  }));
}

async function sendReportEmail(email: string, report: any) {
  try {
    const postmarkToken = Deno.env.get("POSTMARK_API_TOKEN");
    if (!postmarkToken) {
        console.warn("POSTMARK_API_TOKEN is not set. Skipping email.");
        return;
    }

    const pdfBase64 = await generatePDF(report);
    
    const emailData = {
      From: Deno.env.get("POSTMARK_FROM_EMAIL") || "noreply@academgrad.com",
      To: email,
      Subject: `📊 Ваш недельный отчет AcademGrad (${formatDate(report.weekStart)} - ${formatDate(report.weekEnd)})`,
      HtmlBody: generateEmailHTML(report),
      TextBody: generateEmailText(report),
      Attachments: pdfBase64 ? [
        {
          Name: `AcademGrad_Report_${formatDateForFile(report.weekEnd)}.pdf`,
          Content: pdfBase64,
          ContentType: "application/pdf"
        }
      ] : []
    };

    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkToken
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Postmark API error: ${response.status} - ${error}`);
    }

    console.log(`Report email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
  }
}

async function generatePDF(report: any): Promise<string> {
  try {
    // This Python script uses reportlab to generate a PDF and returns it as a base64 string.
    const pythonScript = `
import sys, json, base64, tempfile, os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

def generate_report_pdf(report_data):
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        pdf_path = tmp.name
    try:
        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, spaceAfter=30, textColor=colors.HexColor('#2563eb'))
        story.append(Paragraph("📊 Недельный отчет AcademGrad", title_style))
        story.append(Spacer(1, 12))
        
        user_info = f"<b>Пользователь:</b> {report_data['userName']}<br/><b>Период:</b> {report_data['weekStart'][:10]} - {report_data['weekEnd'][:10]}"
        story.append(Paragraph(user_info, styles['Normal']))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>Статистика недели:</b>", styles['Heading2']))
        stats_data = [
            ['Показатель', 'Значение'],
            ['Всего попыток', str(report_data['totalAttempts'])],
            ['Правильных ответов', str(report_data['correctAttempts'])],
            ['Точность', f"{report_data['accuracy']}%"],
            ['Время занятий', f"{report_data['totalTimeSpent']} мин"],
            ['Средняя сложность', str(report_data['avgDifficulty'])],
        ]
        stats_table = Table(stats_data, colWidths=[2*inch, 2*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')), ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14), ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige), ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(stats_table)
        story.append(Spacer(1, 20))
        
        if report_data.get('topicStats'):
            story.append(Paragraph("<b>Статистика по темам:</b>", styles['Heading2']))
            topic_data = [['Тема', 'Попыток', 'Правильно', 'Точность']]
            for topic_stat in report_data['topicStats']:
                topic_data.append([topic_stat['topic'], str(topic_stat['total']), str(topic_stat['correct']), f"{topic_stat['accuracy']}%"])
            topic_table = Table(topic_data, colWidths=[2.5*inch, 1*inch, 1*inch, 1*inch])
            topic_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')), ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12), ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey), ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(topic_table)
        
        doc.build(story)
        
        with open(pdf_path, 'rb') as f:
            pdf_content = f.read()
            return base64.b64encode(pdf_content).decode('utf-8')
    finally:
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)

if __name__ == "__main__":
    report_data = json.loads(sys.argv[1])
    pdf_base64 = generate_report_pdf(report_data)
    print(pdf_base64)
`;

    const process = new Deno.Command("python3", {
      args: ["-c", pythonScript, JSON.stringify(report)],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await process.output();

    if (code !== 0) {
      console.error("Python PDF generation error:", new TextDecoder().decode(stderr));
      throw new Error("PDF generation failed");
    }

    return new TextDecoder().decode(stdout).trim();
  } catch (error) {
    console.error("Error generating PDF:", error);
    return "";
  }
}

function generateEmailHTML(report: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .stats { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .stat-item { display: inline-block; margin: 10px 20px 10px 0; }
        .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .stat-label { color: #64748b; font-size: 14px; }
        .topic-stats { margin-top: 20px; }
        .topic-item { background: white; border: 1px solid #e2e8f0; padding: 10px; margin: 5px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Ваш недельный отчет AcademGrad</h1>
        <p>Период: ${formatDate(report.weekStart)} - ${formatDate(report.weekEnd)}</p>
    </div>
    
    <div class="content">
        <h2>Привет, ${report.userName}! 👋</h2>
        <p>Вот ваша статистика за прошедшую неделю:</p>
        
        <div class="stats">
            <div class="stat-item"><div class="stat-value">${report.totalAttempts}</div><div class="stat-label">Всего попыток</div></div>
            <div class="stat-item"><div class="stat-value">${report.accuracy}%</div><div class="stat-label">Точность</div></div>
            <div class="stat-item"><div class="stat-value">${report.totalTimeSpent}</div><div class="stat-label">Минут занятий</div></div>
            <div class="stat-item"><div class="stat-value">${report.avgDifficulty}</div><div class="stat-label">Средняя сложность</div></div>
        </div>

        ${report.topicStats?.length ? `
        <div class="topic-stats">
            <h3>Статистика по темам:</h3>
            ${report.topicStats.map((topic: any) => `
                <div class="topic-item"><strong>${topic.topic}</strong> - ${topic.correct}/${topic.total} (${topic.accuracy}%)</div>
            `).join('')}
        </div>
        ` : ''}
        
        <p>📎 Подробный отчет в формате PDF прикреплен к этому письму.</p>
        <p>Продолжайте в том же духе! 💪</p>
        <p>С уважением,<br>Команда AcademGrad</p>
    </div>
</body>
</html>
  `;
}

function generateEmailText(report: any): string {
  return `
📊 Ваш недельный отчет AcademGrad
Привет, ${report.userName}!
Вот ваша статистика за период ${formatDate(report.weekStart)} - ${formatDate(report.weekEnd)}:
📈 Всего попыток: ${report.totalAttempts}
✅ Правильных ответов: ${report.correctAttempts}
🎯 Точность: ${report.accuracy}%
⏱️ Время занятий: ${report.totalTimeSpent} минут
📊 Средняя сложность: ${report.avgDifficulty}
${report.topicStats?.length ? `
Статистика по темам:
${report.topicStats.map((topic: any) => 
  `• ${topic.topic}: ${topic.correct}/${topic.total} (${topic.accuracy}%)`
).join('\n')}
` : ''}
📎 Подробный отчет в формате PDF прикреплен к этому письму.
Продолжайте в том же духе! 💪
С уважением,
Команда AcademGrad
  `;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU');
}

function formatDateForFile(dateString: string): string {
  return new Date(dateString).toISOString().split('T')[0];
}