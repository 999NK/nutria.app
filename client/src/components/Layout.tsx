import NavigationBar from "./NavigationBar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Mobile Container */}
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 min-h-screen relative">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-utensils text-white text-sm"></i>
            </div>
            <div>
              <h1 className="font-semibold text-lg">NutrIA</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <i className="fas fa-bell text-gray-600 dark:text-gray-400"></i>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-[calc(100vh-140px)]">
          {children}
        </main>

        {/* Bottom Navigation */}
        <NavigationBar />

        {/* Floating Action Button */}
        <button 
          className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40"
          onClick={() => window.location.href = "/add-meal"}
        >
          <i className="fas fa-plus text-xl"></i>
        </button>
      </div>
    </div>
  );
}
