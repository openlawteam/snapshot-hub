import { postgresEventsRepository } from '../helpers/adapters/postgres';

export type EventsDB = {
  event: string;
  expire: number;
  id: string;
  space: string;
};
export type EventsRepository = {
  getExpiredEvents: (timestamp: number) => Promise<EventsDB[]>;
  deleteProcessedEvent: (event: EventsDB) => Promise<any>;
  insertCreatedProposal: (
    EVENT_ID: string,
    space: string,
    timestamp: number
  ) => Promise<any>,
  insertStartedProposal: (
    EVENT_ID: string,
    space: string,
    timestamp: number
  ) => Promise<any>
  insertProposalEnd: (
    EVENT_ID: string,
    space: string,
    timestamp: number
  ) => Promise<any>
};

export const eventsRepository: EventsRepository = postgresEventsRepository;
