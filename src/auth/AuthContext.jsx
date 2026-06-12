import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import axios from 'axios';
import { auth } from '../api/firebase';
import { loginUsuario } from '../api/usuarios';

const API_BASE = import.meta.env.VITE_API;

const AuthContext = createContext(null);
const ROL_KEY = 'adminpanel_rol';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(() => sessionStorage.getItem(ROL_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setRol(null);
        sessionStorage.removeItem(ROL_KEY);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    // 1. Login → el backend devuelve token + idUsuario + rol directamente
    const { data: loginData } = await loginUsuario(email, password);
    const rolFinal = loginData.rol ?? 'USUARIO';

    // 2. Firebase sign-in para mantener la sesión activa en el cliente
    await signInWithEmailAndPassword(auth, email, password);

    setRol(rolFinal);
    sessionStorage.setItem(ROL_KEY, rolFinal);
    return rolFinal;
  };

  const logout = async () => {
    await signOut(auth);
    setRol(null);
    sessionStorage.removeItem(ROL_KEY);
  };

  const isAdmin = rol?.toUpperCase() === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, rol, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
