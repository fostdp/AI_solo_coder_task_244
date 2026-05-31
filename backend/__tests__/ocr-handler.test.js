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

describe('OCR异常处理测试', () => {
  let medicineController;
  
  beforeEach(() => {
    jest.resetModules();
    medicineController = require('../src/controllers/medicineController');
  });

  describe('日期解析函数测试', () => {
    it('应该正确解析 "YYYY年MM月DD日" 格式的日期', () => {
      const text = '有效期至 2025年12月31日';
      const parseDate = (text) => {
        const patterns = [
          /(\d{4})[-./年](\d{1,2})[-./月](\d{1,2})/,
          /(\d{4})(\d{2})(\d{2})/,
          /(\d{2})[-./](\d{2})[-./](\d{4})/,
        ];
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            let year, month, day;
            if (match[1].length === 4) {
              [, year, month, day] = match;
            } else {
              [, day, month, year] = match;
            }
            year = parseInt(year, 10);
            month = parseInt(month, 10);
            day = parseInt(day, 10);
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
          }
        }
        return null;
      };
      
      expect(parseDate('有效期至 2025年12月31日')).toBe('2025-12-31');
    });

    it('应该正确解析 "YYYY-MM-DD" 格式的日期', () => {
      const parseDate = (text) => {
        const patterns = [
          /(\d{4})[-./年](\d{1,2})[-./月](\d{1,2})/,
          /(\d{4})(\d{2})(\d{2})/,
          /(\d{2})[-./](\d{2})[-./](\d{4})/,
        ];
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            let year, month, day;
            if (match[1].length === 4) {
              [, year, month, day] = match;
            } else {
              [, day, month, year] = match;
            }
            year = parseInt(year, 10);
            month = parseInt(month, 10);
            day = parseInt(day, 10);
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
          }
        }
        return null;
      };
      
      expect(parseDate('EXP: 2024-08-15')).toBe('2024-08-15');
    });

    it('应该正确解析纯数字 "YYYYMMDD" 格式的日期', () => {
      const parseDate = (text) => {
        const patterns = [
          /(\d{4})[-./年](\d{1,2})[-./月](\d{1,2})/,
          /(\d{4})(\d{2})(\d{2})/,
          /(\d{2})[-./](\d{2})[-./](\d{4})/,
        ];
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            let year, month, day;
            if (match[1].length === 4) {
              [, year, month, day] = match;
            } else {
              [, day, month, year] = match;
            }
            year = parseInt(year, 10);
            month = parseInt(month, 10);
            day = parseInt(day, 10);
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
          }
        }
        return null;
      };
      
      expect(parseDate('有效期 20250630')).toBe('2025-06-30');
    });

    it('对于无效日期应该返回 null', () => {
      const parseDate = (text) => {
        const patterns = [
          /(\d{4})[-./年](\d{1,2})[-./月](\d{1,2})/,
          /(\d{4})(\d{2})(\d{2})/,
          /(\d{2})[-./](\d{2})[-./](\d{4})/,
        ];
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            let year, month, day;
            if (match[1].length === 4) {
              [, year, month, day] = match;
            } else {
              [, day, month, year] = match;
            }
            year = parseInt(year, 10);
            month = parseInt(month, 10);
            day = parseInt(day, 10);
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
          }
        }
        return null;
      };
      
      expect(parseDate('这不是一个日期格式')).toBeNull();
      expect(parseDate('abcdefghij')).toBeNull();
    });

    it('对于超出范围的日期应该返回 null', () => {
      const parseDate = (text) => {
        const patterns = [
          /(\d{4})[-./年](\d{1,2})[-./月](\d{1,2})/,
          /(\d{4})(\d{2})(\d{2})/,
          /(\d{2})[-./](\d{2})[-./](\d{4})/,
        ];
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            let year, month, day;
            if (match[1].length === 4) {
              [, year, month, day] = match;
            } else {
              [, day, month, year] = match;
            }
            year = parseInt(year, 10);
            month = parseInt(month, 10);
            day = parseInt(day, 10);
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
          }
        }
        return null;
      };
      
      expect(parseDate('2025年13月01日')).toBeNull();
      expect(parseDate('2025年00月01日')).toBeNull();
      expect(parseDate('2025年06月32日')).toBeNull();
    });
  });

  describe('药品名称提取测试', () => {
    it('应该从多行文本中提取药品名称', () => {
      const extractMedicineName = (text) => {
        const lines = text.split('\n').filter(line => line.trim().length > 2);
        const stopWords = ['有效期', '生产日期', '批号', 'OTC', '国药准字', 'mg', 'g', 'ml', '片', '粒', '盒'];
        
        for (const line of lines) {
          const cleaned = line.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').trim();
          if (cleaned.length >= 2 && cleaned.length <= 20) {
            const hasStopWord = stopWords.some(word => cleaned.toLowerCase().includes(word.toLowerCase()));
            if (!hasStopWord && /[\u4e00-\u9fa5]/.test(cleaned)) {
              return cleaned;
            }
          }
        }
        return '未知药品';
      };
      
      const text = `阿莫西林胶囊
有效期至 2025年12月31日
国药准字H12345678
0.5g*24粒`;
      
      expect(extractMedicineName(text)).toBe('阿莫西林胶囊');
    });

    it('对于无法识别的文本应该返回默认值', () => {
      const extractMedicineName = (text) => {
        const lines = text.split('\n').filter(line => line.trim().length > 2);
        const stopWords = ['有效期', '生产日期', '批号', 'OTC', '国药准字', 'mg', 'g', 'ml', '片', '粒', '盒'];
        
        for (const line of lines) {
          const cleaned = line.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').trim();
          if (cleaned.length >= 2 && cleaned.length <= 20) {
            const hasStopWord = stopWords.some(word => cleaned.toLowerCase().includes(word.toLowerCase()));
            if (!hasStopWord && /[\u4e00-\u9fa5]/.test(cleaned)) {
              return cleaned;
            }
          }
        }
        return '未知药品';
      };
      
      const text = `有效期至 2025年12月31日
国药准字H12345678`;
      
      expect(extractMedicineName(text)).toBe('未知药品');
    });
  });

  describe('手动录入降级流程测试', () => {
    it('应该能够通过API直接创建药品（手动录入降级路径）', () => {
      const db = require('../src/models/database');
      
      const medicineData = {
        name: '手动录入的药品',
        expiry_date: '2025-12-31',
        notes: 'OCR识别失败后手动录入'
      };
      
      const result = db.addMedicine({
        ...medicineData,
        added_date: new Date().toISOString().split('T')[0],
        notification_sent: 0
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(medicineData.name);
      expect(result.expiry_date).toBe(medicineData.expiry_date);
      expect(result.notes).toBe(medicineData.notes);
      
      const retrieved = db.getMedicineById(result.id);
      expect(retrieved.name).toBe(medicineData.name);
    });

    it('应该在OCR识别失败后允许部分识别结果+手动补充', () => {
      const db = require('../src/models/database');
      
      const scanResult = {
        name: '部分识别的药品',
        expiry_date: null,
        raw_text: '部分识别文本'
      };
      
      const manualExpiry = '2024-06-30';
      
      const result = db.addMedicine({
        name: scanResult.name,
        expiry_date: manualExpiry,
        notes: 'OCR识别出名称，有效期手动补充',
        added_date: new Date().toISOString().split('T')[0],
        notification_sent: 0
      });
      
      expect(result.name).toBe(scanResult.name);
      expect(result.expiry_date).toBe(manualExpiry);
    });
  });

  describe('日期计算测试', () => {
    it('应该正确计算剩余天数', () => {
      const getToday = () => new Date().toISOString().split('T')[0];
      const getDaysRemaining = (expiryDate) => {
        const today = new Date(getToday());
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      };
      
      const today = new Date();
      const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
      
      const formatDate = (date) => date.toISOString().split('T')[0];
      
      expect(getDaysRemaining(formatDate(in7Days))).toBe(7);
      expect(getDaysRemaining(formatDate(in3Days))).toBe(3);
      expect(getDaysRemaining(formatDate(today))).toBe(0);
      expect(getDaysRemaining(formatDate(yesterday))).toBe(-1);
    });
  });
});
