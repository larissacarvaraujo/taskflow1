import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckSquare,
  Paperclip,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { Task, User } from '../types';
import { getDeadlineStatus } from '../utils/helpers';

interface TaskCardProps {
  task: Task;
  users: User[];
  isTracking?: boolean;
  onToggleTimer?: (task: Task) => void;
  onOpenDetails: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask?: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  onOpenDetails,
  onDeleteTask,
  onUpdateTask,
  onDragStart,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  useEffect(() => {
    setEditedTitle(task.title);
  }, [task.title]);

  const handleSaveTitle = () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== task.title && onUpdateTask) {
      onUpdateTask({ ...task, title: trimmed, updatedAt: new Date().toISOString() });
    } else {
      setEditedTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  const assignee = users.find((u) => u.id === task.assigneeId);
  const deadlineInfo = getDeadlineStatus(task.dueDate, task.columnId);

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const priorityConfigs = {
    urgente: { dot: 'bg-rose-500', label: 'Urgente', text: 'text-rose-600 dark:text-rose-400' },
    alta: { dot: 'bg-amber-500', label: 'Alta', text: 'text-amber-600 dark:text-amber-400' },
    media: { dot: 'bg-sky-500', label: 'Média', text: 'text-sky-600 dark:text-sky-400' },
    baixa: { dot: 'bg-slate-400', label: 'Baixa', text: 'text-slate-500 dark:text-slate-400' },
  };

  const currentPriority = priorityConfigs[task.priority] || priorityConfigs.baixa;
  const isOverdue = deadlineInfo.status === 'overdue' && task.columnId !== 'done';
  const isDueToday = deadlineInfo.status === 'due_today' && task.columnId !== 'done';

  return (
    <div
      id={`task-card-${task.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onOpenDetails(task)}
      className={`group relative bg-white dark:bg-slate-900 rounded-lg border p-3 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer active:cursor-grabbing ${
        isOverdue
          ? 'border-rose-300 dark:border-rose-900/60'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top bar: Subtle priority dot, tag, and hidden-by-default hover actions */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Minimalist priority indicator */}
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400"
            title={`Prioridade: ${currentPriority.label}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentPriority.dot} shrink-0`} />
            <span className="capitalize text-[10px]">{currentPriority.label}</span>
          </span>

          {/* Minimalist single tag */}
          {task.tags && task.tags.length > 0 && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-xs truncate max-w-[100px]">
              {task.tags[0]}
            </span>
          )}
        </div>

        {/* Clean Hover Actions (hidden until hover) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            id={`task-edit-title-btn-${task.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            title="Editar título"
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          <button
            id={`task-delete-btn-${task.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmDelete(true);
            }}
            title="Excluir tarefa"
            className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {showConfirmDelete && (
        <div
          className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-lg p-3 flex flex-col justify-center items-center z-20 text-center animate-fade-in border border-rose-200 dark:border-rose-900"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Excluir esta tarefa?
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              id={`confirm-delete-${task.id}`}
              type="button"
              onClick={() => {
                onDeleteTask(task.id);
                setShowConfirmDelete(false);
              }}
              className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition cursor-pointer"
            >
              Excluir
            </button>
            <button
              id={`cancel-delete-${task.id}`}
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Main Task Title & Optional clean 1-line note */}
      {isEditingTitle ? (
        <div className="space-y-1.5 py-1" onClick={(e) => e.stopPropagation()}>
          <input
            id={`task-edit-input-${task.id}`}
            type="text"
            autoFocus
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveTitle();
              } else if (e.key === 'Escape') {
                setEditedTitle(task.title);
                setIsEditingTitle(false);
              }
            }}
            placeholder="Título da tarefa..."
            className="w-full text-xs font-medium px-2 py-1 rounded-md border border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              id={`save-title-${task.id}`}
              type="button"
              onClick={handleSaveTitle}
              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>Salvar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditedTitle(task.title);
                setIsEditingTitle(false);
              }}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-medium transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => onOpenDetails(task)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditingTitle(true);
          }}
          className="cursor-pointer space-y-0.5 my-1 group/title"
          title="Clique para ver detalhes ou clique duplo para editar"
        >
          <h3 className="text-[13px] font-medium text-slate-900 dark:text-slate-100 group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition-colors line-clamp-2 leading-snug">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 font-normal leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
      )}

      {/* Minimalist Footer: Due Date, Subtask Count & Assignee */}
      <div
        onClick={() => onOpenDetails(task)}
        className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs cursor-pointer"
      >
        {/* Left: Deadline & Clean indicators */}
        <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-500">
          {task.dueDate ? (
            <span
              className={`text-[11px] flex items-center gap-1 ${
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : isDueToday
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title={isOverdue ? 'Prazo ultrapassado' : `Vence em: ${deadlineInfo.label}`}
            >
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{deadlineInfo.label}</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-300 dark:text-slate-600">
              Sem prazo
            </span>
          )}

          {/* Minimalist Subtask Count (e.g. 2/4) */}
          {totalSubtasks > 0 && (
            <span
              title={`${completedSubtasks} de ${totalSubtasks} subtarefas concluídas`}
              className={`text-[11px] flex items-center gap-1 ${
                completedSubtasks === totalSubtasks
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </span>
          )}

          {/* Attachments count */}
          {task.attachments && task.attachments.length > 0 && (
            <span
              title={`${task.attachments.length} anexo(s)`}
              className="flex items-center gap-0.5 text-[10px] text-slate-400"
            >
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments.length}</span>
            </span>
          )}

          {/* Comments count */}
          {task.comments && task.comments.length > 0 && (
            <span
              title={`${task.comments.length} comentário(s)`}
              className="flex items-center gap-0.5 text-[10px] text-slate-400"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{task.comments.length}</span>
            </span>
          )}
        </div>

        {/* Right: Discreet Assignee Avatar */}
        {assignee ? (
          <div
            title={`Responsável: ${assignee.name}`}
            className="flex items-center shrink-0"
          >
            {assignee.photoURL ? (
              <img
                src={assignee.photoURL}
                alt={assignee.name}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
            ) : (
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${assignee.avatarBg}`}
              >
                {assignee.name.charAt(0)}
              </span>
            )}
          </div>
        ) : (
          <span className="w-5 h-5 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[9px] text-slate-300 dark:text-slate-600" title="Não atribuído">
            -
          </span>
        )}
      </div>
    </div>
  );
};
