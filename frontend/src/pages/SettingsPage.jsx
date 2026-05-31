import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationApi, medicineApi } from '../utils/api'

function SettingsPage() {
  const navigate = useNavigate()
  const [reminderDays, setReminderDays] = useState('7')
  const [stats, setStats] = useState({ total: 0, expiring: 0, expired: 0 })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadSettings()
    loadStats()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await notificationApi.getSettings()
      if (settings.reminder_days) {
        setReminderDays(settings.reminder_days)
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  const loadStats = async () => {
    try {
      const [all, expiring, expired] = await Promise.all([
        medicineApi.getAll(),
        medicineApi.getExpiring(7),
        medicineApi.getExpired(),
      ])
      setStats({
        total: all?.length || 0,
        expiring: expiring?.length || 0,
        expired: expired?.length || 0,
      })
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await notificationApi.updateSettings({ reminder_days: reminderDays })
      setMessage({ type: 'success', text: '设置已保存' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败: ' + error.message })
    } finally {
      setSaving(false)
    }
  }

  const reminderOptions = [3, 7, 14, 30]

  return (
    <div className="min-h-screen">
      <header className="bg-primary-500 text-white px-4 py-4">
        <h1 className="text-xl font-bold">设置</h1>
        <p className="text-primary-100 text-sm mt-1">管理您的药箱偏好</p>
      </header>

      <main className="p-4 space-y-4">
        <div className="card">
          <h2 className="font-semibold mb-4">📊 药箱统计</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-500">全部药品</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{stats.expiring}</div>
              <div className="text-sm text-gray-500">临期药品</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{stats.expired}</div>
              <div className="text-sm text-gray-500">已过期</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">🔔 提醒设置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                提前提醒天数
              </label>
              <div className="flex gap-2 flex-wrap">
                {reminderOptions.map((days) => (
                  <button
                    key={days}
                    onClick={() => setReminderDays(days.toString())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      reminderDays === days.toString()
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {days}天
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                药品到期前 {reminderDays} 天将收到提醒通知
              </p>
            </div>

            {message && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-primary py-3"
            >
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">ℹ️ 使用说明</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="text-lg">📷</span>
              <p><strong>扫描添加：</strong>使用摄像头扫描药盒上的有效期，系统自动识别药品名称和有效期</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">✏️</span>
              <p><strong>手动添加：</strong>可以手动输入药品信息，包括名称、有效期和备注</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">🔔</span>
              <p><strong>到期提醒：</strong>系统会每天自动检查临期药品，并发送通知提醒</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">🎨</span>
              <p><strong>状态标识：</strong>绿色=安全，蓝色=30天内，黄色=7天内，橙色=3天内，红色=已过期</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">🚀 更多功能</h2>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/family')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👨‍👩‍👧‍👦</span>
                <div>
                  <div className="font-medium text-gray-800">家庭共享药箱</div>
                  <div className="text-xs text-gray-500">与家人共享药品信息</div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            <button
              onClick={() => navigate('/interactions')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚡</span>
                <div>
                  <div className="font-medium text-gray-800">药品相互作用</div>
                  <div className="text-xs text-gray-500">查询药品间的相互作用风险</div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            <button
              onClick={() => navigate('/pharmacy')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🏪</span>
                <div>
                  <div className="font-medium text-gray-800">附近药店</div>
                  <div className="text-xs text-gray-500">查询药品库存和价格</div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">关于</h2>
          <p className="text-sm text-gray-500">
            家庭药箱有效期管理系统 v2.0<br />
            帮助您管理家中药品，避免过期浪费
          </p>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
