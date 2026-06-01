/**
 * Optional near–real-time poller: upserts Hyderabad JSON feed on an interval.
 * Enable with HYDERABAD_ENABLE_POLLER=true in server .env
 */

const DEFAULT_MS = 5 * 60 * 1000;

function startHyderabadPoller() {
    const url = process.env.HYDERABAD_LISTINGS_FEED_URL;
    const secret = process.env.HYDERABAD_JOB_SECRET;
    const port = process.env.PORT || 5000;
    const interval = parseInt(process.env.HYDERABAD_POLL_INTERVAL_MS, 10) || DEFAULT_MS;

    if (!url || !secret) {
        console.warn('[Hyderabad poller] Disabled (need HYDERABAD_LISTINGS_FEED_URL + HYDERABAD_JOB_SECRET)');
        return;
    }

    const tick = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:${port}/api/geo/hyderabad/sync-feed`, {
                method: 'POST',
                headers: {
                    'x-hyderabad-job-key': secret,
                    'Content-Type': 'application/json',
                },
            });
            const text = await res.text();
            if (!res.ok) {
                console.error('[Hyderabad poller] sync failed', res.status, text);
            } else {
                console.log('[Hyderabad poller] sync ok', text);
            }
        } catch (e) {
            console.error('[Hyderabad poller]', e.message);
        }
    };

    console.log(`[Hyderabad poller] Every ${interval}ms → ${url}`);
    setTimeout(tick, 8000);
    setInterval(tick, interval);
}

module.exports = { startHyderabadPoller };
