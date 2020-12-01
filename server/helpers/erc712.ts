import sigUtil from 'eth-sig-util';

//FIXME: This is a copy of ERC12 Signature Verification https://github.com/openlawteam/laoland/commits/vote-erc712
//FIXME: once snapshot.js gets published with ERC712 validation we should replace this class with the new library.

const getProposalDomainType = (verifyingContract, chainId) => {
  const DomainType = {
    name: 'Snapshot Message',
    version: '1',
    chainId,
    verifyingContract
  };

  const MessageType = {
    Message: [
      { name: 'versionHash', type: 'bytes32' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'spaceHash', type: 'bytes32' },
      { name: 'payload', type: 'MessagePayload' }
    ],
    MessagePayload: [
      { name: 'nameHash', type: 'bytes32' },
      { name: 'bodyHash', type: 'bytes32' },
      { name: 'choices', type: 'string[]' },
      { name: 'start', type: 'uint256' },
      { name: 'end', type: 'uint256' },
      { name: 'snapshot', type: 'uint256' },
      { name: 'metadataHash', type: 'bytes32' }
    ]
  };

  return { DomainType, MessageType };
};

const getVoteDomainType = (verifyingContract, chainId) => {
  const DomainType = {
    name: 'Snapshot Message',
    version: '1',
    chainId,
    verifyingContract
  };

  // The named list of all type definitions
  const MessageType = {
    Message: [
      { name: 'versionHash', type: 'bytes32' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'spaceHash', type: 'bytes32' },
      { name: 'payload', type: 'MessagePayload' }
    ],
    MessagePayload: [
      { name: 'choice', type: 'uint256' },
      { name: 'proposalHash', type: 'bytes32' },
      { name: 'metadataHash', type: 'bytes32' }
    ]
  };

  return { DomainType, MessageType };
};

const getDomainType = (message, verifyingContract, chainId) => {
  switch (message.type) {
    case 'vote':
      return getVoteDomainType(verifyingContract, chainId);
    case 'proposal':
      return getProposalDomainType(verifyingContract, chainId);
    default:
      throw new Error('unknown type ' + message.type);
  }
};

export const verifySignatureERC712 = (
  message,
  address,
  verifyingContract,
  chainId,
  signature
) => {
  const { DomainType, MessageType } = getDomainType(
    message,
    verifyingContract,
    chainId
  );

  const msgParams = {
    domain: DomainType,
    message: message,
    primaryType: 'Message',
    types: MessageType
  };

  const recoverAddress = sigUtil.recoverTypedSignature_v4({
    data: msgParams,
    sig: signature
  });

  return address.toLowerCase() === recoverAddress.toLowerCase();
};
