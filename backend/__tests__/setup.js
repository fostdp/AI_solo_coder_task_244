const fs = require('fs');
const path = require('path');

const TEST_DATA_DIR = path.join(__dirname, '../test-data');
const TEST_DB_PATH = path.join(TEST_DATA_DIR, 'db.json');

global.testUtils = {
  TEST_DATA_DIR,
  TEST_DB_PATH,
  
  clearTestData: () => {
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  },
  
  createTestMedicine: (overrides = {}) => {
    const today = new Date();
    const defaultData = {
      name: `测试药品_${Date.now()}`,
      expiry_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '测试备注',
      added_date: today.toISOString().split('T')[0],
      notification_sent: 0,
    };
    return { ...defaultData, ...overrides };
  },
  
  createTestNotification: (overrides = {}) => {
    const today = new Date();
    const defaultData = {
      medicine_id: 1,
      message: '测试提醒消息',
      created_date: today.toISOString().split('T')[0],
      is_read: 0,
    };
    return { ...defaultData, ...overrides };
  },
};

beforeEach(() => {
  jest.resetModules();
  global.testUtils.clearTestData();
});

afterEach(() => {
  global.testUtils.clearTestData();
});
