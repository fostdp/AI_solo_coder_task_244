const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const medicineRoutes = require('./routes/medicineRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const familyRoutes = require('./routes/familyRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const { checkAndCreateNotifications } = require('./controllers/notificationController');

const app = express();
const PORT = process.env.PORT || 3001;

require('./models/database');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/medicines', medicineRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/pharmacies', pharmacyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '家庭药箱管理系统运行正常' });
});

cron.schedule('0 9 * * *', () => {
  console.log('开始执行定时通知检查...');
  checkAndCreateNotifications();
});

console.log('定时通知任务已启动 (每天 09:00 执行)');

checkAndCreateNotifications();

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API 端点: http://localhost:${PORT}/api`);
});
