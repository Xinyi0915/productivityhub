import { apiClient } from './api';
import { Plant } from '../store/slices/gardenSlice';

export interface GardenItemResponse {
  _id: string;
  user: string;
  type: string;
  itemId: string;
  name: string;
  description?: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  planted: string;
  cost: number;
  attributes?: Record<string, any>;
  linkedTo?: {
    itemType: 'task' | 'habit' | 'timerSession' | 'achievement';
    itemId: string;
  };
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

// Convert backend garden item to frontend plant
export const convertToPlant = (item: GardenItemResponse): Plant => {
  return {
    id: item._id,
    name: item.name,
    type: item.type,
    cost: item.cost,
    image: item.attributes?.image || '🌱',
    purchaseDate: item.planted,
    position: item.position,
  };
};

// Convert frontend plant to backend garden item format
export const convertToGardenItem = (plant: Plant) => {
  return {
    itemId: plant.id,
    name: plant.name,
    type: plant.type,
    cost: plant.cost,
    position: plant.position || { x: 0, y: 0, z: 0 },
    attributes: {
      image: plant.image
    }
  };
};

// Get all garden items
export const fetchGardenItems = async () => {
  try {
    const response = await apiClient.get('/garden');
    return response.data.map(convertToPlant);
  } catch (error) {
    console.error('Error fetching garden items:', error);
    throw error;
  }
};

// Get a single garden item
export const fetchGardenItem = async (id: string) => {
  try {
    const response = await apiClient.get(`/garden/${id}`);
    return convertToPlant(response.data);
  } catch (error) {
    console.error(`Error fetching garden item ${id}:`, error);
    throw error;
  }
};

// Create a new garden item
export const createGardenItem = async (plant: Plant) => {
  try {
    const gardenItem = convertToGardenItem(plant);
    const response = await apiClient.post('/garden', gardenItem);
    return convertToPlant(response.data);
  } catch (error) {
    console.error('Error creating garden item:', error);
    throw error;
  }
};

// Update a garden item
export const updateGardenItem = async (id: string, updates: Partial<Plant>) => {
  try {
    const response = await apiClient.patch(`/garden/${id}`, updates);
    return convertToPlant(response.data);
  } catch (error) {
    console.error(`Error updating garden item ${id}:`, error);
    throw error;
  }
};

// Delete a garden item
export const deleteGardenItem = async (id: string) => {
  try {
    await apiClient.delete(`/garden/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting garden item ${id}:`, error);
    throw error;
  }
};

// Get garden statistics
export const fetchGardenStats = async () => {
  try {
    const response = await apiClient.get('/garden/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching garden stats:', error);
    throw error;
  }
}; 