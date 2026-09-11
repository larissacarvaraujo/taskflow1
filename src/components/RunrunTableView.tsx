import React, { useState } from 'react';
import {
  Clock,
  CheckSquare,
  Paperclip,
  Trash2,
  AlertCircle,
  ExternalLink,
  Download,
  Edit2,
  Check,
  X,
  Tag,
} from 'lucide-react';
import { Task, User, ColumnId } from '../types';
import { getDeadlineStatus } from '../utils/helpers';

interface RunrunTableViewProps {
  tasks: Task[];
  users: User[];
  activeTrackingTaskId: string | null;
  onToggleTimer: (task: Task) => void;
  onOpenDetails: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask?: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: ColumnId) => void;
  onExportCsv?: () => void;
}

export const RunrunTableView: React.FC<RunrunTableViewProps> = ({
  tasks,
  users,
  onOpenDetails,
  onDeleteTask,
  onUpdateTask,
  onStatusChange,
  onExportCsv,
}) => {
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(
    null
  );
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditedTitle(task.title);
  };

  const handleSaveTitle = (task: Task) => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== task.title && onUpdateTask) {
      onUpdateTask({ ...task, title: trimmed, updatedAt: new Date().toISOString() });
    }
    setEditingTaskId(null);
  };

  const columnLabels: Record<ColumnId, string> = {
    todo: 'A Fazer',
    in_progress: 'Em Andamento',
    review: 'Em Revisão',
    done: 'Concluído',
  };

  const priorityColors = {
    urgente: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800',
    alta: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800',
    media: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border-sky-200 dark:border-sky-800',
    baixa: 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
        {/* Table Subheader Bar */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Exibindo <span className="font-bold text-slate-900 dark:text-white">{tasks.length}</span> {tasks.length === 1 ? 'tarefa filtrada' : 'tarefas filtradas'}
          </div>
          {onExportCsv && (
            <button
              id="export-csv-table-view-btn"
              type="button"
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs transition cursor-pointer"
              title="Baixar lista atual como planilha CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar CSV</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Tarefa & Subtarefas</th>
                <th className="py-3 px-4 w-36">Status</th>
                <th className="py-3 px-4 w-28">Prioridade</th>
                <th className="py-3 px-4 w-44">Responsável</th>
                <th className="py-3 px-4 w-40">Prazo / Alerta</th>
                <th className="py-3 px-4 w-32">Etiquetas</th>
                <th className="py-3 px-4 w-24 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Nenhuma tarefa encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const assignee = users.find((u) => u.id === task.assigneeId);
                  const deadlineInfo = getDeadlineStatus(task.dueDate, task.columnId);
                  const completedSubtasks = task.subtasks.filter(
                    (s) => s.completed
                  ).length;
                  const totalSubtasks = task.subtasks.length;
                  const isEditingThisTitle = editingTaskId === task.id;

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >

                      {/* Title & Subtasks */}
                      <td className="py-3 px-4">
                        {isEditingThisTitle ? (
                          <div className="flex items-center gap-1.5 py-0.5">
                            <input
                              type="text"
                              autoFocus
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveTitle(task);
                                } else if (e.key === 'Escape') {
                                  setEditingTaskId(null);
                                }
                              }}
                              className="text-xs font-semibold px-2 py-1 rounded border border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden w-full max-w-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveTitle(task)}
                              className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer"
                              title="Salvar"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTaskId(null)}
                              className="p-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="group flex items-start justify-between gap-2">
                            <div
                              onClick={() => onOpenDetails(task)}
                              className="cursor-pointer flex-1"
                            >
                              <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition block">
                                {task.title}
                              </span>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                {totalSubtasks > 0 && (
                                  <span className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400">
                                    <CheckSquare className="w-3 h-3" />
                                    {completedSubtasks}/{totalSubtasks} subtarefas
                                  </span>
                                )}
                                {task.attachments.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Paperclip className="w-3 h-3" />
                                    {task.attachments.length} anexo(s)
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(task)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                              title="Editar título"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          id={`table-status-select-${task.id}`}
                          value={task.columnId}
                          onChange={(e) =>
                            onStatusChange(task.id, e.target.value as ColumnId)
                          }
                          className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="todo" className="dark:bg-slate-900 dark:text-slate-100">A Fazer</option>
                          <option value="in_progress" className="dark:bg-slate-900 dark:text-slate-100">Em Andamento</option>
                          <option value="review" className="dark:bg-slate-900 dark:text-slate-100">Em Revisão</option>
                          <option value="done" className="dark:bg-slate-900 dark:text-slate-100">Concluído</option>
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-4">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0 ${assignee.avatarBg}`}
                            >
                              {assignee.name.charAt(0)}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {assignee.name}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                @{assignee.username} • {assignee.role}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-400 italic">
                            Sem responsável
                          </span>
                        )}
                      </td>

                      {/* Due Date / Alerts */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${deadlineInfo.badgeClass}`}
                          >
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{deadlineInfo.label}</span>
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              Prazo: {task.dueDate.split('-').reverse().join('/')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {task.tags.length > 0 ? (
                            task.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`table-view-details-${task.id}`}
                            type="button"
                            onClick={() => onOpenDetails(task)}
                            className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Ver detalhes"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`table-delete-task-${task.id}`}
                            type="button"
                            onClick={() => setDeleteConfirmTaskId(task.id)}
                            className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Apagar tarefa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Confirmation prompt */}
                        {deleteConfirmTaskId === task.id && (
                          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-800 text-center">
                              <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                Apagar tarefa?
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Tem certeza que deseja apagar "{task.title}"?
                              </p>
                              <div className="flex items-center justify-center gap-2 mt-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteTask(task.id);
                                    setDeleteConfirmTaskId(null);
                                  }}
                                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                                >
                                  Sim, apagar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmTaskId(null)}
                                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
