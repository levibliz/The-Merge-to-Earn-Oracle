import { ethers } from 'ethers';
import { ValidationError } from './errors.js';

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function extractAddressFromBio(bio: string | null | undefined): string {
  if (!bio) {
    throw new ValidationError('GitHub user has no bio configured');
  }

  const match = bio.match(ADDRESS_REGEX);
  if (!match) {
    throw new ValidationError(
      'No valid Ethereum address found in GitHub bio. Expected format: 0x... (42 chars)',
    );
  }

  const address = ethers.getAddress(match[0]!);
  return address;
}
