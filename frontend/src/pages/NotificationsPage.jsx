import { useState, useEffect } from 'react'
import { useNotification } from '../context/NotificationContext'
import { notificationApi } from '../utils/api'

function NotificationsPage() {
  const { refreshNotifications, markAsRead, markAllAsRead } = useNotification()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await notificationApi.getAll()
      setNotifications(data || [])
    } catch (err) {
      setError('加载通知失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    await markAsRead(id)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
    )
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
  }

  const unreadCount = notifications.filter(n => n.is_read === 0).length

  return (
    <div className="min-h-screen">
      <header className="bg-primary-500 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">通知提醒</h1>
          <p className="text-primary-100 text-sm mt-1">
            {unreadCount > 0 ? `有 ${unreadCount} 条未读通知` : '暂无新通知'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            全部已读
          </button>
        )}
      </header>

      <main className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">{error}</p>
            <button onClick={loadNotifications} className="btn-primary">
              重试
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-gray-500 mb-2">暂无通知</p>
            <p className="text-gray-400 text-sm">当有药品临期时会收到提醒</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`card ${notification.is_read === 0 ? 'border-l-4 border-primary-500' : ''} ${notification.is_deleted ? 'opacity-60 bg-gray-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {notification.is_read === 0 && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      )}
                      <span className="text-sm text-gray-400">
                        {new Date(notification.created_date).toLocaleDateString('zh-CN')}
                      </span>
                      {notification.days_remaining !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          notification.days_remaining < 0 ? 'bg-red-100 text-red-600' :
                          notification.days_remaining <= 3 ? 'bg-orange-100 text-orange-600' :
                          notification.days_remaining <= 7 ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {notification.days_remaining < 0 ? `已过期 ${Math.abs(notification.days_remaining)} 天` :
                           notification.days_remaining === 0 ? '今天过期' :
                           `${notification.days_remaining} 天后过期`}
                        </span>
                      )}
                    </div>
                    <p className={`font-medium ${notification.is_read === 0 ? 'text-gray-800' : 'text-gray-500'}`}>
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {notification.medicine_name}
                      {notification.expiry_date && ` · 有效期: ${notification.expiry_date}`}
                      {notification.is_deleted && <span className="text-red-400 ml-2">(药品已删除)</span>}
                    </p>
                  </div>
                  {notification.is_read === 0 && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-sm text-primary-500 hover:text-primary-600"
                    >
                      已读
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default NotificationsPage
