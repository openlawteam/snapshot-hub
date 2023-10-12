import {
  OffchainProof,
  postgresOffchainProofsRepository
} from '../helpers/adapters/postgres';

export type OffchainProofsRepository = {
  getOffchainProof: (
    space: string,
    merkleRoot: string
  ) => Promise<OffchainProof[]>;
  saveOffchainProof: (
    offchainProof: OffchainProof
  ) => Promise<void>;
};
export const offchainProofsRepository: OffchainProofsRepository = postgresOffchainProofsRepository;
