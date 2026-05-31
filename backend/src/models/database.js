const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'db.json');

const defaultData = {
  users: [
    { id: 1, name: '当前用户', avatar: '👤', created_date: new Date().toISOString().split('T')[0] }
  ],
  families: [],
  family_members: [],
  medicines: [],
  family_medicines: [],
  notifications: [],
  drug_interactions: [],
  pharmacies: [],
  pharmacy_inventory: [],
  inventory_alerts: [],
  settings: {
    reminder_days: '7',
    cron_enabled: 'true',
    default_user_id: 1
  },
  nextId: {
    users: 2,
    families: 1,
    family_members: 1,
    medicines: 1,
    family_medicines: 1,
    notifications: 1,
    drug_interactions: 1,
    pharmacies: 1,
    pharmacy_inventory: 1,
    inventory_alerts: 1
  }
};

const seedDrugInteractions = [
  {
    drug1_name: '阿莫西林',
    drug2_name: '甲氨蝶呤',
    severity: 'high',
    description: '阿莫西林可能增加甲氨蝶呤的毒性，应避免同时使用',
    recommendation: '请咨询医生，考虑替代药物'
  },
  {
    drug1_name: '阿莫西林',
    drug2_name: '双歧杆菌',
    severity: 'medium',
    description: '阿莫西林可能降低双歧杆菌的疗效',
    recommendation: '建议间隔2小时以上服用'
  },
  {
    drug1_name: '布洛芬',
    drug2_name: '阿司匹林',
    severity: 'high',
    description: '同时使用可能增加胃肠道出血风险',
    recommendation: '避免同时使用，如需联用请咨询医生'
  },
  {
    drug1_name: '布洛芬',
    drug2_name: '华法林',
    severity: 'high',
    description: '布洛芬可能增强华法林的抗凝作用，增加出血风险',
    recommendation: '避免使用，或在医生监护下使用并监测INR'
  },
  {
    drug1_name: '布洛芬',
    drug2_name: '利尿剂',
    severity: 'medium',
    description: '布洛芬可能降低利尿剂的降压效果',
    recommendation: '监测血压，必要时调整治疗方案'
  },
  {
    drug1_name: '头孢克肟',
    drug2_name: '乙醇',
    severity: 'medium',
    description: '部分头孢类药物与酒精可能发生双硫仑样反应',
    recommendation: '用药期间及停药后1周内避免饮酒'
  },
  {
    drug1_name: '甲硝唑',
    drug2_name: '酒精',
    severity: 'high',
    description: '甲硝唑与酒精会发生严重的双硫仑样反应',
    recommendation: '严格禁止饮酒，包括含酒精的饮料和药物'
  },
  {
    drug1_name: '奥美拉唑',
    drug2_name: '氯吡格雷',
    severity: 'medium',
    description: '奥美拉唑可能降低氯吡格雷的抗血小板活性',
    recommendation: '考虑使用泮托拉唑或兰索拉唑替代'
  },
  {
    drug1_name: '辛伐他汀',
    drug2_name: '红霉素',
    severity: 'high',
    description: '红霉素可能增加辛伐他汀的血药浓度，增加横纹肌溶解风险',
    recommendation: '避免同时使用，或换用不相互作用的他汀类药物'
  },
  {
    drug1_name: '辛伐他汀',
    drug2_name: '伊曲康唑',
    severity: 'high',
    description: '伊曲康唑显著增加辛伐他汀的血药浓度',
    recommendation: '禁止同时使用，如需抗真菌治疗请换用其他药物'
  },
  {
    drug1_name: '硝苯地平',
    drug2_name: '西咪替丁',
    severity: 'medium',
    description: '西咪替丁可能增加硝苯地平的血药浓度',
    recommendation: '监测血压，必要时调整硝苯地平剂量'
  },
  {
    drug1_name: '地高辛',
    drug2_name: '胺碘酮',
    severity: 'high',
    description: '胺碘酮可增加地高辛血药浓度约70%',
    recommendation: '地高辛剂量应减半，密切监测血药浓度'
  },
  {
    drug1_name: '地高辛',
    drug2_name: '维拉帕米',
    severity: 'medium',
    description: '维拉帕米可增加地高辛血药浓度',
    recommendation: '监测地高辛血药浓度，必要时调整剂量'
  },
  {
    drug1_name: '华法林',
    drug2_name: '左氧氟沙星',
    severity: 'medium',
    description: '左氧氟沙星可能增强华法林的抗凝作用',
    recommendation: '密切监测INR，必要时调整华法林剂量'
  },
  {
    drug1_name: '华法林',
    drug2_name: '布洛芬',
    severity: 'high',
    description: '布洛芬影响血小板功能且可能损伤胃黏膜，增加出血风险',
    recommendation: '避免使用，如需镇痛可考虑对乙酰氨基酚'
  },
  {
    drug1_name: '环孢素',
    drug2_name: '酮康唑',
    severity: 'high',
    description: '酮康唑显著增加环孢素的血药浓度',
    recommendation: '避免同时使用，或换用其他抗真菌药物'
  },
  {
    drug1_name: '西地那非',
    drug2_name: '硝酸甘油',
    severity: 'high',
    description: '联合使用可能导致严重的低血压',
    recommendation: '绝对禁止同时使用'
  },
  {
    drug1_name: '对乙酰氨基酚',
    drug2_name: '酒精',
    severity: 'high',
    description: '过量对乙酰氨基酚与酒精联用增加肝损伤风险',
    recommendation: '用药期间避免饮酒，不要超剂量使用'
  },
  {
    drug1_name: '锂盐',
    drug2_name: '利尿剂',
    severity: 'high',
    description: '利尿剂可能减少锂的排泄，导致锂中毒',
    recommendation: '密切监测血锂浓度，必要时调整剂量'
  },
  {
    drug1_name: '苯妥英钠',
    drug2_name: '西咪替丁',
    severity: 'medium',
    description: '西咪替丁可能增加苯妥英钠的血药浓度',
    recommendation: '监测苯妥英钠血药浓度'
  }
];

