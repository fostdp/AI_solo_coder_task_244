const db = require('../models/database');

const getToday = () => new Date().toISOString().split('T')[0];

const getDaysRemaining = (expiryDate) => {
  const today = new Date(getToday());
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getAllNotifications = (req, res) => {
  try {
    const notifications = db.getNotifications().map(n => {
      const medicine = db.getMedicineById(n.medicine_id);
      const daysRemaining = medicine?.expiry_date 
        ? getDaysRemaining(medicine.expiry_date) 
        : null;
      return {
        ...n,
        medicine_name: medicine?.name || '已删除',
        expiry_date: medicine?.expiry_date || '',
        days_remaining: daysRemaining,
        is_deleted: !medicine
      };
    }).sort((a, b) => {
      if (a.is_deleted && !b.is_deleted) return 1;
      if (!a.is_deleted && b.is_deleted) return -1;
      if (a.is_deleted && b.is_deleted) {
        return new Date(b.created_date) - new Date(a.created_date);
      }
      if (a.days_remaining === null && b.days_remaining !== null) return 1;
      if (a.days_remaining !== null && b.days_remaining === null) return -1;
      if (a.days_remaining === null && b.days_remaining === null) {
        return new Date(b.created_date) - new Date(a.created_date);
      }
      return a.days_remaining - b.days_remaining;
    });
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUnreadNotifications = (req, res) => {
  try {
    const notifications = db.getUnreadNotifications().map(n => {
      const medicine = db.getMedicineById(n.medicine_id);
      const daysRemaining = medicine?.expiry_date 
        ? getDaysRemaining(medicine.expiry_date) 
        : null;
      return {
        ...n,
        medicine_name: medicine?.name || '已删除',
        expiry_date: medicine?.expiry_date || '',
        days_remaining: daysRemaining,
        is_deleted: !medicine
      };
    }).sort((a, b) => {
      if (a.is_deleted && !b.is_deleted) return 1;
      if (!a.is_deleted && b.is_deleted) return -1;
      if (a.is_deleted && b.is_deleted) {
        return new Date(b.created_date) - new Date(a.created_date);
      }
      if (a.days_remaining === null && b.days_remaining !== null) return 1;
      if (a.days_remaining !== null && b.days_remaining === null) return -1;
      if (a.days_remaining === null && b.days_remaining === null) {
        return new Date(b.created_date) - new Date(a.created_date);
      }
      return a.days_remaining - b.days_remaining;
    });
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAsRead = (req, res) => {
  try {
    const success = db.markNotificationAsRead(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '通知未找到' });
    }
    res.json({ message: '标记为已读' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAllAsRead = (req, res) => {
  try {
    const count = db.markAllNotificationsAsRead();
    res.json({ message: '全部标记为已读', count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSettings = (req, res) => {
  try {
    res.json(db.getSettings());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSettings = (req, res) => {
  try {
    const { reminder_days } = req.body;
    
    if (reminder_days !== undefined) {
      db.updateSetting('reminder_days', reminder_days.toString());
      res.json({ message: '设置更新成功', reminder_days });
    } else {
      res.status(400).json({ error: '缺少设置参数' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const checkAndCreateNotifications = () => {
  try {
    const settings = db.getSettings();
    const reminderDays = parseInt(settings.reminder_days || '7');
    const today = getToday();

    const medicines = db.getMedicines().filter(m => {
      if (m.notification_sent === 1) return false;
      const daysRemaining = getDaysRemaining(m.expiry_date);
      return daysRemaining >= 0 && daysRemaining <= reminderDays;
    });

    medicines.forEach(medicine => {
      const days = getDaysRemaining(medicine.expiry_date);
      let message;
      
      if (days === 0) {
        message = `警告: ${medicine.name} 今天过期!`;
      } else if (days === 1) {
        message = `提醒: ${medicine.name} 明天过期!`;
      } else {
        message = `提醒: ${medicine.name} 将在 ${days} 天后过期`;
      }

      db.addNotification({
        medicine_id: medicine.id,
        message,
        created_date: today,
        is_read: 0
      });

      db.updateMedicine(medicine.id, { notification_sent: 1 });
      console.log(`创建通知: ${message}`);
    });

    if (medicines.length > 0) {
      console.log(`已为 ${medicines.length} 个临期药品创建通知`);
    }
  } catch (err) {
    console.error('检查临期药品失败:', err.message);
  }
};

module.exports = {
  getAllNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  getSettings,
  updateSettings,
  checkAndCreateNotifications,
};
