import { PrivateAxios } from '../../helpers/PrivateAxios';

export type SwipeDirection = 'like' | 'pass';

export interface Coords {
  lat: number;
  lng: number;
}

export interface SwipeResult {
  matched: boolean;
  conversationId?: string;
}

// ── Playdate ──────────────────────────────────────────────────────────────────

export const getPlaydateCards = async (petId: string, coords?: Coords) => {
  try {
    const params: any = { petId };
    if (coords) {
      params.lat = coords.lat;
      params.lng = coords.lng;
    }
    const response = await PrivateAxios.get('/playdate/cards', { params });
    return response.data;
  } catch (error: any) {
    console.error('getPlaydateCards Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const swipePlaydate = async (
  targetPetId: string,
  swiperPetId: string,
  direction: SwipeDirection
): Promise<SwipeResult> => {
  try {
    const response = await PrivateAxios.post('/playdate/swipe', { targetPetId, swiperPetId, direction });
    return response.data;
  } catch (error: any) {
    console.error('swipePlaydate Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const getPlaydateMatches = async () => {
  try {
    const response = await PrivateAxios.get('/playdate/matches');
    return response.data;
  } catch (error: any) {
    console.error('getPlaydateMatches Error:', error?.response?.data || error.message);
    throw error;
  }
};

// ── Owner Match ───────────────────────────────────────────────────────────────

export const getOwnerCards = async (coords?: Coords) => {
  try {
    const params: any = {};
    if (coords) {
      params.lat = coords.lat;
      params.lng = coords.lng;
    }
    const response = await PrivateAxios.get('/owner-match/cards', { params });
    return response.data;
  } catch (error: any) {
    console.error('getOwnerCards Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const swipeOwner = async (
  targetId: string,
  direction: SwipeDirection
): Promise<SwipeResult> => {
  try {
    const response = await PrivateAxios.post('/owner-match/swipe', { targetId, direction });
    return response.data;
  } catch (error: any) {
    console.error('swipeOwner Error:', error?.response?.data || error.message);
    throw error;
  }
};

// ── Breed ─────────────────────────────────────────────────────────────────────

export const getBreedCards = async (petId: string, coords?: Coords) => {
  try {
    const params: any = { petId };
    if (coords) {
      params.lat = coords.lat;
      params.lng = coords.lng;
    }
    const response = await PrivateAxios.get('/breed/cards', { params });
    return response.data;
  } catch (error: any) {
    console.error('getBreedCards Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const swipeBreed = async (
  targetPetId: string,
  swiperPetId: string,
  direction: SwipeDirection
): Promise<SwipeResult> => {
  try {
    const response = await PrivateAxios.post('/breed/swipe', { targetPetId, swiperPetId, direction });
    return response.data;
  } catch (error: any) {
    console.error('swipeBreed Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const matchApi = {
  getPlaydateCards,
  swipePlaydate,
  getPlaydateMatches,
  getOwnerCards,
  swipeOwner,
  getBreedCards,
  swipeBreed,
};
