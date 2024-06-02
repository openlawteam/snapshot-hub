/**
 * THIS FILE HAS BEEN COPIED AND MODIFIED
 * FROM SNAPSHOT HUB FOR THE PURPOSES OF
 * ADOPTING EVENTS AND WEBHOOKS IN THIS FORK.
 *
 * @see https://github.com/snapshot-labs/snapshot-hub
 * @see https://github.com/snapshot-labs/snapshot-hub/tree/master/src/events
 */

import axios, { AxiosError } from 'axios/dist/node/axios.cjs';
import { eventsRepository } from '../repositories/events-repository';

type Subscribers = {
  url: string;
  spaces?: string[];
}[];

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
  const { default: subscribers } = await import(
    `./subscribers/${process.env.ENV}.json`
  );

  return subscribers;
};

async function sendEvent(event, to) {
  try {
    await axios.post(to, event, {
      headers: {
        'x-snapshot-hub-verify': process.env.WEBHOOK_VERIFY
      }
    });
  } catch (error) {
    const BASE_ERROR = `Failed to send event to ${to}`;

    if (error instanceof AxiosError) {
      console.error(
        BASE_ERROR,
        error.response ? error.response.data : error.toJSON()
      );
    } else {
      console.error(BASE_ERROR, error);
    }
  }
}

async function processEvents() {
  const ts = parseInt((Date.now() / 1e3).toFixed()) - DELAY;

  const events = await eventsRepository.getExpiredEvents(ts);

  const subscribers = await getSubscribersFromFile();

  console.log('Process event start', ts, events.length);

  for (const event of events) {
    Promise.all(
      subscribers
        .filter(
          subscriber =>
            !subscriber.spaces || subscriber.spaces.includes(event.space)
        )
        .map(async subscriber => await sendEvent(event, subscriber.url))
    )
      .then(() => console.log('Process event done'))
      .catch(e => console.log('Process event failed', e));

    try {
      await eventsRepository.deleteProcessedEvent(event);

      console.log(`Event sent ${event.id} ${event.event}`);
    } catch (e) {
      console.log(e);
    }
  }
}

if (SERVICE_EVENTS_ACTIVE) {
  setInterval(async () => await processEvents(), INTERVAL * 1e3);
}
