import React, { useState } from 'react';
import { Plus, Edit2, Check, X, Trash2, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Column, Task, User, ColumnId } from '../types';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  columns: Column[];
  tasks: Task[];
  users: User[];
  activeTrackingTaskId: string | null;
  onToggleTimer: (task: Task) => void;
  onOpenDetails: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask?: (task: Task) => void;
  onMoveTask: (taskId: string, targetColumnId: ColumnId) => void;
  onQuickAddTask: (columnId: ColumnId) => void;
  onUpdateColumnTitle?: (columnId: ColumnId, newTitle: string) => void;
  onClearColumnTasks?: (columnId: ColumnId) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  tasks,
  users,
  activeTrackingTaskId,
  onToggleTimer,
  onOpenDetails,
  onDeleteTask,
  onUpdateTask,
  onMoveTask,
  onQuickAddTask,
  onUpdateColumnTitle,
  onClearColumnTasks,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<ColumnId | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<ColumnId | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');
  const [confirmClearColId, setConfirmClearColId] = useState<ColumnId | null>(null);
  const [openColMenuId, setOpenColMenuId] = useState<ColumnId | null>(null);

  const handleStartEditColumn = (col: Column) => {
    setEditingColumnId(col.id);
    setEditingColumnTitle(col.title);
    setOpenColMenuId(null);
  };

  const handleSaveColumnTitle = (colId: ColumnId) => {
    const trimmed = editingColumnTitle.trim();
    if (trimmed && onUpdateColumnTitle) {
      onUpdateColumnTitle(colId, trimmed);
    }
    setEditingColumnId(null);
  };

  const handleConfirmClearColumn = (colId: ColumnId) => {
    if (onClearColumnTasks) {
      onClearColumnTasks(colId);
    }
    setConfirmClearColId(null);
    setOpenColMenuId(null);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragLeave = (columnId: ColumnId) => {
    if (dragOverColumnId === columnId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, columnId: ColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onMoveTask(taskId, columnId);
    }
    setDraggedTaskId(null);
    setDragOverColumnId(null);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.columnId === column.id);
          const isOver = dragOverColumnId === column.id;
          const isEditingThisCol = editingColumnId === column.id;
          const isMenuOpen = openColMenuId === column.id;
          const isClearingThisCol = confirmClearColId === column.id;

          return (
            <div
              key={column.id}
              id={`kanban-column-${column.id}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={() => handleDragLeave(column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`relative flex flex-col bg-slate-50/80 dark:bg-slate-900/50 rounded-xl p-2.5 border transition-colors min-h-[500px] ${
                isOver
                  ? 'border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/30'
                  : 'border-slate-200/70 dark:border-slate-800/70'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between gap-1.5 px-1.5 py-1 mb-2">
                {isEditingThisCol ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      autoFocus
                      value={editingColumnTitle}
                      onChange={(e) => setEditingColumnTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveColumnTitle(column.id);
                        } else if (e.key === 'Escape') {
                          setEditingColumnId(null);
                        }
                      }}
                      className="w-full text-xs font-semibold px-2 py-0.5 rounded border border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden uppercase tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveColumnTitle(column.id)}
                      className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer"
                      title="Salvar título da coluna"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingColumnId(null)}
                      className="p-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h2
                      onDoubleClick={() => handleStartEditColumn(column)}
                      className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                      title="Clique duplo para renomear a coluna"
                    >
                      {column.title}
                    </h2>
                    <span
                      id={`col-count-${column.id}`}
                      className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.2 rounded shrink-0"
                    >
                      {columnTasks.length}
                    </span>
                  </div>
                )}

                {/* Column Actions (Menu / Rename / Clear) */}
                {!isEditingThisCol && (
                  <div className="relative flex items-center">
                    <button
                      id={`column-menu-btn-${column.id}`}
                      type="button"
                      onClick={() => setOpenColMenuId(isMenuOpen ? null : column.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Opções da coluna"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {isMenuOpen && (
                      <div
                        className="absolute right-0 top-6 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1.5 z-30 text-xs animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleStartEditColumn(column)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Renomear Coluna</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenColMenuId(null);
                            onQuickAddTask(column.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Criar Tarefa</span>
                        </button>
                        {columnTasks.length > 0 && (
                          <>
                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmClearColId(column.id);
                                setOpenColMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Apagar Tarefas ({columnTasks.length})</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Clear column tasks confirmation dialog */}
              {isClearingThisCol && (
                <div className="p-3 mb-2 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 rounded-xl text-xs animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-900 dark:text-rose-100">
                        Apagar todas as tarefas?
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                        {columnTasks.length} {columnTasks.length === 1 ? 'tarefa será removida' : 'tarefas serão removidas'} de "{column.title}".
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmClearColumn(column.id)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-[11px] cursor-pointer"
                        >
                          Sim, Apagar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearColId(null)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium text-[11px] border border-slate-200 dark:border-slate-700 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {columnTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center">
                    <p className="text-xs text-slate-400 font-normal">
                      Vazio
                    </p>
                    <button
                      id={`quick-add-empty-${column.id}`}
                      type="button"
                      onClick={() => onQuickAddTask(column.id)}
                      className="mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      + Criar tarefa
                    </button>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      users={users}
                      isTracking={activeTrackingTaskId === task.id}
                      onToggleTimer={onToggleTimer}
                      onOpenDetails={onOpenDetails}
                      onDeleteTask={onDeleteTask}
                      onUpdateTask={onUpdateTask}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>

              {/* Quick Add Button at bottom of column */}
              <button
                id={`add-task-col-btn-${column.id}`}
                type="button"
                onClick={() => onQuickAddTask(column.id)}
                className="mt-2 flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova tarefa</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
