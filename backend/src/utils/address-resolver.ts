import { StrKey } from '@stellar/stellar-sdk';
import { ValidationError } from './errors.js';

const STELLAR_ADDRESS_REGEX = /^G[A-Z0-9]{55}$/;

export function extractAddressFromBio(bio: string | null | undefined): string {
  if (!bio) {
    throw new ValidationError('GitHub user has no bio configured');
  }

  const match = bio.match(STELLAR_ADDRESS_REGEX);
  if (!match) {
    throw new ValidationError(
      'No valid Stellar address found in GitHub bio. Expected format: G... (56 chars)',
    );
  }

  const address = match[0]!;
  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new ValidationError('Invalid Stellar address checksum in GitHub bio');
  }

  return address;
}
