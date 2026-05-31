const db = require('../models/database');

const searchInteractions = (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: '请提供药品名称' });
    }
    
    const interactions = db.searchDrugInteractions(query);
    
    res.json({
      query,
      count: interactions.length,
      interactions: interactions.map(i => ({
        ...i,
        severity_label: getSeverityLabel(i.severity),
        severity_color: getSeverityColor(i.severity)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const checkTwoDrugs = (req, res) => {
  try {
    const { drug1, drug2 } = req.body;
    
    if (!drug1 || !drug2) {
      return res.status(400).json({ error: '请提供两个药品名称' });
    }
    
    const interaction = db.checkInteraction(drug1, drug2);
    
    if (!interaction) {
      return res.json({
        safe: true,
        drug1,
        drug2,
        message: '未发现这两种药品之间的已知相互作用'
      });
    }
    
    res.json({
      safe: false,
      drug1,
      drug2,
      interaction: {
        ...interaction,
        severity_label: getSeverityLabel(interaction.severity),
        severity_color: getSeverityColor(interaction.severity)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const batchCheck = (req, res) => {
  try {
    const { drugs } = req.body;
    
    if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
      return res.status(400).json({ error: '请提供至少两种药品' });
    }
    
    const interactions = db.batchCheckInteractions(drugs);
    
    const checkedPairs = [];
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        checkedPairs.push({
          drug1: drugs[i],
          drug2: drugs[j]
        });
      }
    }
    
    if (interactions.length === 0) {
      return res.json({
        safe: true,
        drugs,
        checked_pairs: checkedPairs.length,
        message: '未发现这些药品之间的已知相互作用'
      });
    }
    
    res.json({
      safe: false,
      drugs,
      checked_pairs: checkedPairs.length,
      interaction_count: interactions.length,
      interactions: interactions.map(i => ({
        ...i,
        severity_label: getSeverityLabel(i.severity),
        severity_color: getSeverityColor(i.severity)
      })),
      summary: generateInteractionSummary(interactions)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllInteractions = (req, res) => {
  try {
    const severity = req.query.severity;
    let interactions = db.getAllDrugInteractions();
    
    if (severity) {
      interactions = interactions.filter(i => i.severity === severity);
    }
    
    res.json({
      count: interactions.length,
      interactions: interactions.map(i => ({
        ...i,
        severity_label: getSeverityLabel(i.severity),
        severity_color: getSeverityColor(i.severity)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getQuickCheck = (req, res) => {
  try {
    const drug = req.query.drug;
    if (!drug) {
      return res.status(400).json({ error: '请提供药品名称' });
    }
    
    const interactions = db.searchDrugInteractions(drug);
    
    const highRisk = interactions.filter(i => i.severity === 'high');
    const mediumRisk = interactions.filter(i => i.severity === 'medium');
    
    res.json({
      drug,
      total_interactions: interactions.length,
      high_risk_count: highRisk.length,
      medium_risk_count: mediumRisk.length,
      risk_level: highRisk.length > 0 ? 'high' : mediumRisk.length > 0 ? 'medium' : 'low',
      top_interactions: interactions.slice(0, 5).map(i => ({
        other_drug: i.drug1_name === drug ? i.drug2_name : i.drug1_name,
        severity: i.severity,
        severity_label: getSeverityLabel(i.severity),
        description: i.description
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSeverityLabel = (severity) => {
  const labels = {
    high: '严重',
    medium: '中等',
    low: '轻微'
  };
  return labels[severity] || '未知';
};

const getSeverityColor = (severity) => {
  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e'
  };
  return colors[severity] || '#6b7280';
};

const generateInteractionSummary = (interactions) => {
  const highCount = interactions.filter(i => i.severity === 'high').length;
  const mediumCount = interactions.filter(i => i.severity === 'medium').length;
  
  let summary = '检测到 ';
  const parts = [];
  if (highCount > 0) parts.push(`${highCount} 个严重相互作用`);
  if (mediumCount > 0) parts.push(`${mediumCount} 个中等相互作用`);
  
  summary += parts.join('和') + '，请咨询医生后再服用。';
  
  return summary;
};

module.exports = {
  searchInteractions,
  checkTwoDrugs,
  batchCheck,
  getAllInteractions,
  getQuickCheck,
};
