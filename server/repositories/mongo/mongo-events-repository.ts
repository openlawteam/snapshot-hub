import { EventsRepository } from '../events-repository.js';
import { snapshotHubMongoDb } from '../../index.js';
import { Event } from '../../models/event.js';

const getExpiredEvents: (
  timestamp: number
) => Promise<Event[]> = async timestamp => {
  const db = await snapshotHubMongoDb;
  const eventsCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_EVENTS_COLLECTION_NAME
  );
  return eventsCollection.find({ timestamp: { $lte: timestamp } });
};

const deleteProcessedEvent: (event: Event) => Promise<void> = async event => {
  const db = await snapshotHubMongoDb;
  const eventsCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_EVENTS_COLLECTION_NAME
  );
  return eventsCollection.deleteOne({ id: event.id, event: event.event });
};

const insertCreatedProposal: (
  EVENT_ID: string,
  space: string,
  timestamp: number
) => Promise<void> = async (EVENT_ID, space, timestamp) => {
  const db = await snapshotHubMongoDb;
  const eventsCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_EVENTS_COLLECTION_NAME
  );
  return eventsCollection.insertOne({
    id: EVENT_ID,
    event: 'proposal/created',
    space: space,
    expire: timestamp
  });
};

const insertStartedProposal: (
  EVENT_ID: string,
  space: string,
  timestamp: number
) => Promise<void> = async (EVENT_ID, space, timestamp) => {
  const db = await snapshotHubMongoDb;
  const eventsCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_EVENTS_COLLECTION_NAME
  );
  return eventsCollection.insertOne({
    id: EVENT_ID,
    event: 'proposal/start',
    space: space,
    expire: timestamp
  });
};

const insertProposalEnd: (
  EVENT_ID: string,
  space: string,
  timestamp: number
) => Promise<void> = async (EVENT_ID, space, timestamp) => {
  const db = await snapshotHubMongoDb;
  const eventsCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_EVENTS_COLLECTION_NAME
  );
  return eventsCollection.insertOne({
    id: EVENT_ID,
    event: 'proposal/end',
    space: space,
    expire: timestamp
  });
};


export const mongoEventsRepository: EventsRepository = {
  getExpiredEvents,
  deleteProcessedEvent,
  insertCreatedProposal,
  insertStartedProposal,
  insertProposalEnd
};
