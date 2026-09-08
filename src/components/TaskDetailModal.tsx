import React, { useState, useRef } from 'react';
import {
  X,
  Clock,
  CheckSquare,
  Paperclip,
  Trash2,
  AlertTriangle,
  AtSign,
  Send,
  Calendar,
  User as UserIcon,
  Tag,
  FileText,
  Download,
  Eye,
  Plus,
  Check,
  AlertCircle,
  BarChart2,
  UserPlus,
} from 'lucide-react';
import { Task, User, ColumnId, TaskPriority, Attachment, Subtask } from '../types';
import {
  getDeadlineStatus,
  formatSecondsDetailed,
  extractMentions,
} from '../utils/helpers';

interface TaskDetailModalProps {
  task: Task;
  users: User[];
  currentUser?: User | null;
  isTracking: boolean;
  onToggleTimer: (task: Task) => void;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onClose: () => void;
  onOpenAddUser?: () => void;
  onMentionUser?: (mentionedUser: User, taskTitle: string, commentText: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  users,
  currentUser,
  isTracking,
  onToggleTimer,
  onUpdateTask,
  onDeleteTask,
  onClose,
  onOpenAddUser,
  onMentionUser,
}) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [columnId, setColumnId] = useState<ColumnId>(task.columnId);
  const [assigneeId, setAssigneeId] = useState<string | undefined>(task.assigneeId);
  const currentAssignee = users.find((u) => u.id === assigneeId);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [estimatedHours, setEstimatedHours] = useState(task.estimatedHours);

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>(task.attachments || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments state
  const [comments, setComments] = useState(task.comments || []);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentAuthorId, setCommentAuthorId] = useState<string>(
    currentUser?.id || users[0]?.id || 'user-1'
  );
  const [mentionFeedback, setMentionFeedback] = useState<string | null>(null);

  // Mention suggestions helpers
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Calculated info
  const deadlineInfo = getDeadlineStatus(dueDate, columnId);
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const totalSubtasks = subtasks.length;
  const subtaskPercentage =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Auto-sync changes back to parent
  const handleSaveField = (updatedFields: Partial<Task>) => {
    const updated: Task = {
      ...task,
      title,
      description,
      priority,
      columnId,
      assigneeId,
      dueDate,
      estimatedHours,
      subtasks,
      attachments,
      comments,
      updatedAt: new Date().toISOString(),
      ...updatedFields,
    };
    onUpdateTask(updated);
  };

  // Subtask handlers
  const handleToggleSubtask = (subtaskId: string) => {
    const updated = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    setSubtasks(updated);
    handleSaveField({ subtasks: updated });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    handleSaveField({ subtasks: updated });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updated = subtasks.filter((st) => st.id !== subtaskId);
    setSubtasks(updated);
    handleSaveField({ subtasks: updated });
  };

  // Attachments handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newAtt: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: (reader.result as string) || '#',
          uploadedAt: new Date().toISOString(),
        };
        const updated = [...attachments, newAtt];
        setAttachments(updated);
        handleSaveField({ attachments: updated });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAttachment = (attId: string) => {
    const updated = attachments.filter((a) => a.id !== attId);
    setAttachments(updated);
    handleSaveField({ attachments: updated });
  };

  // Comments handler
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const mentions = extractMentions(newCommentText);
    const newComment = {
      id: `comm-${Date.now()}`,
      userId: commentAuthorId,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      mentions,
    };

    const updated = [...comments, newComment];
    setComments(updated);
    setNewCommentText('');
    setShowMentionMenu(false);
    handleSaveField({ comments: updated });

    if (mentions.length > 0) {
      const mentionedNames: string[] = [];
      mentions.forEach((tag) => {
        const found = users.find((u) => u.username.toLowerCase() === tag.toLowerCase());
        if (found) {
          mentionedNames.push(found.name);
          if (onMentionUser) {
            onMentionUser(found, task.title, newComment.text);
          }
        }
      });
      if (mentionedNames.length > 0) {
        setMentionFeedback(`Menção enviada para ${mentionedNames.join(', ')}! Notificação gerada.`);
        setTimeout(() => setMentionFeedback(null), 4000);
      }
    }
  };

  // Mention insertion helper for description or comment
  const insertMention = (username: string, target: 'description' | 'comment') => {
    if (target === 'description') {
      const updated = `${description} @${username} `;
      setDescription(updated);
      handleSaveField({ description: updated });
    } else {
      // Replace last @fragment or append
      setNewCommentText((prev) => {
        const atIndex = prev.lastIndexOf('@');
        if (atIndex >= 0) {
          return `${prev.slice(0, atIndex)}@${username} `;
        }
        return `${prev} @${username} `;
      });
      setShowMentionMenu(false);
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }
  };

  // Render text with @mentions highlighted
  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        const user = users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );
        return (
          <span
            key={index}
            className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 text-xs shadow-2xs"
            title={user ? `${user.name} (${user.email}) - ${user.role}` : `@${username}`}
          >
            <AtSign className="w-2.5 h-2.5" />
            {user ? `${user.name} (@${user.username})` : username}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      id="task-detail-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="task-detail-modal-container"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
              ID: {task.id}
            </span>

            {/* Column / Status selector */}
            <select
              id="task-modal-column-select"
              value={columnId}
              onChange={(e) => {
                const newCol = e.target.value as ColumnId;
                setColumnId(newCol);
                handleSaveField({ columnId: newCol });
              }}
              className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="todo" className="dark:bg-slate-900 dark:text-slate-100">A Fazer</option>
              <option value="in_progress" className="dark:bg-slate-900 dark:text-slate-100">Em Andamento (Trabalhando)</option>
              <option value="review" className="dark:bg-slate-900 dark:text-slate-100">Em Revisão / Bloqueio</option>
              <option value="done" className="dark:bg-slate-900 dark:text-slate-100">Concluído</option>
            </select>

            {/* Priority selector */}
            <select
              id="task-modal-priority-select"
              value={priority}
              onChange={(e) => {
                const newP = e.target.value as TaskPriority;
                setPriority(newP);
                handleSaveField({ priority: newP });
              }}
              className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="baixa" className="dark:bg-slate-900 dark:text-slate-100">Baixa prioridade</option>
              <option value="media" className="dark:bg-slate-900 dark:text-slate-100">Média prioridade</option>
              <option value="alta" className="dark:bg-slate-900 dark:text-slate-100">Alta prioridade</option>
              <option value="urgente" className="dark:bg-slate-900 dark:text-slate-100">Urgente</option>
            </select>
          </div>

          {/* Top Actions: Delete & Close */}
          <div className="flex items-center gap-2">
            {/* Delete button */}
            <button
              id="modal-delete-task-btn"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="Apagar tarefa definitivamente"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              id="modal-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert Modal */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-900/80 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>
                Tem certeza que deseja apagar permanentemente esta tarefa?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="modal-confirm-delete-action"
                type="button"
                onClick={() => {
                  onDeleteTask(task.id);
                  onClose();
                }}
                className="px-3 py-1 rounded-md text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer"
              >
                Confirmar e Apagar
              </button>
              <button
                id="modal-cancel-delete-action"
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Modal Body (2-column layout) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column: Title, Description, Subtasks, Attachments, Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Título da Tarefa
              </label>
              <input
                id="task-modal-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  handleSaveField({ title: e.target.value });
                }}
                className="w-full text-lg font-bold text-slate-900 dark:text-white border-0 border-b-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-0 p-1 bg-transparent transition"
                placeholder="Ex: Definir arquitetura de dados..."
              />
            </div>

            {/* Description & Mentions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Descrição do Projeto / Tarefa
                </label>
                {/* Quick Mention Helper Buttons */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Mencionar membro:
                  </span>
                  {users.slice(0, 3).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => insertMention(u.username, 'description')}
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      @{u.username}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                id="task-modal-description-textarea"
                ref={descriptionTextareaRef}
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  handleSaveField({ description: e.target.value });
                }}
                placeholder="Detalhes, especificações, objetivos e escopo da tarefa... Use @nome para marcar colaboradores."
                className="w-full text-xs text-slate-800 dark:text-slate-100 p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-950/70 focus:bg-white dark:focus:bg-slate-950 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />

              {description && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 block mb-1">
                    Visualização formatada com menções:
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {renderTextWithMentions(description)}
                  </p>
                </div>
              )}
            </div>

            {/* Sub-tarefas (Subtasks para projetos complexos) */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Sub-tarefas & Checklist
                  </h4>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {completedSubtasks}/{totalSubtasks} ({subtaskPercentage}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-300 ${
                    subtaskPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${subtaskPercentage}%` }}
                />
              </div>

              {/* Subtasks List */}
              <div className="space-y-1.5 mb-3">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    id={`subtask-item-${st.id}`}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition group"
                  >
                    <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span
                        className={`text-xs ${
                          st.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200 font-medium'
                        }`}
                      >
                        {st.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 transition p-1 cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Excluir subtarefa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add subtask input */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  id="new-subtask-input"
                  type="text"
                  placeholder="+ Adicionar novo passo ou subtarefa..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  id="add-subtask-btn"
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-white transition cursor-pointer"
                >
                  Adicionar
                </button>
              </form>
            </div>

            {/* Anexos (Attachments) */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Anexos & Documentos ({attachments.length})
                  </h4>
                </div>
                <button
                  id="upload-attachment-trigger-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1 rounded-lg transition cursor-pointer border border-indigo-200/80 dark:border-indigo-800/80"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Anexar Arquivo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Attachments List */}
              {attachments.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition"
                >
                  <Paperclip className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Nenhum anexo adicionado ainda.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Clique aqui para anexar PDFs, especificações, planilhas ou imagens.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {att.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-400">
                            {(att.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={att.url}
                          download={att.name}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          title="Baixar arquivo"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                          title="Remover anexo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comentários e Histórico com Menções */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Comentários & Menções (@)
              </h4>

              {/* Comments Feed */}
              <div className="space-y-3 mb-4 max-h-52 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Nenhum comentário registrado. Marque um membro para direcionar dúvidas.
                  </p>
                ) : (
                  comments.map((comm) => {
                    const author = users.find((u) => u.id === comm.userId);
                    return (
                      <div
                        key={comm.id}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0 ${
                                author?.avatarBg || 'bg-slate-700 text-white'
                              }`}
                            >
                              {author?.name.charAt(0) || 'U'}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {author?.name || 'Usuário'}
                            </span>
                            {author?.username && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                @{author.username}
                              </span>
                            )}
                            {author?.role && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-400 hidden sm:inline">
                                • {author.role}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 shrink-0">
                            {new Date(comm.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap pl-8">
                          {renderTextWithMentions(comm.text)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Feedback on mention */}
              {mentionFeedback && (
                <div className="mb-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{mentionFeedback}</span>
                </div>
              )}

              {/* Add Comment Box */}
              <form onSubmit={handleAddComment} className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Postar como:</span>
                  <select
                    value={commentAuthorId}
                    onChange={(e) => setCommentAuthorId(e.target.value)}
                    className="text-xs py-0.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id} className="dark:bg-slate-900 dark:text-slate-100">
                        {u.name} (@{u.username})
                      </option>
                    ))}
                  </select>

                  <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto">
                    Mencionar:
                  </span>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => insertMention(u.username, 'comment')}
                      title={`${u.name} (${u.email})`}
                      className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-1.5 py-0.5 rounded cursor-pointer transition flex items-center gap-1"
                    >
                      <span className={`w-3 h-3 rounded-full ${u.avatarBg} text-[8px] flex items-center justify-center font-bold text-white`}>
                        {u.name.charAt(0)}
                      </span>
                      <span>@{u.username}</span>
                    </button>
                  ))}
                  {onOpenAddUser && (
                    <button
                      type="button"
                      onClick={onOpenAddUser}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition"
                      title="Adicionar novo membro à equipe"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ Membro</span>
                    </button>
                  )}
                </div>

                {/* Autocomplete mention suggestion popup */}
                {newCommentText.includes('@') && (
                  <div className="p-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-lg flex flex-wrap gap-1.5 items-center animate-fade-in">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 mr-1 flex items-center gap-1">
                      <AtSign className="w-3 h-3" /> Sugestões da equipe:
                    </span>
                    {users
                      .filter((u) => {
                        const lastAt = newCommentText
                          .slice(newCommentText.lastIndexOf('@') + 1)
                          .toLowerCase();
                        return (
                          !lastAt ||
                          u.name.toLowerCase().includes(lastAt) ||
                          u.username.toLowerCase().includes(lastAt) ||
                          u.email.toLowerCase().includes(lastAt)
                        );
                      })
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => insertMention(u.username, 'comment')}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-indigo-900 dark:text-indigo-200 font-medium cursor-pointer transition"
                        >
                          <span
                            className={`w-4 h-4 rounded-full ${u.avatarBg} text-[10px] flex items-center justify-center font-bold text-white`}
                          >
                            {u.name.charAt(0)}
                          </span>
                          <span className="font-semibold">{u.name}</span>
                          <span className="text-[10px] opacity-75">@{u.username}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            ({u.email})
                          </span>
                        </button>
                      ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    ref={commentInputRef}
                    id="new-comment-input"
                    type="text"
                    placeholder="Escreva um comentário ou digite @ para mencionar..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    id="submit-comment-btn"
                    type="submit"
                    className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Sidebar: Properties (Assignee, Time Tracker, Due Date, Tags) */}
          <div className="space-y-5 bg-slate-50/60 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {/* Task Progress & Checklist Summary */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Progresso das Etapas
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {subtaskPercentage}%
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${subtaskPercentage}%` }}
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                {totalSubtasks > 0 ? (
                  <span>{completedSubtasks} de {totalSubtasks} subtarefas concluídas</span>
                ) : (
                  <span>Nenhuma subtarefa adicionada no checklist</span>
                )}
              </div>
            </div>

            {/* Direcionar Usuário (Assignee) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Responsável
                </label>
                {onOpenAddUser && (
                  <button
                    type="button"
                    onClick={onOpenAddUser}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Membro</span>
                  </button>
                )}
              </div>

              {/* Visual Card for Currently Assigned User */}
              {currentAssignee ? (
                <div className="mb-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-2xs">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs shrink-0 ${currentAssignee.avatarBg}`}
                  >
                    {currentAssignee.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {currentAssignee.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      @{currentAssignee.username} • {currentAssignee.email}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {currentAssignee.role}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-400 italic text-center">
                  Nenhum usuário direcionado para esta tarefa
                </div>
              )}

              <select
                id="task-modal-assignee-select"
                value={assigneeId || ''}
                onChange={(e) => {
                  const val = e.target.value || undefined;
                  setAssigneeId(val);
                  handleSaveField({ assigneeId: val });
                }}
                className="w-full text-xs font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs [color-scheme:light] dark:[color-scheme:dark]"
              >
                <option value="" className="dark:bg-slate-900 dark:text-slate-100">-- Trocar responsável (Não atribuído) --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="dark:bg-slate-900 dark:text-slate-100">
                    {u.name} (@{u.username}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Limite / Prazo & Notificação */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Prazo de Conclusão (Due Date)
              </label>
              <input
                id="task-modal-due-date-input"
                type="date"
                value={dueDate || ''}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  handleSaveField({ dueDate: e.target.value });
                }}
                className="w-full text-xs font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs [color-scheme:light] dark:[color-scheme:dark]"
              />

              {/* Deadline Status Badge & Alert */}
              <div className="mt-2">
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${deadlineInfo.badgeClass}`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-900 dark:text-slate-100">{deadlineInfo.label}</span>
                    {dueDate && (
                      <span className="text-[10px] font-mono block opacity-90 mt-0.5">
                        Data final: {dueDate.split('-').reverse().join('/')}
                      </span>
                    )}
                    {deadlineInfo.status === 'overdue' && (
                      <span className="text-[11px] block mt-0.5 font-medium">
                        Alerta emitido! Esta tarefa ultrapassou o prazo de entrega.
                      </span>
                    )}
                    {(deadlineInfo.status === 'due_today' ||
                      deadlineInfo.status === 'due_tomorrow') && (
                      <span className="text-[11px] block mt-0.5 font-medium">
                        Atenção ao cronograma: prazo crítico iminente.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Estimativa de Horas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Horas Estimadas
              </label>
              <input
                id="task-modal-estimated-hours"
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setEstimatedHours(val);
                  handleSaveField({ estimatedHours: val });
                }}
                className="w-full text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
