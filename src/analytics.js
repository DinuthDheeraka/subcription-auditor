/**
 * Google Analytics 4 — Custom Event Tracking
 * 
 * These fire custom events to GA4 so you can see:
 * - Which subscriptions people add most
 * - Which tabs they use
 * - How long they stay on projections
 * - Conversion: did they set a cancel reminder?
 * 
 * View these in: GA4 → Reports → Engagement → Events
 */

function gtag(...args) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

// Track when user adds a subscription (preset or custom)
export function trackAddSubscription(name, price, category, isPreset) {
  gtag('event', 'add_subscription', {
    subscription_name: name,
    subscription_price: price,
    subscription_category: category,
    is_preset: isPreset,
  });
}

// Track when user removes a subscription
export function trackRemoveSubscription(name) {
  gtag('event', 'remove_subscription', {
    subscription_name: name,
  });
}

// Track tab/view changes
export function trackViewChange(viewName) {
  gtag('event', 'page_view_internal', {
    view_name: viewName,
  });
}

// Track projection year changes
export function trackProjectionChange(years) {
  gtag('event', 'projection_change', {
    projection_years: years,
  });
}

// Track total monthly when user finishes adding (fire on dashboard view)
export function trackAuditSummary(totalMonthly, totalYearly, subCount) {
  gtag('event', 'audit_summary', {
    total_monthly: totalMonthly,
    total_yearly: totalYearly,
    subscription_count: subCount,
  });
}
