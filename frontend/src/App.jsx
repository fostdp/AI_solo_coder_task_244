import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ScanPage from './pages/ScanPage'
import AddMedicinePage from './pages/AddMedicinePage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import FamilyPage from './pages/FamilyPage'
import InteractionPage from './pages/InteractionPage'
import PharmacyPage from './pages/PharmacyPage'
import BottomNav from './components/BottomNav'
import { NotificationProvider, useNotification } from './context/NotificationContext'
import { useState } from 'react'

const menuItems = [
  { path: '/', label: '我的药箱', icon: '💊' },
  { path: '/family', label: '家庭共享', icon: '👨‍👩‍👧‍👦' },
  { path: '/interactions', label: '药品相互作用', icon: '⚡' },
  { path: '/pharmacy', label: '附近药店', icon: '🏪' },
]

function Sidebar() {
  const location = useLocation()
  const { unreadCount } = useNotification()

  return (
    <div className="bg-white border-r border-gray-200 py-4">
      <div className="px-4 mb-4">
        <h2 className="text-lg font-bold text-gray-900">家庭药箱</h2>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg mx-2 ${
              location.pathname === item.path
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-gray-100 mt-4 pt-4 px-4">
        <Link
          to="/notifications"
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-lg relative ${
            location.pathname === '/notifications'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="mr-3 text-lg">🔔</span>
          到期提醒
          {unreadCount > 0 && (
            <span className="absolute right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <Link
          to="/settings"
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-lg mt-1 ${
            location.pathname === '/settings'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="mr-3 text-lg">⚙️</span>
          设置
        </Link>
      </div>
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const mainRoutes = ['/', '/scan', '/add', '/edit', '/notifications', '/settings']
  const isMainApp = mainRoutes.some(route => location.pathname.startsWith(route))

  return (
    <div className="min-h-screen bg-gray-50">
      {!isMainApp && (
        <>
          <div className="hidden md:flex">
            <div className="w-64 min-h-screen bg-white border-r border-gray-200">
              <Sidebar />
            </div>
          </div>
          
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div 
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-white">
                <Sidebar />
              </div>
            </div>
          )}
          
          <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
            <div className="flex items-center px-4 h-14">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="ml-2 font-bold text-gray-900">家庭药箱</h1>
            </div>
          </div>
          <div className="md:hidden h-14" />
        </>
      )}
      
      <div className={!isMainApp ? 'md:ml-0' : ''}>
        {isMainApp ? (
          <>
            <div className="pb-20">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/add" element={<AddMedicinePage />} />
                <Route path="/edit/:id" element={<AddMedicinePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/family" element={<FamilyPage />} />
                <Route path="/interactions" element={<InteractionPage />} />
                <Route path="/pharmacy" element={<PharmacyPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <BottomNav />
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Routes>
              <Route path="/family" element={<FamilyPage />} />
              <Route path="/interactions" element={<InteractionPage />} />
              <Route path="/pharmacy" element={<PharmacyPage />} />
              <Route path="/" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  )
}

export default App
