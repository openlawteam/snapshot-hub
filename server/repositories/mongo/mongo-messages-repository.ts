import {
  Message,
  MessageWithVotes,
  VoteMessage
} from '../../models/message.js';
import { snapshotHubMongoDb } from '../../index.js';
import { MessagesRepository } from '../messages-repository.js';
import { toVotesMessageJson } from '../../helpers/utils.js';

const getMessages: (
  space: string,
  msgType: string
) => Promise<Message[]> = async (space, msgType) => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection
    .find<Message>({ space, type: msgType }, { sort: { timestamp: -1 } })
    .toArray()
    .then((result: Message[]) => {
      console.log(result.length);
      return result;
    });
};

const getMessagesByAction: (
  space: string,
  actionId: string,
  msgType: string
) => Promise<Message[]> = async (space, actionId, msgType) => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection
    .find<Message>(
      { space, type: msgType, actionId },
      { sort: { timestamp: -1 } }
    )
    .toArray()
    .then((result: Message[]) => {
      console.log(result.length);
      return result;
    });
};

const getMessagesById: (
  space: string,
  id: string,
  msgType: string
) => Promise<Message[]> = async (space, id, msgType) => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection
    .find<Message>({ space, type: msgType, id })
    .toArray()
    .then((result: Message[]) => {
      console.log(result.length);
      return result;
    });
};

const getVoteBySender: (
  space: string,
  address: string,
  proposalId: string
) => Promise<Message[]> = async (space, address, proposalId) => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection
    .find<Message>({
      space,
      address,
      'payload.proposalId': proposalId,
      type: 'vote'
    })
    .toArray()
    .then((result: Message[]) => {
      console.log(result.length);
      return result;
    });
};

const getProposalByDraft: (
  space: string,
  id: string
) => Promise<Message[]> = async (space, id) => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection
    .find<Message>({
      space,
      'data.erc712DraftHash': id,
      type: 'proposal'
    })
    .toArray()
    .then((result: Message[]) => {
      console.log(result.length);
      return result;
    });
};

const getProposalVotes: (
  space: string,
  id: string
) => Promise<Message[]> = async (space, id) => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection
    .find<Message>(
      {
        space,
        'payload.proposalId': id,
        type: 'vote'
      },
      { sort: { timestamp: 1 } }
    )
    .toArray()
    .then((result: Message[]) => {
      console.log(result.length);
      return result;
    });
};

const getAllProposalsAndVotes: (
  space: string
) => Promise<MessageWithVotes[]> = async space => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection
    .find<MessageWithVotes>({ space, type: 'proposal' })
    .toArray()
    .then((result: MessageWithVotes[]) => {
      console.log(result.length);
      return result;
    });
};

const getAllProposalsAndVotesByAction: (
  space: string,
  actionId: string
) => Promise<MessageWithVotes[]> = async (space, actionId) => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection
    .find<MessageWithVotes>(
      {
        space,
        type: 'proposal',
        actionId: actionId
      },
      { sort: { timestamp: -1 } }
    )
    .toArray()
    .then((result: MessageWithVotes[]) => {
      console.log(result.length);
      return result;
    });
};

const getAllDraftsExceptSponsored: (
  space: string
) => Promise<Message[]> = async space => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection
    .find<Message>(
      {
        space,
        type: 'draft',
        'data.sponsored': false
      },
      { sort: { timestamp: 1 } }
    )
    .toArray()
    .then((result: MessageWithVotes[]) => {
      console.log(result.length);
      return result;
    });
};
function formatMessageForInsertion(
  erc712Hash,
  body: {
    address: string;
    sig: string;
    msg: { version: string; timestamp: number; payload: any };
  },
  space,
  token,
  relayerIpfsHash,
  actionId,
  type: string,
  data: any
): Message {
  return {
    id: erc712Hash,
    address: body.address,
    version: body.msg.version,
    timestamp: body.msg.timestamp,
    space,
    token,
    type,
    payload: body.msg.payload,
    sig: body.sig,
    metadata: { relayerIpfsHash },
    actionId,
    data
  };
}
const storeDraft: (
  space,
  erc712Hash,
  token,
  body: {
    address: string;
    sig: string;
    msg: { version: string; timestamp: number; payload: any };
  },
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) => Promise<void> = async (
  space,
  erc712Hash,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection.insertOne(
    formatMessageForInsertion(
      erc712Hash,
      body,
      space,
      token,
      relayerIpfsHash,
      actionId,
      'draft',

      { sponsored: false, authorIpfsHash }
    )
  );
};

const storeProposal: (
  space,
  erc712Hash,
  erc712DraftHash,
  token,
  body: {
    address: string;
    sig: string;
    msg: { version: string; timestamp: number; payload: any };
  },
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) => Promise<void> = async (
  space,
  erc712Hash,
  erc712DraftHash,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection.insertOne(
    formatMessageForInsertion(
      erc712Hash,
      body,
      space,
      token,
      relayerIpfsHash,
      actionId,
      'proposal',
      { erc712DraftHash, authorIpfsHash }
    )
  );
};

const storeVote: (
  space,
  erc712Hash,
  token,
  body: {
    address: string;
    sig: string;
    msg: { version: string; timestamp: number; payload: any };
  },
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) => Promise<void> = async (
  space,
  erc712Hash,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection.insertOne(
    formatMessageForInsertion(
      erc712Hash,
      body,
      space,
      token,
      relayerIpfsHash,
      actionId,
      'vote',
      { authorIpfsHash }
    )
  );
};

const sponsorDraftIfAny: (space, erc712DraftHash) => Promise<number> = async (
  space,
  erc712DraftHash
) => {
  const db = await snapshotHubMongoDb;
  const messagesCollection = db.collection(
    process.env.MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_MESSAGES_COLLECTION_NAME
  );
  return messagesCollection.updateOne(
    { type: 'draft', space: space, id: erc712DraftHash },
    { $set: { 'data.sponsored': true } }
  );
};

const findVotesForProposals: (
  space,
  proposals
) => Promise<MessageWithVotes[]> = async (space, proposals) => {
  return Promise.all(
    proposals.map((proposal: Message) =>
      getProposalVotes(space, proposal.id)
        .then((votes: Message[]) =>
          votes && votes.length > 0 ? toVotesMessageJson(votes) : []
        )
        .then((votes: VoteMessage[]) => ({
          ...proposal,
          votes
        }))
    )
  );
};

export const mongoMessagesRepository: MessagesRepository = {
  getMessages,
  getMessagesByAction,
  getMessagesById,
  getVoteBySender,
  getProposalByDraft,
  getProposalVotes,
  getAllProposalsAndVotes,
  getAllProposalsAndVotesByAction,
  getAllDraftsExceptSponsored,
  storeDraft,
  storeProposal,
  storeVote,
  sponsorDraftIfAny,
  findVotesForProposals
};
