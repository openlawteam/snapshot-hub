import { postgresEventsRepository } from '../helpers/adapters/postgres';
import { EventsDB } from '../models/event.js';

export type EventsRepository = {
  getExpiredEvents: (timestamp: number) => Promise<EventsDB[]>;
  deleteProcessedEvent: (event: EventsDB) => Promise<void>;
  insertCreatedProposal: (
    EVENT_ID: string,
    space: string,
    timestamp: number
  ) => Promise<void>,
  insertStartedProposal: (
    EVENT_ID: string,
    space: string,
    timestamp: number
  ) => Promise<void>
  insertProposalEnd: (
    EVENT_ID: string,
    space: string,
    timestamp: number
  ) => Promise<void>
};

export const eventsRepository: EventsRepository = postgresEventsRepository;
