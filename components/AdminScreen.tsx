
import React, { useState, useContext, useRef, FormEvent, ChangeEvent, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import { Anuncio, Aula } from '../types';
import { XIcon, UploadCloudIcon, FileTextIcon, PlusCircleIcon, TrashIcon, LogOutIcon, CameraIcon } from './Icons';

const calcularTurno = (inicio: string): string => {
    if (!inicio) return 'Matutino'; 
    const h = parseInt(inicio.split(':')[0]);
    if (h < 12) return 'Matutino';
    if (h < 18) return 'Vespertino';
    return 'Noturno';
};

const AulaItem: React.FC<{ aula: Aula, onUpdate: (id: string, data: Partial<Aula>) => void, onDelete: (id: string) => void }> = ({ aula, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Aula>(aula);
    const handleSave = () => { onUpdate(aula.id, editData); setIsEditing(false); };
    if (isEditing) return (
        <div className="grid grid-cols-6 gap-2 bg-white/10 p-4 rounded-lg items-center border border-[#ff6600]/50">
            <input name="data" value={editData.data} onChange={e => setEditData({...editData, data: e.target.value})} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white" />
            <input name="inicio" value={editData.inicio} onChange={e => setEditData({...editData, inicio: e.target.value})} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white" />
            <input name="turma" value={editData.turma} onChange={e => setEditData({...editData, turma: e.target.value})} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white" />
            <input name="sala" value={editData.sala} onChange={e => setEditData({...editData, sala: e.target.value})} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white" />
            <input name="instrutor" value={editData.instrutor} onChange={e => setEditData({...editData, instrutor: e.target.value})} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white" />
            <div className="flex gap-2 justify-end"><button onClick={handleSave} className="text-green-400 text-xs">Salvar</button><button onClick={() => setIsEditing(false)} className="text-red-400 text-xs">Cancelar</button></div>
        </div>
    );
    return (
        <div className="grid grid-cols-6 gap-2 bg-white/5 p-4 rounded-lg items-center hover:bg-white/10 border border-white/5">
            <div className="text-xs text-white/70 font-mono">{aula.data}</div>
            <div className="text-xs text-[#ff6600] font-bold">{aula.inicio} - {aula.fim} <span className="text-white/30 font-normal text-[10px]">({aula.turno})</span></div>
            <div className="text-xs font-bold text-white truncate">{aula.turma}</div>
            <div className="text-xs text-white/80 truncate">{aula.sala}</div>
            <div className="text-xs text-white/60 truncate">{aula.instrutor}</div>
            <div className="flex gap-2 justify-end"><button onClick={() => setIsEditing(true)} className="text-[#ff6600] text-xs font-bold uppercase">Editar</button><button onClick={() => onDelete(aula.id)} className="text-red-500"><TrashIcon className="w-4 h-4" /></button></div>
        </div>
    );
};

const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const context = useContext(DataContext);
    const [newAula, setNewAula] = useState<Omit<Aula, 'id'>>({ data: new Date().toLocaleDateString('pt-BR'), sala: '', turma: '', instrutor: '', unidade_curricular: '', inicio: '', fim: '' });
    const [filterStart, setFilterStart] = useState('');
    const [filterEnd, setFilterEnd] = useState('');

    const sortedAulas = useMemo(() => {
        let filtered = [...(context?.aulas || [])];
        if (filterStart || filterEnd) {
            filtered = filtered.filter(a => {
                const [d, m, y] = a.data.split('/');
                const date = new Date(`${y}-${m}-${d}`).getTime();
                const start = filterStart ? new Date(filterStart).getTime() : 0;
                const end = filterEnd ? new Date(filterEnd).getTime() : Infinity;
                return date >= start && date <= end;
            });
        } else {
            const today = new Date().toLocaleDateString('pt-BR');
            filtered = filtered.filter(a => a.data === today);
        }
        return filtered.sort((a,b) => a.inicio.localeCompare(b.inicio));
    }, [context?.aulas, filterStart, filterEnd]);

    const handleCSV = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const rows = (event.target?.result as string).split('\n').filter(r => r.trim() !== '');
            rows.shift(); // Remove cabeçalho
            const data = rows.map(r => {
                const v = r.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                if (v.length < 5) return null;
                return { data: v[0], sala: v[1], turma: v[2], instrutor: v[3], unidade_curricular: v[4], inicio: v[5] || '08:00', fim: v[6] || '12:00', turno: calcularTurno(v[5]) };
            }).filter((i): i is any => i !== null);
            context?.updateAulasFromCSV(data);
        };
        reader.readAsText(file, 'UTF-8');
    };

    const handleAd = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => context?.addAnuncio({ src: reader.result as string, type: file.type.startsWith('image') ? 'image' : 'video' });
        reader.readAsDataURL(file);
    };

    if (!context) return null;

    return (
        <div className="min-h-screen bg-[#0b0b0f] text-white p-8">
            <header className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Admin</h1><button onClick={onLogout} className="text-white/80 hover:text-[#ff6600]">Sair</button></header>
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
                        <h2 className="text-[#ff6600] font-bold mb-4 flex items-center gap-2"><UploadCloudIcon /> Upload Aulas (CSV)</h2>
                        <input type="file" accept=".csv" onChange={handleCSV} className="text-xs" />
                    </div>
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
                        <h2 className="text-[#ff6600] font-bold mb-4 flex items-center gap-2"><CameraIcon /> Adicionar Anúncio</h2>
                        <input type="file" accept="image/*,video/*" onChange={handleAd} className="text-xs" />
                        <div className="grid grid-cols-4 gap-2 mt-4">
                            {context.anuncios.map(a => (
                                <div key={a.id} className="relative aspect-video bg-black rounded overflow-hidden group">
                                    {a.type === 'image' ? <img src={a.src} className="object-cover w-full h-full" /> : <video src={a.src} className="w-full h-full" />}
                                    <button onClick={() => context.deleteAnuncio(a.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-600 p-1 rounded"><TrashIcon className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
                    <h2 className="text-[#ff6600] font-bold mb-4 flex items-center gap-2"><PlusCircleIcon /> Nova Aula</h2>
                    <form onSubmit={e => { e.preventDefault(); context.addAula(newAula); }} className="space-y-3">
                        <input value={newAula.data} onChange={e => setNewAula({...newAula, data: e.target.value})} placeholder="Data" className="w-full bg-black/20 p-2 rounded border border-white/10" />
                        <input value={newAula.turma} onChange={e => setNewAula({...newAula, turma: e.target.value})} placeholder="Turma" className="w-full bg-black/20 p-2 rounded border border-white/10" />
                        <input value={newAula.sala} onChange={e => setNewAula({...newAula, sala: e.target.value})} placeholder="Sala" className="w-full bg-black/20 p-2 rounded border border-white/10" />
                        <div className="flex gap-2">
                            <input type="time" value={newAula.inicio} onChange={e => setNewAula({...newAula, inicio: e.target.value})} className="w-1/2 bg-black/20 p-2 rounded border border-white/10" />
                            <input type="time" value={newAula.fim} onChange={e => setNewAula({...newAula, fim: e.target.value})} className="w-1/2 bg-black/20 p-2 rounded border border-white/10" />
                        </div>
                        <button type="submit" className="w-full bg-green-600 p-2 rounded font-bold">Adicionar</button>
                    </form>
                </div>
            </div>
            <div className="mt-8 bg-white/10 p-6 rounded-2xl border border-white/20">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-[#ff6600]">Lista de Aulas</h2>
                    <div className="flex gap-2 items-center bg-black/40 p-2 rounded-lg border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-white/50">Período:</span>
                        <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="bg-transparent text-xs text-white" />
                        <span className="text-white/20">até</span>
                        <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="bg-transparent text-xs text-white" />
                        {(filterStart || filterEnd) && <button onClick={() => { setFilterStart(''); setFilterEnd(''); }} className="text-white/40"><XIcon className="w-3 h-3" /></button>}
                    </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#ff6600]">
                    {sortedAulas.map(a => <AulaItem key={a.id} aula={a} onUpdate={context.updateAula} onDelete={context.deleteAula} />)}
                </div>
            </div>
        </div>
    );
};

const AdminScreen: React.FC<{ onReturnToDashboard: () => void }> = ({ onReturnToDashboard }) => {
    const [auth, setAuth] = useState(false);
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    if (auth) return <AdminPanel onLogout={onReturnToDashboard} />;
    return (
        <div className="h-screen w-screen bg-[#0f1016] flex items-center justify-center">
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 w-80">
                <h2 className="text-white text-center mb-6 font-bold">Admin Login</h2>
                <input value={user} onChange={e => setUser(e.target.value)} placeholder="Usuário" className="w-full bg-black/40 p-2 rounded mb-3 text-white border border-white/10" />
                <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha" className="w-full bg-black/40 p-2 rounded mb-6 text-white border border-white/10" />
                <button onClick={() => (user === 'admin' && pass === '1234') && setAuth(true)} className="w-full bg-[#ff6600] p-2 rounded font-bold text-white">Entrar</button>
            </div>
        </div>
    );
};
export default AdminScreen;
