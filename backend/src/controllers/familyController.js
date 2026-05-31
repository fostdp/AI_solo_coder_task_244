const db = require('../models/database');

const DEFAULT_USER_ID = 1;

const getMyFamilies = (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || DEFAULT_USER_ID;
    const families = db.getFamilies(userId);
    
    const familiesWithDetails = families.map(family => {
      const members = db.getFamilyMembers(family.id);
      const medicines = db.getFamilyMedicines(family.id);
      return {
        ...family,
        member_count: members.length,
        medicine_count: medicines.length,
        members,
        medicines
      };
    });
    
    res.json(familiesWithDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFamilyById = (req, res) => {
  try {
    const family = db.getFamilyById(req.params.id);
    if (!family) {
      return res.status(404).json({ error: '家庭未找到' });
    }
    
    const members = db.getFamilyMembers(family.id);
    const medicines = db.getFamilyMedicines(family.id);
    
    res.json({
      ...family,
      members,
      medicines
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createFamily = (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = parseInt(req.body.user_id) || DEFAULT_USER_ID;
    
    if (!name) {
      return res.status(400).json({ error: '家庭名称不能为空' });
    }
    
    const family = db.createFamily({ name, description: description || '' }, userId);
    
    res.json({
      success: true,
      message: '家庭创建成功',
      family: {
        ...family,
        members: db.getFamilyMembers(family.id),
        medicines: []
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateFamily = (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = parseInt(req.body.user_id) || DEFAULT_USER_ID;
    const familyId = parseInt(req.params.id);
    
    const family = db.getFamilyById(familyId);
    if (!family) {
      return res.status(404).json({ error: '家庭未找到' });
    }
    
    const role = db.getFamilyRole(familyId, userId);
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({ error: '无权限修改家庭信息' });
    }
    
    const updated = db.updateFamily(familyId, {
      name: name || family.name,
      description: description !== undefined ? description : family.description
    });
    
    res.json({
      success: true,
      message: '家庭信息更新成功',
      family: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteFamily = (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || DEFAULT_USER_ID;
    const familyId = parseInt(req.params.id);
    
    const family = db.getFamilyById(familyId);
    if (!family) {
      return res.status(404).json({ error: '家庭未找到' });
    }
    
    const role = db.getFamilyRole(familyId, userId);
    if (role !== 'owner') {
      return res.status(403).json({ error: '只有家庭创建者可以删除家庭' });
    }
    
    const success = db.deleteFamily(familyId);
    if (!success) {
      return res.status(500).json({ error: '删除失败' });
    }
    
    res.json({ success: true, message: '家庭已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFamilyMembers = (req, res) => {
  try {
    const members = db.getFamilyMembers(req.params.id);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addFamilyMember = (req, res) => {
  try {
    const { user_id, role, user_name } = req.body;
    const userId = parseInt(req.body.current_user_id) || DEFAULT_USER_ID;
    const familyId = parseInt(req.params.id);
    
    const family = db.getFamilyById(familyId);
    if (!family) {
      return res.status(404).json({ error: '家庭未找到' });
    }
    
    const currentRole = db.getFamilyRole(familyId, userId);
    if (currentRole !== 'owner' && currentRole !== 'admin') {
      return res.status(403).json({ error: '无权限添加成员' });
    }
    
    let targetUserId = user_id;
    if (!targetUserId) {
      if (!user_name) {
        return res.status(400).json({ error: '需要用户ID或用户名' });
      }
      const newUser = db.addUser({ name: user_name, avatar: '👤' });
      targetUserId = newUser.id;
    }
    
    const existing = db.isFamilyMember(familyId, targetUserId);
    if (existing) {
      return res.status(400).json({ error: '该用户已是家庭成员' });
    }
    
    const member = db.addFamilyMember(familyId, targetUserId, role || 'member');
    const memberWithUser = {
      ...member,
      user_name: db.getUserById(targetUserId)?.name,
      user_avatar: db.getUserById(targetUserId)?.avatar
    };
    
    res.json({
      success: true,
      message: '成员添加成功',
      member: memberWithUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeFamilyMember = (req, res) => {
  try {
    const { user_id } = req.body;
    const currentUserId = parseInt(req.body.current_user_id) || DEFAULT_USER_ID;
    const familyId = parseInt(req.params.id);
    
    const family = db.getFamilyById(familyId);
    if (!family) {
      return res.status(404).json({ error: '家庭未找到' });
    }
    
    const targetUserId = parseInt(user_id);
    const currentRole = db.getFamilyRole(familyId, currentUserId);
    const targetRole = db.getFamilyRole(familyId, targetUserId);
    
    if (currentUserId !== targetUserId) {
      if (currentRole !== 'owner' && currentRole !== 'admin') {
        return res.status(403).json({ error: '无权限移除成员' });
      }
      if (targetRole === 'owner' && currentRole !== 'owner') {
        return res.status(403).json({ error: '不能移除家庭创建者' });
      }
    }
    
    const success = db.removeFamilyMember(familyId, targetUserId);
    if (!success) {
      return res.status(404).json({ error: '成员未找到' });
    }
    
    res.json({ success: true, message: '成员已移除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFamilyMedicines = (req, res) => {
  try {
    const medicines = db.getFamilyMedicines(req.params.id);
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addMedicineToFamily = (req, res) => {
  try {
    const { medicine_id, medicine_name, expiry_date, notes } = req.body;
    const userId = parseInt(req.body.user_id) || DEFAULT_USER_ID;
    const familyId = parseInt(req.params.id);
    
    const family = db.getFamilyById(familyId);
    if (!family) {
      return res.status(404).json({ error: '家庭未找到' });
    }
    
    if (!db.isFamilyMember(familyId, userId)) {
      return res.status(403).json({ error: '非家庭成员' });
    }
    
    let medId = medicine_id;
    if (!medId) {
      if (!medicine_name || !expiry_date) {
        return res.status(400).json({ error: '需要药品信息' });
      }
      const newMedicine = db.addMedicine({
        name: medicine_name,
        expiry_date,
        notes: notes || '',
        added_date: new Date().toISOString().split('T')[0],
        notification_sent: 0
      });
      medId = newMedicine.id;
    }
    
    const familyMedicine = db.addFamilyMedicine(familyId, medId, userId);
    
    res.json({
      success: true,
      message: '药品已添加到家庭药箱',
      family_medicine: familyMedicine
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeMedicineFromFamily = (req, res) => {
  try {
    const { medicine_id } = req.body;
    const userId = parseInt(req.body.user_id) || DEFAULT_USER_ID;
    const familyId = parseInt(req.params.id);
    
    const family = db.getFamilyById(familyId);
    if (!family) {
      return res.status(404).json({ error: '家庭未找到' });
    }
    
    if (!db.isFamilyMember(familyId, userId)) {
      return res.status(403).json({ error: '非家庭成员' });
    }
    
    const success = db.removeFamilyMedicine(familyId, parseInt(medicine_id));
    if (!success) {
      return res.status(404).json({ error: '药品未在家庭药箱中' });
    }
    
    res.json({ success: true, message: '药品已从家庭药箱移除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const searchUsers = (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || '';
    let users = db.getUsers();
    
    if (query) {
      users = users.filter(u => u.name.toLowerCase().includes(query));
    }
    
    res.json(users.slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMyFamilies,
  getFamilyById,
  createFamily,
  updateFamily,
  deleteFamily,
  getFamilyMembers,
  addFamilyMember,
  removeFamilyMember,
  getFamilyMedicines,
  addMedicineToFamily,
  removeMedicineFromFamily,
  searchUsers,
};
