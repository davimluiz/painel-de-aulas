
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
    
    // States para Uploads
    const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
    const [adPreview, setAdPreview] = useState<{ src: string, type: 'image'|'video' } | null>(null);

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

    const handleCsvFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setSelectedCsvFile(e.target.files[0]);
    };

    const processCSV = () => {
        if (!selectedCsvFile) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const rows = (event.target?.result as string).split('\n').filter(r => r.trim() !== '');
            rows.shift();
            const data = rows.map(r => {
                const v = r.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                if (v.length < 5) return null;
                return { data: v[0], sala: v[1], turma: v[2], instrutor: v[3], unidade_curricular: v[4], inicio: v[5] || '08:00', fim: v[6] || '12:00', turno: calcularTurno(v[5]) };
            }).filter((i): i is any => i !== null);
            context?.updateAulasFromCSV(data);
            setSelectedCsvFile(null);
            alert("CSV enviado com sucesso!");
        };
        reader.readAsText(selectedCsvFile, 'UTF-8');
    };

    const handleAdSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setAdPreview({ src: reader.result as string, type: file.type.startsWith('image') ? 'image' : 'video' });
        reader.readAsDataURL(file);
    };

    const processAd = () => {
        if (!adPreview) return;
        context?.addAnuncio(adPreview);
        setAdPreview(null);
        alert("Anúncio enviado com sucesso!");
    };

    if (!context) return null;

    return (
        <div className="min-h-screen bg-[#0b0b0f] text-white p-6 lg:p-10">
            {context.loading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white font-bold animate-pulse">Sincronizando com GitHub...</p>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white">ADMIN<span className="text-[#ff6600]">PAINEL</span></h1>
                    <p className="text-white/40 text-sm">Gerenciamento de aulas e mídia</p>
                </div>
                <button onClick={onLogout} className="flex items-center gap-2 bg-white/5 hover:bg-red-500/20 px-4 py-2 rounded-xl border border-white/10 transition-all text-white/60 hover:text-red-400">
                    <LogOutIcon className="w-5 h-5"/> Sair
                </button>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Lado Esquerdo: Uploads */}
                <div className="lg:col-span-5 space-y-8">
                    {/* CSV Upload */}
                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <h2 className="text-[#ff6600] text-xl font-bold mb-6 flex items-center gap-3"><FileTextIcon /> Planilha de Aulas</h2>
                        <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${selectedCsvFile ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-[#ff6600]/50'}`}>
                            <input type="file" accept=".csv" onChange={handleCsvFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <UploadCloudIcon className={`w-12 h-12 mx-auto mb-3 ${selectedCsvFile ? 'text-green-400' : 'text-white/20'}`} />
                            <p className="text-sm font-medium">{selectedCsvFile ? selectedCsvFile.name : 'Selecionar arquivo CSV'}</p>
                            <p className="text-[10px] text-white/30 mt-1">Clique para buscar no computador</p>
                        </div>
                        {selectedCsvFile && (
                            <button onClick={processCSV} className="w-full mt-4 bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2">
                                <UploadCloudIcon className="w-5 h-5"/> Enviar Aulas
                            </button>
                        )}
                    </div>

                    {/* Media Upload */}
                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <h2 className="text-[#ff6600] text-xl font-bold mb-6 flex items-center gap-3"><CameraIcon /> Banner de Anúncio</h2>
                        <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${adPreview ? 'border-[#ff6600]/50 bg-orange-500/5' : 'border-white/10 hover:border-[#ff6600]/50'}`}>
                            <input type="file" accept="image/*,video/*" onChange={handleAdSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                            {adPreview ? (
                                <div className="h-24 w-full flex items-center justify-center overflow-hidden rounded-lg bg-black/40">
                                    {adPreview.type === 'image' ? <img src={adPreview.src} className="h-full object-contain" /> : <video src={adPreview.src} className="h-full" />}
                                </div>
                            ) : (
                                <>
                                    <CameraIcon className="w-12 h-12 mx-auto mb-3 text-white/20" />
                                    <p className="text-sm font-medium">Selecionar Imagem ou Vídeo</p>
                                </>
                            )}
                        </div>
                        {adPreview && (
                            <button onClick={processAd} className="w-full mt-4 bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-900/20">
                                Enviar Anúncio
                            </button>
                        )}
                        
                        <div className="grid grid-cols-4 gap-3 mt-6">
                            {context.anuncios.map(a => (
                                <div key={a.id} className="relative aspect-video bg-black/40 rounded-xl overflow-hidden group border border-white/5">
                                    {a.type === 'image' ? <img src={a.src} className="object-cover w-full h-full" /> : <video src={a.src} className="w-full h-full" />}
                                    <button onClick={() => context.deleteAnuncio(a.id)} className="absolute inset-0 flex items-center justify-center bg-red-600/80 opacity-0 group-hover:opacity-100 transition-all">
                                        <TrashIcon className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Listagem e Manual */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <h2 className="text-[#ff6600] text-xl font-bold mb-6 flex items-center gap-3"><PlusCircleIcon /> Lançamento Manual</h2>
                        <form onSubmit={e => { e.preventDefault(); context.addAula(newAula); }} className="grid grid-cols-2 gap-4">
                            <input value={newAula.data} onChange={e => setNewAula({...newAula, data: e.target.value})} placeholder="Data (DD/MM/YYYY)" className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm" />
                            <input value={newAula.turma} onChange={e => setNewAula({...newAula, turma: e.target.value})} placeholder="Turma" className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm" />
                            <input value={newAula.sala} onChange={e => setNewAula({...newAula, sala: e.target.value})} placeholder="Sala / Ambiente" className="col-span-2 bg-white/5 border border-white/10 p-3 rounded-xl text-sm" />
                            <input type="time" value={newAula.inicio} onChange={e => setNewAula({...newAula, inicio: e.target.value})} className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm" />
                            <input type="time" value={newAula.fim} onChange={e => setNewAula({...newAula, fim: e.target.value})} className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm" />
                            <button type="submit" className="col-span-2 bg-green-600 hover:bg-green-500 p-3 rounded-xl font-bold transition-colors">Cadastrar Aula</button>
                        </form>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h2 className="font-bold text-[#ff6600] text-xl">Aulas Registradas</h2>
                            <div className="flex gap-2 items-center bg-black/40 p-2 rounded-xl border border-white/10">
                                <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="bg-transparent text-[10px] text-white outline-none" />
                                <span className="text-white/20">-</span>
                                <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="bg-transparent text-[10px] text-white outline-none" />
                                {(filterStart || filterEnd) && <button onClick={() => { setFilterStart(''); setFilterEnd(''); }} className="text-white/40 hover:text-white"><XIcon className="w-3 h-3" /></button>}
                            </div>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {sortedAulas.length === 0 ? (
                                <p className="text-white/20 text-center py-10 italic">Nenhum registro para o período.</p>
                            ) : (
                                sortedAulas.map(a => <AulaItem key={a.id} aula={a} onUpdate={context.updateAula} onDelete={context.deleteAula} />)
                            )}
                        </div>
                    </div>
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
        <div className="h-screen w-screen bg-[#060608] flex items-center justify-center p-6">
             <button onClick={onReturnToDashboard} className="fixed top-8 left-8 text-white/30 hover:text-[#ff6600] transition-colors font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                <LogOutIcon className="w-4 h-4 rotate-180" /> Voltar ao Painel
             </button>
            <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 w-full max-w-md shadow-2xl backdrop-blur-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-white mb-2">ACESSO</h2>
                    <div className="h-1 w-12 bg-[#ff6600] mx-auto rounded-full"></div>
                </div>
                <input value={user} onChange={e => setUser(e.target.value)} placeholder="Usuário" className="w-full bg-white/5 p-4 rounded-2xl mb-4 text-white border border-white/10 focus:border-[#ff6600]/50 outline-none transition-all" />
                <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha" className="w-full bg-white/5 p-4 rounded-2xl mb-8 text-white border border-white/10 focus:border-[#ff6600]/50 outline-none transition-all" />
                <button onClick={() => (user === 'admin' && pass === '1234') && setAuth(true)} className="w-full bg-[#ff6600] p-4 rounded-2xl font-bold text-white hover:bg-[#e65c00] transition-all shadow-xl shadow-orange-900/20 active:scale-95">ENTRAR NO SISTEMA</button>
            </div>
        </div>
    );
};
export default AdminScreen;
