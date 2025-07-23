import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import * as gardenService from '../../services/garden';
import { getCurrentUser, registerFetchPlants } from './authSlice';

export interface Plant {
  id: string;
  name: string;
  type: string;
  cost: number;
  image: string;
  purchaseDate: string;
  position?: {
    x: number;
    y: number;
    z: number;
  };
}

interface GardenState {
  plants: Plant[];
  availablePlants: Plant[];
  loading: boolean;
  error: string | null;
}

const initialAvailablePlants: Plant[] = [
  {
    id: 'flower1',
    name: 'Sunflower',
    type: 'flower',
    cost: 100,
    image: '🌻',
    purchaseDate: '',
  },
  {
    id: 'flower2',
    name: 'Rose',
    type: 'flower',
    cost: 150,
    image: '🌹',
    purchaseDate: '',
  },
  {
    id: 'tree1',
    name: 'Pine Tree',
    type: 'tree',
    cost: 300,
    image: '🌲',
    purchaseDate: '',
  },
  {
    id: 'tree2',
    name: 'Palm Tree',
    type: 'tree',
    cost: 250,
    image: '🌴',
    purchaseDate: '',
  },
  {
    id: 'plant1',
    name: 'Cactus',
    type: 'plant',
    cost: 200,
    image: '🌵',
    purchaseDate: '',
  },
];

const initialState: GardenState = {
  plants: [],
  availablePlants: initialAvailablePlants,
  loading: false,
  error: null,
};

// Async thunks
export const fetchPlants = createAsyncThunk(
  'garden/fetchPlants',
  async (_, { rejectWithValue }) => {
    try {
      return await gardenService.fetchGardenItems();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch plants');
    }
  }
);

// Register the fetchPlants function with authSlice
registerFetchPlants(fetchPlants);

export const buyPlantAsync = createAsyncThunk(
  'garden/buyPlant',
  async (plant: Plant, { rejectWithValue, dispatch }) => {
    try {
      const newPlant = {
        ...plant,
        purchaseDate: new Date().toISOString(),
        position: { x: Math.floor(Math.random() * 100), y: Math.floor(Math.random() * 100), z: 0 }
      };
      const result = await gardenService.createGardenItem(newPlant);
      
      // Update user info to reflect the new coin balance
      dispatch(getCurrentUser());
      
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to buy plant');
    }
  }
);

export const removePlantAsync = createAsyncThunk(
  'garden/removePlant',
  async (plantId: string, { rejectWithValue }) => {
    try {
      await gardenService.deleteGardenItem(plantId);
      return plantId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove plant');
    }
  }
);

const gardenSlice = createSlice({
  name: 'garden',
  initialState,
  reducers: {
    buyPlant: (state, action: PayloadAction<{ plantId: string }>) => {
      const plantToBuy = state.availablePlants.find(p => p.id === action.payload.plantId);
      if (plantToBuy) {
        const newPlant = {
          ...plantToBuy,
          id: Math.random().toString(36).substr(2, 9),
          purchaseDate: new Date().toISOString(),
        };
        state.plants.push(newPlant);
      }
    },
    removePlant: (state, action: PayloadAction<{ plantId: string }>) => {
      state.plants = state.plants.filter(p => p.id !== action.payload.plantId);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch plants
      .addCase(fetchPlants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlants.fulfilled, (state, action) => {
        state.loading = false;
        state.plants = action.payload;
      })
      .addCase(fetchPlants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Buy plant
      .addCase(buyPlantAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(buyPlantAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.plants.push(action.payload);
      })
      .addCase(buyPlantAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Remove plant
      .addCase(removePlantAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removePlantAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.plants = state.plants.filter(p => p.id !== action.payload);
      })
      .addCase(removePlantAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export const { buyPlant, removePlant } = gardenSlice.actions;
export default gardenSlice.reducer; 