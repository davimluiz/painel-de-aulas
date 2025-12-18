
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Aula, Anuncio, DataContextType } from '../types';

// O frontend agora só precisa saber onde os dados ficam publicamente para leitura rápida
const GITHUB_OWNER = (import.meta as any).env?.VITE_GITHUB_OWNER || '';
const GITHUB_REPO = (import.meta as any).env?.VITE_GITHUB_REPO || '';
const DB_PATH = 'public/db.json';

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Leitura: Podemos continuar lendo via Raw URL ou GitHub API pública (GET é seguro no cliente)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${DB_PATH}?t=${Date.now()}`;
      const res = await fetch(rawUrl);
      
      if (res.ok) {
        const decoded = await res.json();
        setAulas(decoded.aulas || []);
        setAnuncios(decoded.anuncios || []);
        setError(null);
      } else {
        // Se o arquivo não existir, inicializamos vazio
        setAulas([]);
        setAnuncios([]);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      // Fallback para evitar tela de loading infinita se o repo for privado ou não configurado
      setAulas([]);
      setAnuncios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Escrita: AGORA USA A NOSSA API SERVERLESS
  const syncToGithub = async (path: string, content: string, isBase64: boolean = false) => {
    const res = await fetch('/api/github-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content, isBase64 })
    });
    return res.ok;
  };

  const saveDatabase = async (newAulas: Aula[], newAnuncios: Anuncio[]) => {
    setLoading(true);
    const content = JSON.stringify({ aulas: newAulas, anuncios: newAnuncios }, null, 2);
    const ok = await syncToGithub(DB_PATH, content);
    
    if (ok) {
      setAulas(newAulas);
      setAnuncios(newAnuncios);
    } else {
      alert("Erro ao salvar no GitHub via API Serverless. Verifique os logs do Vercel.");
    }
    setLoading(false);
  };

  const addAula = useCallback(async (aula: Omit<Aula, 'id'>) => {
    const novaAula = { ...aula, id: Date.now().toString() };
    await saveDatabase([...aulas, novaAula], anuncios);
  }, [aulas, anuncios]);

  const updateAulasFromCSV = useCallback(async (data: Omit<Aula, 'id'>[]) => {
    const novasAulas = data.map(d => ({ ...d, id: Math.random().toString(36).substr(2, 9) }));
    await saveDatabase(novasAulas, anuncios);
  }, [anuncios]);

  const updateAula = useCallback(async (id: string, aulaData: Partial<Aula>) => {
    const updated = aulas.map(a => a.id === id ? { ...a, ...aulaData } : a);
    await saveDatabase(updated, anuncios);
  }, [aulas, anuncios]);

  const deleteAula = useCallback(async (id: string) => {
    const updated = aulas.filter(a => a.id !== id);
    await saveDatabase(updated, anuncios);
  }, [aulas, anuncios]);

  const clearAulas = useCallback(async () => {
    if(confirm("Deseja apagar todas as aulas?")) {
      await saveDatabase([], anuncios);
    }
  }, [anuncios]);

  const addAnuncio = useCallback(async (anuncio: Omit<Anuncio, 'id'>) => {
    const ext = anuncio.type === 'video' ? 'mp4' : 'png';
    const filename = `ad_${Date.now()}.${ext}`;
    const path = `public/media/${filename}`;
    const base64Data = anuncio.src.split(',')[1]; // Remove o prefixo data:...;base64,
    
    setLoading(true);
    const ok = await syncToGithub(path, base64Data, true);
    
    if (ok) {
      const newAd = { id: Date.now().toString(), type: anuncio.type, src: `./media/${filename}` };
      await saveDatabase(aulas, [...anuncios, newAd]);
    } else {
      alert("Erro ao enviar arquivo de mídia.");
      setLoading(false);
    }
  }, [aulas, anuncios]);

  const deleteAnuncio = useCallback(async (id: string) => {
    const updatedAds = anuncios.filter(a => a.id !== id);
    await saveDatabase(aulas, updatedAds);
  }, [aulas, anuncios]);

  return (
    <DataContext.Provider value={{ aulas, anuncios, loading, error, addAula, updateAulasFromCSV, updateAula, deleteAula, clearAulas, addAnuncio, deleteAnuncio }}>
      {children}
    </DataContext.Provider>
  );
};
