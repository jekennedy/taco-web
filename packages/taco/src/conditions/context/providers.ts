import type { TypedDataSigner } from '@ethersproject/abstract-signer';
import { ethers } from 'ethers';
import { utils as ethersUtils } from 'ethers/lib/ethers';

import { OidcService } from '../../providers';
import { Eip712TypedData, FormattedTypedData } from '../../web3';

export interface TypedSignature {
  signature: string;
  typedData: Eip712TypedData;
  address: string;
}

interface ChainData {
  blockHash: string;
  chainId: number;
  blockNumber: number;
}

export class WalletAuthenticationProvider {
  private walletSignature?: Record<string, string>;

  constructor(
    private readonly provider: ethers.providers.Provider,
    private readonly signer: ethers.Signer,
  ) {}

  public async getOrCreateWalletSignature(): Promise<TypedSignature> {
    const address = await this.signer.getAddress();
    const storageKey = `wallet-signature-${address}`;

    // If we have a signature in localStorage, return it
    const isLocalStorage = typeof localStorage !== 'undefined';
    if (isLocalStorage) {
      const maybeSignature = localStorage.getItem(storageKey);
      if (maybeSignature) {
        return JSON.parse(maybeSignature);
      }
    }

    // If not, try returning from memory
    const maybeSignature = this.walletSignature?.[address];
    if (maybeSignature) {
      if (isLocalStorage) {
        localStorage.setItem(storageKey, maybeSignature);
      }
      return JSON.parse(maybeSignature);
    }

    // If at this point we didn't return, we need to create a new signature
    const typedSignature = await this.createWalletSignature();

    // Persist where you can
    if (isLocalStorage) {
      localStorage.setItem(storageKey, JSON.stringify(typedSignature));
    }
    if (!this.walletSignature) {
      this.walletSignature = {};
    }
    this.walletSignature[address] = JSON.stringify(typedSignature);
    return typedSignature;
  }

  private async createWalletSignature(): Promise<TypedSignature> {
    // Ensure freshness of the signature
    const { blockNumber, blockHash, chainId } = await this.getChainData();
    const address = await this.signer.getAddress();
    const signatureText = `I'm the owner of address ${address} as of block number ${blockNumber}`;
    const salt = ethersUtils.hexlify(ethersUtils.randomBytes(32));

    const typedData: Eip712TypedData = {
      types: {
        Wallet: [
          { name: 'address', type: 'address' },
          { name: 'signatureText', type: 'string' },
          { name: 'blockNumber', type: 'uint256' },
          { name: 'blockHash', type: 'bytes32' },
        ],
      },
      domain: {
        name: 'taco',
        version: '1',
        chainId,
        salt,
      },
      message: {
        address,
        signatureText,
        blockNumber,
        blockHash,
      },
    };
    // https://github.com/ethers-io/ethers.js/issues/1431#issuecomment-813950552
    const signature = await (
      this.signer as unknown as TypedDataSigner
    )._signTypedData(typedData.domain, typedData.types, typedData.message);

    const formattedTypedData: FormattedTypedData = {
      ...typedData,
      primaryType: 'Wallet',
      types: {
        ...typedData.types,
        EIP712Domain: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'version',
            type: 'string',
          },
          {
            name: 'chainId',
            type: 'uint256',
          },
          {
            name: 'salt',
            type: 'bytes32',
          },
        ],
      },
    };
    return { signature, typedData: formattedTypedData, address };
  }

  private async getChainData(): Promise<ChainData> {
    const blockNumber = await this.provider.getBlockNumber();
    const blockHash = (await this.provider.getBlock(blockNumber)).hash;
    const chainId = (await this.provider.getNetwork()).chainId;
    return { blockNumber, blockHash, chainId };
  }
}

// Example implementation of an OIDCProvider for getting the user profile from the access token.
// Initially, the client app would handle user authentication with the IdP,
// to get the access token, and then pass that, along with the IdP vars, to this.
// In a real world scenario, this would be called by the TACo nodes
export class OIDCAuthenticationProvider {
  private oidcService: OidcService;

  constructor(
    private readonly issuerUrl: string,
  ) { 
    this.oidcService = new OidcService(issuerUrl);    
  }

  public async getUserEmail(accessToken: string): Promise<string> {
    if (!this.oidcService.isInitialized()) {
      await this.oidcService.initialize();
    }

    try {
      const userInfo = await this.oidcService.getUserInfo(accessToken);

      // Verify we've got a valid response from the IdP
      if (
        typeof userInfo.email_verified !== 'boolean' ||
        typeof userInfo.email !== 'string'
      ) {
        throw new Error('Could not get user profile info from the oidcService');
      }

      // We shouldn't continue if the user's email isn't verified
      if (userInfo.email_verified == false) {
        throw new Error("User's email address has not been verified");
      }
      return userInfo.email;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new Error('Failed to fetch user email');
    }
  }
}
