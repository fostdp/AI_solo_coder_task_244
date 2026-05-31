const fs = require('fs');
const path = require('path');

jest.mock('../src/models/database', () => {
  const fs = require('fs');
  const path = require('path');
  
  const TEST_DATA_DIR = path.join(__dirname, '../test-data');
  const TEST_DB_PATH = path.join(TEST_DATA_DIR, 'db.json');
  
  const defaultData = {
    medicines: [],
    notifications: [],
    settings: { reminder_days: '7', cron_enabled: 'true' },
    nextId: { medicines: 1, notifications: 1 }
  };

  let db = JSON.parse(JSON.stringify(defaultData));

  const ensureDir = () => {
    if (!fs.existsSync(TEST_DATA_DIR)) {
      fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
  };

  const saveDb = () => {
    ensureDir();
    fs.writeFileSync(TEST_DB_PATH, JSON.stringify(db, null, 2));
  };

  const loadDb = () => {
    ensureDir();
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        db = JSON.parse(fs.readFileSync(TEST_DB_PATH, 'utf-8'));
      } catch (e) {
        db = JSON.parse(JSON.stringify(defaultData));
      }
    }
    return db;
  };

  loadDb();

  return {
    getMedicines: () => [...db.medicines],
    getMedicineById: (id) => db.medicines.find(m => m.id === parseInt(id)),
    addMedicine: (medicine) => {
      const id = db.nextId.medicines++;
      const newMedicine = { ...medicine, id };
      db.medicines.push(newMedicine);
      saveDb();
      return newMedicine;
    },
    updateMedicine: (id, medicine) => {
      const index = db.medicines.findIndex(m => m.id === parseInt(id));
      if (index === -1) return null;
      db.medicines[index] = { ...db.medicines[index], ...medicine, id: parseInt(id) };
      saveDb();
      return db.medicines[index];
    },
    deleteMedicine: (id) => {
      const medicineId = parseInt(id);
      const index = db.medicines.findIndex(m => m.id === medicineId);
      if (index === -1) return false;
      db.medicines.splice(index, 1);
      const beforeCount = db.notifications.length;
      db.notifications = db.notifications.filter(n => n.medicine_id !== medicineId);
      saveDb();
      return true;
    },
    getNotifications: () => [...db.notifications],
    getUnreadNotifications: () => db.notifications.filter(n => n.is_read === 0),
    addNotification: (notification) => {
      const id = db.nextId.notifications++;
      const newNotification = { ...notification, id };
      db.notifications.push(newNotification);
      saveDb();
      return newNotification;
    },
    markNotificationAsRead: (id) => {
      const notification = db.notifications.find(n => n.id === parseInt(id));
      if (!notification) return false;
      notification.is_read = 1;
      saveDb();
      return true;
    },
    markAllNotificationsAsRead: () => {
      const count = db.notifications.filter(n => n.is_read === 0).length;
      db.notifications.forEach(n => n.is_read = 1);
      saveDb();
      return count;
    },
    getSettings: () => ({ ...db.settings }),
    updateSetting: (key, value) => {
      db.settings[key] = value;
      saveDb();
      return true;
    },
    getNotificationById: (id) => db.notifications.find(n => n.id === parseInt(id)),
    _reset: () => {
      db = JSON.parse(JSON.stringify(defaultData));
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
      }
    }
  };
});

