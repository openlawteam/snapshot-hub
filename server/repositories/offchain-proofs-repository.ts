import { postgresOffchainProofsRepository } from '../helpers/adapters/postgres';

export type OffchainProofsRepository = {
  getOffchainProof: (space: string, merkleRoot: string) => Promise<any[]>;
  saveOffchainProof: (
    space: string,
    merkleRoot: string,
    steps: Record<string, any>[]
  ) => Promise<void>;
};
export const offchainProofsRepository: OffchainProofsRepository = postgresOffchainProofsRepository;
