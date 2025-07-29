import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Страница не найдена</h2>
        <p className="text-gray-600 mb-6">
          Запрашиваемая страница не существует или была перемещена.
        </p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}