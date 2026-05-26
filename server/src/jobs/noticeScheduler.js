const cron = require('node-cron');
const Notice = require('../models/Notice');
const { NOTICE_STATUS } = require('../config/constants');

/**
 * Notice Scheduler - runs every minute to activate/expire notices
 */
cron.schedule('* * * * *', async () => {
  const now = new Date();

  try {
    // Activate scheduled notices whose start time has passed
    const activated = await Notice.updateMany(
      {
        status: NOTICE_STATUS.SCHEDULED,
        'schedule.startDate': { $lte: now },
      },
      { $set: { status: NOTICE_STATUS.ACTIVE } }
    );

    // Expire active notices whose end time has passed
    const expired = await Notice.updateMany(
      {
        status: NOTICE_STATUS.ACTIVE,
        'schedule.endDate': { $ne: null, $lte: now },
      },
      { $set: { status: NOTICE_STATUS.EXPIRED } }
    );

    if (activated.modifiedCount > 0 || expired.modifiedCount > 0) {
      console.log(`⏰ Scheduler: Activated ${activated.modifiedCount}, Expired ${expired.modifiedCount} notices`);
    }
  } catch (error) {
    console.error('❌ Notice scheduler error:', error.message);
  }
});

console.log('⏰ Notice scheduler started (runs every minute)');
