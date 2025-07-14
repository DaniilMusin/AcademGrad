import { WifiOff, RefreshCw, Book, TrendingUp } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            <WifiOff className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Вы офлайн
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Проверьте подключение к интернету и попробуйте еще раз. 
            Некоторые функции могут быть недоступны в офлайн режиме.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  Сохраненные задачи
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Решайте ранее загруженные задачи
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  Локальная статистика
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Просматривайте свой прогресс
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Повторить попытку
        </button>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          AcademGrad продолжает работать даже без интернета
        </p>
      </div>
    </div>
  );
}