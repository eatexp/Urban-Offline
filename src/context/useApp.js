import { useContext } from 'react';
import { AppContext } from './AppProvider';

export const useApp = () => useContext(AppContext);