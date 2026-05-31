import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { medicineApi } from '../utils/api'

function MedicineCard({ medicine, onDeleted }) {
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const daysRemaining = medicine.days_remaining !== undefined 
    ? Math.floor(medicine.days_remaining) 
    : null

  const getStatusConfig = () => {
    if (daysRemaining === null) return { color: 'bg-gray-100', textColor: 'text-gray-600', label: '未知' }
    if (daysRemaining < 0) return { color: 'bg-red-100', textColor: 'text-red-600', label: `已过期 ${Math.abs(daysRemaining)} 天` }
    if (daysRemaining === 0) return { color: 'bg-red-100', textColor: 'text-red-600', label: '今天过期!' }
    if (daysRemaining <= 3) return { color: 'bg-orange-100', textColor: 'text-orange-600', label: `${daysRemaining} 天后过期` }
    if (daysRemaining <= 7) return { color: 'bg-yellow-100', textColor: 'text-yellow-600', label: `${daysRemaining} 天后过期` }
    if (daysRemaining <= 30) return { color: 'bg-blue-100', textColor: 'text-blue-600', label: `${daysRemaining} 天后过期` }
    return { color: 'bg-green-100', textColor: 'text-green-600', label: `${daysRemaining} 天后过期` }
  }

  const status = getStatusConfig()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await medicineApi.delete(medicine.id)
      if (onDeleted) onDeleted(medicine.id)
    } catch (error) {
      alert('删除失败: ' + error.message)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="card mb-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-800">{medicine.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            有效期: {medicine.expiry_date}
          </p>
          {medicine.notes && (
            <p className="text-sm text-gray-400 mt-1">{medicine.notes}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} ${status.textColor}`}>
            {status.label}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => navigate(`/edit/${medicine.id}`)}
              className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-gray-600 mb-4">确定要删除药品 "{medicine.name}" 吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 btn-danger"
              >
                {isDeleting ? '删除中...' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicineCard
