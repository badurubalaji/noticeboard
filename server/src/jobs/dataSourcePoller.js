const cron = require('node-cron');
const DataSource = require('../models/DataSource');
const { fetchOnce } = require('../services/fetchDataSource');

const inflight = new Set();

async function pollDue() {
  const now = Date.now();
  // Anything active where (now - lastFetchedAt) >= refreshInterval, or never fetched.
  // JSON sources are static — never polled.
  const sources = await DataSource.find({ isActive: true, sourceType: { $ne: 'json' } }).lean();

  for (const ds of sources) {
    if (inflight.has(String(ds._id))) continue;
    const last = ds.lastFetchedAt ? new Date(ds.lastFetchedAt).getTime() : 0;
    const dueAt = last + (ds.refreshInterval || 300) * 1000;
    if (now < dueAt) continue;

    inflight.add(String(ds._id));
    (async () => {
      try {
        const result = await fetchOnce(ds);
        const updates = {
          lastFetchedAt: new Date(),
          lastFetchStatus: result.status,
          lastError: result.error || '',
        };
        if (result.status === 'success') updates.data = result.data;
        await DataSource.updateOne({ _id: ds._id }, { $set: updates });
        if (result.status === 'error') {
          console.warn(`📡 DataSource "${ds.name}" failed: ${result.error}`);
        }
      } catch (err) {
        console.error(`📡 DataSource poll error (${ds.name}):`, err.message);
      } finally {
        inflight.delete(String(ds._id));
      }
    })();
  }
}

// Tick every 15 seconds — the per-source `refreshInterval` (min 30s) gates
// when each source is actually fetched.
cron.schedule('*/15 * * * * *', pollDue);

console.log('📡 Data source poller started (checks every 15s, fetches due sources)');

module.exports = { pollDue };
