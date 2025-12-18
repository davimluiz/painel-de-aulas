
import React, { useContext, useEffect, useState, useRef } from 'react';
import { DataContext } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import useCurrentTime from '../hooks/useCurrentTime';
import { Anuncio, Aula } from '../types';
import { BuildingIcon, UsersIcon, UserTieIcon, BookOpenIcon, ClockIcon, SettingsIcon, SunIcon, MoonIcon } from './Icons';

const MaximizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
);

const cleanSalaName = (name: string) => {
    if (!name) return '';
    return name.replace(/^VTRIA-\d*-?/i, '').trim();
};

const normalizeTurno = (t: string | undefined) => {
    if (!t) return '';
    const lower = t.toLowerCase();
    if (lower.includes('manhã') || lower.includes('manha') || lower.includes('matutino')) return 'matutino';
    if (lower.includes('tarde') || lower.includes('vespertino')) return 'vespertino';
    if (lower.includes('noite') || lower.includes('noturno')) return 'noturno';
    return lower;
};

const Header: React.FC<{ currentShift: string; onFullscreen: () => void }> = ({ currentShift, onFullscreen }) => {
    const { formattedDate, formattedTime } = useCurrentTime();
    const { isDarkMode } = useTheme();
    
    let shiftColor = isDarkMode ? 'text-white/80' : 'text-slate-700';
    if (currentShift === 'Matutino') shiftColor = 'text-yellow-500';
    if (currentShift === 'Vespertino') shiftColor = 'text-orange-500';
    if (currentShift === 'Noturno') shiftColor = 'text-indigo-500';

    return (
        <header className={`flex-none p-4 flex justify-between items-center px-8 h-20 z-20 relative border-b transition-colors duration-500 ${isDarkMode ? 'bg-black/10 backdrop-blur-sm border-white/5 text-white' : 'bg-white/40 backdrop-blur-md border-slate-200 text-slate-800'}`}>
            <div className={`text-sm font-light tracking-widest uppercase flex flex-col ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                <span>Painel de Aulas</span>
                <button onClick={onFullscreen} className="text-xs hover:text-[#ff6600] flex items-center gap-1 mt-1" title="Entrar em Tela Cheia">
                    <MaximizeIcon className="w-3 h-3" /> Tela Cheia
                </button>
            </div>
            
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
                 <h1 className="text-2xl md:text-3xl font-bold tracking-wider leading-none drop-shadow-sm">
                    {formattedTime}
                </h1>
                <span className={`text-sm font-light tracking-widest uppercase ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>
                    {formattedDate}
                </span>
            </div>

            <div className={`text-lg font-bold tracking-wide uppercase flex items-center gap-2 ${shiftColor}`}>
                <span className={`px-4 py-1 rounded-full text-sm backdrop-blur-md border shadow-lg ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/60 border-slate-200'}`}>
                    Turno: {currentShift}
                </span>
            </div>
        </header>
    );
};

const ClassCard: React.FC<{ aula: Aula }> = ({ aula }) => {
    const { isDarkMode } = useTheme();
    return (
        <div className={`backdrop-blur-md border rounded-xl p-3 shadow-lg transition-all duration-300 hover:scale-[1.01] flex flex-col gap-1.5 relative group h-full ${
            isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-white/60 border-slate-200 hover:bg-white/80 hover:border-[#ff6600]/30'
        }`}>
            <div className={`absolute top-2 right-2 opacity-60 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${
                isDarkMode ? 'bg-black/20 border-white/10 text-white' : 'bg-slate-200 border-slate-300 text-slate-600'
            }`}>
                {aula.turno}
            </div>
            <div className="flex items-center gap-2 mb-0.5">
                <div className="p-1.5 bg-gradient-to-br from-[#ff6600] to-[#cc5200] rounded-lg text-white shadow-lg shadow-orange-900/20">
                    <UsersIcon className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                    <h2 className={`text-base font-bold truncate leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        {aula.turma}
                    </h2>
                </div>
            </div>
            <div className="space-y-1.5 mt-1 flex-1">
                <div className={`rounded-md p-1.5 flex items-center gap-2 border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <BuildingIcon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`} />
                    <span className={`text-xs font-medium truncate ${isDarkMode ? 'text-white/90' : 'text-slate-700'}`}>{cleanSalaName(aula.sala)}</span>
                </div>
                <div className={`rounded-md p-1.5 flex items-center gap-2 border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <UserTieIcon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`} />
                    <span className={`text-xs truncate ${isDarkMode ? 'text-white/90' : 'text-slate-700'}`}>{aula.instrutor}</span>
                </div>
                <div className={`rounded-md p-1.5 flex items-center gap-2 border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <BookOpenIcon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`} />
                    <span className={`text-xs line-clamp-2 leading-snug ${isDarkMode ? 'text-white/90' : 'text-slate-700'}`}>{aula.unidade_curricular}</span>
                </div>
            </div>
            <div className={`mt-2 pt-2 border-t flex justify-between items-center text-[#ff6600] ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                <span className={`text-[9px] uppercase font-bold tracking-wider ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Horário</span>
                <div className="flex items-center gap-1 font-bold bg-[#ff6600]/10 px-2 py-0.5 rounded-full text-[10px]">
                    <ClockIcon className="w-3 h-3" /> {aula.inicio} - {aula.fim}
                </div>
            </div>
        </div>
    );
};

const AnnouncementPanel: React.FC<{ anuncios: Anuncio[] }> = ({ anuncios }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { isDarkMode } = useTheme();

    useEffect(() => {
        if (anuncios.length <= 1) return;
        const interval = setInterval(() => setCurrentIndex((prev) => (prev + 1) % anuncios.length), 10000);
        return () => clearInterval(interval);
    }, [anuncios.length]);

    if (anuncios.length === 0) return null;
    const currentAnuncio = anuncios[currentIndex];

    return (
        <div className="w-full h-full p-4 flex items-center justify-center">
            <div className={`relative w-full h-full overflow-hidden rounded-2xl shadow-2xl border ${isDarkMode ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-white/50'}`}>
                {anuncios.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center gap-2">
                        {anuncios.map((_, idx) => (
                            <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-[#ff6600]' : 'w-1.5 bg-white/50'}`} />
                        ))}
                    </div>
                )}
                {currentAnuncio.type === 'image' ? (
                    <img key={currentAnuncio.id} src={currentAnuncio.src} className="w-full h-full object-fill animate-fadeIn" />
                ) : (
                    <video key={currentAnuncio.id} src={currentAnuncio.src} autoPlay loop muted playsInline className="w-full h-full object-fill animate-fadeIn"></video>
                )}
            </div>
        </div>
    );
};

const DashboardScreen: React.FC<{ onAdminClick: () => void }> = ({ onAdminClick }) => {
    const context = useContext(DataContext);
    const { isDarkMode, toggleTheme } = useTheme();
    const [filteredAulas, setFilteredAulas] = useState<Aula[]>([]);
    const [visibleAulas, setVisibleAulas] = useState<Aula[]>([]);
    const [currentShift, setCurrentShift] = useState<string>('Matutino');
    const [page, setPage] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    useEffect(() => {
        const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, []);

    const toggleFS = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    };

    useEffect(() => {
        const updateShift = () => {
            const h = new Date().getHours();
            if (h < 12) setCurrentShift('Matutino');
            else if (h < 18) setCurrentShift('Vespertino');
            else setCurrentShift('Noturno');
        };
        updateShift();
        const interval = setInterval(updateShift, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (context && !context.loading) {
            const today = new Date().toLocaleDateString('pt-BR');
            const filtered = context.aulas.filter(aula => 
                aula.data === today && normalizeTurno(aula.turno) === normalizeTurno(currentShift)
            );
            setFilteredAulas(filtered);
            setPage(0);
        }
    }, [context, currentShift]);

    const hasAnuncio = context?.anuncios && context.anuncios.length > 0;
    const ITEMS_PER_PAGE = hasAnuncio ? 8 : 12;

    useEffect(() => {
        const totalPages = Math.ceil(filteredAulas.length / ITEMS_PER_PAGE);
        const start = page * ITEMS_PER_PAGE;
        setVisibleAulas(filteredAulas.slice(start, start + ITEMS_PER_PAGE));
        if (totalPages > 1) {
            const interval = setInterval(() => setPage(p => (p + 1) % totalPages), 15000);
            return () => clearInterval(interval);
        }
    }, [filteredAulas, page, ITEMS_PER_PAGE]);

    if (!context) return null;

    return (
        <div className={`h-screen w-screen overflow-hidden flex flex-col font-sans transition-colors duration-700 ${isDarkMode ? 'bg-[#0f1016] text-white' : 'bg-gray-100 text-slate-800'}`}>
            <Header currentShift={currentShift} onFullscreen={toggleFS} />
            <main className="flex-1 overflow-hidden p-6 relative flex flex-col">
                <div className={`flex-1 w-full flex backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-slate-200'}`}>
                    <div className={`flex flex-col h-full relative ${hasAnuncio ? 'w-[60%] border-r' : 'w-full'} ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                        <div className="flex-1 p-6 overflow-hidden flex flex-col justify-center">
                            {context.loading ? <div className="text-center">Carregando dados...</div> : visibleAulas.length > 0 ? (
                                <div className={`grid gap-5 h-full content-start ${hasAnuncio ? 'grid-cols-2' : 'grid-cols-4'}`}>
                                    {visibleAulas.map(aula => <ClassCard key={aula.id} aula={aula} />)}
                                </div>
                            ) : <div className="text-center opacity-40">Nenhuma aula para este turno.</div>}
                        </div>
                    </div>
                    {hasAnuncio && <aside className="w-[40%] h-full hidden lg:block"><AnnouncementPanel anuncios={context.anuncios} /></aside>}
                </div>
            </main>
            {!isFullscreen && (
                <div className="fixed bottom-4 left-4 flex gap-3 z-50">
                    <button onClick={onAdminClick} className={`p-3 rounded-full backdrop-blur-md border ${isDarkMode ? 'text-white/20 hover:text-[#ff6600] border-transparent hover:border-white/10' : 'text-slate-400 bg-white border-slate-200 shadow-lg'}`}><SettingsIcon className="w-5 h-5" /></button>
                    <button onClick={toggleTheme} className={`p-3 rounded-full backdrop-blur-md border ${isDarkMode ? 'text-white/20 hover:text-yellow-300 border-transparent hover:border-white/10' : 'text-slate-400 bg-white border-slate-200 shadow-lg'}`}>{isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}</button>
                </div>
            )}
        </div>
    );
};
export default DashboardScreen;
