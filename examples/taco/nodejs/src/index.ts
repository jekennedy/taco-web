import { format } from 'node:util';

import {
  conditions,
  decrypt,
  domains,
  encrypt,
  fromBytes,
  getPorterUri,
  initialize,
  ThresholdMessageKit,
  toBytes,
  toHexString,
} from '@nucypher/taco';
import { CustomContextParam } from '@nucypher/taco/src/conditions/context';
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

const rpcProviderUrl = process.env.RPC_PROVIDER_URL;
if (!rpcProviderUrl) {
  throw new Error('RPC_PROVIDER_URL is not set.');
}

const encryptorPrivateKey = process.env.ENCRYPTOR_PRIVATE_KEY;
if (!encryptorPrivateKey) {
  throw new Error('ENCRYPTOR_PRIVATE_KEY is not set.');
}

const consumerPrivateKey = process.env.CONSUMER_PRIVATE_KEY;
if (!consumerPrivateKey) {
  throw new Error('CONSUMER_PRIVATE_KEY is not set.');
}

const oidcIssuer = process.env.OIDC_ISSUER;
if (!oidcIssuer) {
  throw new Error('OIDC_ISSUER is not set.');
}

const oidcAccessTokenTest = process.env.OIDC_ACCESS_TOKEN_TEST;
if (!oidcAccessTokenTest) {
  throw new Error('OIDC_ACCESS_TOKEN_TEST is not set.');
}

const domain = process.env.DOMAIN || domains.TESTNET;
const ritualId = parseInt(process.env.RITUAL_ID || '0');
const provider = new ethers.providers.JsonRpcProvider(rpcProviderUrl);

console.log('Domain:', domain);
console.log('Ritual ID:', ritualId);

const encryptToBytes = async (messageString: string) => {
  const encryptorSigner = new ethers.Wallet(encryptorPrivateKey);
  console.log(
    "Encryptor signer's address:",
    await encryptorSigner.getAddress(),
  );

  const message = toBytes(messageString);
  console.log(format('Encrypting message ("%s") ...', messageString));

  const ownsEmail = new conditions.base.email.OwnsEmailCondition({
    issuer: oidcIssuer,
    parameters: [':accessToken'],
  });
  console.assert(ownsEmail.requiresSigner(), 'Condition requires signer');

  const messageKit = await encrypt(
    provider,
    domain,
    message,
    ownsEmail,
    ritualId,
    encryptorSigner,
  );

  return messageKit.toBytes();
};

const decryptFromBytes = async (encryptedBytes: Uint8Array) => {
  const consumerSigner = new ethers.Wallet(consumerPrivateKey);
  console.log("\nConsumer signer's access token:", oidcAccessTokenTest);

  const messageKit = ThresholdMessageKit.fromBytes(encryptedBytes);
  console.log('Decrypting message ...');
  const customParameters: Record<string, CustomContextParam> = {
    ':accessToken': oidcAccessTokenTest,
  };
  return decrypt(
    provider,
    domain,
    messageKit,
    getPorterUri(domain),
    consumerSigner,
    customParameters,
  );
};

const runExample = async () => {
  // Make sure the provider is connected to Polygon Amoy testnet
  const network = await provider.getNetwork();
  if (network.chainId !== 80002) {
    console.error('Please connect to Polygon Amoy testnet');
  }
  await initialize();

  const messageString = 'This is a secret 🤐';
  const encryptedBytes = await encryptToBytes(messageString);
  console.log('Ciphertext: ', toHexString(encryptedBytes));

  const decryptedBytes = await decryptFromBytes(encryptedBytes);
  const decryptedMessageString = fromBytes(decryptedBytes);
  console.log('Decrypted message:', decryptedMessageString);

  console.assert(
    decryptedMessageString === messageString,
    'Decrypted message is different to original message',
  );
};

runExample().then(() => {
  console.log('Example finished');
});
