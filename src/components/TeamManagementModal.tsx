import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  AlertTriangle,
  LogIn,
  Check,
  Shield,
  Search,
} from 'lucide-react';
import { User, Task } from '../types';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  tasks: Task[];
  onRemoveUser: (userId: string) => void;
  onSwitchUser?: (user: User) => void;
  onOpenAddUser: () => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  tasks,
  onRemoveUser,
  onSwitchUser,
  onOpenAddUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const getTaskCountForUser = (userId: string) => {
    return tasks.filter((t) => t.assigneeId === userId).length;
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      onRemoveUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  return (
    <div
      id="team-management-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="team-management-modal-container"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Membros da Equipe
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {users.length} {users.length === 1 ? 'membro cadastrado' : 'membros cadastrados'} no TaskFlow
              </p>
            </div>
          </div>
          <button
            id="close-team-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {userToDelete && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-900 text-xs animate-fade-in">
            <div className="flex items-start gap-2.5 text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">
                  Remover "{userToDelete.name}" da equipe?
                </p>
                <p className="text-rose-600 dark:text-rose-300 text-[11px] mt-0.5">
                  {getTaskCountForUser(userToDelete.id) > 0
                    ? `Este membro possui ${getTaskCountForUser(userToDelete.id)} tarefa(s) atribuída(s) que ficarão sem responsável.`
                    : 'Este membro não possui tarefas atribuídas no momento.'}
                </p>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    id="confirm-remove-user-btn"
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition cursor-pointer"
                  >
                    Confirmar Remoção
                  </button>
                  <button
                    id="cancel-remove-user-btn"
                    type="button"
                    onClick={() => setUserToDelete(null)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-medium rounded-lg transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar: Search & Add Member */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-team-members-input"
              type="text"
              placeholder="Buscar por nome, e-mail ou cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
          <button
            id="modal-add-new-member-btn"
            type="button"
            onClick={() => {
              onClose();
              onOpenAddUser();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-2xs cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Convidar</span>
          </button>
        </div>

        {/* Members List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhum membro encontrado com "{searchQuery}".
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isMe = currentUser?.id === user.id;
              const taskCount = getTaskCountForUser(user.id);

              return (
                <div
                  key={user.id}
                  id={`team-member-row-${user.id}`}
                  className="py-3 flex items-center justify-between gap-3 group first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-2xs shrink-0 ${user.avatarBg}`}
                    >
                      {user.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {user.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Você
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          @{user.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        <span className="truncate">{user.email}</span>
                        {user.role && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-slate-600 dark:text-slate-300">
                              {user.role}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-slate-400">
                          {taskCount} {taskCount === 1 ? 'tarefa' : 'tarefas'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Switch / Login as user button if not current */}
                    {!isMe && onSwitchUser && (
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchUser(user);
                          onClose();
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer text-xs flex items-center gap-1"
                        title={`Conectar como ${user.name}`}
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px] font-medium">
                          Entrar
                        </span>
                      </button>
                    )}

                    {/* Remove Member button */}
                    <button
                      id={`delete-user-btn-${user.id}`}
                      type="button"
                      onClick={() => setUserToDelete(user)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                      title={`Remover ${user.name} da equipe`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <span>
            Ao remover um membro, tarefas atribuídas a ele ficarão desvinculadas.
          </span>
          <button
            id="close-team-modal-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
