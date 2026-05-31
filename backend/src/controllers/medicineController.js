const db = require('../models/database');
const Tesseract = require('tesseract.js');

const getToday = () => new Date().toISOString().split('T')[0];

const getDaysRemaining = (expiryDate) => {
  const today = new Date(getToday());
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

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

const getAllMedicines = (req, res) => {
  try {
    const medicines = db.getMedicines().map(m => ({
      ...m,
      days_remaining: getDaysRemaining(m.expiry_date)
    }));
    medicines.sort((a, b) => a.days_remaining - b.days_remaining);
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMedicineById = (req, res) => {
  try {
    const medicine = db.getMedicineById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ error: '药品未找到' });
    }
    res.json({
      ...medicine,
      days_remaining: getDaysRemaining(medicine.expiry_date)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addMedicine = (req, res) => {
  try {
    const { name, expiry_date, notes } = req.body;
    
    if (!name || !expiry_date) {
      return res.status(400).json({ error: '药品名称和有效期不能为空' });
    }

    const newMedicine = db.addMedicine({
      name,
      expiry_date,
      notes: notes || '',
      added_date: getToday(),
      notification_sent: 0
    });

    res.json({ id: newMedicine.id, message: '药品添加成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateMedicine = (req, res) => {
  try {
    const { name, expiry_date, notes } = req.body;
    
    const existing = db.getMedicineById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '药品未找到' });
    }

    const updated = db.updateMedicine(req.params.id, {
      name,
      expiry_date,
      notes: notes || '',
      notification_sent: 0
    });

    res.json({ message: '药品更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteMedicine = (req, res) => {
  try {
    const success = db.deleteMedicine(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '药品未找到' });
    }
    res.json({ message: '药品删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const scanMedicine = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    console.log('开始OCR识别...');
    
    const result = await Tesseract.recognize(
      req.file.buffer,
      'chi_sim+eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR进度: ${(m.progress * 100).toFixed(0)}%`);
          }
        },
      }
    );

    const text = result.data.text;
    console.log('OCR识别文本:', text);

    const expiryDate = parseDate(text);
    const medicineName = extractMedicineName(text);

    res.json({
      success: true,
      name: medicineName,
      expiry_date: expiryDate || null,
      raw_text: text,
    });
  } catch (error) {
    console.error('OCR识别失败:', error);
    res.status(500).json({ error: 'OCR识别失败: ' + error.message });
  }
};

const getExpiringMedicines = (req, res) => {
  try {
    const days = parseInt(req.query.days || '7');
    const medicines = db.getMedicines()
      .map(m => ({ ...m, days_remaining: getDaysRemaining(m.expiry_date) }))
      .filter(m => m.days_remaining >= 0 && m.days_remaining <= days)
      .sort((a, b) => a.days_remaining - b.days_remaining);
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getExpiredMedicines = (req, res) => {
  try {
    const medicines = db.getMedicines()
      .map(m => ({ 
        ...m, 
        days_expired: Math.abs(getDaysRemaining(m.expiry_date)) 
      }))
      .filter(m => getDaysRemaining(m.expiry_date) < 0)
      .sort((a, b) => b.days_expired - a.days_expired);
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllMedicines,
  getMedicineById,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  scanMedicine,
  getExpiringMedicines,
  getExpiredMedicines,
};
