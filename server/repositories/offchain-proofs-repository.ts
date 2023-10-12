import {
  OffchainProof,
  postgresOffchainProofsRepository
} from '../helpers/adapters/postgres';
import { useMongoPersistence } from '../index.js';
import { mongoOffchainProofsRepository } from './mongo/mongo-offchain-proofs-repository.js';

export type OffchainProofsRepository = {
  getOffchainProof: (
    space: string,
    merkleRoot: string
  ) => Promise<OffchainProof[]>;
  saveOffchainProof: (offchainProof: OffchainProof) => Promise<void>;
};
export const offchainProofsRepository: OffchainProofsRepository = useMongoPersistence
  ? mongoOffchainProofsRepository
  : postgresOffchainProofsRepository;
