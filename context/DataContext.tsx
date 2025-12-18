
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Aula, Anuncio, DataContextType } from '../types';

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

  // Função para pegar o arquivo e o seu SHA atual
  const getFileInfo = async (path: string) => {
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) return null;
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    try {
      const res = await fetch(url, {
        headers: { 
          Authorization: `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        cache: 'no-store' // Evitar cache para pegar o SHA mais recente
      });
      if (res.status === 404) return { isNew: true };
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  };

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
        sha: sha // O SHA é obrigatório para arquivos que já existem
      })
    });
    return res.ok;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!GITHUB_TOKEN) {
        setError("Configurações do GitHub ausentes (TOKEN).");
        setLoading(false);
        return;
      }

      const fileData = await getFileInfo(DB_PATH);
      if (fileData && fileData.content) {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
        setAulas(decoded.aulas || []);
        setAnuncios(decoded.anuncios || []);
        setError(null);
      } else if (fileData?.isNew) {
        setAulas([]);
        setAnuncios([]);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar com o GitHub.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveDatabase = async (newAulas: Aula[], newAnuncios: Anuncio[]) => {
    setLoading(true);
    try {
      // Passo crítico: Buscar o SHA mais recente do arquivo antes de cada gravação
      const currentFile = await getFileInfo(DB_PATH);
      const sha = currentFile && !currentFile.isNew ? currentFile.sha : undefined;
      
      const contentString = JSON.stringify({ aulas: newAulas, anuncios: newAnuncios }, null, 2);
      const contentBase64 = btoa(unescape(encodeURIComponent(contentString)));
      
      const ok = await commitToGithub(DB_PATH, contentBase64, `Update db.json: ${new Date().toISOString()}`, sha);
      
      if (ok) {
        setAulas(newAulas);
        setAnuncios(newAnuncios);
      } else {
        throw new Error("Erro na resposta da API do GitHub");
      }
    } catch (e) {
      alert("Erro ao salvar no GitHub. Verifique as permissões do seu TOKEN e se o repositório existe.");
    } finally {
      setLoading(false);
    }
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
    if(confirm("Deseja apagar todas as aulas registradas?")) {
      await saveDatabase([], anuncios);
    }
  }, [anuncios]);

  const addAnuncio = useCallback(async (anuncio: Omit<Anuncio, 'id'>) => {
    const ext = anuncio.type === 'video' ? 'mp4' : 'png';
    const filename = `ad_${Date.now()}.${ext}`;
    const path = `public/media/${filename}`;
    const base64Data = anuncio.src.split(',')[1];
    
    setLoading(true);
    const ok = await commitToGithub(path, base64Data, `Upload media: ${filename}`);
    if (ok) {
      const newAd = { id: Date.now().toString(), type: anuncio.type, src: `./media/${filename}` };
      await saveDatabase(aulas, [...anuncios, newAd]);
    } else {
      alert("Erro ao enviar arquivo de mídia para o GitHub.");
    }
    setLoading(false);
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
