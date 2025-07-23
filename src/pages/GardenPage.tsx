import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { buyPlantAsync, removePlantAsync } from '../store/slices/gardenSlice';
import { sendGardenNotification } from '../utils/notifications';

const GardenPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { plants, availablePlants, loading } = useSelector((state: RootState) => state.garden);
  // Select user coins directly to force re-render when coins change
  const userCoins = useSelector((state: RootState) => state.auth.user?.coins || 0);

  const handleBuyPlant = (plant: any) => {
    if (userCoins >= plant.cost) {
      dispatch(buyPlantAsync(plant));
      // Note: Coins are updated by the backend
      
      // Send notification
      sendGardenNotification(dispatch, plant.name);
    }
  };

  const handleRemovePlant = (plantId: string) => {
    dispatch(removePlantAsync(plantId));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Store Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Plant Store</h2>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500">🪙</span>
              <span className="font-medium">{userCoins} coins</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {availablePlants.map((plant) => (
              <div
                key={plant.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col items-center"
              >
                <span className="text-4xl mb-2">{plant.image}</span>
                <h3 className="font-medium text-gray-900">{plant.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plant.type}</p>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-yellow-500">🪙</span>
                  <span>{plant.cost}</span>
                </div>
                <button
                  onClick={() => handleBuyPlant(plant)}
                  disabled={userCoins < plant.cost || loading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Buy Plant'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Garden Display */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">My Garden</h2>
          
          <div 
            className="rounded-lg p-6 relative min-h-80 overflow-hidden"
            style={{
              backgroundImage: 'url("./images/grass.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
              </div>
            )}
            
            {!loading && plants.length === 0 ? (
              <div className="bg-white bg-opacity-80 rounded-md p-4 text-center">
                <p className="text-gray-600">
                  Your garden is empty. Buy some plants to get started!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {plants.map((plant) => (
                  <div
                    key={plant.id}
                    className="flex flex-col items-center relative group"
                  >
                    <span 
                      className="text-5xl mb-2 drop-shadow-lg cursor-pointer transition-transform group-hover:scale-110 duration-200"
                    >
                      {plant.image}
                    </span>
                    
                    {/* Info card that appears on hover */}
                    <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-40">
                      <h3 className="font-medium text-gray-900">{plant.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Planted on: {new Date(plant.purchaseDate).toLocaleDateString()}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlant(plant.id);
                          }}
                          className="w-full bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded-md text-sm pointer-events-auto"
                        >
                          Remove Plant
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardenPage; 