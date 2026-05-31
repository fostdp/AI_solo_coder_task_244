import { useState } from 'react'
import { interactionApi, medicineApi } from '../utils/api'

function InteractionPage() {
  const [mode, setMode] = useState('quick')
  const [drug1, setDrug1] = useState('')
  const [drug2, setDrug2] = useState('')
  const [selectedDrugs, setSelectedDrugs] = useState([])
  const [newDrug, setNewDrug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [quickCheckResult, setQuickCheckResult] = useState(null)

  const quickDrugs = ['阿莫西林', '布洛芬', '头孢克肟', '奥美拉唑', '华法林', '甲硝唑']

  const handleQuickCheck = async (drugName) => {
    if (!drugName.trim()) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await interactionApi.quickCheck(drugName)
      setQuickCheckResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTwoDrugsCheck = async () => {
    if (!drug1.trim() || !drug2.trim()) {
      setError('请输入两种药品名称')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      setResult(null)
      const data = await interactionApi.checkTwoDrugs(drug1, drug2)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addDrugToBatch = () => {
    if (!newDrug.trim()) return
    if (selectedDrugs.includes(newDrug.trim())) {
      setError('该药品已添加')
      return
    }
    setSelectedDrugs([...selectedDrugs, newDrug.trim()])
    setNewDrug('')
    setError(null)
  }

  const removeDrugFromBatch = (index) => {
    const updated = [...selectedDrugs]
    updated.splice(index, 1)
    setSelectedDrugs(updated)
  }

  const handleBatchCheck = async () => {
    if (selectedDrugs.length < 2) {
      setError('请至少添加两种药品')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      setResult(null)
      const data = await interactionApi.batchCheck(selectedDrugs)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadMyMedicines = async () => {
    try {
      setLoading(true)
      setError(null)
      const medicines = await medicineApi.getAll()
      if (medicines.length === 0) {
        setError('您的药箱中还没有药品')
        return
      }
      setSelectedDrugs(medicines.slice(0, 5).map(m => m.name))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = {
      high: 'bg-red-100 border-red-200',
      medium: 'bg-yellow-100 border-yellow-200',
      low: 'bg-green-100 border-green-200'
    }
    return colors[severity] || 'bg-gray-100 border-gray-200'
  }

  const getSeverityTextColor = (severity) => {
    const colors = {
      high: 'text-red-800',
      medium: 'text-yellow-800',
      low: 'text-green-800'
    }
    return colors[severity] || 'text-gray-800'
  }

  const getSeverityBadge = (severity) => {
    const badges = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    }
    return badges[severity] || 'bg-gray-500'
  }

  const getSeverityLabel = (severity) => {
    const labels = {
      high: '严重',
      medium: '中等',
      low: '轻微'
    }
    return labels[severity] || '未知'
  }

  return (
    <div className="p-4 pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">药品相互作用</h1>
        <p className="text-gray-500 text-sm">快速查询药品间的相互作用风险</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode('quick'); setResult(null); setQuickCheckResult(null); setError(null) }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'quick'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          快速查询
        </button>
        <button
          onClick={() => { setMode('two'); setResult(null); setQuickCheckResult(null); setError(null) }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'two'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          两药对比
        </button>
        <button
          onClick={() => { setMode('batch'); setResult(null); setQuickCheckResult(null); setError(null) }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'batch'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          批量检查
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {mode === 'quick' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-medium text-gray-700 mb-3">快速了解某药品的风险</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={drug1}
                onChange={(e) => setDrug1(e.target.value)}
                placeholder="输入药品名称，如：阿莫西林"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => handleQuickCheck(drug1)}
                disabled={loading || !drug1.trim()}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {loading ? '查询中...' : '查询'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500 mr-2">快速选择：</span>
              {quickDrugs.map((drug) => (
                <button
                  key={drug}
                  onClick={() => handleQuickCheck(drug)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
                >
                  {drug}
                </button>
              ))}
            </div>
          </div>

          {quickCheckResult && (
            <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${
              quickCheckResult.risk_level === 'high' ? 'border-red-300' :
              quickCheckResult.risk_level === 'medium' ? 'border-yellow-300' :
              'border-green-300'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{quickCheckResult.drug}</h3>
                <span className={`text-sm px-3 py-1 rounded-full text-white ${
                  quickCheckResult.risk_level === 'high' ? 'bg-red-500' :
                  quickCheckResult.risk_level === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}>
                  {quickCheckResult.risk_level === 'high' ? '⚠️ 高风险' :
                   quickCheckResult.risk_level === 'medium' ? '⚡ 中风险' :
                   '✅ 低风险'}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{quickCheckResult.total_interactions}</div>
                  <div className="text-sm text-gray-500">总相互作用</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{quickCheckResult.high_risk_count}</div>
                  <div className="text-sm text-gray-500">严重风险</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{quickCheckResult.medium_risk_count}</div>
                  <div className="text-sm text-gray-500">中等风险</div>
                </div>
              </div>

              {quickCheckResult.top_interactions && quickCheckResult.top_interactions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">主要相互作用药品：</h4>
                  <div className="space-y-2">
                    {quickCheckResult.top_interactions.map((item, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(item.severity)}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getSeverityBadge(item.severity)}`}>
                            {getSeverityLabel(item.severity)}
                          </span>
                          <span className={`font-medium ${getSeverityTextColor(item.severity)}`}>
                            {item.other_drug}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'two' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-medium text-gray-700 mb-3">检查两种药品的相互作用</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">药品 A</label>
                <input
                  type="text"
                  value={drug1}
                  onChange={(e) => setDrug1(e.target.value)}
                  placeholder="如：阿莫西林"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">药品 B</label>
                <input
                  type="text"
                  value={drug2}
                  onChange={(e) => setDrug2(e.target.value)}
                  placeholder="如：甲硝唑"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <button
              onClick={handleTwoDrugsCheck}
              disabled={loading || !drug1.trim() || !drug2.trim()}
              className="w-full px-4 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? '检查中...' : '🔍 开始检查'}
            </button>
          </div>

          {result && (
            <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${
              result.safe ? 'border-green-300' : 'border-red-300'
            }`}>
              {result.safe ? (
                <>
                  <div className="text-center py-4">
                    <div className="text-5xl mb-3">✅</div>
                    <h3 className="text-xl font-bold text-green-700 mb-2">未发现相互作用</h3>
                    <p className="text-gray-600">
                      <strong>{result.drug1}</strong> 和 <strong>{result.drug2}</strong> 之间
                      未发现已知的严重相互作用
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      提示：请务必咨询医生或药剂师的专业建议
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-2">⚠️</div>
                    <h3 className="text-xl font-bold text-red-700">发现相互作用风险</h3>
                  </div>
                  
                  <div className={`p-4 rounded-lg border ${getSeverityColor(result.interaction.severity)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm px-3 py-1 rounded-full text-white ${getSeverityBadge(result.interaction.severity)}`}>
                        {getSeverityLabel(result.interaction.severity)} 风险
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {result.drug1} + {result.drug2}
                    </h4>
                    <p className="text-gray-700 mb-3">{result.interaction.description}</p>
                    <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">💡 建议：</span>
                      <span className="text-sm text-gray-600">{result.interaction.recommendation}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'batch' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">批量检查多种药品</h3>
              <button
                onClick={loadMyMedicines}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + 从我的药箱导入
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newDrug}
                onChange={(e) => setNewDrug(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDrugToBatch()}
                placeholder="输入药品名称，按回车添加"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={addDrugToBatch}
                disabled={!newDrug.trim()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                添加
              </button>
            </div>

            {selectedDrugs.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">已添加 {selectedDrugs.length} 种药品：</div>
                <div className="flex flex-wrap gap-2">
                  {selectedDrugs.map((drug, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {drug}
                      <button
                        onClick={() => removeDrugFromBatch(index)}
                        className="ml-1 hover:text-primary-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleBatchCheck}
              disabled={loading || selectedDrugs.length < 2}
              className="w-full px-4 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? '检查中...' : `🔍 检查 ${Math.max(0, selectedDrugs.length * (selectedDrugs.length - 1) / 2)} 种组合`}
            </button>
          </div>

          {result && (
            <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${
              result.safe ? 'border-green-300' : 'border-red-300'
            }`}>
              {result.safe ? (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">✅</div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">全部安全</h3>
                  <p className="text-gray-600">
                    检查了 {result.checked_pairs} 种组合，未发现已知相互作用
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-2">⚠️</div>
                    <h3 className="text-xl font-bold text-red-700">发现 {result.interaction_count} 个相互作用</h3>
                    <p className="text-sm text-gray-600">{result.summary}</p>
                  </div>
                  
                  <div className="space-y-3">
                    {result.interactions.map((interaction, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(interaction.severity)}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getSeverityBadge(interaction.severity)}`}>
                            {getSeverityLabel(interaction.severity)}
                          </span>
                          <span className={`font-semibold ${getSeverityTextColor(interaction.severity)}`}>
                            {interaction.drug1_name} + {interaction.drug2_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{interaction.description}</p>
                        <p className="text-xs text-gray-600 bg-white bg-opacity-50 p-2 rounded">
                          💡 {interaction.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-1">📌 温馨提示</h4>
        <p className="text-sm text-blue-700">
          本功能提供的相互作用信息仅供参考，不能替代专业医疗建议。
          如有疑问，请咨询医生或药剂师。
        </p>
      </div>
    </div>
  )
}

export default InteractionPage
