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

describe('提醒到期排序测试', () => {
  let notificationController;
  
  beforeEach(() => {
    jest.resetModules();
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

  describe('通知排序逻辑测试', () => {
    it('应该按照到期天数从近到远排序通知', () => {
      const getDaysRemaining = (expiryDate) => {
        const today = new Date(getToday());
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      };

      const today = getToday();
      const notifications = [
        { medicine_id: 1, expiry_date: addDays(today, 7) },
        { medicine_id: 2, expiry_date: addDays(today, 1) },
        { medicine_id: 3, expiry_date: addDays(today, 30) },
        { medicine_id: 4, expiry_date: addDays(today, 0) },
        { medicine_id: 5, expiry_date: addDays(today, 3) },
      ].map(n => ({
        ...n,
        medicine: { expiry_date: n.expiry_date },
        days_remaining: getDaysRemaining(n.expiry_date)
      }));

      const sorted = [...notifications].sort((a, b) => a.days_remaining - b.days_remaining);
      
      expect(sorted[0].days_remaining).toBe(0);
      expect(sorted[1].days_remaining).toBe(1);
      expect(sorted[2].days_remaining).toBe(3);
      expect(sorted[3].days_remaining).toBe(7);
      expect(sorted[4].days_remaining).toBe(30);
    });

    it('应该将已过期的通知排在最前面（天数最小）', () => {
      const getDaysRemaining = (expiryDate) => {
        const today = new Date(getToday());
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      };

      const today = getToday();
      const notifications = [
        { medicine_id: 1, expiry_date: addDays(today, 5) },
        { medicine_id: 2, expiry_date: addDays(today, -3) },
        { medicine_id: 3, expiry_date: addDays(today, -1) },
        { medicine_id: 4, expiry_date: addDays(today, 10) },
      ].map(n => ({
        ...n,
        medicine: { expiry_date: n.expiry_date },
        days_remaining: getDaysRemaining(n.expiry_date)
      }));

      const sorted = [...notifications].sort((a, b) => a.days_remaining - b.days_remaining);
      
      expect(sorted[0].days_remaining).toBe(-3);
      expect(sorted[1].days_remaining).toBe(-1);
      expect(sorted[2].days_remaining).toBe(5);
      expect(sorted[3].days_remaining).toBe(10);
    });

    it('今天过期的通知应该排在即将过期的前面', () => {
      const getDaysRemaining = (expiryDate) => {
        const today = new Date(getToday());
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      };

      const today = getToday();
      const notifications = [
        { medicine_id: 1, expiry_date: addDays(today, 2) },
        { medicine_id: 2, expiry_date: addDays(today, 0) },
        { medicine_id: 3, expiry_date: addDays(today, 1) },
      ].map(n => ({
        ...n,
        days_remaining: getDaysRemaining(n.expiry_date)
      }));

      const sorted = [...notifications].sort((a, b) => a.days_remaining - b.days_remaining);
      
      expect(sorted[0].days_remaining).toBe(0);
      expect(sorted[1].days_remaining).toBe(1);
      expect(sorted[2].days_remaining).toBe(2);
    });
  });

  describe('已删除药品的通知处理测试', () => {
    it('应该正确识别药品已删除的通知', () => {
      const getDaysRemaining = (expiryDate) => {
        const today = new Date(getToday());
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      };

      const today = getToday();
      const notifications = [
        { medicine_id: 1, is_deleted: false, expiry_date: addDays(today, 5), days_remaining: 5 },
        { medicine_id: 2, is_deleted: true, expiry_date: addDays(today, 1), days_remaining: 1 },
        { medicine_id: 3, is_deleted: false, expiry_date: addDays(today, 10), days_remaining: 10 },
      ];

      const sorted = [...notifications].sort((a, b) => {
        if (a.is_deleted && !b.is_deleted) return 1;
        if (!a.is_deleted && b.is_deleted) return -1;
        if (a.is_deleted && b.is_deleted) return 0;
        return a.days_remaining - b.days_remaining;
      });
      
      expect(sorted[0].is_deleted).toBe(false);
      expect(sorted[1].is_deleted).toBe(false);
      expect(sorted[2].is_deleted).toBe(true);
    });

    it('已删除药品的通知之间按创建时间排序', () => {
      const notifications = [
        { medicine_id: 1, is_deleted: true, created_date: addDays(getToday(), -5) },
        { medicine_id: 2, is_deleted: true, created_date: addDays(getToday(), -1) },
        { medicine_id: 3, is_deleted: true, created_date: addDays(getToday(), -10) },
      ];

      const sorted = [...notifications].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      expect(sorted[0].medicine_id).toBe(2);
      expect(sorted[1].medicine_id).toBe(1);
      expect(sorted[2].medicine_id).toBe(3);
    });
  });

  describe('数据库集成排序测试', () => {
    it('应该返回按到期天数排序的通知列表', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      db.addMedicine({
        name: '最早过期的药',
        expiry_date: addDays(today, 1),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addMedicine({
        name: '中等过期的药',
        expiry_date: addDays(today, 15),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addMedicine({
        name: '最晚过期的药',
        expiry_date: addDays(today, 30),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({
        medicine_id: 3,
        message: '最晚过期的药提醒',
        created_date: today,
        is_read: 0
      });
      
      db.addNotification({
        medicine_id: 1,
        message: '最早过期的药提醒',
        created_date: today,
        is_read: 0
      });
      
      db.addNotification({
        medicine_id: 2,
        message: '中等过期的药提醒',
        created_date: today,
        is_read: 0
      });

      const req = createMockRequest();
      const res = createMockResponse();
      
      notificationController.getAllNotifications(req, res);
      
      const result = res.getResponseData();
      
      expect(result).toBeDefined();
      expect(result.length).toBe(3);
      
      if (result && result.length >= 3) {
        expect(result[0].days_remaining).toBeLessThan(result[1].days_remaining);
        expect(result[1].days_remaining).toBeLessThan(result[2].days_remaining);
        
        expect(result[0].medicine_name).toBe('最早过期的药');
        expect(result[1].medicine_name).toBe('中等过期的药');
        expect(result[2].medicine_name).toBe('最晚过期的药');
      }
    });

    it('应该正确计算并返回days_remaining字段', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      db.addMedicine({
        name: '测试药品',
        expiry_date: addDays(today, 7),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({
        medicine_id: 1,
        message: '测试提醒',
        created_date: today,
        is_read: 0
      });

      const req = createMockRequest();
      const res = createMockResponse();
      
      notificationController.getAllNotifications(req, res);
      
      const result = res.getResponseData();
      
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].days_remaining).toBe(7);
    });

    it('已过期药品的days_remaining应该为负数', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      db.addMedicine({
        name: '已过期药品',
        expiry_date: addDays(today, -5),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({
        medicine_id: 1,
        message: '已过期提醒',
        created_date: today,
        is_read: 0
      });

      const req = createMockRequest();
      const res = createMockResponse();
      
      notificationController.getAllNotifications(req, res);
      
      const result = res.getResponseData();
      
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].days_remaining).toBeLessThan(0);
    });
  });

  describe('未读通知排序测试', () => {
    it('getUnreadNotifications也应该按到期天数排序', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      db.addMedicine({
        name: '最近过期',
        expiry_date: addDays(today, 1),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addMedicine({
        name: '较晚过期',
        expiry_date: addDays(today, 20),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({
        medicine_id: 2,
        message: '未读-较晚过期',
        created_date: today,
        is_read: 0
      });
      
      db.addNotification({
        medicine_id: 1,
        message: '未读-最近过期',
        created_date: today,
        is_read: 0
      });

      const req = createMockRequest();
      const res = createMockResponse();
      
      notificationController.getUnreadNotifications(req, res);
      
      const result = res.getResponseData();
      
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      
      if (result && result.length >= 2) {
        expect(result[0].medicine_name).toBe('最近过期');
        expect(result[1].medicine_name).toBe('较晚过期');
      }
    });

    it('已读的通知不应该出现在未读列表中', () => {
      const db = require('../src/models/database');
      
      const today = getToday();
      
      db.addMedicine({
        name: '测试药品',
        expiry_date: addDays(today, 7),
        notes: '',
        added_date: today,
        notification_sent: 0
      });
      
      db.addNotification({
        medicine_id: 1,
        message: '未读提醒',
        created_date: today,
        is_read: 0
      });
      
      db.addNotification({
        medicine_id: 1,
        message: '已读提醒',
        created_date: today,
        is_read: 1
      });

      const req = createMockRequest();
      const res = createMockResponse();
      
      notificationController.getUnreadNotifications(req, res);
      
      const result = res.getResponseData();
      
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].message).toBe('未读提醒');
    });
  });
});
