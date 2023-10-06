import { postgresMessagesRepository } from '../helpers/adapters/postgres';
import { Message, MessageWithVotes } from '../models/message.js';

export type MessagesRepository = {
  getMessages: (spaces: string, msgType: string) => Promise<Message[]>;
  getMessagesByAction: (
    space: string,
    actionId: string,
    msgType: string
  ) => Promise<Message[]>;
  getMessagesById: (
    space: string,
    id: string,
    msgType: string
  ) => Promise<Message[]>;
  getVoteBySender: (
    space: string,
    address: string,
    proposalId: string
  ) => Promise<Message[]>;
  getProposalByDraft: (space: string, id: string) => Promise<Message[]>;
  getProposalVotes: (space: string, id: string) => Promise<Message[]>;
  getAllProposalsAndVotes: (space: string) => Promise<MessageWithVotes[]>;
  getAllProposalsAndVotesByAction: (
    space: string,
    actionId: string
  ) => Promise<MessageWithVotes[]>;
  getAllDraftsExceptSponsored: (space: string) => Promise<Message[]>;
  storeDraft: (
    space,
    erc712Hash,
    token,
    body,
    authorIpfsHash,
    relayerIpfsHash,
    actionId
  ) => Promise<void>,
  storeProposal: (
    space,
    erc712Hash,
    erc712DraftHash,
    token,
    body,
    authorIpfsHash,
    relayerIpfsHash,
    actionId
  ) => Promise<void>,
  storeVote:(
    space,
    erc712Hash,
    token,
    body,
    authorIpfsHash,
    relayerIpfsHash,
    actionId
  ) => Promise<void>
  sponsorDraftIfAny: (space, erc712DraftHash) => Promise<number>,
  findVotesForProposals: (space, proposals) => Promise<MessageWithVotes[]>
};



export const messagesRepository: MessagesRepository = postgresMessagesRepository;
