// One definition of an active entitlement for the client, matching what the
// server already enforces in api/portal/animation.js, api/portal/activity.js
// and api/certificate/[workshopId].js. A null expires_at means no expiry.
//
// This exists because the client gate used to ignore expires_at entirely while
// every server gate checked it. For the ten animation-* tools that divergence
// was contained -- the server refuses to serve the HTML -- but the four
// client-only tools (spring-load-calculator, springs-101,
// reformer-force-modeler, class-simulator) have no server gate at all, so an
// expired entitlement granted full working access to them.
export function isActiveEntitlement(entitlement) {
  if (!entitlement) return false
  if (!entitlement.expires_at) return true
  return new Date(entitlement.expires_at) > new Date()
}
