import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { medicineApi } from '../utils/api'

function AddMedicinePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = !!id
  
  const [formData, setFormData] = useState({
    name: '',
    expiry_date: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isEdit) {
      loadMedicine()
    } else if (location.state) {
      setFormData(prev => ({
        ...prev,
        name: location.state.name || '',
        expiry_date: location.state.expiry_date || '',
      }))
    }
  }, [id, location.state, isEdit])

  const loadMedicine = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await medicineApi.getById(id)
      setFormData({
        name: data.name || '',
        expiry_date: data.expiry_date || '',
        notes: data.notes || '',
      })
    } catch (err) {
      setError('加载药品信息失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('请输入药品名称')
      return
    }
    if (!formData.expiry_date) {
      setError('请选择有效期')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isEdit) {
        await medicineApi.update(id, formData)
      } else {
        await medicineApi.create(formData)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="bg-primary-500 text-white px-4 py-4">
        <h1 className="text-xl font-bold">
          {isEdit ? '编辑药品' : '添加药品'}
        </h1>
        <p className="text-primary-100 text-sm mt-1">
          {isEdit ? '修改药品信息' : '填写药品信息'}
        </p>
      </header>

      <main className="p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              药品名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="例如：阿莫西林、布洛芬"
              className="input-field"
              required
            />
          </div>

          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              有效期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
              className="input-field"
              required
            />
            {formData.expiry_date && (
              <p className="text-sm text-gray-500 mt-2">
                已选择: {new Date(formData.expiry_date).toLocaleDateString('zh-CN')}
              </p>
            )}
          </div>

          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注 (可选)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="例如：感冒药、头痛时服用、每日3次等"
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 btn-secondary py-3"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-primary py-3"
            >
              {saving ? (isEdit ? '保存中...' : '添加中...') : (isEdit ? '保存' : '添加')}
            </button>
          </div>
        </form>

        <div className="mt-6 card">
          <h4 className="font-medium mb-2">📝 填写提示</h4>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• 药品名称建议填写完整名称</li>
            <li>• 有效期通常在药盒底部或侧面</li>
            <li>• 可以在备注中记录用法用量</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default AddMedicinePage
