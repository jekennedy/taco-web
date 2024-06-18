import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcService } from '../../../src/providers/oidc/oidc-service';

describe('OidcService', () => {
  const issuerUrl = 'https://example.com';
  const mockUserInfoResponse = {
    sub: '1234567890',
    name: 'John Doe',
    email: 'john.doe@example.com',
    picture: 'http://example.com/john.jpg',
  };

  let oidcService: OidcService;

  beforeEach(async () => {
    // Mock the discovery document request
    vi.spyOn(axios, 'get').mockImplementation((url) => {
      if (url === `${issuerUrl}/.well-known/openid-configuration`) {
        return Promise.resolve({
          data: {
            userinfo_endpoint: `${issuerUrl}/userinfo`,
          },
        });
      } else if (url === `${issuerUrl}/userinfo`) {
        return Promise.resolve({ data: mockUserInfoResponse });
      }
      return Promise.reject(new Error('not found'));
    });

    oidcService = new OidcService(issuerUrl);
    await oidcService.initialize();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize and fetch the userinfo endpoint from the discovery document', async () => {
    expect(oidcService.isInitialized()).toBe(true);
    expect(oidcService['userInfoEndpoint']).toBe(`${issuerUrl}/userinfo`);
  });

  it('should return user info with a valid access token', async () => {
    const userInfo = await oidcService.getUserInfo('valid-token');
    expect(userInfo).toEqual(mockUserInfoResponse);
  });

  it('should throw an error if access token is not provided', async () => {
    await expect(oidcService.getUserInfo('')).rejects.toThrow(
      'Access token is required',
    );
  });

  it('should throw an error if service is not initialized', async () => {
    const uninitializedService = new OidcService(issuerUrl);
    await expect(
      uninitializedService.getUserInfo('valid-token'),
    ).rejects.toThrow(
      'Service not initialized. Call initialize() before using this method.',
    );
  });

  // Separate the real call test to avoid mocking
  describe('Real-world tests', () => {
    it.skip('should call getUserInfo method and return expected email', async () => {
      vi.restoreAllMocks(); // Ensure no mocks are active

      const realIssuerUrl = 'https://accounts.google.com';
      const realAccessToken = 'access-token';
      const expectedEmail = 'jedk108@gmail.com';

      const realOidcService = new OidcService(realIssuerUrl);

      try {
        await realOidcService.initialize();
      } catch (error) {
        console.error('Error during realOidcService initialization:', error);
        throw error;
      }

      try {
        const userInfo = await realOidcService.getUserInfo(realAccessToken);
        expect(userInfo.email).toEqual(expectedEmail);
      } catch (error) {
        console.error('Error during realOidcService getUserInfo:', error);
        throw error;
      }
    });
  });
});