const seedPharmacies = [
  {
    name: '和平大药房',
    address: '北京市朝阳区和平路88号',
    phone: '010-88888888',
    latitude: 39.9042,
    longitude: 116.4074,
    opening_hours: '08:00-22:00',
    is_24h: false,
    is_online: true
  },
  {
    name: '健康医药超市',
    address: '北京市海淀区中关村大街100号',
    phone: '010-66666666',
    latitude: 39.9842,
    longitude: 116.3074,
    opening_hours: '07:00-23:00',
    is_24h: false,
    is_online: true
  },
  {
    name: '康泰药店',
    address: '北京市西城区宣武门内大街50号',
    phone: '010-55555555',
    latitude: 39.9142,
    longitude: 116.3774,
    opening_hours: '24小时',
    is_24h: true,
    is_online: false
  },
  {
    name: '益民堂',
    address: '北京市东城区东直门内大街200号',
    phone: '010-77777777',
    latitude: 39.9342,
    longitude: 116.4374,
    opening_hours: '09:00-21:00',
    is_24h: false,
    is_online: true
  },
  {
    name: '同仁堂药店',
    address: '北京市朝阳区建国路99号',
    phone: '010-99999999',
    latitude: 39.9092,
    longitude: 116.4474,
    opening_hours: '08:30-20:30',
    is_24h: false,
    is_online: true
  }
];

const ensureDataDir = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const initSeedData = (data) => {
  let needsSave = false;
  
  if (!data.drug_interactions || data.drug_interactions.length === 0) {
    data.drug_interactions = seedDrugInteractions.map((item, index) => ({
      ...item,
      id: index + 1
    }));
    data.nextId.drug_interactions = seedDrugInteractions.length + 1;
    needsSave = true;
  }
  
  if (!data.pharmacies || data.pharmacies.length === 0) {
    data.pharmacies = seedPharmacies.map((item, index) => ({
      ...item,
      id: index + 1,
      created_date: new Date().toISOString().split('T')[0]
    }));
    data.nextId.pharmacies = seedPharmacies.length + 1;
    
    data.pharmacy_inventory = [];
    let invId = 1;
    seedPharmacies.forEach((pharmacy, pIndex) => {
      const pharmacyId = pIndex + 1;
      const stockMedicines = [
        { name: '阿莫西林', quantity: 100, price: 15.5 },
        { name: '布洛芬', quantity: 50, price: 28.0 },
        { name: '头孢克肟', quantity: 80, price: 45.0 },
        { name: '奥美拉唑', quantity: 60, price: 35.0 },
        { name: '辛伐他汀', quantity: 40, price: 55.0 },
        { name: '硝苯地平', quantity: 70, price: 22.0 },
        { name: '华法林', quantity: 30, price: 18.0 },
        { name: '对乙酰氨基酚', quantity: 120, price: 8.5 },
        { name: '甲硝唑', quantity: 45, price: 12.0 },
        { name: '左氧氟沙星', quantity: 55, price: 38.0 }
      ];
      
      stockMedicines.forEach(med => {
        const randomFactor = 0.7 + Math.random() * 0.6;
        data.pharmacy_inventory.push({
          id: invId++,
          pharmacy_id: pharmacyId,
          medicine_name: med.name,
          stock: Math.floor(med.quantity * randomFactor),
          price: med.price,
          last_updated: new Date().toISOString().split('T')[0]
        });
      });
    });
    data.nextId.pharmacy_inventory = invId;
    needsSave = true;
  }
  
  if (!data.inventory_alerts) {
    data.inventory_alerts = [];
  }
  
  if (!data.families) {
    data.families = [];
  }
  
  if (!data.family_members) {
    data.family_members = [];
  }
  
  if (!data.family_medicines) {
    data.family_medicines = [];
  }
  
  if (!data.users) {
    data.users = defaultData.users;
  }
  
  return needsSave;
};

