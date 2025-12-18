
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Aula, Anuncio, DataContextType } from '../types';

// Configurações do GitHub (Devem ser configuradas no Vercel Environment Variables)
const GITHUB_TOKEN = (import.meta as any).env?.VITE_GITHUB_TOKEN || '';
const GITHUB_OWNER = (import.meta as any).env?.VITE_GITHUB_OWNER || '';
const GITHUB_REPO = (import.meta as any).env?.VITE_GITHUB_REPO || '';
const DB_PATH = 'public/db.json';

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper para buscar arquivos do GitHub API
  const getFileFromGithub = async (path: string) => {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const res = await fetch(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    if (!res.ok) return null;
    return await res.json();
  };

  // Helper para commitar arquivos no GitHub
  const commitToGithub = async (path: string, contentBase64: string, message: string, sha?: string) => {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content: contentBase64,
        sha: sha
      })
    });
    return res.ok;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Busca db.json diretamente via Raw URL para evitar cache de API ou via API para pegar o SHA
      const fileData = await getFileFromGithub(DB_PATH);
      if (fileData && fileData.content) {
        const decoded = JSON.parse(atob(fileData.content));
        setAulas(decoded.aulas || []);
        setAnuncios(decoded.anuncios || []);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados do GitHub. Verifique as variáveis de ambiente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO) {
      fetchData();
    } else {
      setError("Variáveis do GitHub não configuradas.");
      setLoading(false);
    }
  }, [fetchData]);

  const saveDatabase = async (newAulas: Aula[], newAnuncios: Anuncio[]) => {
    const fileData = await getFileFromGithub(DB_PATH);
    const content = btoa(unescape(encodeURIComponent(JSON.stringify({ aulas: newAulas, anuncios: newAnuncios }, null, 2))));
    await commitToGithub(DB_PATH, content, "Update database", fileData?.sha);
    setAulas(newAulas);
    setAnuncios(newAnuncios);
  };

  const addAula = useCallback(async (aula: Omit<Aula, 'id'>) => {
    const novaAula = { ...aula, id: Date.now().toString() };
    const updated = [...aulas, novaAula];
    await saveDatabase(updated, anuncios);
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
    const filename = `ad_${Date.now()}.${anuncio.type === 'video' ? 'mp4' : 'png'}`;
    const path = `public/media/${filename}`;
    
    // anuncio.src aqui é o base64
    const base64Data = anuncio.src.split(',')[1];
    
    setLoading(true);
    const ok = await commitToGithub(path, base64Data, `Add ad: ${filename}`);
    if (ok) {
      const newAd = { 
        id: Date.now().toString(), 
        type: anuncio.type, 
        src: `./media/${filename}` // Caminho relativo para o deploy
      };
      await saveDatabase(aulas, [...anuncios, newAd]);
    }
    setLoading(false);
  }, [aulas, anuncios]);

  const deleteAnuncio = useCallback(async (id: string) => {
    const adToDelete = anuncios.find(a => a.id === id);
    if (!adToDelete) return;

    // Nota: Deletar o arquivo físico no GitHub via API requer o SHA do arquivo.
    // Por simplicidade, vamos remover apenas a referência no db.json.
    const updatedAds = anuncios.filter(a => a.id !== id);
    await saveDatabase(aulas, updatedAds);
  }, [aulas, anuncios]);

  return (
    <DataContext.Provider value={{ aulas, anuncios, loading, error, addAula, updateAulasFromCSV, updateAula, deleteAula, clearAulas, addAnuncio, deleteAnuncio }}>
      {children}
    </DataContext.Provider>
  );
};
