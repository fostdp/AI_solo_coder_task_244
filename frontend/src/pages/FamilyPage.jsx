import { useState, useEffect } from 'react'
import { familyApi } from '../utils/api'

function FamilyPage() {
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedFamily, setSelectedFamily] = useState(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [newFamilyName, setNewFamilyName] = useState('')
  const [newFamilyDesc, setNewFamilyDesc] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')

  const loadFamilies = async () => {
    try {
      setLoading(true)
      const data = await familyApi.getMyFamilies()
      setFamilies(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFamilies()
  }, [])

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) return
    
    try {
      await familyApi.create({
        name: newFamilyName,
        description: newFamilyDesc,
        user_id: 1
      })
      setShowCreateModal(false)
      setNewFamilyName('')
      setNewFamilyDesc('')
      loadFamilies()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberName.trim() || !selectedFamily) return
    
    try {
      await familyApi.addMember(selectedFamily.id, {
        user_name: newMemberName,
        role: newMemberRole,
        current_user_id: 1
      })
      setShowMemberModal(false)
      setNewMemberName('')
      setNewMemberRole('member')
      loadFamilies()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!selectedFamily) return
    if (!confirm('确定要移除该成员吗？')) return
    
    try {
      await familyApi.removeMember(selectedFamily.id, {
        user_id: userId,
        current_user_id: 1
      })
      loadFamilies()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteFamily = async (familyId) => {
    if (!confirm('确定要删除这个家庭吗？所有成员和药品关联都将被移除。')) return
    
    try {
      await familyApi.delete(familyId)
      if (selectedFamily?.id === familyId) {
        setSelectedFamily(null)
      }
      loadFamilies()
    } catch (err) {
      alert(err.message)
    }
  }

  const getDaysRemaining = (expiryDate) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    const diffTime = expiry - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStatusColor = (days) => {
    if (days < 0) return 'bg-red-100 text-red-800'
    if (days <= 3) return 'bg-orange-100 text-orange-800'
    if (days <= 7) return 'bg-yellow-100 text-yellow-800'
    if (days <= 30) return 'bg-blue-100 text-blue-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (days) => {
    if (days < 0) return `已过期 ${Math.abs(days)} 天`
    if (days === 0) return '今天过期'
    if (days === 1) return '明天过期'
    return `剩余 ${days} 天`
  }

  const getRoleLabel = (role) => {
    const labels = {
      owner: '创建者',
      admin: '管理员',
      member: '成员'
    }
    return labels[role] || role
  }

  const getRoleBadgeClass = (role) => {
    if (role === 'owner') return 'bg-purple-100 text-purple-700'
    if (role === 'admin') return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">家庭药箱</h1>
          <p className="text-gray-500 text-sm">与家人共享药品信息</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          + 创建家庭
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {families.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">还没有家庭</h3>
          <p className="text-gray-500 mb-6">创建一个家庭，与家人共享药箱</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            创建第一个家庭
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {families.map((family) => (
            <div
              key={family.id}
              className={`bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all ${
                selectedFamily?.id === family.id
                  ? 'border-primary-500'
                  : 'border-transparent hover:border-primary-200'
              }`}
              onClick={() => setSelectedFamily(selectedFamily?.id === family.id ? null : family)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{family.name}</h3>
                    {family.description && (
                      <p className="text-gray-500 text-sm mt-1">{family.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>👥 {family.member_count} 成员</span>
                    <span>💊 {family.medicine_count} 药品</span>
                  </div>
                </div>

                {selectedFamily?.id === family.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-700">成员列表</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowMemberModal(true)
                          }}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          + 添加成员
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {family.members?.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg group"
                          >
                            <span className="text-lg">{member.user_avatar}</span>
                            <span className="text-sm text-gray-700">{member.user_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeClass(member.role)}`}>
                              {getRoleLabel(member.role)}
                            </span>
                            {member.role !== 'owner' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveMember(member.user_id)
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {family.medicines && family.medicines.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-3">共享药品</h4>
                        <div className="space-y-2">
                          {family.medicines
                            .filter(fm => fm.medicine)
                            .map((fm) => {
                              const days = getDaysRemaining(fm.medicine.expiry_date)
                              return (
                                <div key={fm.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                                  <div>
                                    <span className="text-gray-800">{fm.medicine.name}</span>
                                    {fm.added_by_user && (
                                      <span className="text-xs text-gray-500 ml-2">
                                        由 {fm.added_by_user.name} 添加
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(days)}`}>
                                    {getStatusText(days)}
                                  </span>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFamily(family.id)
                      }}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      删除家庭
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">创建家庭</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">家庭名称</label>
                <input
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="如：我家药箱"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述（可选）</label>
                <textarea
                  value={newFamilyDesc}
                  onChange={(e) => setNewFamilyDesc(e.target.value)}
                  placeholder="描述一下这个家庭..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateFamily}
                disabled={!newFamilyName.trim()}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showMemberModal && selectedFamily && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">添加成员到 {selectedFamily.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">成员昵称</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="输入成员名称"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="member">成员（只能查看和添加药品）</option>
                  <option value="admin">管理员（可以管理成员）</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMemberModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAddMember}
                disabled={!newMemberName.trim()}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FamilyPage
