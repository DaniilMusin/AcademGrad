export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your progress and achievements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">📚</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Tasks Solved</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total XP</p>
                <p className="text-2xl font-bold text-gray-900">1250</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Badges</p>
                <p className="text-2xl font-bold text-gray-900">2/4</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📚</span>
                <div>
                  <p className="font-medium text-gray-900">Start Learning</p>
                  <p className="text-sm text-gray-600">Continue your progress</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <p className="font-medium text-gray-900">View Schedule</p>
                  <p className="text-sm text-gray-600">Check your study plan</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <p className="font-medium text-gray-900">View Analytics</p>
                  <p className="text-sm text-gray-600">Track your performance</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
