const db = require('../models/database');

const DEFAULT_USER_ID = 1;

const getNearbyPharmacies = (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const radius = parseFloat(req.query.radius) || 5;
    
    let pharmacies = db.getPharmacies(latitude, longitude, radius);
    
    res.json({
      count: pharmacies.length,
      pharmacies: pharmacies.map(p => ({
        ...p,
        distance_km: p.distance ? p.distance.toFixed(2) : null
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPharmacyById = (req, res) => {
  try {
    const pharmacy = db.getPharmacyById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ error: '药店未找到' });
    }
    
    const inventory = db.getPharmacyInventory(req.params.id);
    
    res.json({
      ...pharmacy,
      inventory,
      medicine_count: inventory.length,
      low_stock_count: inventory.filter(i => i.stock <= 10).length,
      out_of_stock_count: inventory.filter(i => i.stock === 0).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const searchMedicine = (req, res) => {
  try {
    const medicineName = req.query.name;
    if (!medicineName) {
      return res.status(400).json({ error: '请提供药品名称' });
    }
    
    const results = db.searchPharmacyMedicine(medicineName);
    
    const available = results.filter(r => r.stock > 0);
    const outOfStock = results.filter(r => r.stock === 0);
    
    res.json({
      medicine_name: medicineName,
      total_found: results.length,
      available_count: available.length,
      out_of_stock_count: outOfStock.length,
      results: results.map(r => ({
        id: r.id,
        pharmacy_id: r.pharmacy?.id,
        pharmacy_name: r.pharmacy?.name,
        pharmacy_address: r.pharmacy?.address,
        pharmacy_phone: r.pharmacy?.phone,
        is_24h: r.pharmacy?.is_24h,
        stock: r.stock,
        price: r.price,
        last_updated: r.last_updated
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const checkAvailability = (req, res) => {
  try {
    const medicineName = req.query.name;
    if (!medicineName) {
      return res.status(400).json({ error: '请提供药品名称' });
    }
    
    const availability = db.checkMedicineAvailability(medicineName);
    
    res.json(availability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createInventoryAlert = (req, res) => {
  try {
    const { medicine_name, user_id } = req.body;
    const userId = parseInt(user_id) || DEFAULT_USER_ID;
    
    if (!medicine_name) {
      return res.status(400).json({ error: '请提供药品名称' });
    }
    
    const availability = db.checkMedicineAvailability(medicine_name);
    
    if (availability.available_pharmacies === 0) {
      const alert = db.createInventoryAlert({
        user_id: userId,
        medicine_name,
        is_out_of_stock: 1
      });
      
      res.json({
        success: true,
        message: '缺药提醒已创建，当有货时会通知您',
        alert
      });
    } else {
      res.json({
        success: false,
        message: '该药品目前有库存',
        availability
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyInventoryAlerts = (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || DEFAULT_USER_ID;
    const alerts = db.getInventoryAlerts(userId);
    
    const alertsWithStatus = alerts.map(alert => {
      const availability = db.checkMedicineAvailability(alert.medicine_name);
      return {
        ...alert,
        current_available: availability.available_pharmacies > 0,
        lowest_price: availability.lowest_price,
        pharmacy_count: availability.available_pharmacies
      };
    });
    
    res.json({
      count: alertsWithStatus.length,
      alerts: alertsWithStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deactivateAlert = (req, res) => {
  try {
    const success = db.deactivateInventoryAlert(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '提醒不存在' });
    }
    
    res.json({ success: true, message: '提醒已取消' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPharmacyInventory = (req, res) => {
  try {
    const pharmacyId = req.params.id;
    const inventory = db.getPharmacyInventory(pharmacyId);
    
    const grouped = {
      available: inventory.filter(i => i.stock > 0),
      low_stock: inventory.filter(i => i.stock > 0 && i.stock <= 10),
      out_of_stock: inventory.filter(i => i.stock === 0)
    };
    
    res.json({
      pharmacy_id: pharmacyId,
      total: inventory.length,
      available_count: grouped.available.length,
      low_stock_count: grouped.low_stock.length,
      out_of_stock_count: grouped.out_of_stock.length,
      inventory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllPharmacies = (req, res) => {
  try {
    const pharmacies = db.getPharmacies();
    
    res.json({
      count: pharmacies.length,
      pharmacies: pharmacies.map(p => ({
        ...p,
        inventory_count: db.getPharmacyInventory(p.id).length
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getNearbyPharmacies,
  getPharmacyById,
  searchMedicine,
  checkAvailability,
  createInventoryAlert,
  getMyInventoryAlerts,
  deactivateAlert,
  getPharmacyInventory,
  getAllPharmacies
};
