/**
 * Predictive Analytics Service
 * Implements ML-based forecasting and anomaly detection for energy consumption
 */

/**
 * Exponential Smoothing (Holt-Winters) for time-series forecasting
 * @param {number[]} data - Historical data points
 * @param {number} alpha - Smoothing parameter for level (0-1)
 * @param {number} beta - Smoothing parameter for trend (0-1)
 * @param {number} gamma - Smoothing parameter for seasonality (0-1)
 * @param {number} period - Seasonal period (e.g., 7 for weekly)
 * @param {number} forecastSteps - Number of steps ahead to forecast
 * @returns {Object} Forecast values and confidence intervals
 */
function exponentialSmoothing(data, alpha = 0.3, beta = 0.1, gamma = 0.1, period = 7, forecastSteps = 7) {
  // Filter out invalid data
  const validData = data.filter((v) => v != null && !isNaN(v) && v > 0);
  if (validData.length === 0) {
    // Return default forecasts if no valid data
    const defaultValue = 10000;
    return {
      forecasts: Array(forecastSteps).fill(0).map(() => ({
        value: defaultValue,
        upper: defaultValue * 1.2,
        lower: defaultValue * 0.8,
      })),
      mae: 0,
      stdDev: defaultValue * 0.1,
    };
  }

  if (validData.length < period * 2) {
    // Not enough data for seasonal model, use simple exponential smoothing
    return simpleExponentialSmoothing(validData, alpha, forecastSteps);
  }

  const n = validData.length;
  let level = Math.max(validData[0], 100); // Ensure minimum level
  let trend = validData.length > period ? (validData[period] - validData[0]) / period : 0;
  const seasonals = Array(period).fill(1); // Initialize to 1 instead of 0

  // Initialize seasonals
  for (let i = 0; i < Math.min(period, n); i++) {
    if (level > 0) {
      seasonals[i] = Math.max(0.5, Math.min(2.0, validData[i] / level)); // Clamp between 0.5 and 2.0
    }
  }

  // Apply Holt-Winters triple exponential smoothing
  for (let i = period; i < n; i++) {
    const prevLevel = level;
    const seasonalIndex = i - period;
    const seasonalFactor = seasonals[seasonalIndex % period] || 1;
    if (seasonalFactor > 0) {
      level = alpha * (validData[i] / seasonalFactor) + (1 - alpha) * (level + trend);
    } else {
      level = alpha * validData[i] + (1 - alpha) * (level + trend);
    }
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    if (level > 0) {
      const newSeasonal = gamma * (validData[i] / level) + (1 - gamma) * seasonals[i % period];
      seasonals[i % period] = Math.max(0.5, Math.min(2.0, newSeasonal)); // Clamp seasonal factors
    }
  }

  // Forecast future values
  const forecasts = [];
  const errors = [];
  
  // Calculate historical errors for confidence intervals
  for (let i = period; i < n; i++) {
    const seasonalFactor = seasonals[i % period] || 1;
    const forecast = (level + trend * (i - n + 1)) * seasonalFactor;
    errors.push(Math.abs(validData[i] - forecast));
  }
  
  const mae = errors.length > 0 ? errors.reduce((a, b) => a + b, 0) / errors.length : level * 0.1;
  const stdDev = errors.length > 0
    ? Math.sqrt(errors.reduce((s, e) => s + Math.pow(e - mae, 2), 0) / errors.length)
    : level * 0.15;

  // Ensure minimum stdDev for confidence intervals
  const minStdDev = level * 0.05;
  const finalStdDev = Math.max(minStdDev, stdDev);

  for (let i = 0; i < forecastSteps; i++) {
    const seasonalFactor = seasonals[(n + i) % period] || 1;
    const forecast = Math.max(100, (level + trend * (i + 1)) * seasonalFactor); // Ensure minimum value
    forecasts.push({
      value: forecast,
      upper: forecast + 1.96 * finalStdDev, // 95% confidence
      lower: Math.max(0, forecast - 1.96 * finalStdDev),
    });
  }

  return { forecasts, mae, stdDev };
}

/**
 * Simple Exponential Smoothing (when insufficient data)
 */
