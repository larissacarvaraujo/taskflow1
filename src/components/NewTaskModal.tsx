import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  User as UserIcon,
  Tag,
  Clock,
  UserPlus,
  AtSign,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ColumnId, TaskPriority, User, Task } from '../types';

interface NewTaskModalProps {
  initialColumnId?: ColumnId;
  projectId: string;
  users: User[];
  onAddTask: (task: Partial<Task>) => void;
  onClose: () => void;
  onOpenAddUser?: () => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  initialColumnId = 'todo',
  projectId,
  users,
  onAddTask,
  onClose,
  onOpenAddUser,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState<ColumnId>(initialColumnId);
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(users[0]?.id);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Projeto']);

  // Gemini AI Priority Suggestion states
  const [isSuggestingPriority, setIsSuggestingPriority] = useState(false);
  const [aiPriorityReason, setAiPriorityReason] = useState<string | null>(null);
  const [aiSuccessBadge, setAiSuccessBadge] = useState<string | null>(null);
  const [priorityNotice, setPriorityNotice] = useState<string | null>(null);

  const handleSuggestPriority = async () => {
    if (!description.trim() && !title.trim()) {
      setPriorityNotice('Digite a descrição ou título da tarefa para a IA sugerir a prioridade.');
      setTimeout(() => setPriorityNotice(null), 4500);
      return;
    }

    setIsSuggestingPriority(true);
    setPriorityNotice(null);
    setAiPriorityReason(null);

    try {
      const response = await fetch('/api/suggest-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível analisar a prioridade no momento.');
      }

      if (data.priority) {
        setPriority(data.priority as TaskPriority);
        setAiPriorityReason(data.reason || 'Prioridade avaliada com sucesso pela inteligência artificial.');
        setAiSuccessBadge(data.priority);
        setTimeout(() => setAiSuccessBadge(null), 6000);
      }
    } catch (err: any) {
      console.error('Falha ao sugerir prioridade com Gemini:', err);
      setPriorityNotice(err.message || 'Falha na conexão com o serviço de IA.');
      setTimeout(() => setPriorityNotice(null), 5000);
    } finally {
      setIsSuggestingPriority(false);
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtaskInput.trim()) {
      setSubtasks([...subtasks, subtaskInput.trim()]);
      setSubtaskInput('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      projectId,
      title: title.trim(),
      description: description.trim(),
      columnId,
      priority,
      assigneeId,
      dueDate,
      estimatedHours,
      trackedSeconds: 0,
      isTracking: false,
      tags,
      subtasks: subtasks.map((st, idx) => ({
        id: `sub-new-${Date.now()}-${idx}`,
        title: st,
        completed: false,
      })),
      attachments: [],
      comments: [],
    });

    onClose();
  };

  return (
    <div
      id="new-task-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="new-task-modal-container"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-scale-up transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Criar Nova Tarefa</h3>
          <button
            id="close-new-task-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Título da Tarefa *
            </label>
            <input
              id="new-task-title-input"
              type="text"
              required
              placeholder="Ex: Implementar fluxo de pagamentos..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Coluna Inicial
              </label>
              <select
                id="new-task-column-select"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value as ColumnId)}
                className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="todo" className="dark:bg-slate-900 dark:text-slate-100">A Fazer</option>
                <option value="in_progress" className="dark:bg-slate-900 dark:text-slate-100">Em Andamento</option>
                <option value="review" className="dark:bg-slate-900 dark:text-slate-100">Em Revisão</option>
                <option value="done" className="dark:bg-slate-900 dark:text-slate-100">Concluído</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Prioridade
                </label>
                <button
                  id="suggest-priority-btn"
                  type="button"
                  onClick={handleSuggestPriority}
                  disabled={isSuggestingPriority}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer disabled:opacity-50 transition px-1.5 py-0.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                  title="Sugerir prioridade automaticamente com base na descrição fornecida usando a API do Gemini"
                >
                  {isSuggestingPriority ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400" />
                      <span>Analisando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                      <span>Sugerir Prioridade</span>
                    </>
                  )}
                </button>
              </div>
              <select
                id="new-task-priority-select"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value as TaskPriority);
                  setAiPriorityReason(null);
                }}
                className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="baixa" className="dark:bg-slate-900 dark:text-slate-100">Baixa</option>
                <option value="media" className="dark:bg-slate-900 dark:text-slate-100">Média</option>
                <option value="alta" className="dark:bg-slate-900 dark:text-slate-100">Alta</option>
                <option value="urgente" className="dark:bg-slate-900 dark:text-slate-100">Urgente</option>
              </select>
            </div>
          </div>

          {/* AI Priority Suggestion Feedback Box */}
          {aiPriorityReason && (
            <div
              id="ai-priority-suggestion-card"
              className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-2.5 transition-all shadow-2xs"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center shrink-0 text-amber-500 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 fill-amber-500/30" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Prioridade sugerida pela IA Gemini:
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      priority === 'urgente'
                        ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                        : priority === 'alta'
                        ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                        : priority === 'media'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    {priority}
                  </span>
                  {aiSuccessBadge && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Aplicada!
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                  {aiPriorityReason}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAiPriorityReason(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Fechar sugestão"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {priorityNotice && (
            <div
              id="ai-priority-notice-banner"
              className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2 shadow-2xs"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-[11px]">{priorityNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Direcionar para
                </label>
                {onOpenAddUser && (
                  <button
                    type="button"
                    onClick={onOpenAddUser}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <UserPlus className="w-2.5 h-2.5" />
                    <span>+ Pessoa</span>
                  </button>
                )}
              </div>
              <select
                id="new-task-assignee-select"
                value={assigneeId || ''}
                onChange={(e) => setAssigneeId(e.target.value || undefined)}
                className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
              >
                <option value="" className="dark:bg-slate-900 dark:text-slate-100">-- Não atribuído --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="dark:bg-slate-900 dark:text-slate-100">
                    {u.name} (@{u.username}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Prazo (Data)
              </label>
              <input
                id="new-task-due-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Descrição e Menções
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Clique para marcar:
              </span>
            </div>
            <textarea
              id="new-task-description-textarea"
              rows={3}
              placeholder="Descreva o escopo e mencione @membros da equipe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-1 focus:ring-indigo-500"
            />
            {/* Quick mention pills & AI shortcut */}
            <div className="flex items-center justify-between gap-2 flex-wrap mt-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                  <AtSign className="w-2.5 h-2.5" /> Marcar:
                </span>
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setDescription((prev) => `${prev} @${u.username} `)}
                    title={`${u.name} (${u.email})`}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium cursor-pointer transition flex items-center gap-1"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${u.avatarBg}`} />
                    <span>@{u.username}</span>
                  </button>
                ))}
              </div>

              <button
                id="suggest-priority-from-desc-btn"
                type="button"
                onClick={handleSuggestPriority}
                disabled={isSuggestingPriority}
                className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800/80 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                title="Sugerir prioridade da tarefa automaticamente com base na descrição"
              >
                {isSuggestingPriority ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                ) : (
                  <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500/20" />
                )}
                <span>Sugerir Prioridade</span>
              </button>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Sub-tarefas Iniciais ({subtasks.length})
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="+ Adicionar passo ou subtarefa..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Incluir
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {subtasks.map((st, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <span>{st}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(i)}
                      className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="submit-create-task-btn"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
            >
              Criar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
