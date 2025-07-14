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
      if (report) {
        reports.push(report);
        
        // Send email report via Postmark
        if (user.email) {
          await sendWeeklyReportEmail(user.email, user.user_metadata?.full_name || 'User', report);
        }
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
      .gte("ts", weekStart.toISOString())
      .lte("ts", weekEnd.toISOString());

    if (!attempts?.length) {
      return null;
    }

    // Calculate stats
    const tasksSolved = attempts.length;
    const correctAttempts = attempts.filter(a => a.is_correct).length;
    const accuracy = correctAttempts / tasksSolved;
    
    // Get topics covered
    const topicsSet = new Set(attempts.map(a => a.tasks.topic));
    const topicsCovered = Array.from(topicsSet);
    
    // Get weak topics (< 50% accuracy)
    const topicStats = {};
    attempts.forEach(a => {
      const topic = a.tasks.topic;
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total++;
      if (a.is_correct) {
        topicStats[topic].correct++;
      }
    });

    const weakTopics = Object.entries(topicStats)
      .filter(([_, stats]: [string, any]) => stats.correct / stats.total < 0.5)
      .map(([topic]) => topic);

    // Save report to database
    const { data: report } = await supabase
      .from("lesson_reports")
      .insert({
        user_id: userId,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        tasks_solved: tasksSolved,
        accuracy,
        topics_covered: topicsCovered,
        weak_topics: weakTopics
      })
      .select()
      .single();

    return report;
  } catch (error) {
    console.error("Error generating report for user:", userId, error);
    return null;
  }
}

async function sendWeeklyReportEmail(email: string, userName: string, report: any) {
  try {
    const postmarkToken = Deno.env.get("POSTMARK_SERVER_TOKEN");
    
    if (!postmarkToken) {
      console.warn("POSTMARK_SERVER_TOKEN not configured, skipping email");
      return;
    }

    const emailTemplate = generateEmailTemplate(userName, report);

    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkToken
      },
      body: JSON.stringify({
        From: Deno.env.get("POSTMARK_FROM_EMAIL") || "noreply@yourapp.com",
        To: email,
        Subject: `Ваш недельный отчет по обучению`,
        HtmlBody: emailTemplate.html,
        TextBody: emailTemplate.text,
        MessageStream: "outbound"
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send email via Postmark:", error);
    } else {
      console.log(`Weekly report email sent to ${email}`);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

function generateEmailTemplate(userName: string, report: any) {
  const accuracyPercent = Math.round(report.accuracy * 100);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .stat { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #4F46E5; }
            .weak-topics { background: #FEF2F2; border-left-color: #EF4444; }
            .topics-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
            .topic-tag { background: #E0E7FF; color: #3730A3; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Недельный отчет</h1>
                <p>Привет, ${userName}!</p>
            </div>
            <div class="content">
                <div class="stat">
                    <h3>📈 Статистика за неделю</h3>
                    <p><strong>Решено задач:</strong> ${report.tasks_solved}</p>
                    <p><strong>Точность:</strong> ${accuracyPercent}%</p>
                </div>
                
                <div class="stat">
                    <h3>📚 Изученные темы</h3>
                    <div class="topics-list">
                        ${report.topics_covered.map((topic: string) => 
                          `<span class="topic-tag">${topic}</span>`
                        ).join('')}
                    </div>
                </div>
                
                ${report.weak_topics.length > 0 ? `
                <div class="stat weak-topics">
                    <h3>⚠️ Темы для повторения</h3>
                    <p>Обратите внимание на эти темы (точность < 50%):</p>
                    <div class="topics-list">
                        ${report.weak_topics.map((topic: string) => 
                          `<span class="topic-tag">${topic}</span>`
                        ).join('')}
                    </div>
                </div>` : ''}
                
                <div style="text-align: center; margin-top: 30px;">
                    <p>Продолжайте обучение! 🚀</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
Недельный отчет по обучению

Привет, ${userName}!

📈 Статистика за неделю:
- Решено задач: ${report.tasks_solved}
- Точность: ${accuracyPercent}%

📚 Изученные темы: ${report.topics_covered.join(', ')}

${report.weak_topics.length > 0 ? `
⚠️ Темы для повторения (точность < 50%): ${report.weak_topics.join(', ')}
` : ''}

Продолжайте обучение! 🚀
  `;

  return { html, text };
}
