import {
  FerveoVariant,
  initialize,
  SessionStaticSecret,
} from '@nucypher/nucypher-core';
import {
  aliceSecretKeyBytes,
  fakeDkgFlow,
  fakePorterUri,
  fakeProvider,
  fakeSigner,
  fakeTDecFlow,
  mockGetRitualIdFromPublicKey,
  mockTacoDecrypt,
  TEST_CHAIN_ID,
} from '@nucypher/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import * as taco from '../src';
import { conditions, domains, toBytes } from '../src';
import { OwnsEmailCondition } from '../src/conditions/base/email';
import { CustomContextParam } from '../src/conditions/context';
import { OIDCAuthenticationProvider } from '../src/conditions/context/providers';

import {
  fakeDkgRitual,
  mockDkgParticipants,
  mockGetActiveRitual,
  mockGetParticipants,
  mockMakeSessionKey,
  testOwnsEmailConditionObj,
} from './test-utils';

// Shared test variables
const message = 'this is a secret';
const ownsNFT = new conditions.predefined.erc721.ERC721Ownership({
  contractAddress: '0x1e988ba4692e52Bc50b375bcC8585b95c48AaD77',
  parameters: [3591],
  chain: TEST_CHAIN_ID,
});

describe('taco', () => {
  beforeAll(async () => {
    await initialize();
  });

  it('encrypts and decrypts with OwnsEmailCondition', async () => {
    const ownsEmailCondition = new OwnsEmailCondition(
      testOwnsEmailConditionObj,
    );

    const mockedDkg = fakeDkgFlow(FerveoVariant.precomputed, 0, 4, 4);
    const mockedDkgRitual = fakeDkgRitual(mockedDkg);
    const provider = fakeProvider(aliceSecretKeyBytes);
    const signer = fakeSigner(aliceSecretKeyBytes);
    const getFinalizedRitualSpy = mockGetActiveRitual(mockedDkgRitual);

    // Mock OIDCAuthenticationProvider.getUserEmail
    const getUserEmailMock = vi
      .fn()
      .mockResolvedValue('mocked-email@example.com');
    vi.spyOn(
      OIDCAuthenticationProvider.prototype,
      'getUserEmail',
    ).mockImplementation(getUserEmailMock);

    const messageKit = await taco.encrypt(
      provider,
      domains.DEVNET,
      message,
      ownsEmailCondition,
      mockedDkg.ritualId,
      signer,
    );
    expect(getFinalizedRitualSpy).toHaveBeenCalled();

    const { decryptionShares } = fakeTDecFlow({
      ...mockedDkg,
      message: toBytes(message),
      dkgPublicKey: mockedDkg.dkg.publicKey(),
      thresholdMessageKit: messageKit,
    });
    const { participantSecrets, participants } = await mockDkgParticipants(
      mockedDkg.ritualId,
    );
    const requesterSessionKey = SessionStaticSecret.random();
    const decryptSpy = mockTacoDecrypt(
      mockedDkg.ritualId,
      decryptionShares,
      participantSecrets,
      requesterSessionKey.publicKey(),
    );
    const getParticipantsSpy = mockGetParticipants(participants);
    const sessionKeySpy = mockMakeSessionKey(requesterSessionKey);
    const getRitualIdFromPublicKey = mockGetRitualIdFromPublicKey(
      mockedDkg.ritualId,
    );
    const getRitualSpy = mockGetActiveRitual(mockedDkgRitual);

    const customParameters: Record<string, CustomContextParam> = {
      ':accessToken': 'idsjfoiwjeoifjw',
    };

    const decryptedMessage = await taco.decrypt(
      provider,
      domains.DEVNET,
      messageKit,
      fakePorterUri,
      signer,
      customParameters,
    );

    expect(getParticipantsSpy).toHaveBeenCalled();
    expect(sessionKeySpy).toHaveBeenCalled();
    expect(getRitualIdFromPublicKey).toHaveBeenCalled();
    expect(getRitualSpy).toHaveBeenCalled();
    expect(decryptSpy).toHaveBeenCalled();
    expect(getUserEmailMock).toHaveBeenCalledWith('idsjfoiwjeoifjw');
    expect(decryptedMessage).toEqual(toBytes(message));
  });

  it('encrypts and decrypts with OwnsNFT', async () => {
    const mockedDkg = fakeDkgFlow(FerveoVariant.precomputed, 0, 4, 4);
    const mockedDkgRitual = fakeDkgRitual(mockedDkg);
    const provider = fakeProvider(aliceSecretKeyBytes);
    const signer = fakeSigner(aliceSecretKeyBytes);
    const getFinalizedRitualSpy = mockGetActiveRitual(mockedDkgRitual);

    const messageKit = await taco.encrypt(
      provider,
      domains.DEVNET,
      message,
      ownsNFT,
      mockedDkg.ritualId,
      signer,
    );
    expect(getFinalizedRitualSpy).toHaveBeenCalled();

    const { decryptionShares } = fakeTDecFlow({
      ...mockedDkg,
      message: toBytes(message),
      dkgPublicKey: mockedDkg.dkg.publicKey(),
      thresholdMessageKit: messageKit,
    });
    const { participantSecrets, participants } = await mockDkgParticipants(
      mockedDkg.ritualId,
    );
    const requesterSessionKey = SessionStaticSecret.random();
    const decryptSpy = mockTacoDecrypt(
      mockedDkg.ritualId,
      decryptionShares,
      participantSecrets,
      requesterSessionKey.publicKey(),
    );
    const getParticipantsSpy = mockGetParticipants(participants);
    const sessionKeySpy = mockMakeSessionKey(requesterSessionKey);
    const getRitualIdFromPublicKey = mockGetRitualIdFromPublicKey(
      mockedDkg.ritualId,
    );
    const getRitualSpy = mockGetActiveRitual(mockedDkgRitual);

    const decryptedMessage = await taco.decrypt(
      provider,
      domains.DEVNET,
      messageKit,
      fakePorterUri,
      signer,
    );
    expect(getParticipantsSpy).toHaveBeenCalled();
    expect(sessionKeySpy).toHaveBeenCalled();
    expect(getRitualIdFromPublicKey).toHaveBeenCalled();
    expect(getRitualSpy).toHaveBeenCalled();
    expect(decryptSpy).toHaveBeenCalled();
    expect(decryptedMessage).toEqual(toBytes(message));
  });
});
