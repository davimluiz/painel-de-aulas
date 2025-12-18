
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
        <div className="grid grid-cols-6 gap-2 bg-white/5 p-4 rounded-lg items-center hover:bg-white/10 border border-white/5 transition-all">
            <div className="text-xs text-white/70 font-mono">{aula.data}</div>
            <div className="text-xs text-[#ff6600] font-bold">{aula.inicio} - {aula.fim} <span className="text-white/30 font-normal text-[10px] uppercase">({aula.turno})</span></div>
            <div className="text-xs font-bold text-white truncate">{aula.turma}</div>
            <div className="text-xs text-white/80 truncate">{aula.sala}</div>
            <div className="text-xs text-white/60 truncate">{aula.instrutor}</div>
            <div className="flex gap-2 justify-end"><button onClick={() => setIsEditing(true)} className="text-[#ff6600] text-xs font-bold uppercase hover:text-white transition-colors">Editar</button><button onClick={() => onDelete(aula.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button></div>
        </div>
    );
};

const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const context = useContext(DataContext);
    const [newAula, setNewAula] = useState<Omit<Aula, 'id'>>({ data: new Date().toLocaleDateString('pt-BR'), sala: '', turma: '', instrutor: '', unidade_curricular: '', inicio: '', fim: '' });
    const [filterStart, setFilterStart] = useState('');
    const [filterEnd, setFilterEnd] = useState('');
    
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
            try {
                const rows = (event.target?.result as string).split('\n').filter(r => r.trim() !== '');
                rows.shift();
                const data = rows.map(r => {
                    const v = r.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                    if (v.length < 5) return null;
                    return { data: v[0], sala: v[1], turma: v[2], instrutor: v[3], unidade_curricular: v[4], inicio: v[5] || '08:00', fim: v[6] || '12:00', turno: calcularTurno(v[5]) };
                }).filter((i): i is any => i !== null);
                context?.updateAulasFromCSV(data);
                setSelectedCsvFile(null);
            } catch (err) {
                alert("Erro ao processar o conteúdo do CSV.");
            }
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
    };

    if (!context) return null;

    return (
        <div className="min-h-screen bg-[#0b0b0f] text-white p-6 lg:p-10 font-sans">
            {context.loading && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[100] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-[#ff6600] font-black text-xl tracking-widest animate-pulse">SINCRONIZANDO GITHUB</p>
                    <p className="text-white/40 text-sm mt-2">Aguarde enquanto os dados são atualizados no repositório.</p>
                </div>
            )}

            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Painel<span className="text-[#ff6600]">Admin</span></h1>
                    <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-bold">Gerenciador de Aulas e Publicidade</p>
                </div>
                <button onClick={onLogout} className="flex items-center gap-3 bg-white/5 hover:bg-red-500/10 px-6 py-3 rounded-2xl border border-white/10 transition-all text-white/50 hover:text-red-500 group">
                    <LogOutIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1"/> 
                    <span className="font-bold uppercase text-xs tracking-widest">Sair</span>
                </button>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Lado Esquerdo: Uploads de Arquivo */}
                <div className="lg:col-span-5 space-y-10">
                    
                    {/* CSV Uploader */}
                    <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-3xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#ff6600] opacity-50"></div>
                        <h2 className="text-white text-xl font-black mb-6 flex items-center gap-3 uppercase italic"><FileTextIcon className="text-[#ff6600]"/> Importar Planilha (CSV)</h2>
                        
                        <div className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-500 ${selectedCsvFile ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-[#ff6600]/50 hover:bg-white/5'}`}>
                            <input type="file" accept=".csv" onChange={handleCsvFileSelect} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <UploadCloudIcon className={`w-16 h-16 mx-auto mb-4 transition-all duration-500 ${selectedCsvFile ? 'text-green-400 scale-110' : 'text-white/10'}`} />
                            <p className="text-sm font-bold uppercase tracking-tight">{selectedCsvFile ? selectedCsvFile.name : 'Clique para buscar CSV'}</p>
                            <p className="text-[10px] text-white/20 mt-2 uppercase">Somente arquivos .csv com codificação UTF-8</p>
                        </div>
                        
                        {selectedCsvFile && (
                            <button onClick={processCSV} className="w-full mt-6 bg-[#ff6600] hover:bg-[#ff8533] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-orange-950/40 flex items-center justify-center gap-3 uppercase text-sm tracking-widest active:scale-[0.98]">
                                <UploadCloudIcon className="w-5 h-5"/> Enviar Aulas agora
                            </button>
                        )}
                    </div>

                    {/* Media Uploader */}
                    <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-3xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#ff6600] opacity-50"></div>
                        <h2 className="text-white text-xl font-black mb-6 flex items-center gap-3 uppercase italic"><CameraIcon className="text-[#ff6600]"/> Novo Anúncio de Mídia</h2>
                        
                        <div className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-500 ${adPreview ? 'border-[#ff6600]/50 bg-orange-500/5' : 'border-white/10 hover:border-[#ff6600]/50 hover:bg-white/5'}`}>
                            <input type="file" accept="image/*,video/*" onChange={handleAdSelect} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            {adPreview ? (
                                <div className="h-32 w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/60 border border-white/10">
                                    {adPreview.type === 'image' ? <img src={adPreview.src} className="h-full object-contain" /> : <video src={adPreview.src} className="h-full" />}
                                </div>
                            ) : (
                                <>
                                    <CameraIcon className="w-16 h-16 mx-auto mb-4 text-white/10" />
                                    <p className="text-sm font-bold uppercase tracking-tight">Buscar Imagem ou Vídeo</p>
                                    <p className="text-[10px] text-white/20 mt-2 uppercase">PNG, JPG ou MP4 (Máx 4 anúncios)</p>
                                </>
                            )}
                        </div>
                        
                        {adPreview && (
                            <button onClick={processAd} className="w-full mt-6 bg-[#ff6600] hover:bg-[#ff8533] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-orange-950/40 uppercase text-sm tracking-widest active:scale-[0.98]">
                                Confirmar e Enviar
                            </button>
                        )}
                        
                        {/* Listagem mini de anúncios */}
                        <div className="grid grid-cols-4 gap-4 mt-8">
                            {context.anuncios.map(a => (
                                <div key={a.id} className="relative aspect-video bg-black/40 rounded-xl overflow-hidden group border border-white/5 ring-1 ring-white/5">
                                    {a.type === 'image' ? <img src={a.src} className="object-cover w-full h-full" /> : <video src={a.src} className="w-full h-full" />}
                                    <button onClick={() => context.deleteAnuncio(a.id)} className="absolute inset-0 flex items-center justify-center bg-red-600/90 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <TrashIcon className="w-6 h-6 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Listagem e Cadastro Manual */}
                <div className="lg:col-span-7 space-y-10">
                    
                    {/* Manual Form */}
                    <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-3xl">
                        <h2 className="text-[#ff6600] text-xl font-black mb-6 flex items-center gap-3 uppercase italic"><PlusCircleIcon /> Lançamento Rápido</h2>
                        <form onSubmit={e => { e.preventDefault(); context.addAula(newAula); }} className="grid grid-cols-2 gap-5">
                            <input value={newAula.data} onChange={e => setNewAula({...newAula, data: e.target.value})} placeholder="Data (DD/MM/YYYY)" className="bg-white/5 border border-white/10 p-4 rounded-2xl text-sm focus:border-[#ff6600] outline-none transition-all" />
                            <input value={newAula.turma} onChange={e => setNewAula({...newAula, turma: e.target.value})} placeholder="Identificação da Turma" className="bg-white/5 border border-white/10 p-4 rounded-2xl text-sm focus:border-[#ff6600] outline-none transition-all" />
                            <input value={newAula.sala} onChange={e => setNewAula({...newAula, sala: e.target.value})} placeholder="Ambiente / Laboratório" className="col-span-2 bg-white/5 border border-white/10 p-4 rounded-2xl text-sm focus:border-[#ff6600] outline-none transition-all" />
                            <div className="flex gap-4 col-span-2">
                                <input type="time" value={newAula.inicio} onChange={e => setNewAula({...newAula, inicio: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 p-4 rounded-2xl text-sm focus:border-[#ff6600] outline-none transition-all" />
                                <input type="time" value={newAula.fim} onChange={e => setNewAula({...newAula, fim: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 p-4 rounded-2xl text-sm focus:border-[#ff6600] outline-none transition-all" />
                            </div>
                            <button type="submit" className="col-span-2 bg-green-600 hover:bg-green-500 p-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-green-950/20 active:scale-95">Salvar Registro</button>
                        </form>
                    </div>

                    {/* Listagem */}
                    <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-3xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <h2 className="font-black text-[#ff6600] text-xl uppercase italic">Registros no Sistema</h2>
                            <div className="flex gap-3 items-center bg-black/40 p-3 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-black uppercase text-white/30 ml-2">Período</span>
                                <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="bg-transparent text-[10px] text-white outline-none font-bold cursor-pointer" />
                                <span className="text-white/10">—</span>
                                <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="bg-transparent text-[10px] text-white outline-none font-bold cursor-pointer" />
                                {(filterStart || filterEnd) && (
                                    <button onClick={() => { setFilterStart(''); setFilterEnd(''); }} className="text-white/40 hover:text-white transition-colors bg-white/5 p-1 rounded-md">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                            {sortedAulas.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                    <p className="text-white/20 text-sm italic font-medium uppercase tracking-widest">Nenhuma aula encontrada para esta busca.</p>
                                </div>
                            ) : (
                                sortedAulas.map(a => <AulaItem key={a.id} aula={a} onUpdate={context.updateAula} onDelete={context.deleteAula} />)
                            )}
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                            <button onClick={context.clearAulas} className="text-red-500/60 hover:text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                                <TrashIcon className="w-4 h-4" /> Apagar Tudo
                            </button>
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
        <div className="h-screen w-screen bg-[#060608] flex items-center justify-center p-6 font-sans">
             <button onClick={onReturnToDashboard} className="fixed top-10 left-10 text-white/20 hover:text-[#ff6600] transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 group">
                <LogOutIcon className="w-5 h-5 rotate-180 transition-transform group-hover:-translate-x-1" /> Voltar ao Painel
             </button>
            <div className="bg-white/5 p-12 rounded-[3rem] border border-white/10 w-full max-w-md shadow-4xl backdrop-blur-3xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff6600] blur-[100px] opacity-20"></div>
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Login<span className="text-[#ff6600]">Admin</span></h2>
                    <div className="h-1.5 w-16 bg-[#ff6600] mx-auto rounded-full mt-2"></div>
                </div>
                <input value={user} onChange={e => setUser(e.target.value)} placeholder="Usuário" className="w-full bg-white/5 p-5 rounded-2xl mb-4 text-white border border-white/10 focus:border-[#ff6600]/40 outline-none transition-all font-bold placeholder:text-white/10" />
                <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha de Acesso" className="w-full bg-white/5 p-5 rounded-2xl mb-10 text-white border border-white/10 focus:border-[#ff6600]/40 outline-none transition-all font-bold placeholder:text-white/10" />
                <button onClick={() => (user === 'admin' && pass === '1234') && setAuth(true)} className="w-full bg-[#ff6600] p-5 rounded-2xl font-black text-white hover:bg-[#ff8533] transition-all shadow-2xl shadow-orange-950/40 uppercase tracking-widest text-xs active:scale-95">Autenticar agora</button>
            </div>
        </div>
    );
};
export default AdminScreen;
