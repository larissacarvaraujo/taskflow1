import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  LogIn,
  UserCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AtSign,
  Briefcase,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  users?: User[];
  existingUsers?: User[];
  onLogin: (user: User) => void;
  onRegisterAndLogin: (user: Omit<User, 'id'>) => User;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser = null,
  users: propUsers,
  existingUsers: propExistingUsers,
  onLogin,
  onRegisterAndLogin,
}) => {
  const users = propUsers || propExistingUsers || [];
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [isRegistering, setIsRegistering] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (currentUser) {
        setEmailInput(currentUser.email);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Check if entered email matches an existing user
  const cleanEmail = emailInput.trim().toLowerCase();
  const matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (matchedUser) {
      // Existing user found -> direct login!
      onLogin(matchedUser);
      onClose();
    } else {
      // New user -> prompt to fill in their name and handle
      setIsRegistering(true);
      if (!nameInput) {
        // extract name suggestion from email before @
        const suggestion = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
        setNameInput(
          suggestion
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        );
        setUsernameInput(cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, ''));
      }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = nameInput.trim();
    const cleanUsername = usernameInput.trim().toLowerCase().replace(/^@/, '');
    const cleanRole = roleInput.trim() || 'Membro da Equipe';

    if (!cleanName) {
      setError('Informe seu nome completo para que a equipe possa identificar você.');
      return;
    }

    if (!cleanUsername) {
      setError('Escolha um identificador de menção (@seu_nome).');
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setError(`O nome de usuário @${cleanUsername} já está em uso.`);
      return;
    }

    const newUser = onRegisterAndLogin({
      name: cleanName,
      email: cleanEmail,
      username: cleanUsername,
      role: cleanRole,
      avatarBg: 'bg-indigo-600 text-white',
    });

    onLogin(newUser);
    setIsRegistering(false);
    onClose();
  };

  const handleQuickLogin = (user: User) => {
    onLogin(user);
    onClose();
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="auth-modal-panel"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isRegistering ? 'Criar Conta' : 'Entrar com E-mail'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRegistering
                  ? 'Cadastre seus dados para colaborar e receber menções'
                  : 'Acesse para ver suas tarefas e menções'}
              </p>
            </div>
          </div>

          <button
            id="close-auth-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!isRegistering ? (
            <>
              {/* Form: Email Login */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Seu E-mail</span>
                    <span className="text-[11px] font-normal text-slate-400">Ex: usuario@empresa.com</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      placeholder="seu.email@gmail.com ou empresa.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {matchedUser ? (
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${matchedUser.avatarBg} flex items-center justify-center font-bold text-xs shadow-xs`}>
                      {matchedUser.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-indigo-950 dark:text-indigo-200">
                          {matchedUser.name}
                        </span>
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold">
                          @{matchedUser.username}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-800 dark:text-indigo-300 truncate">
                        {matchedUser.role} • Conta encontrada!
                      </p>
                    </div>
                    <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                ) : cleanEmail && cleanEmail.includes('@') ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        Novo e-mail detectado
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Clique em Continuar para cadastrar seu nome e tag @
                      </p>
                    </div>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                ) : null}

                <button
                  id="submit-auth-email-btn"
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <span>{matchedUser ? 'Entrar como ' + matchedUser.name.split(' ')[0] : 'Continuar com este E-mail'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Login with existing accounts */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  Ou acesse rapidamente uma conta da equipe:
                </p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {users.map((user) => {
                    const isCurrent = currentUser?.id === user.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleQuickLogin(user)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition border cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-lg ${user.avatarBg} flex items-center justify-center text-[11px] font-bold shrink-0`}
                          >
                            {user.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {user.name}
                              </span>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                @{user.username}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {user.email} • {user.role}
                            </p>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full shrink-0">
                            Atual
                          </span>
                        ) : (
                          <LogIn className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Register Mode */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200">
                E-mail cadastrado: <strong className="font-semibold">{cleanEmail}</strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  id="auth-register-name"
                  type="text"
                  required
                  placeholder="Ex: Graciele Silva"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (!usernameInput) {
                      setUsernameInput(
                        e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]/g, '')
                      );
                    }
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    Tag de Menção (@) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      @
                    </span>
                    <input
                      id="auth-register-username"
                      type="text"
                      required
                      placeholder="usuario"
                      value={usernameInput}
                      onChange={(e) =>
                        setUsernameInput(
                          e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
                        )
                      }
                      className="w-full text-xs pl-6 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    Cargo / Função
                  </label>
                  <input
                    id="auth-register-role"
                    type="text"
                    placeholder="Ex: Product Lead"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  id="confirm-register-btn"
                  type="submit"
                  className="flex-2 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar e Entrar</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer note */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sessão ativa e persistida localmente no seu dispositivo.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
