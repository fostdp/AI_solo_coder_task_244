import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { notificationApi } from '../utils/api'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationApi.getUnread()
      setUnreadCount(data.length)
      setNotifications(data)
    } catch (error) {
      console.error('获取通知数失败:', error)
    }
  }, [])

  const refreshNotifications = useCallback(async () => {
    try {
      const [unread, all] = await Promise.all([
        notificationApi.getUnread(),
        notificationApi.getAll(),
      ])
      setUnreadCount(unread.length)
      setNotifications(all)
      return { unread, all }
    } catch (error) {
      console.error('刷新通知失败:', error)
      return null
    }
  }, [])

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationApi.markAsRead(id)
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead()
      setUnreadCount(0)
    } catch (error) {
      console.error('全部标记已读失败:', error)
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        fetchUnreadCount,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
