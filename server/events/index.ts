/**
 * THIS FILE HAS BEEN COPIED AND MODIFIED
 * FROM SNAPSHOT HUB FOR THE PURPOSES OF
 * ADOPTING EVENTS AND WEBHOOKS IN THIS FORK.
 *
 * @see https://github.com/snapshot-labs/snapshot-hub
 * @see https://github.com/snapshot-labs/snapshot-hub/tree/master/src/events
 */

import fetch from 'cross-fetch';
import { QueryResult, QueryResultRow } from 'pg';

import db from '../helpers/postgres';

type Subscribers = {
  url: string;
  spaces?: string[];
}[];

type EventsDB = {
  event: string;
  expire: number;
  id: string;
  space: string;
};

const DELAY = 5;
const INTERVAL = 30;
const SERVICE_EVENTS_ACTIVE = parseInt(process.env.SERVICE_EVENTS || '0');

/**
 * Gets subscribers JSON by environment (e.g. `local`, `dev`, `prod`)
 * from `./subscribers/`.
 *
 * @returns `Subscribers`
 */
const getSubscribersFromFile = async (): Promise<Subscribers> => {
  return await import(`./subscribers/${process.env.ENV}.json`);
};

async function sendEvent(event, to) {
  const res = await fetch(to, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
  return res.json();
}

async function processEvents() {
  const ts = parseInt((Date.now() / 1e3).toFixed()) - DELAY;
  const events = await db.query<EventsDB>(
    'SELECT * FROM events WHERE expire <= ?',
    [ts]
  );

  const subscribers = await getSubscribersFromFile();

  console.log('Process event start', ts, events.rows.length);

  for (const event of events.rows) {
    Promise.all(
      subscribers
        .filter(
          subscriber =>
            !subscriber?.spaces || subscriber?.spaces.includes(event.space)
        )
        .map(subscriber => sendEvent(event, subscriber?.url))
    )
      .then(() => console.log('Process event done'))
      .catch(e => console.log('Process event failed', e));

    try {
      await db.query('DELETE FROM events WHERE id = ? AND event = ? LIMIT 1', [
        event.id,
        event.event
      ]);

      console.log(`Event sent ${event.id} ${event.event}`);
    } catch (e) {
      console.log(e);
    }
  }
}

if (SERVICE_EVENTS_ACTIVE) {
  setInterval(async () => await processEvents(), INTERVAL * 1e3);
}
