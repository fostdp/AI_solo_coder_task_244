import { useState, useEffect } from 'react'
import { medicineApi } from '../utils/api'
import MedicineCard from '../components/MedicineCard'

function HomePage() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)

  const fetchMedicines = async () => {
    setLoading(true)
    setError(null)
    try {
      let data
      if (filter === 'all') {
        data = await medicineApi.getAll()
      } else if (filter === 'expiring') {
        data = await medicineApi.getExpiring(7)
      } else if (filter === 'expired') {
        data = await medicineApi.getExpired()
      }
      setMedicines(data || [])
    } catch (err) {
      setError(err.message)
      setMedicines([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedicines()
  }, [filter])

  const handleDeleted = (id) => {
    setMedicines(prev => prev.filter(m => m.id !== id))
  }

  const getFilterStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const all = medicines.length
    const expired = medicines.filter(m => m.expiry_date < today).length
    const expiring = medicines.filter(m => {
      const diff = Math.ceil((new Date(m.expiry_date) - new Date(today)) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff <= 7
    }).length
    return { all, expired, expiring }
  }

  const stats = getFilterStats()

  return (
    <div className="min-h-screen">
      <header className="bg-primary-500 text-white px-4 py-6">
        <h1 className="text-2xl font-bold">我的药箱</h1>
        <p className="text-primary-100 text-sm mt-1">管理您的药品有效期</p>
      </header>

      <div className="px-4 py-3 bg-white border-b">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            全部 ({stats.all})
          </button>
          <button
            onClick={() => setFilter('expiring')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'expiring' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            临期 ({stats.expiring})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'expired' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            已过期 ({stats.expired})
          </button>
        </div>
      </div>

      <main className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-500 mb-4">{error}</p>
            <button onClick={fetchMedicines} className="btn-primary">
              重试
            </button>
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 mb-2">
              {filter === 'all' ? '药箱是空的' : filter === 'expiring' ? '没有临期药品' : '没有过期药品'}
            </p>
            {filter === 'all' && (
              <p className="text-gray-400 text-sm">
                点击底部"添加"或"扫描"来添加药品
              </p>
            )}
          </div>
        ) : (
          <div>
            {medicines.map(medicine => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default HomePage
