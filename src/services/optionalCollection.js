import { app } from '../../firebaseConfig';

let analyticsModulePromise;
let analyticsInstance;
let performanceModulePromise;
let performanceInstance;

async function setAnalyticsEnabled(enabled) {
  if (!enabled && !analyticsInstance) return;
  analyticsModulePromise ||= import('firebase/analytics');
  const analytics = await analyticsModulePromise;
  if (enabled) {
    if (!(await analytics.isSupported())) return;
    analyticsInstance ||= analytics.initializeAnalytics(app, {
      config: {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      },
    });
  }
  if (analyticsInstance) analytics.setAnalyticsCollectionEnabled(analyticsInstance, enabled);
}

async function setPerformanceEnabled(enabled) {
  if (!enabled && !performanceInstance) return;
  performanceModulePromise ||= import('firebase/performance');
  const performance = await performanceModulePromise;
  if (enabled) {
    performanceInstance ||= performance.initializePerformance(app, {
      instrumentationEnabled: true,
      dataCollectionEnabled: true,
    });
  }
  if (performanceInstance) {
    performanceInstance.instrumentationEnabled = enabled;
    performanceInstance.dataCollectionEnabled = enabled;
  }
}

export async function applyOptionalCollectionPreferences(preferences = {}) {
  await Promise.allSettled([
    setAnalyticsEnabled(preferences.analyticsCookies === true),
    setPerformanceEnabled(preferences.performanceInfo === true),
  ]);
}
