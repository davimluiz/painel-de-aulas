
export interface Aula {
  id: string;
  data: string; // Formato DD/MM/YYYY
  sala: string;
  turma: string;
  instrutor: string;
  unidade_curricular: string;
  inicio: string;
  fim: string;
  turno?: string;
}

export interface Anuncio {
  id: string;
  type: 'image' | 'video';
  src: string;
}

export interface DataContextType {
  aulas: Aula[];
  anuncios: Anuncio[];
  loading: boolean;
  error: string | null;
  addAula: (aula: Omit<Aula, 'id'>) => void;
  updateAulasFromCSV: (data: Omit<Aula, 'id'>[]) => void;
  updateAula: (id: string, aula: Partial<Aula>) => Promise<void>;
  deleteAula: (id: string) => Promise<void>;
  clearAulas: () => void;
  addAnuncio: (anuncio: Omit<Anuncio, 'id'>) => void;
  deleteAnuncio: (id: string) => void;
}
