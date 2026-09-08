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
  const subtaskPercentage =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const priorityIndicators = {
    urgente: { dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60' },
    alta: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60' },
    media: { dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', badge: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/60' },
    baixa: { dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400', badge: 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60' },
  };

  const priorityStyle = priorityIndicators[task.priority] || priorityIndicators.baixa;

  return (
    <div
      id={`task-card-${task.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className={`group relative bg-white dark:bg-slate-900 rounded-xl border p-3.5 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing ${
        deadlineInfo.status === 'overdue' && task.columnId !== 'done'
          ? 'border-rose-300/80 dark:border-rose-900/60'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/60'
      }`}
    >
      {/* Top bar: Priority & Tags & Delete */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityStyle.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
            {task.priority}
          </span>

          {task.tags.slice(0, 1).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions: Edit title & Delete task */}
        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            id={`task-edit-title-btn-${task.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            title="Editar título da tarefa"
            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            id={`task-delete-btn-${task.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmDelete(true);
            }}
            title="Apagar tarefa"
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {showConfirmDelete && (
        <div
          className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-xl p-3 flex flex-col justify-center items-center z-20 text-center animate-fade-in border border-rose-200 dark:border-rose-900"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Apagar esta tarefa?
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              id={`confirm-delete-${task.id}`}
              type="button"
              onClick={() => {
                onDeleteTask(task.id);
                setShowConfirmDelete(false);
              }}
              className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition cursor-pointer"
            >
              Apagar
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

      {/* Title & Description preview / Inline Edit */}
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
            className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden shadow-2xs"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              id={`save-title-${task.id}`}
              type="button"
              onClick={handleSaveTitle}
              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
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
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[11px] font-medium transition cursor-pointer"
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
          className="cursor-pointer space-y-1 group/title"
          title="Clique para abrir detalhes ou clique duplo para editar título"
        >
          <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition-colors line-clamp-2 leading-snug">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 leading-normal font-normal">
              {task.description}
            </p>
          )}
        </div>
      )}

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div
          onClick={() => onOpenDetails(task)}
          className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 cursor-pointer"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <CheckSquare className="w-3 h-3 text-slate-400" />
              <span>{completedSubtasks}/{totalSubtasks} concluídas</span>
            </span>
            <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">{subtaskPercentage}%</span>
          </div>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                subtaskPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${subtaskPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Card Footer: Due Date & Assignee */}
      <div
        onClick={() => onOpenDetails(task)}
        className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs cursor-pointer"
      >
        {/* Deadline Indicator & Counters */}
        <div className="flex items-center gap-2">
          {task.dueDate ? (
            <span
              className={`text-[11px] font-medium flex items-center gap-1 ${
                deadlineInfo.status === 'overdue' && task.columnId !== 'done'
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : deadlineInfo.status === 'due_today'
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{deadlineInfo.label}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-300 dark:text-slate-600 font-normal">
              Sem data
            </span>
          )}

          {task.attachments.length > 0 && (
            <span
              title={`${task.attachments.length} anexo(s)`}
              className="flex items-center gap-0.5 text-[10px] text-slate-400"
            >
              <Paperclip className="w-3 h-3" />
              {task.attachments.length}
            </span>
          )}

          {task.comments.length > 0 && (
            <span
              title={`${task.comments.length} comentário(s)`}
              className="flex items-center gap-0.5 text-[10px] text-slate-400"
            >
              <MessageSquare className="w-3 h-3" />
              {task.comments.length}
            </span>
          )}
        </div>

        {/* Directed Assignee Avatar */}
        {assignee ? (
          <div
            title={`${assignee.name} (@${assignee.username})`}
            className="flex items-center gap-1.5 shrink-0"
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs ${assignee.avatarBg}`}
            >
              {assignee.name.charAt(0)}
            </span>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 max-w-[80px] truncate">
              {assignee.name.split(' ')[0]}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">
            Não atribuído
          </span>
        )}
      </div>
    </div>
  );
};
