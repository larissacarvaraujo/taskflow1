import React, { useState, useMemo } from 'react';
import {
  Tag,
  X,
  Check,
  Search,
  SlidersHorizontal,
  Filter,
  RotateCcw,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface TagFilterSidebarProps {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onSelectAllTags: () => void;
  onClearTags: () => void;
  tagFilterMode: 'any' | 'all';
  onChangeTagFilterMode: (mode: 'any' | 'all') => void;
  tagCounts: Record<string, number>;
  totalProjectTasks: number;
  filteredTasksCount: number;
  isOpen: boolean;
  onClose: () => void;
  onToggleOpen: () => void;
}

// Consistent palette for visual tag identification
const TAG_PALETTES = [
  { dot: 'bg-indigo-500', activeBg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-700' },
  { dot: 'bg-emerald-500', activeBg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
  { dot: 'bg-sky-500', activeBg: 'bg-sky-50 dark:bg-sky-950/60', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-700' },
  { dot: 'bg-amber-500', activeBg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
  { dot: 'bg-purple-500', activeBg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
  { dot: 'bg-rose-500', activeBg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700' },
  { dot: 'bg-teal-500', activeBg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700' },
  { dot: 'bg-cyan-500', activeBg: 'bg-cyan-50 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-700' },
];

export function getTagPalette(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % TAG_PALETTES.length;
  return TAG_PALETTES[idx];
}

export const TagFilterSidebar: React.FC<TagFilterSidebarProps> = ({
  allTags,
  selectedTags,
  onToggleTag,
  onSelectAllTags,
  onClearTags,
  tagFilterMode,
  onChangeTagFilterMode,
  tagCounts,
  totalProjectTasks,
  filteredTasksCount,
  isOpen,
  onClose,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tag list based on internal search
  const visibleTags = useMemo(() => {
    if (!searchQuery.trim()) return allTags;
    const q = searchQuery.toLowerCase();
    return allTags.filter((tag) => tag.toLowerCase().includes(q));
  }, [allTags, searchQuery]);

  const isAllSelected = allTags.length > 0 && selectedTags.length === allTags.length;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Panel */}
      <div
        id="tag-filter-sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-40 lg:z-10
          w-72 sm:w-80 lg:w-72 shrink-0
          bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-800
          lg:rounded-2xl lg:border lg:shadow-xs
          flex flex-col
          transition-transform lg:transition-none duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
          h-full lg:h-[calc(100vh-160px)] lg:sticky lg:top-24
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/40 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Filtro por Etiquetas
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedTags.length === 0
                  ? `${allTags.length} etiqueta${allTags.length === 1 ? '' : 's'} no projeto`
                  : `${selectedTags.length} de ${allTags.length} selecionada${selectedTags.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {selectedTags.length > 0 && (
              <button
                id="clear-all-tags-btn"
                type="button"
                onClick={onClearTags}
                title="Limpar filtros de etiquetas"
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="close-tag-filter-sidebar-btn"
              type="button"
              onClick={onClose}
              title="Recolher barra lateral"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2.5">
          {/* Search Tags Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="tag-search-input"
              type="text"
              placeholder="Buscar etiqueta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Select/Deselect All buttons */}
          {allTags.length > 0 && (
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <button
                id="select-all-tags-btn"
                type="button"
                onClick={onSelectAllTags}
                disabled={isAllSelected}
                className={`font-semibold transition cursor-pointer ${
                  isAllSelected
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300'
                }`}
              >
                Marcar todas
              </button>

              <span className="text-slate-300 dark:text-slate-700">•</span>

              <button
                id="deselect-all-tags-btn"
                type="button"
                onClick={onClearTags}
                disabled={selectedTags.length === 0}
                className={`font-semibold transition cursor-pointer ${
                  selectedTags.length === 0
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400'
                }`}
              >
                Desmarcar todas
              </button>
            </div>
          )}

          {/* Logic Match Mode (OR vs AND) */}
          {allTags.length > 0 && (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                <span>Modo de correspondência</span>
              </div>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <button
                  id="tag-mode-any-btn"
                  type="button"
                  onClick={() => onChangeTagFilterMode('any')}
                  className={`text-[11px] font-semibold py-1 rounded-md transition cursor-pointer ${
                    tagFilterMode === 'any'
                      ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Tarefas com pelo menos uma das etiquetas selecionadas"
                >
                  Qualquer (OU)
                </button>
                <button
                  id="tag-mode-all-btn"
                  type="button"
                  onClick={() => onChangeTagFilterMode('all')}
                  className={`text-[11px] font-semibold py-1 rounded-md transition cursor-pointer ${
                    tagFilterMode === 'all'
                      ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Tarefas que possuam todas as etiquetas selecionadas"
                >
                  Todas (E)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tags List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {allTags.length === 0 ? (
            <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Tag className="w-5 h-5 text-slate-400" />
              </div>
              <p className="font-medium">Nenhuma etiqueta encontrada</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Adicione etiquetas nas tarefas do projeto para habilitar o filtro aqui.
              </p>
            </div>
          ) : visibleTags.length === 0 ? (
            <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs">
              Nenhuma etiqueta corresponde a "<strong>{searchQuery}</strong>".
            </div>
          ) : (
            visibleTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              const palette = getTagPalette(tag);
              const count = tagCounts[tag] || 0;

              return (
                <div
                  key={tag}
                  id={`tag-filter-row-${tag}`}
                  onClick={() => onToggleTag(tag)}
                  className={`
                    group flex items-center justify-between gap-2 p-2 rounded-xl text-xs font-medium cursor-pointer transition border
                    ${
                      isSelected
                        ? `${palette.activeBg} ${palette.border} ${palette.text} shadow-2xs`
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent div
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                    />

                    <span className={`w-2 h-2 rounded-full shrink-0 ${palette.dot}`} />

                    <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                      {tag}
                    </span>
                  </div>

                  {/* Task counter */}
                  <span
                    className={`
                      text-[11px] font-mono px-2 py-0.5 rounded-full shrink-0
                      ${
                        isSelected
                          ? 'bg-white/80 dark:bg-slate-900/80 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }
                    `}
                    title={`${count} tarefa(s) com esta etiqueta`}
                  >
                    {count}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Results Counter */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 rounded-b-2xl">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Tarefas visíveis:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {filteredTasksCount} de {totalProjectTasks}
            </span>
          </div>

          {selectedTags.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Filtro ativo</span>
              <button
                type="button"
                onClick={onClearTags}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Limpar etiquetas
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
