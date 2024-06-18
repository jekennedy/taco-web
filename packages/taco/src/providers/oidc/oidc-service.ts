import axios from 'axios';

interface UserInfo {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Optional, for additional fields
}

export class OidcService {
  private userInfoEndpoint: string | null = null;

  constructor(private issuerUrl: string) {}

  async initialize() {
    try {
      // Discover the issuer's userinfo endpoint
      const { data } = await axios.get(
        `${this.issuerUrl}/.well-known/openid-configuration`,
      );
      if (!data.userinfo_endpoint) {
        throw new Error('userinfo_endpoint not found in discovery document');
      }
      this.userInfoEndpoint = data.userinfo_endpoint;
    } catch (error) {
      console.error('Error during OidcService initialization:', error);
      throw error;
    }
  }

  async getUserInfo(accessToken: string): Promise<UserInfo> {
    if (!this.userInfoEndpoint) {
      throw new Error(
        'Service not initialized. Call initialize() before using this method.',
      );
    }
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    try {
      const { data } = await axios.get<UserInfo>(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return data;
    } catch (error) {
      console.error('Error during getUserInfo:', error);
      throw error;
    }
  }

  public isInitialized(): boolean {
    return !!this.userInfoEndpoint;
  }
}