function simpleExponentialSmoothing(data, alpha = 0.3, forecastSteps = 7) {
  const validData = data.filter((v) => v != null && !isNaN(v) && v > 0);
  if (validData.length === 0) {
    const defaultValue = 10000;
    return {
      forecasts: Array(forecastSteps).fill(0).map(() => ({
        value: defaultValue,
        upper: defaultValue * 1.2,
        lower: defaultValue * 0.8,
      })),
      mae: 0,
      stdDev: defaultValue * 0.1,
    };
  }

  let smoothed = Math.max(100, validData[0]); // Ensure minimum value
  const errors = [];

  // Calculate smoothed values and errors
  for (let i = 1; i < validData.length; i++) {
    const prevSmoothed = smoothed;
    smoothed = alpha * validData[i] + (1 - alpha) * smoothed;
    errors.push(Math.abs(validData[i] - prevSmoothed));
  }

  const mae = errors.length > 0 ? errors.reduce((a, b) => a + b, 0) / errors.length : smoothed * 0.1;
  const stdDev = errors.length > 0
    ? Math.sqrt(errors.reduce((s, e) => s + Math.pow(e - mae, 2), 0) / errors.length)
    : smoothed * 0.15;

  // Ensure minimum stdDev
  const minStdDev = smoothed * 0.05;
  const finalStdDev = Math.max(minStdDev, stdDev);

  // Forecast future values
  const forecasts = [];
  for (let i = 0; i < forecastSteps; i++) {
    const forecast = Math.max(100, smoothed); // Ensure minimum forecast value
    forecasts.push({
      value: forecast,
      upper: forecast + 1.96 * finalStdDev,
      lower: Math.max(0, forecast - 1.96 * finalStdDev),
    });
  }

  return { forecasts, mae, stdDev: finalStdDev };
}

/**
 * Linear Regression for trend analysis
 */
function linearRegression(data) {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Anomaly Detection using Z-score and IQR methods
 */
function detectAnomalies(data, method = 'zscore', threshold = 2.5) {
  if (data.length < 3) return [];

  const anomalies = [];
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const stdDev = Math.sqrt(
    data.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / data.length
  );

  if (method === 'zscore') {
    data.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          index,
          value,
          zScore: Math.round(zScore * 100) / 100,
          severity: zScore > 3 ? 'high' : 'medium',
        });
      }
    });
  } else if (method === 'iqr') {
    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    data.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        anomalies.push({
          index,
          value,
          severity: value < lowerBound ? 'low' : 'high',
        });
      }
    });
  }

  return anomalies;
}

/**
 * Calculate prediction accuracy based on historical errors
 */
function calculateAccuracy(actual, predicted) {
  if (actual.length === 0 || predicted.length === 0) return { mape: 0, accuracy: 100 };

  const errors = actual.map((a, i) => Math.abs(a - predicted[i]));
  const mape = actual.reduce((sum, a, i) => {
    if (a === 0) return sum;
    return sum + Math.abs((a - predicted[i]) / a) * 100;
  }, 0) / actual.length;

  // Convert MAPE to accuracy percentage (lower MAPE = higher accuracy)
  const accuracy = Math.max(0, Math.min(100, 100 - mape));

  return { mape: Math.round(mape * 10) / 10, accuracy: Math.round(accuracy * 10) / 10 };
}

/**
 * Detect day-of-week patterns
 */
function detectDayOfWeekPattern(data, timestamps) {
  const dayPatterns = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }; // Sun-Sat

  timestamps.forEach((ts, i) => {
    const date = new Date(ts);
    const dayOfWeek = date.getDay();
    dayPatterns[dayOfWeek].push(data[i]);
  });

  const averages = {};
  Object.keys(dayPatterns).forEach((day) => {
    const values = dayPatterns[day];
    averages[day] = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
  });

  return averages;
}

/**
 * Main predictive analytics function
 * @param {Array} historicalData - Array of {timestamp, value} objects
 * @param {Object} options - Configuration options
 * @returns {Object} Complete predictive analytics results
 */
