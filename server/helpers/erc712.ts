//FIXME: This is a copy of ERC12 Signature Verification https://github.com/openlawteam/laoland/commits/vote-erc712
//FIXME: once snapshot.js gets published with ERC712 validation we should replace this class with the new library.
import { recoverTypedSignature_v4 } from 'eth-sig-util';

const getDomainType = () => {
  return [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
    { name: 'actionId', type: 'address' }
  ];
};

const getMessageDomainType = (chainId, verifyingContract, actionId) => {
  return {
    name: 'Snapshot Message',
    version: '4',
    chainId,
    verifyingContract,
    actionId
  };
};

const getVoteDomainDefinition = (verifyingContract, actionId, chainId) => {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  // The named list of all type definitions
  const types = {
    Message: [
      { name: 'timestamp', type: 'uint256' },
      { name: 'token', type: 'string' },
      { name: 'type', type: 'string' },
      { name: 'space', type: 'string' },
      { name: 'payload', type: 'MessagePayload' }
    ],
    MessagePayload: [
      { name: 'choice', type: 'uint256' },
      { name: 'proposalIpfsHash', type: 'string' }
    ],
    EIP712Domain: getDomainType()
  };

  return { domain, types };
};

const getProposalDomainDefinition = (verifyingContract, actionId, chainId) => {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: 'timestamp', type: 'uint256' },
      { name: 'space', type: 'string' },
      { name: 'payload', type: 'MessagePayload' }
    ],
    MessagePayload: [
      { name: 'name', type: 'string' },
      { name: 'body', type: 'string' },
      { name: 'choices', type: 'string[]' },
      { name: 'start', type: 'uint256' },
      { name: 'end', type: 'uint256' },
      { name: 'snapshot', type: 'string' }
    ],
    EIP712Domain: getDomainType()
  };

  return { domain, types };
};

const getDraftDomainDefinition = (verifyingContract, actionId, chainId) => {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: 'timestamp', type: 'uint256' },
      { name: 'space', type: 'string' },
      { name: 'payload', type: 'MessagePayload' }
    ],
    MessagePayload: [
      { name: 'name', type: 'string' },
      { name: 'body', type: 'string' },
      { name: 'choices', type: 'string[]' }
    ],
    EIP712Domain: getDomainType()
  };

  return { domain, types };
};

const getDomainDefinition = (message, verifyingContract, actionId, chainId) => {
  switch (message.type) {
    case 'draft':
      return getDraftDomainDefinition(verifyingContract, actionId, chainId);
    case 'vote':
      return getVoteDomainDefinition(verifyingContract, actionId, chainId);
    case 'proposal':
      return getProposalDomainDefinition(verifyingContract, actionId, chainId);
    default:
      throw new Error('unknown type ' + message.type);
  }
};

const verifySignature = (
  message,
  address,
  verifyingContract,
  actionId,
  chainId,
  signature
) => {
  const { domain, types } = getDomainDefinition(
    message,
    verifyingContract,
    actionId,
    chainId
  );

  const msgParams = {
    domain,
    message,
    primaryType: 'Message',
    types
  };

  const recoverAddress = recoverTypedSignature_v4({
    data: msgParams,
    sig: signature
  });
  return address.toLowerCase() === recoverAddress.toLowerCase();
};

export default verifySignature;
