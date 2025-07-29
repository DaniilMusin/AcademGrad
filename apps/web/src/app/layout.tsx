import type { Metadata } from 'next';
import './globals.css';
import NotificationCenter from '@/components/NotificationCenter';
// import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Академград - Школа подготовки к ЕГЭ',
  description: 'Банк заданий ЕГЭ с подробными решениями и AI-помощником',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="stylesheet" href="/output.css" />
      </head>
      <body style={{
        fontFamily: 'system-ui, sans-serif',
        margin: 0,
        padding: 0,
        backgroundColor: '#f9fafb'
      }}>
        <div className="relative min-h-screen flex flex-col">
          {/* Уведомления в верхнем правом углу */}
          <div className="fixed top-4 right-4 z-50">
            {/* NotificationCenter временно отключен */}
          </div>
          
          {/* Header будет внутри каждой страницы */}
          
          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
          
          {/* Footer */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