const loadDatabase = () => {
  ensureDataDir();
  if (!fs.existsSync(dbPath)) {
    const data = JSON.parse(JSON.stringify(defaultData));
    initSeedData(data);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    console.log('数据库文件已创建并初始化');
    return data;
  }
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const needsSave = initSeedData(data);
    if (needsSave) {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return data;
  } catch (err) {
    console.error('读取数据库失败，使用默认数据:', err.message);
    const data = JSON.parse(JSON.stringify(defaultData));
    initSeedData(data);
    return data;
  }
};

const saveDatabase = (data) => {
  ensureDataDir();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

let db = loadDatabase();

const getMedicines = () => [...db.medicines];

const getMedicineById = (id) => db.medicines.find(m => m.id === parseInt(id));

const addMedicine = (medicine) => {
  const id = db.nextId.medicines++;
  const newMedicine = { ...medicine, id };
  db.medicines.push(newMedicine);
  saveDatabase(db);
  return newMedicine;
};

const updateMedicine = (id, medicine) => {
  const index = db.medicines.findIndex(m => m.id === parseInt(id));
  if (index === -1) return null;
  db.medicines[index] = { ...db.medicines[index], ...medicine, id: parseInt(id) };
  saveDatabase(db);
  return db.medicines[index];
};

const deleteMedicine = (id) => {
  const medicineId = parseInt(id);
  const index = db.medicines.findIndex(m => m.id === medicineId);
  if (index === -1) return false;
  db.medicines.splice(index, 1);
  const beforeCount = db.notifications.length;
  db.notifications = db.notifications.filter(n => n.medicine_id !== medicineId);
  db.family_medicines = db.family_medicines.filter(fm => fm.medicine_id !== medicineId);
  const deletedNotificationCount = beforeCount - db.notifications.length;
  saveDatabase(db);
  console.log(`删除药品 ID: ${medicineId}，同时删除 ${deletedNotificationCount} 条关联通知`);
  return true;
};

const getNotifications = () => [...db.notifications];

const getUnreadNotifications = () => db.notifications.filter(n => n.is_read === 0);

const addNotification = (notification) => {
  const id = db.nextId.notifications++;
  const newNotification = { ...notification, id };
  db.notifications.push(newNotification);
  saveDatabase(db);
  return newNotification;
};

const markNotificationAsRead = (id) => {
  const notification = db.notifications.find(n => n.id === parseInt(id));
  if (!notification) return false;
  notification.is_read = 1;
  saveDatabase(db);
  return true;
};

const markAllNotificationsAsRead = () => {
  const count = db.notifications.filter(n => n.is_read === 0).length;
  db.notifications.forEach(n => n.is_read = 1);
  saveDatabase(db);
  return count;
};

const getSettings = () => ({ ...db.settings });

const updateSetting = (key, value) => {
  db.settings[key] = value;
  saveDatabase(db);
  return true;
};

const getNotificationById = (id) => db.notifications.find(n => n.id === parseInt(id));

const getFamilies = (userId) => {
  if (userId) {
    const memberFamilyIds = db.family_members
      .filter(fm => fm.user_id === parseInt(userId))
      .map(fm => fm.family_id);
    return db.families.filter(f => memberFamilyIds.includes(f.id));
  }
  return [...db.families];
};

const getFamilyById = (id) => db.families.find(f => f.id === parseInt(id));

const createFamily = (family, ownerId) => {
  const id = db.nextId.families++;
  const newFamily = {
    ...family,
    id,
    owner_id: parseInt(ownerId),
    created_date: new Date().toISOString().split('T')[0]
  };
  db.families.push(newFamily);
  
  const memberId = db.nextId.family_members++;
  db.family_members.push({
    id: memberId,
    family_id: id,
    user_id: parseInt(ownerId),
    role: 'owner',
    joined_date: new Date().toISOString().split('T')[0]
  });
  
  saveDatabase(db);
  return newFamily;
};

const updateFamily = (id, family) => {
  const index = db.families.findIndex(f => f.id === parseInt(id));
  if (index === -1) return null;
  db.families[index] = { ...db.families[index], ...family, id: parseInt(id) };
  saveDatabase(db);
  return db.families[index];
};

const deleteFamily = (id) => {
  const familyId = parseInt(id);
  const index = db.families.findIndex(f => f.id === familyId);
  if (index === -1) return false;
  
  db.families.splice(index, 1);
  db.family_members = db.family_members.filter(fm => fm.family_id !== familyId);
  db.family_medicines = db.family_medicines.filter(fm => fm.family_id !== familyId);
  
  saveDatabase(db);
  return true;
};

const getFamilyMembers = (familyId) => {
  const members = db.family_members.filter(fm => fm.family_id === parseInt(familyId));
  return members.map(m => {
    const user = db.users.find(u => u.id === m.user_id);
    return {
      ...m,
      user_name: user?.name || '未知用户',
      user_avatar: user?.avatar || '👤'
    };
  });
};

const addFamilyMember = (familyId, userId, role = 'member') => {
  const existing = db.family_members.find(
    fm => fm.family_id === parseInt(familyId) && fm.user_id === parseInt(userId)
  );
  if (existing) return existing;
  
  const id = db.nextId.family_members++;
  const newMember = {
    id,
    family_id: parseInt(familyId),
    user_id: parseInt(userId),
    role,
    joined_date: new Date().toISOString().split('T')[0]
  };
  db.family_members.push(newMember);
  saveDatabase(db);
  return newMember;
};

const removeFamilyMember = (familyId, userId) => {
  const index = db.family_members.findIndex(
    fm => fm.family_id === parseInt(familyId) && fm.user_id === parseInt(userId)
  );
  if (index === -1) return false;
  db.family_members.splice(index, 1);
  saveDatabase(db);
  return true;
};

const getFamilyMedicines = (familyId) => {
  const familyMeds = db.family_medicines.filter(fm => fm.family_id === parseInt(familyId));
  return familyMeds.map(fm => {
    const medicine = db.medicines.find(m => m.id === fm.medicine_id);
    return {
      ...fm,
      medicine,
      added_by_user: db.users.find(u => u.id === fm.added_by)
    };
  });
};

const addFamilyMedicine = (familyId, medicineId, addedBy) => {
  const existing = db.family_medicines.find(
    fm => fm.family_id === parseInt(familyId) && fm.medicine_id === parseInt(medicineId)
  );
  if (existing) return existing;
  
  const id = db.nextId.family_medicines++;
  const newFamilyMed = {
    id,
    family_id: parseInt(familyId),
    medicine_id: parseInt(medicineId),
    added_by: parseInt(addedBy),
    added_date: new Date().toISOString().split('T')[0]
  };
  db.family_medicines.push(newFamilyMed);
  saveDatabase(db);
  return newFamilyMed;
};

const removeFamilyMedicine = (familyId, medicineId) => {
  const index = db.family_medicines.findIndex(
    fm => fm.family_id === parseInt(familyId) && fm.medicine_id === parseInt(medicineId)
  );
  if (index === -1) return false;
  db.family_medicines.splice(index, 1);
  saveDatabase(db);
  return true;
};

const getUsers = () => [...db.users];

const getUserById = (id) => db.users.find(u => u.id === parseInt(id));

const addUser = (user) => {
  const id = db.nextId.users++;
  const newUser = {
    ...user,
    id,
    created_date: new Date().toISOString().split('T')[0]
  };
  db.users.push(newUser);
  saveDatabase(db);
  return newUser;
};

const searchDrugInteractions = (drugName) => {
  const name = drugName.toLowerCase();
  return db.drug_interactions.filter(
    di => di.drug1_name.toLowerCase().includes(name) || di.drug2_name.toLowerCase().includes(name)
  );
};

const checkInteraction = (drug1, drug2) => {
  const d1 = drug1.toLowerCase();
  const d2 = drug2.toLowerCase();
  return db.drug_interactions.find(
    di => (di.drug1_name.toLowerCase() === d1 && di.drug2_name.toLowerCase() === d2) ||
          (di.drug1_name.toLowerCase() === d2 && di.drug2_name.toLowerCase() === d1)
  );
};

const batchCheckInteractions = (drugNames) => {
  const interactions = [];
  for (let i = 0; i < drugNames.length; i++) {
    for (let j = i + 1; j < drugNames.length; j++) {
      const interaction = checkInteraction(drugNames[i], drugNames[j]);
      if (interaction) {
        interactions.push(interaction);
      }
    }
  }
  return interactions;
};

const getAllDrugInteractions = () => [...db.drug_interactions];

const getPharmacies = (latitude, longitude, radius = 5) => {
  let pharmacies = [...db.pharmacies];
  
  if (latitude && longitude) {
    pharmacies = pharmacies.map(p => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        p.latitude,
        p.longitude
      );
      return { ...p, distance };
    }).filter(p => p.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }
  
  return pharmacies;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getPharmacyById = (id) => db.pharmacies.find(p => p.id === parseInt(id));

const getPharmacyInventory = (pharmacyId) => {
  return db.pharmacy_inventory.filter(pi => pi.pharmacy_id === parseInt(pharmacyId));
};

const searchPharmacyMedicine = (medicineName) => {
  const name = medicineName.toLowerCase();
  const results = [];
  
  db.pharmacy_inventory.forEach(inv => {
    if (inv.medicine_name.toLowerCase().includes(name)) {
      const pharmacy = db.pharmacies.find(p => p.id === inv.pharmacy_id);
      results.push({
        ...inv,
        pharmacy: pharmacy
      });
    }
  });
  
  return results.sort((a, b) => a.price - b.price);
};

const checkMedicineAvailability = (medicineName) => {
  const inventory = searchPharmacyMedicine(medicineName);
  const available = inventory.filter(i => i.stock > 0);
  const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= 10);
  const outOfStock = inventory.filter(i => i.stock === 0);
  
  return {
    medicine_name: medicineName,
    total_pharmacies: inventory.length,
    available_pharmacies: available.length,
    low_stock_pharmacies: lowStock.length,
    out_of_stock_pharmacies: outOfStock.length,
    lowest_price: available.length > 0 ? Math.min(...available.map(i => i.price)) : null,
    locations: available.slice(0, 5).map(i => ({
      pharmacy_name: i.pharmacy?.name,
      address: i.pharmacy?.address,
      stock: i.stock,
      price: i.price
    }))
  };
};

