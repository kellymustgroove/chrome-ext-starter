import { BetaAnalyticsDataClient } from '@google-analytics/data';

function getDateRange(query) {
  const { startDate, endDate } = query;
  // If both dates are provided, use them; otherwise, default to last 30 days
  if (startDate && endDate) {
    return [{ startDate, endDate }];
  }
  return [{ startDate: '30daysAgo', endDate: 'yesterday' }];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = JSON.parse(process.env.GA4_SERVICE_KEY_JSON);
  const analyticsDataClient = new BetaAnalyticsDataClient({ credentials: key });
  const PROPERTY_ID = '392448310';
  const { metric } = req.query;
  const dateRanges = getDateRange(req.query);

  try {
    if (metric === 'sessions') {
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges,
        metrics: [{ name: 'sessions' }],
      });
      const sessions =
        response.rows?.[0]?.metricValues?.[0]?.value || 'No data available';
      return res.status(200).json({ sessions });
    }
    if (metric === 'pageviews') {
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges,
        metrics: [{ name: 'screenPageViews' }],
      });
      const pageviews =
        response.rows?.[0]?.metricValues?.[0]?.value || 'No data available';
      return res.status(200).json({ pageviews });
    }
    if (metric === 'top-pages') {
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 5,
      });
      const topPages =
        response.rows?.map((row) => ({
          page: row.dimensionValues?.[0]?.value,
          pageviews: row.metricValues?.[0]?.value,
        })) || [];
      return res.status(200).json({ topPages });
    }
    return res
      .status(400)
      .json({ error: 'Invalid or missing metric parameter' });
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || 'Failed to fetch GA4 data' });
  }
}