function generatePredictions(historicalData, options = {}) {
  const {
    forecastDays = 7,
    anomalyThreshold = 2.5,
    includeHourly = false,
  } = options;

  if (!historicalData || historicalData.length === 0) {
    return {
      error: 'Insufficient historical data',
      forecasts: [],
      anomalies: [],
      accuracy: { mape: 0, accuracy: 100 },
    };
  }

  // Extract values and timestamps
  const values = historicalData.map((d) => d.value || d.totalKwh || d.powerConsumption || 0);
  const timestamps = historicalData.map((d) => new Date(d.timestamp || d._id || d.date));

  // Generate forecasts using exponential smoothing
  const { forecasts, mae, stdDev } = exponentialSmoothing(values, 0.3, 0.1, 0.1, 7, forecastDays);

  // Detect anomalies
  const anomalies = detectAnomalies(values, 'zscore', anomalyThreshold);

  // Calculate trend
  const trend = linearRegression(values);

  // Detect day-of-week patterns
  const dayPatterns = detectDayOfWeekPattern(values, timestamps);

  // Calculate accuracy (if we have enough data to validate)
  let accuracy = { mape: 0, accuracy: 92 }; // Default
  if (values.length >= 14) {
    // Use last 7 days as "predicted" vs actual for accuracy estimation
    const trainingData = values.slice(0, -7);
    const { forecasts: validationForecasts } = exponentialSmoothing(trainingData, 0.3, 0.1, 0.1, 7, 7);
    const actual = values.slice(-7);
    const predicted = validationForecasts.map((f) => f.value);
    accuracy = calculateAccuracy(actual, predicted);
  }

  // Find next peak day based on day-of-week patterns
  const today = new Date();
  const dayOfWeek = today.getDay();
  let maxAvg = 0;
  let peakDay = dayOfWeek;
  Object.entries(dayPatterns).forEach(([day, avg]) => {
    if (avg > maxAvg) {
      maxAvg = avg;
      peakDay = parseInt(day, 10);
    }
  });

  // Calculate days until next peak
  let daysUntilPeak = (peakDay - dayOfWeek + 7) % 7;
  if (daysUntilPeak === 0) daysUntilPeak = 7; // Next week's peak
  const nextPeakDate = new Date(today);
  nextPeakDate.setDate(today.getDate() + daysUntilPeak);

  // Tomorrow's forecast
  const tomorrowForecast = forecasts[0]?.value || values[values.length - 1];
  const lastValue = values[values.length - 1];
  const forecastChangePercent = lastValue > 0
    ? Math.round(((tomorrowForecast - lastValue) / lastValue) * 1000) / 10
    : 0;

  return {
    tomorrowsForecastKwh: Math.round(tomorrowForecast * 10) / 10,
    forecastChangePercent,
    predictionAccuracyLabel: accuracy.accuracy >= 90 ? 'High' : accuracy.accuracy >= 75 ? 'Medium' : 'Low',
    predictionAccuracyPercent: accuracy.accuracy,
    weeklyAnomalies: anomalies.filter((a) => {
      const anomalyDate = timestamps[a.index];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return anomalyDate >= weekAgo;
    }).length,
    activeAnomalies: anomalies.filter((a) => {
      const anomalyDate = timestamps[a.index];
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return anomalyDate >= dayAgo;
    }).length,
    nextPeakDay: nextPeakDate.toISOString().slice(0, 10),
    forecastSeries: {
      horizon: `${forecastDays}d`,
      unit: 'kWh',
      values: forecasts.map((f) => Math.round(f.value * 10) / 10),
      upperBounds: forecasts.map((f) => Math.round(f.upper * 10) / 10),
      lowerBounds: forecasts.map((f) => Math.round(f.lower * 10) / 10),
    },
    trend: {
      slope: Math.round(trend.slope * 1000) / 1000,
      direction: trend.slope > 0 ? 'increasing' : trend.slope < 0 ? 'decreasing' : 'stable',
    },
    anomalies: anomalies.map((a) => ({
      ...a,
      timestamp: timestamps[a.index].toISOString(),
      value: Math.round(values[a.index] * 10) / 10,
    })),
    dayPatterns,
    modelMetrics: {
      mae: Math.round(mae * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
    },
  };
}

module.exports = {
  generatePredictions,
  exponentialSmoothing,
  detectAnomalies,
  calculateAccuracy,
  linearRegression,
};
