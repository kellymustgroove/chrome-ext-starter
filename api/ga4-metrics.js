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
  const { metric, dimension } = req.query;
  const dateRanges = getDateRange(req.query);

  if (!metric) {
    return res.status(400).json({ error: 'Missing metric parameter' });
  }

  // Support single or multiple metrics (comma-separated)
  const metricNames = metric
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  if (metricNames.length === 0) {
    return res.status(400).json({ error: 'No valid metrics provided' });
  }

  try {
    const reportRequest = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges,
      metrics: metricNames.map((name) => ({ name })),
    };
    if (dimension) {
      reportRequest.dimensions = [{ name: dimension }];
    }
    const [response] = await analyticsDataClient.runReport(reportRequest);
    if (dimension) {
      // Return grouped results by dimension
      const results =
        response.rows?.map((row) => {
          const dimValue = row.dimensionValues?.[0]?.value;
          const metrics = {};
          metricNames.forEach((name, i) => {
            metrics[name] = row.metricValues?.[i]?.value || 'No data';
          });
          return { [dimension]: dimValue, ...metrics };
        }) || [];
      return res.status(200).json({ results });
    }
    // Build a result object with all metric values
    const result = {};
    metricNames.forEach((name, i) => {
      result[name] =
        response.rows?.[0]?.metricValues?.[i]?.value || 'No data available';
    });
    return res.status(200).json(result);
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || 'Failed to fetch GA4 data' });
  }
}
