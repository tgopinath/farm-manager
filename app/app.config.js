// Extends app.json. EXPO_BASE_URL lets the web export live under a sub-path,
// e.g. the demo build inside the portfolio at /Portfolio/prototypes/farm/app.
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}) },
})
