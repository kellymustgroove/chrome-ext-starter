// api/analytics-summary.js
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const client = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GA4_SERVICE_KEY_JSON),
});

export default async function handler(req, res) {
  try {
    const [response] = await client.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
    });

    // Turn rows into a plain-English summary
    const summaryLines = response.rows.map(
      (row) =>
        `${row.dimensionValues[0].value}: ${row.metricValues[0].value} users`
    );
    const summary = summaryLines.join('\n');

    res.status(200).json({ summary, rows: response.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
