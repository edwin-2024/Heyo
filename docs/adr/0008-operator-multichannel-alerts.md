# 0008. Operator Multichannel Alerts for Human Handoff

## Context
When a conversation state switches to `WAITING_HUMAN`, the human operator must be alerted immediately to prevent visitor abandonment. If the operator only looks at visual inbox counts while working in another tab, handoff latency will breach acceptable thresholds.

## Decision
We implement a three-tier alert system in the Operator Dashboard:
1. **Audio Chime**: An audible ping generated via Web Audio API when a new handoff event arrives.
2. **Visual Badges**: Dynamic favicon badge and high-contrast red counter on the "Needs Human" inbox filter.
3. **Browser Desktop Notifications**: Standard HTML5 Web Notifications API request (`Notification.requestPermission()`) to trigger OS-level push banners when the dashboard tab is running in the background.

## Consequences
- Operator first-response time is minimized even when the dashboard tab is minimized.
- Operator can toggle sound preferences on/off in dashboard settings.
