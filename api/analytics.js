import { BetaAnalyticsDataClient } from '@google-analytics/data';

const client = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GA4_SERVICE_KEY_JSON),
});

export default async function handler(req, res) {
  try {
    const [response] = await client.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }],
      dimensions: [{ name: 'date' }],
    });
    res.status(200).json(response);
  } catch (error) {
    console.error('GA4 error:', error);
    res.status(500).json({ error: error.message });
  }
}
