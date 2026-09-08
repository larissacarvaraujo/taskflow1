import React from 'react';
import {
  X,
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Volume2,
  ExternalLink,
  Trash2,
  AtSign,
  Monitor,
  ShieldAlert,
  BellRing,
} from 'lucide-react';
import { NotificationItem, Task } from '../types';
import { NotificationPermissionStatus } from '../services/systemNotificationService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onSelectTask: (taskId: string) => void;
  onClearNotifications: () => void;
  onTestSoundAlert: () => void;
  notificationPermission: NotificationPermissionStatus;
  onRequestNotificationPermission: () => void;
  onTestSystemNotification: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectTask,
  onClearNotifications,
  onTestSoundAlert,
  notificationPermission,
  onRequestNotificationPermission,
  onTestSystemNotification,
}) => {
  if (!isOpen) return null;

  const overdueNotifications = notifications.filter((n) => n.type === 'overdue');
  const dueSoonNotifications = notifications.filter((n) => n.type === 'due_soon');
  const mentionNotifications = notifications.filter(
    (n) => n.type === 'mention' || n.type === 'assigned'
  );

  return (
    <div
      id="notifications-drawer-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/70 backdrop-blur-2xs flex justify-end"
      onClick={onClose}
    >
      <div
        id="notifications-drawer-panel"
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left border-l border-slate-200 dark:border-slate-800 transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Central de Alertas e Prazos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitoramento contínuo de tarefas críticas
              </p>
            </div>
          </div>
          <button
            id="close-notifications-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System & Audio Alerts Settings Bar */}
        <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Notificações na Área de Trabalho:</span>
            </span>

            {notificationPermission === 'granted' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Ativas
              </span>
            ) : notificationPermission === 'denied' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Bloqueadas
              </span>
            ) : (
              <button
                id="drawer-request-permission-btn"
                type="button"
                onClick={onRequestNotificationPermission}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-2xs transition"
              >
                <BellRing className="w-3 h-3" />
                <span>Ativar Alertas</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            {notificationPermission === 'granted'
              ? 'Alertas nativos do sistema operacional serão enviados quando tarefas atingirem o prazo, mesmo com esta aba em segundo plano.'
              : notificationPermission === 'denied'
              ? 'O navegador bloqueou as notificações. Permita o envio no cadeado da barra de endereço para receber alertas fora da aba.'
              : 'Clique em "Ativar Alertas" para permitir notificações fora da aba quando um prazo estourar.'}
          </p>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              id="test-system-notification-btn"
              type="button"
              onClick={onTestSystemNotification}
              className="flex-1 flex items-center justify-center gap-1.5 text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium cursor-pointer bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/80 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition"
              title="Disparar notificação nativa para testar visualização fora da aba"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Testar no Sistema</span>
            </button>

            <button
              id="test-sound-alert-btn"
              type="button"
              onClick={onTestSoundAlert}
              className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <Volume2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Testar Som</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Tudo sob controle!
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                Não há tarefas atrasadas ou com prazo estourando no momento.
              </p>
            </div>
          ) : (
            <>
              {/* Overdue Section */}
              {overdueNotifications.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-2.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Atrasadas ({overdueNotifications.length})</span>
                  </div>
                  <div className="space-y-2">
                    {overdueNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onSelectTask(notif.taskId);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-rose-900 dark:text-rose-200 line-clamp-1">
                            {notif.taskTitle}
                          </span>
                          <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded uppercase">
                            Atrasada
                          </span>
                        </div>
                        <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 group-hover:underline">
                          <span>Ver e resolver tarefa</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Soon Section */}
              {dueSoonNotifications.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-2.5">
                    <Clock className="w-4 h-4" />
                    <span>Em cima do Prazo ({dueSoonNotifications.length})</span>
                  </div>
                  <div className="space-y-2">
                    {dueSoonNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onSelectTask(notif.taskId);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 line-clamp-1">
                            {notif.taskTitle}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                            Urgente
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 group-hover:underline">
                          <span>Ver detalhes da tarefa</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentions Section */}
              {mentionNotifications.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2.5">
                    <AtSign className="w-4 h-4" />
                    <span>Menções & Atribuições ({mentionNotifications.length})</span>
                  </div>
                  <div className="space-y-2">
                    {mentionNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onSelectTask(notif.taskId);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer group"
                      >
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block mb-1">
                          {notif.taskTitle}
                        </span>
                        <p className="text-xs text-indigo-800 dark:text-indigo-300">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {notifications.length} alerta{notifications.length > 1 ? 's' : ''} ativo
              {notifications.length > 1 ? 's' : ''}
            </span>
            <button
              id="clear-notifications-btn"
              type="button"
              onClick={onClearNotifications}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium hover:underline cursor-pointer"
            >
              Limpar alertas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
