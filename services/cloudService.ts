
import { SanghaData } from '../types';

/**
 * CloudService provides a bridge between different devices.
 * It uses an ephemeral public relay to store and fetch Sangha data.
 */
class CloudService {
  // We use npoint.io as a free, no-auth JSON storage relay for this prototype
  private BASE_URL = 'https://api.npoint.io';

  /**
   * Pushes the current local state to the cloud Sangha.
   */
  async pushToSangha(sanghaId: string, data: SanghaData): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/${sanghaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (e) {
      console.error("Cloud push failed:", e);
      return false;
    }
  }

  /**
   * Fetches the latest state from the cloud Sangha.
   */
  async fetchFromSangha(sanghaId: string): Promise<SanghaData | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/${sanghaId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error("Cloud fetch failed:", e);
      return null;
    }
  }

  /**
   * Initializes a new Sangha bin and returns the ID.
   */
  async createSangha(): Promise<string | null> {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media: [], events: [], lastUpdated: Date.now() }),
      });
      const result = await response.json();
      // npoint returns { "id": "..." }
      return result.id || null;
    } catch (e) {
      console.error("Failed to create Sangha:", e);
      return null;
    }
  }
}

export const cloudService = new CloudService();
