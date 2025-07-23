import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';

/**
 * Custom hook that provides properly typed Redux dispatch function
 * 
 * This hook wraps the standard useDispatch hook from react-redux
 * but provides TypeScript type inference via the AppDispatch type.
 * This ensures that when dispatch is used, TypeScript can properly 
 * check that actions being dispatched conform to the expected types.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>(); 