describe('级联删除测试', () => {
  let medicineController;
  let notificationController;
  
  beforeEach(() => {
    jest.resetModules();
    medicineController = require('../src/controllers/medicineController');
    notificationController = require('../src/controllers/notificationController');
  });

  const getToday = () => new Date().toISOString().split('T')[0];
  
  const addDays = (dateStr, days) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const createMockRequest = () => ({
    query: {},
    params: {},
    body: {}
  });

  const createMockResponse = () => {
    let statusCode = 200;
    let responseData = null;
    return {
      status: (code) => {
        statusCode = code;
        return { json: (data) => { responseData = data; } };
      },
      json: (data) => { responseData = data; },
      getStatusCode: () => statusCode,
      getResponseData: () => responseData
    };
  };

  describe('药品删除基础测试', () => {
    it('删除存在的药品应该返回 true', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      const medicine = db.addMedicine({
        name: '测试药品',
        expiry_date: addDays(today, 30),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      expect(medicine.id).toBeDefined();
      
      const result = db.deleteMedicine(medicine.id);
      expect(result).toBe(true);
      
      const deleted = db.getMedicineById(medicine.id);
      expect(deleted).toBeUndefined();
    });

    it('删除不存在的药品应该返回 false', () => {
      const db = require('../src/models/database');
      
      const result = db.deleteMedicine(999);
      expect(result).toBe(false);
    });

    it('删除药品后药品列表应该减少一个', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      db.addMedicine({
        name: '药品1',
        expiry_date: addDays(today, 30),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      const toDelete = db.addMedicine({
        name: '药品2',
        expiry_date: addDays(today, 60),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addMedicine({
        name: '药品3',
        expiry_date: addDays(today, 90),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      expect(db.getMedicines().length).toBe(3);
      
      db.deleteMedicine(toDelete.id);
      
      expect(db.getMedicines().length).toBe(2);
      
      const names = db.getMedicines().map(m => m.name);
      expect(names).toContain('药品1');
      expect(names).not.toContain('药品2');
      expect(names).toContain('药品3');
    });
  });

  describe('关联通知级联删除测试', () => {
    it('删除药品时应该同步删除该药品的所有通知', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      const medicine1 = db.addMedicine({
        name: '即将删除的药品',
        expiry_date: addDays(today, 7),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      const medicine2 = db.addMedicine({
        name: '保留的药品',
        expiry_date: addDays(today, 30),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({
        medicine_id: medicine1.id,
        message: '通知1-即将删除',
        created_date: today,
        is_read: 0
      });
      
      db.addNotification({
        medicine_id: medicine1.id,
        message: '通知2-即将删除',
        created_date: today,
        is_read: 1
      });
      
      db.addNotification({
        medicine_id: medicine2.id,
        message: '通知3-应该保留',
        created_date: today,
        is_read: 0
      });
      
      expect(db.getNotifications().length).toBe(3);
      
      db.deleteMedicine(medicine1.id);
      
      expect(db.getNotifications().length).toBe(1);
      
      const remainingNotification = db.getNotifications()[0];
      expect(remainingNotification.medicine_id).toBe(medicine2.id);
      expect(remainingNotification.message).toBe('通知3-应该保留');
    });

    it('删除没有通知的药品不应该影响其他通知', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      const medicine1 = db.addMedicine({
        name: '无通知的药品',
        expiry_date: addDays(today, 7),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      const medicine2 = db.addMedicine({
        name: '有通知的药品',
        expiry_date: addDays(today, 30),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({
        medicine_id: medicine2.id,
        message: '重要通知',
        created_date: today,
        is_read: 0
      });
      
      expect(db.getNotifications().length).toBe(1);
      
      db.deleteMedicine(medicine1.id);
      
      expect(db.getNotifications().length).toBe(1);
      expect(db.getNotifications()[0].medicine_id).toBe(medicine2.id);
    });

    it('应该正确删除多个药品及其通知', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      const medicine1 = db.addMedicine({
        name: '药品1',
        expiry_date: addDays(today, 7),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      const medicine2 = db.addMedicine({
        name: '药品2',
        expiry_date: addDays(today, 14),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      const medicine3 = db.addMedicine({
        name: '药品3',
        expiry_date: addDays(today, 21),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({ medicine_id: medicine1.id, message: '药品1通知', created_date: today, is_read: 0 });
      db.addNotification({ medicine_id: medicine2.id, message: '药品2通知', created_date: today, is_read: 0 });
      db.addNotification({ medicine_id: medicine3.id, message: '药品3通知', created_date: today, is_read: 0 });
      
      expect(db.getMedicines().length).toBe(3);
      expect(db.getNotifications().length).toBe(3);
      
      db.deleteMedicine(medicine1.id);
      db.deleteMedicine(medicine2.id);
      
      expect(db.getMedicines().length).toBe(1);
      expect(db.getMedicines()[0].name).toBe('药品3');
      
      expect(db.getNotifications().length).toBe(1);
      expect(db.getNotifications()[0].medicine_id).toBe(medicine3.id);
    });

    it('删除药品后通过API获取的通知列表应该更新', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      const medicine1 = db.addMedicine({
        name: '即将删除',
        expiry_date: addDays(today, 7),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      const medicine2 = db.addMedicine({
        name: '保留',
        expiry_date: addDays(today, 30),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({
        medicine_id: medicine1.id,
        message: '删除药品的通知',
        created_date: today,
        is_read: 0
      });
      
      db.addNotification({
        medicine_id: medicine2.id,
        message: '保留药品的通知',
        created_date: today,
        is_read: 0
      });
      
      const req1 = createMockRequest();
      const res1 = createMockResponse();
      notificationController.getAllNotifications(req1, res1);
      expect(res1.getResponseData().length).toBe(2);
      
      db.deleteMedicine(medicine1.id);
      
      const req2 = createMockRequest();
      const res2 = createMockResponse();
      notificationController.getAllNotifications(req2, res2);
      const result = res2.getResponseData();
      
      expect(result.length).toBe(1);
      expect(result[0].medicine_name).toBe('保留');
    });
  });

  describe('通过API删除药品测试', () => {
    it('通过控制器删除药品应该触发级联删除', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      const medicine = db.addMedicine({
        name: '待删除药品',
        expiry_date: addDays(today, 7),
        notes: '测试备注',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({
        medicine_id: medicine.id,
        message: '关联通知',
        created_date: today,
        is_read: 0
      });
      
      expect(db.getMedicines().length).toBe(1);
      expect(db.getNotifications().length).toBe(1);
      
      const req = {
        params: { id: medicine.id.toString() },
        query: {},
        body: {}
      };
      const res = createMockResponse();
      
      medicineController.deleteMedicine(req, res);
      
      expect(res.getResponseData().message).toBe('药品删除成功');
      
      expect(db.getMedicines().length).toBe(0);
      expect(db.getNotifications().length).toBe(0);
    });

    it('删除不存在的药品应该返回404', () => {
      const req = {
        params: { id: '999' },
        query: {},
        body: {}
      };
      const res = createMockResponse();
      
      medicineController.deleteMedicine(req, res);
      
      expect(res.getStatusCode()).toBe(404);
      expect(res.getResponseData().error).toBe('药品未找到');
    });
  });

  describe('数据一致性测试', () => {
    it('删除药品后其他药品的通知ID不应该受影响', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      const medicine1 = db.addMedicine({
        name: '药品1',
        expiry_date: addDays(today, 7),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      const medicine2 = db.addMedicine({
        name: '药品2',
        expiry_date: addDays(today, 30),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      const notif1 = db.addNotification({
        medicine_id: medicine1.id,
        message: '通知1',
        created_date: today,
        is_read: 0
      });
      
      const notif2 = db.addNotification({
        medicine_id: medicine2.id,
        message: '通知2',
        created_date: today,
        is_read: 0
      });
      
      const originalNotif2Id = notif2.id;
      
      db.deleteMedicine(medicine1.id);
      
      const remainingNotif = db.getNotificationById(originalNotif2Id);
      expect(remainingNotif).toBeDefined();
      expect(remainingNotif.medicine_id).toBe(medicine2.id);
      expect(remainingNotif.message).toBe('通知2');
    });

    it('多次删除操作应该保持数据一致', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      for (let i = 1; i <= 5; i++) {
        const medicine = db.addMedicine({
          name: `药品${i}`,
          expiry_date: addDays(today, i * 7),
          notes: '',
          added_date: today,
          notification_sent: 0
        });
        
        db.addNotification({
          medicine_id: medicine.id,
          message: `药品${i}通知`,
          created_date: today,
          is_read: 0
        });
        
        db.addNotification({
          medicine_id: medicine.id,
          message: `药品${i}通知2`,
          created_date: today,
          is_read: 1
        });
      }
      
      expect(db.getMedicines().length).toBe(5);
      expect(db.getNotifications().length).toBe(10);
      
      const medicines = db.getMedicines();
      
      db.deleteMedicine(medicines[1].id);
      db.deleteMedicine(medicines[3].id);
      
      expect(db.getMedicines().length).toBe(3);
      expect(db.getNotifications().length).toBe(6);
      
      const remainingMedicines = db.getMedicines();
      expect(remainingMedicines.map(m => m.name)).toEqual(['药品1', '药品3', '药品5']);
    });
  });

  describe('空提醒测试', () => {
    it('删除药品后不应该出现空提醒', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      const medicine = db.addMedicine({
        name: '测试药品',
        expiry_date: addDays(today, 7),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({
        medicine_id: medicine.id,
        message: '测试提醒',
        created_date: today,
        is_read: 0
      });
      
      expect(db.getNotifications().length).toBe(1);
      
      db.deleteMedicine(medicine.id);
      
      expect(db.getNotifications().length).toBe(0);
      
      const req = createMockRequest();
      const res = createMockResponse();
      
      notificationController.getAllNotifications(req, res);
      const result = res.getResponseData();
      
      expect(result.length).toBe(0);
    });

    it('未读通知列表在删除药品后也应该更新', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      const medicine1 = db.addMedicine({
        name: '药品1',
        expiry_date: addDays(today, 7),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      const medicine2 = db.addMedicine({
        name: '药品2',
        expiry_date: addDays(today, 30),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({
        medicine_id: medicine1.id,
        message: '药品1未读提醒',
        created_date: today,
        is_read: 0
      });
      
      db.addNotification({
        medicine_id: medicine2.id,
        message: '药品2未读提醒',
        created_date: today,
        is_read: 0
      });
      
      const req1 = createMockRequest();
      const res1 = createMockResponse();
      notificationController.getUnreadNotifications(req1, res1);
      expect(res1.getResponseData().length).toBe(2);
      
      db.deleteMedicine(medicine1.id);
      
      const req2 = createMockRequest();
      const res2 = createMockResponse();
      notificationController.getUnreadNotifications(req2, res2);
      const result = res2.getResponseData();
      
      expect(result.length).toBe(1);
      expect(result[0].medicine_name).toBe('药品2');
    });
  });
});