const createInventoryAlert = (alert) => {
  const id = db.nextId.inventory_alerts++;
  const newAlert = {
    ...alert,
    id,
    created_date: new Date().toISOString().split('T')[0],
    is_active: 1
  };
  db.inventory_alerts.push(newAlert);
  saveDatabase(db);
  return newAlert;
};

const getInventoryAlerts = (userId) => {
  let alerts = [...db.inventory_alerts];
  if (userId) {
    alerts = alerts.filter(a => a.user_id === parseInt(userId));
  }
  return alerts;
};

const deactivateInventoryAlert = (id) => {
  const alert = db.inventory_alerts.find(a => a.id === parseInt(id));
  if (!alert) return false;
  alert.is_active = 0;
  saveDatabase(db);
  return true;
};

const isFamilyMember = (familyId, userId) => {
  return db.family_members.some(
    fm => fm.family_id === parseInt(familyId) && fm.user_id === parseInt(userId)
  );
};

const getFamilyRole = (familyId, userId) => {
  const member = db.family_members.find(
    fm => fm.family_id === parseInt(familyId) && fm.user_id === parseInt(userId)
  );
  return member?.role || null;
};

module.exports = {
  getMedicines,
  getMedicineById,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getNotifications,
  getUnreadNotifications,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getSettings,
  updateSetting,
  getNotificationById,
  getFamilies,
  getFamilyById,
  createFamily,
  updateFamily,
  deleteFamily,
  getFamilyMembers,
  addFamilyMember,
  removeFamilyMember,
  getFamilyMedicines,
  addFamilyMedicine,
  removeFamilyMedicine,
  getUsers,
  getUserById,
  addUser,
  searchDrugInteractions,
  checkInteraction,
  batchCheckInteractions,
  getAllDrugInteractions,
  getPharmacies,
  getPharmacyById,
  getPharmacyInventory,
  searchPharmacyMedicine,
  checkMedicineAvailability,
  createInventoryAlert,
  getInventoryAlerts,
  deactivateInventoryAlert,
  isFamilyMember,
  getFamilyRole,
};
