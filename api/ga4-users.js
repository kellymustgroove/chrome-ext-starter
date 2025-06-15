import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Load service account key from environment variable
  const key = JSON.parse(process.env.GA4_SERVICE_KEY_JSON);
  const analyticsDataClient = new BetaAnalyticsDataClient({ credentials: key });

  // Your GA4 property ID
  const PROPERTY_ID = '392448310';

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
      metrics: [{ name: 'totalUsers' }],
    });

    const users =
      response.rows && response.rows.length > 0
        ? response.rows[0].metricValues?.[0]?.value
        : 'No data available';

    return res.status(200).json({ users });
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || 'Failed to fetch GA4 data' });
  }
}
