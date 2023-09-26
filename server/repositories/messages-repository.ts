import { postgresMessagesRepository } from '../helpers/adapters/postgres';

export type MessagesRepository = {
  getMessages: (spaces: string, msgType: string) => Promise<any[]>;
  getMessagesByAction: (
    space: string,
    actionId: string,
    msgType: string
  ) => Promise<any[]>;
  getMessagesById: (
    space: string,
    id: string,
    msgType: string
  ) => Promise<any[]>;
  getVoteBySender: (
    space: string,
    address: string,
    proposalId: string
  ) => Promise<any[]>;
  getProposalByDraft: (space: string, id: string) => Promise<any[]>;
  getProposalVotes: (space: string, id: string) => Promise<any[]>;
  getAllProposalsAndVotes: (space: string) => Promise<any[]>;
  getAllProposalsAndVotesByAction: (
    space: string,
    actionId: string
  ) => Promise<any[]>;
  getAllDraftsExceptSponsored: (space: string) => Promise<any[]>;
  storeDraft: (
    space,
    erc712Hash,
    token,
    body,
    authorIpfsHash,
    relayerIpfsHash,
    actionId
  ) => Promise<any>,
  storeProposal: (
    space,
    erc712Hash,
    erc712DraftHash,
    token,
    body,
    authorIpfsHash,
    relayerIpfsHash,
    actionId
  ) => Promise<any>,
  storeVote:(
    space,
    erc712Hash,
    token,
    body,
    authorIpfsHash,
    relayerIpfsHash,
    actionId
  ) => Promise<any>
  sponsorDraftIfAny: (space, erc712DraftHash) => Promise<any>,
  findVotesForProposals: (space, proposals) => Promise<any[]>
};
export const messagesRepository: MessagesRepository = postgresMessagesRepository;
