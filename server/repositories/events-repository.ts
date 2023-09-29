import { postgresEventsRepository } from '../helpers/adapters/postgres';

export type EventsDB = {
  event: string;
  expire: number;
  id: string;
  space: string;
};
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
