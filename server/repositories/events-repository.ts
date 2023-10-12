import { postgresEventsRepository } from '../helpers/adapters/postgres';
import { Event } from '../models/event.js';
import { useMongoPersistence } from '../index.js';
import { mongoEventsRepository } from './mongo/mongo-events-repository.js';

export type EventsRepository = {
  getExpiredEvents: (timestamp: number) => Promise<Event[]>;
  deleteProcessedEvent: (event: Event) => Promise<void>;
  insertCreatedProposal: (
    EVENT_ID: string,
    space: string,
    timestamp: number
  ) => Promise<void>;
  insertStartedProposal: (
    EVENT_ID: string,
    space: string,
    timestamp: number
  ) => Promise<void>;
  insertProposalEnd: (
    EVENT_ID: string,
    space: string,
    timestamp: number
  ) => Promise<void>;
};

export const eventsRepository: EventsRepository = useMongoPersistence
  ? mongoEventsRepository
  : postgresEventsRepository;
