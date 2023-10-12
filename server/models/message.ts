export type Message = {
  id: string;
  address: string;
  version: string;
  timestamp: number;
  space?: string;
  token?: string;
  type: string;
  payload?: string;
  sig: string;
  metadata?: {
    relayerIpfsHash: string;
  };
  actionId: string;
  data?: string;
};
export type VoteMessage = {
  [address: string]: {
    id: string;
    address: string;
    data?: string;
    msg: {
      version: string;
      timestamp: string;
      token?: string;
      type: string;
      payload?: string;
    };
    sig: string;
    authorIpfsHash: string;
    relayerIpfsHash?: string;
    actionId: string;
  };
};
export type MessageWithVotes = Message & { votes: VoteMessage[] };
export type ProposalWithVotesMessage = {
  [id: string]: MessageWithVotes;
};
