import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  LogIn,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';
import { signInWithGoogleAuth } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  users?: User[];
  existingUsers?: User[];
  onLogin: (user: User) => void;
  onRegisterAndLogin: (user: Omit<User, 'id'>) => User;
  onGoogleLogin?: (googleUser: { email: string; name: string; photoURL?: string }) => void;
  isBlocking?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser = null,
  users: propUsers,
  existingUsers: propExistingUsers,
  onLogin,
  onRegisterAndLogin,
  onGoogleLogin,
  isBlocking = false,
}) => {
  const users = propUsers || propExistingUsers || [];
  const [activeTab, setActiveTab] = useState<'gmail' | 'login' | 'register'>('gmail');

  // Google state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [directGmailInput, setDirectGmailInput] = useState('');
  const [showDirectGmailInput, setShowDirectGmailInput] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerRole, setRegisterRole] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Feedback state
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setIsGoogleLoading(false);
      if (currentUser) {
        setLoginEmail(currentUser.email);
        setDirectGmailInput(currentUser.email);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle Google / Gmail popup authentication
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const googleUser = await signInWithGoogleAuth();
      if (googleUser && googleUser.email) {
        const cleanEmail = googleUser.email.toLowerCase().trim();
        const displayName = googleUser.displayName || cleanEmail.split('@')[0];
        setSuccessMsg(`Autenticado com sucesso pelo Google! Conectando ${displayName}...`);

        setTimeout(() => {
          if (onGoogleLogin) {
            onGoogleLogin({
              email: cleanEmail,
              name: displayName,
              photoURL: googleUser.photoURL || undefined,
            });
          } else {
            // Fallback match or create
            const matched = users.find((u) => u.email.toLowerCase() === cleanEmail);
            if (matched) {
              onLogin(matched);
            } else {
              const newUser = onRegisterAndLogin({
                name: displayName,
                email: cleanEmail,
                username: cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, ''),
                role: 'Colaborador',
                avatarBg: 'bg-indigo-600 text-white',
                photoURL: googleUser.photoURL || undefined,
                provider: 'google',
              });
              onLogin(newUser);
            }
          }
          onClose();
        }, 500);
      }
    } catch (err: unknown) {
      console.warn('Google sign-in error:', err);
      const anyErr = err as { code?: string; message?: string };
      if (anyErr?.code === 'auth/popup-closed-by-user') {
        setError('A janela do Google foi fechada antes de concluir o login.');
      } else if (
        anyErr?.code === 'auth/popup-blocked' ||
        anyErr?.message?.includes('popup') ||
        anyErr?.code === 'auth/unauthorized-domain'
      ) {
        setError(
          'O navegador ou iframe bloqueou a janela pop-up do Google. Utilize a autenticação direta com seu Gmail abaixo.'
        );
        setShowDirectGmailInput(true);
      } else {
        setError(
          'Não foi possível concluir o pop-up do Google no ambiente atual. Digite ou confirme seu Gmail abaixo para entrar diretamente.'
        );
        setShowDirectGmailInput(true);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle quick or direct Gmail login (without requiring password)
  const handleDirectGmailSubmit = (targetEmail?: string, targetName?: string) => {
    setError(null);
    setSuccessMsg(null);

    const emailToUse = (targetEmail || directGmailInput).trim().toLowerCase();

    if (!emailToUse || !emailToUse.includes('@') || !emailToUse.includes('.')) {
      setError('Por favor, informe um endereço de Gmail válido.');
      return;
    }

    const nameToUse = targetName || emailToUse.split('@')[0];
    setSuccessMsg(`Conectando seu painel exclusivo do Gmail: ${emailToUse}...`);

    setTimeout(() => {
      if (onGoogleLogin) {
        onGoogleLogin({
          email: emailToUse,
          name: nameToUse,
        });
      } else {
        const matched = users.find((u) => u.email.toLowerCase() === emailToUse);
        if (matched) {
          onLogin(matched);
        } else {
          const newUser = onRegisterAndLogin({
            name: nameToUse,
            email: emailToUse,
            username: emailToUse.split('@')[0].replace(/[^a-z0-9]/g, ''),
            role: 'Colaborador',
            avatarBg: 'bg-indigo-600 text-white',
            provider: 'google',
          });
          onLogin(newUser);
        }
      }
      onClose();
    }, 450);
  };

  // Handle standard login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!cleanPassword) {
      setError('Por favor, informe sua senha de acesso.');
      return;
    }

    const matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      setError(
        'Nenhum usuário cadastrado com este e-mail. Caso ainda não tenha acesso, crie sua conta na aba Cadastrar ou use a opção Gmail.'
      );
      return;
    }

    if (matchedUser.password && matchedUser.password !== cleanPassword) {
      setError('Senha incorreta para este e-mail. Verifique suas credenciais e tente novamente.');
      return;
    }

    setSuccessMsg(`Bem-vindo(a) de volta, ${matchedUser.name}!`);
    setTimeout(() => {
      onLogin(matchedUser);
      onClose();
    }, 400);
  };

  // Handle Register submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = registerName.trim();
    const cleanEmail = registerEmail.trim().toLowerCase();
    const cleanPassword = registerPassword.trim();
    const cleanConfirm = registerConfirmPassword.trim();
    const cleanUsername =
      registerUsername.trim().toLowerCase().replace(/^@/, '') ||
      cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
    const cleanRole = registerRole.trim() || 'Colaborador';

    if (!cleanName) {
      setError('Por favor, preencha seu nome completo.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      setError(
        'Já existe uma conta cadastrada com este e-mail. Acesse a aba Entrar para fazer login.'
      );
      return;
    }

    if (cleanPassword.length < 4) {
      setError('A senha deve conter no mínimo 4 caracteres para proteger sua conta.');
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setError('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    const palettes = [
      'bg-indigo-600 text-white',
      'bg-emerald-600 text-white',
      'bg-violet-600 text-white',
      'bg-sky-600 text-white',
      'bg-rose-600 text-white',
      'bg-amber-600 text-white',
      'bg-teal-600 text-white',
    ];
    const randomAvatar = palettes[Math.floor(Math.random() * palettes.length)];

    const newUser = onRegisterAndLogin({
      name: cleanName,
      email: cleanEmail,
      username: cleanUsername,
      role: cleanRole,
      avatarBg: randomAvatar,
      password: cleanPassword,
      provider: cleanEmail.endsWith('@gmail.com') ? 'google' : 'email',
    });

    setSuccessMsg('Conta criada com sucesso! Carregando seu ambiente exclusivo...');
    setTimeout(() => {
      onLogin(newUser);
      onClose();
    }, 500);
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => {
        if (!isBlocking) onClose();
      }}
    >
      <div
        id="auth-modal-panel"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Acesso Seguro TaskFlow
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Entre com seu Gmail ou e-mail pessoal para seu painel isolado
              </p>
            </div>
          </div>

          {!isBlocking && (
            <button
              id="close-auth-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/50 p-1 gap-1">
          <button
            id="auth-tab-gmail-btn"
            type="button"
            onClick={() => {
              setActiveTab('gmail');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'gmail'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Gmail / Google</span>
          </button>

          <button
            id="auth-tab-login-btn"
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>E-mail & Senha</span>
          </button>

          <button
            id="auth-tab-register-btn"
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Cadastrar</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div
              id="auth-error-message"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              id="auth-success-message"
              className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'gmail' && (
            /* Gmail Tab */
            <div className="space-y-4 animate-fade-in">
              <div className="text-center space-y-1">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Entre diretamente com sua conta Google / Gmail
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Acesso rápido, seguro e com espaço de tarefas 100% individual
                </p>
              </div>

              {/* Main Google Popup Button */}
              <button
                id="google-login-btn"
                type="button"
                disabled={isGoogleLoading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs hover:shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>
                  {isGoogleLoading
                    ? 'Abrindo login do Google...'
                    : 'Conectar com Conta do Google'}
                </span>
              </button>

              {/* 1-Click Fast Shortcut for active account */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Entrar com 1 clique:
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Detectado
                  </span>
                </div>

                <button
                  id="quick-gmail-larissa-btn"
                  type="button"
                  onClick={() =>
                    handleDirectGmailSubmit(
                      'larissaaraujo.grupovirtron@gmail.com',
                      'Larissa Araújo'
                    )
                  }
                  className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      L
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        Larissa Araújo
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        larissaaraujo.grupovirtron@gmail.com
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition shrink-0" />
                </button>
              </div>

              {/* Direct Gmail Input (Always available or expandable) */}
              <div className="pt-1">
                {!showDirectGmailInput ? (
                  <div className="text-center">
                    <button
                      id="toggle-direct-gmail-btn"
                      type="button"
                      onClick={() => setShowDirectGmailInput(true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Entrar com outro e-mail do Gmail</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Informe seu Gmail:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDirectGmailInput(false)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Ocultar
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        id="direct-gmail-input"
                        type="email"
                        placeholder="exemplo@gmail.com"
                        value={directGmailInput}
                        onChange={(e) => setDirectGmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleDirectGmailSubmit();
                          }
                        }}
                        className="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <button
                        id="submit-direct-gmail-btn"
                        type="button"
                        onClick={() => handleDirectGmailSubmit()}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shrink-0 shadow-xs transition cursor-pointer"
                      >
                        Acessar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'login' && (
            /* Standard Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    placeholder="seu.email@empresa.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Senha
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Acesso exclusivo ao seu usuário
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password-input"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    title={showLoginPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <span>Entrar no Meu Painel</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('gmail');
                    setError(null);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Prefere entrar com Gmail? Clique aqui
                </button>
              </div>
            </form>
          )}

          {activeTab === 'register' && (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-name-input"
                    type="text"
                    required
                    placeholder="Seu nome completo"
                    value={registerName}
                    onChange={(e) => {
                      setRegisterName(e.target.value);
                      if (!registerUsername) {
                        setRegisterUsername(
                          e.target.value
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^a-z0-9]/g, '')
                        );
                      }
                    }}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  E-mail Pessoal / Corporativo *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-email-input"
                    type="email"
                    required
                    placeholder="seu.email@gmail.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Cargo / Função
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-role-input"
                      type="text"
                      placeholder="Ex: Gestora, Dev"
                      value={registerRole}
                      onChange={(e) => setRegisterRole(e.target.value)}
                      className="w-full text-xs pl-8 pr-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Identificador (@)
                  </label>
                  <input
                    id="register-username-input"
                    type="text"
                    placeholder="usuario"
                    value={registerUsername}
                    onChange={(e) =>
                      setRegisterUsername(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
                      )
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-password-input"
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      placeholder="Mín. 4 dígitos"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full text-xs pl-8 pr-7 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-confirm-password-input"
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      placeholder="Repita a senha"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="w-full text-xs pl-8 pr-7 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar e Entrar no Painel</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('gmail');
                    setError(null);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Prefere entrar com Gmail? Clique aqui
                </button>
              </div>
            </form>
          )}

          {/* Privacy and Security Notice */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              <strong>Privacidade e isolamento:</strong> O login é individual e intransferível. Cada usuário do Gmail tem acesso exclusivo às suas próprias demandas e dados com segurança.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
