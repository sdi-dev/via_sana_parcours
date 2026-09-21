import { useContext } from 'react';
import { AuthContext } from './contexte';

export const useAuth = () => useContext(AuthContext);
