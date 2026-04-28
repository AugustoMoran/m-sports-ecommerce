const { getStorageUsage } = require('../config/cloudinary');

const ALERT_THRESHOLD = 80; // percent

const getUsageReport = async () => {
  const usage = await getStorageUsage();
  const alert = parseFloat(usage.percentage) >= ALERT_THRESHOLD;
  return { ...usage, alert, threshold: ALERT_THRESHOLD };
};

module.exports = { getUsageReport };
