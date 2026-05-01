import axios from 'axios';

const FB_GRAPH_URL = 'https://graph.facebook.com/v17.0';

export class InstagramService {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;

  constructor() {
    this.appId = process.env.INSTAGRAM_APP_ID || '';
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI || '';
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<string> {
    try {
      const response = await axios.get(`${FB_GRAPH_URL}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });
      return response.data.access_token;
    } catch (error: any) {
      console.error('Error getting long-lived token:', error.response?.data || error.message);
      throw new Error('Failed to get long-lived Instagram token');
    }
  }

  /**
   * Get the Instagram Business Account ID associated with a Facebook Page
   */
  async getInstagramBusinessAccountId(accessToken: string): Promise<string> {
    try {
      // 1. Get user's pages
      const pagesRes = await axios.get(`${FB_GRAPH_URL}/me/accounts`, {
        params: { access_token: accessToken },
      });

      const pages = pagesRes.data.data;
      if (!pages || pages.length === 0) {
        throw new Error('No Facebook Pages found associated with this account');
      }

      // 2. Get Instagram account for the first page (as a default strategy)
      for (const page of pages) {
        const igRes = await axios.get(`${FB_GRAPH_URL}/${page.id}`, {
          params: {
            fields: 'instagram_business_account',
            access_token: page.access_token || accessToken,
          },
        });

        if (igRes.data.instagram_business_account) {
          return igRes.data.instagram_business_account.id;
        }
      }

      throw new Error('No Instagram Business Account linked to your Facebook Pages');
    } catch (error: any) {
      console.error('Error getting IG Business ID:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Publish a photo post to Instagram
   */
  async publishPhoto(igUserId: string, accessToken: string, imageUrl: string, caption: string) {
    try {
      // 1. Create Media Container
      const containerRes = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media`, null, {
        params: {
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken,
        },
      });

      const creationId = containerRes.data.id;

      // 2. Publish Media
      const publishRes = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media_publish`, null, {
        params: {
          creation_id: creationId,
          access_token: accessToken,
        },
      });

      return publishRes.data.id;
    } catch (error: any) {
      console.error('Error publishing to Instagram:', error.response?.data || error.message);
      throw new Error('Failed to publish post to Instagram');
    }
  }

  /**
   * Publish a story to Instagram
   */
  async publishStory(igUserId: string, accessToken: string, imageUrl: string) {
    try {
      const containerRes = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media`, null, {
        params: {
          image_url: imageUrl,
          media_type: 'STORIES',
          access_token: accessToken,
        },
      });

      const creationId = containerRes.data.id;

      const publishRes = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media_publish`, null, {
        params: {
          creation_id: creationId,
          access_token: accessToken,
        },
      });

      return publishRes.data.id;
    } catch (error: any) {
      console.error('Error publishing story to Instagram:', error.response?.data || error.message);
      throw new Error('Failed to publish story to Instagram');
    }
  }
}

export const instagramService = new InstagramService();
