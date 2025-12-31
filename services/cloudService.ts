
import { SanghaData } from '../types';

/**
 * CloudService provides a bridge between different devices.
 * It uses a public JSON relay to store and fetch Sangha data.
 */
class CloudService {
  // Using npoint.io as a reliable public JSON relay.
  private BASE_URL = 'https://api.npoint.io';

  /**
   * Pushes the current local state to the cloud Sangha.
   * Uses POST to the bin ID to overwrite the current state.
   */
  async pushToSangha(sanghaId: string, data: SanghaData): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/${sanghaId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (e) {
      console.error("Cloud push network error:", e);
      return false;
    }
  }

  /**
   * Fetches the latest state from the cloud Sangha.
   */
  async fetchFromSangha(sanghaId: string): Promise<SanghaData | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/${sanghaId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store' 
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data && Array.isArray(data.media) && Array.isArray(data.events)) {
        return data as SanghaData;
      }
      return null;
    } catch (e) {
      console.error("Cloud fetch network error:", e);
      return null;
    }
  }

  /**
   * Creates a new Sangha bin and returns the ID.
   */
  async createSangha(initialData?: SanghaData): Promise<string | null> {
    try {
      const response = await fetch(`${this.BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialData || { media: [], events: [], lastUpdated: Date.now() }),
      });
      const result = await response.json();
      return result.id || null;
    } catch (e) {
      console.error("Failed to create Sangha bin:", e);
      return null;
    }
  }
}

export const cloudService = new CloudService();
