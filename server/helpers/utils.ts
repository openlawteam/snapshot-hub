import { verifyMessage } from '@ethersproject/wallet';
import { providers } from 'ethers';
import { convertUtf8ToHex } from '@walletconnect/utils';
import * as ethUtil from 'ethereumjs-util';
import { isValidSignature } from './eip1271';

export const jsonParse = (input, fallback?) => {
  try {
    return JSON.parse(input);
  } catch (err) {
    return fallback || {};
  }
};

export const verify = async (address, msg, sig) => {
  const recovered = await verifyMessage(msg, sig);
  return recovered === address;
};

export const clone = item => {
  return JSON.parse(JSON.stringify(item));
};

export const sendError = (res, description, status = 500) => {
  console.error(description);
  return res.status(status).json({
    error: 'unauthorized',
    error_description: description
  });
};

export const recoverPublicKey = (sig: string, hash: string): string => {
  const params = ethUtil.fromRpcSig(sig);
  const result = ethUtil.ecrecover(
    ethUtil.toBuffer(hash),
    params.v,
    params.r,
    params.s
  );
  return ethUtil.bufferToHex(ethUtil.publicToAddress(result));
};

export const verifySignature = async (
  address: string,
  sig: string,
  hash: string
  // chainId: number
): Promise<boolean> => {
  const provider = new providers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
  return provider
    .getCode(address)
    .then(bytecode => {
      if (
        !bytecode ||
        bytecode === '0x' ||
        bytecode === '0x0' ||
        bytecode === '0x00'
      ) {
        const signer = recoverPublicKey(sig, hash);
        return signer.toLowerCase() === address.toLowerCase();
      } else {
        console.log('Smart contract signature');
        return isValidSignature(address, sig, hash, provider);
      }
    })
    .catch(error => {
      console.error(error);
      return false;
    });
};

export const encodePersonalMessage = (msg: string): string => {
  const data = ethUtil.toBuffer(convertUtf8ToHex(msg));
  const buf = Buffer.concat([
    Buffer.from(
      '\u0019Ethereum Signed Message:\n' + data.length.toString(),
      'utf8'
    ),
    data
  ]);
  return ethUtil.bufferToHex(buf);
};

export const hashPersonalMessage = (msg: string): string => {
  const data = encodePersonalMessage(msg);
  const buf = ethUtil.toBuffer(data);
  const hash = ethUtil.keccak256(buf);
  return ethUtil.bufferToHex(hash);
};

export const toMessageJson = (messages: any): any =>
  Object.fromEntries(
    messages.map(message => {
      return [
        message.type === 'vote' ? message.address : message.id,
        {
          address: message.address,
          data: message.data,
          msg: {
            version: message.version,
            timestamp: message.timestamp.toString(),
            token: message.token,
            type: message.type,
            payload: message.payload
          },
          sig: message.sig,
          authorIpfsHash: message.id,
          relayerIpfsHash: message.metadata.relayerIpfsHash,
          actionId: message.actionId
        },
      ];
    })
  );

export const toVoteMessageJson = (message: any): any => {
  return {
    [message.address]: {
      id: message.id,
      address: message.address,
      data: message.data,
      msg: {
        version: message.version,
        timestamp: message.timestamp.toString(),
        token: message.token,
        type: message.type,
        payload: message.payload
      },
      sig: message.sig,
      authorIpfsHash: message.id,
      relayerIpfsHash: message.metadata.relayerIpfsHash,
      actionId: message.actionId
    }
  };
};

export const toVotesMessageJson = (messages: any): any =>
  messages.map(m => toVoteMessageJson(m));

export const toProposalWithVotesMessageJson = (messages: any): any =>
  Object.fromEntries(
    messages.map(message => {
      return [
        message.id,
        {
          address: message.address,
          data: message.data,
          msg: {
            version: message.version,
            timestamp: message.timestamp.toString(),
            token: message.token,
            type: message.type,
            payload: message.payload
          },
          votes: message.votes,
          sig: message.sig,
          authorIpfsHash: message.id,
          relayerIpfsHash: message.metadata.relayerIpfsHash,
          actionId: message.actionId
        }
      ];
    })
  );
