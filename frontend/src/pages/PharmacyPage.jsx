import { useState, useEffect } from 'react'
import { pharmacyApi } from '../utils/api'

function PharmacyPage() {
  const [activeTab, setActiveTab] = useState('nearby')
  const [searchQuery, setSearchQuery] = useState('')
  const [pharmacies, setPharmacies] = useState([])
  const [searchResults, setSearchResults] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPharmacy, setSelectedPharmacy] = useState(null)

  const loadPharmacies = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await pharmacyApi.getAll()
      setPharmacies(data.pharmacies)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAlerts = async () => {
    try {
      const data = await pharmacyApi.getAlerts()
      setAlerts(data.alerts)
    } catch (err) {
      console.error('加载提醒失败:', err)
    }
  }

  useEffect(() => {
    loadPharmacies()
    loadAlerts()
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('请输入药品名称')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      setSearchResults(null)
      const data = await pharmacyApi.searchMedicine(searchQuery.trim())
      setSearchResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = async () => {
    if (!searchQuery.trim()) return
    
    try {
      const result = await pharmacyApi.createInventoryAlert({
        medicine_name: searchQuery.trim()
      })
      
      if (result.success) {
        alert('缺药提醒已创建！当有药店有货时会通知您')
        loadAlerts()
      } else {
        alert(`该药品目前有库存，共 ${result.availability.available_pharmacies} 家药店有售`)
      }
    } catch (err) {
      alert('创建提醒失败: ' + err.message)
    }
  }

  const handleRemoveAlert = async (alertId) => {
    if (!confirm('确定要取消这个提醒吗？')) return
    
    try {
      await pharmacyApi.deactivateAlert(alertId)
      loadAlerts()
    } catch (err) {
      alert('取消提醒失败: ' + err.message)
    }
  }

  const getStockStatusClass = (stock) => {
    if (stock === 0) return 'bg-red-100 text-red-800'
    if (stock <= 10) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getStockStatusText = (stock) => {
    if (stock === 0) return '缺货'
    if (stock <= 10) return `仅剩 ${stock} 盒`
    return `库存充足 (${stock}盒)`
  }

  return (
    <div className="p-4 pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">药店查询</h1>
        <p className="text-gray-500 text-sm">查找附近药店和药品库存</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab('nearby'); setSearchResults(null) }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'nearby'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          📍 附近药店
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'search'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          🔍 查药
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
            activeTab === 'alerts'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          🔔 缺药提醒
          {alerts.filter(a => a.is_active).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {alerts.filter(a => a.is_active).length}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {activeTab === 'nearby' && (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-blue-700">
              <span className="text-xl">📍</span>
              <span className="text-sm">显示所有药店，可根据需要筛选</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : pharmacies.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🏪</div>
              <p className="text-gray-500">附近暂无药店信息</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pharmacies.map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all border-2 ${
                    selectedPharmacy?.id === pharmacy.id
                      ? 'border-primary-500'
                      : 'border-transparent hover:border-primary-200'
                  }`}
                  onClick={() => setSelectedPharmacy(selectedPharmacy?.id === pharmacy.id ? null : pharmacy)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{pharmacy.name}</h3>
                        {pharmacy.is_24h && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            24小时
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        📍 {pharmacy.address}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📞 {pharmacy.phone}</span>
                        <span>🕐 {pharmacy.opening_hours}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {pharmacy.inventory_count && (
                        <span className="text-sm text-primary-600">
                          {pharmacy.inventory_count} 种药品
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedPharmacy?.id === pharmacy.id && pharmacy.inventory && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-700 mb-2">药品库存</h4>
                      <div className="space-y-2">
                        {pharmacy.inventory.slice(0, 8).map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-800">{item.medicine_name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-primary-600 font-medium">¥{item.price}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStockStatusClass(item.stock)}`}>
                                {getStockStatusText(item.stock)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-medium text-gray-700 mb-3">搜索药品库存</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="输入药品名称，如：阿莫西林"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {loading ? '搜索中...' : '搜索'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500 mr-2">热门搜索：</span>
              {['阿莫西林', '布洛芬', '头孢克肟', '奥美拉唑'].map((drug) => (
                <button
                  key={drug}
                  onClick={() => { setSearchQuery(drug); setTimeout(() => handleSearch(), 0) }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-primary-100 hover:text-primary-700"
                >
                  {drug}
                </button>
              ))}
            </div>
          </div>

          {searchResults && (
            <>
              <div className={`rounded-xl p-4 shadow-sm ${
                searchResults.available_count > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl mr-2">
                      {searchResults.available_count > 0 ? '✅' : '😟'}
                    </span>
                    <span className="font-semibold">
                      {searchResults.medicine_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      searchResults.available_count > 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {searchResults.available_count > 0 
                        ? `${searchResults.available_count} 家有售`
                        : '暂时缺货'}
                    </div>
                    {searchResults.available_count === 0 && (
                      <button
                        onClick={handleCreateAlert}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        🔔 设置到货提醒
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {searchResults.results && searchResults.results.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">库存详情</h4>
                  {searchResults.results
                    .sort((a, b) => {
                      if (a.stock === 0 && b.stock > 0) return 1
                      if (b.stock === 0 && a.stock > 0) return -1
                      return a.price - b.price
                    })
                    .map((result, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">{result.pharmacy_name}</h5>
                            <p className="text-sm text-gray-500">{result.pharmacy_address}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary-600">¥{result.price}</div>
                            {result.is_24h && (
                              <span className="text-xs text-green-600">24小时营业</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">📞 {result.pharmacy_phone}</span>
                          <span className={`text-xs px-3 py-1 rounded-full ${getStockStatusClass(result.stock)}`}>
                            {getStockStatusText(result.stock)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">暂无缺药提醒</h3>
              <p className="text-gray-500 mb-6">搜索药品时可以设置到货提醒</p>
              <button
                onClick={() => setActiveTab('search')}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
              >
                去搜索药品
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`bg-white rounded-xl p-4 shadow-sm ${
                  alert.is_active ? '' : 'opacity-60'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {alert.current_available ? '✅' : '🔔'}
                      </span>
                      <div>
                        <h5 className="font-medium text-gray-900">{alert.medicine_name}</h5>
                        <p className="text-sm text-gray-500">
                          {alert.created_date} 创建
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {alert.is_active ? (
                        alert.current_available ? (
                          <span className="text-sm text-green-600 font-medium">
                            🎉 有货了！
                          </span>
                        ) : (
                          <span className="text-sm text-yellow-600">
                            等待到货
                          </span>
                        )
                      ) : (
                        <span className="text-sm text-gray-400">
                          已取消
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {alert.current_available && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        <span className="text-green-600 font-medium">
                          {alert.pharmacy_count} 家药店有货
                        </span>
                        {alert.lowest_price && (
                          <span className="ml-2">
                            最低价格 ¥{alert.lowest_price}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {alert.is_active && (
                    <button
                      onClick={() => handleRemoveAlert(alert.id)}
                      className="mt-3 text-sm text-red-500 hover:text-red-700"
                    >
                      取消提醒
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-1">💡 小提示</h4>
        <p className="text-sm text-gray-600">
          库存信息可能有延迟，建议前往药店前先电话确认。价格仅供参考，以药店实际售价为准。
        </p>
      </div>
    </div>
  )
}

export default PharmacyPage
