import { User, Column, Project, Task } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Graciele Silva',
    username: 'graciele',
    email: 'graciele14.silva@gmail.com',
    avatarBg: 'bg-indigo-600 text-white',
    role: 'Product Lead',
  },
  {
    id: 'user-2',
    name: 'Lucas Mendes',
    username: 'lucas',
    email: 'lucas.mendes@empresa.com',
    avatarBg: 'bg-emerald-600 text-white',
    role: 'Full Stack Dev',
  },
  {
    id: 'user-3',
    name: 'Ana Souza',
    username: 'ana',
    email: 'ana.souza@empresa.com',
    avatarBg: 'bg-amber-600 text-white',
    role: 'UI/UX Designer',
  },
  {
    id: 'user-4',
    name: 'Carlos Rocha',
    username: 'carlos',
    email: 'carlos.rocha@empresa.com',
    avatarBg: 'bg-sky-600 text-white',
    role: 'Tech Lead',
  },
  {
    id: 'user-5',
    name: 'Mariana Costa',
    username: 'mariana',
    email: 'mariana.costa@empresa.com',
    avatarBg: 'bg-rose-600 text-white',
    role: 'QA Engineer',
  },
];

export const INITIAL_COLUMNS: Column[] = [
  {
    id: 'todo',
    title: 'A Fazer',
    description: 'Backlog pronto para ser puxado',
    color: 'border-slate-400/30',
  },
  {
    id: 'in_progress',
    title: 'Em Andamento',
    description: 'Tarefas ativas com time tracking',
    color: 'border-blue-500/40',
  },
  {
    id: 'review',
    title: 'Em Revisão / Bloqueio',
    description: 'Aguardando aprovação ou validação',
    color: 'border-amber-500/40',
  },
  {
    id: 'done',
    title: 'Concluído',
    description: 'Entregue e homologado com sucesso',
    color: 'border-emerald-500/40',
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Gestão de Demandas',
    description: 'Acompanhamento de tarefas, prazos e entregas da equipe',
    category: 'Geral',
  },
];

// Helper to compute relative ISO dates
function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Elaborar especificação de integração com API Gateway',
    description: 'Alinhado com @carlos para definir os contratos OpenAPI e autenticação via OAuth2. Tarefa crítica direcionada para @lucas.',
    columnId: 'in_progress',
    priority: 'urgente',
    assigneeId: 'user-2', // Lucas
    dueDate: getDateOffset(-2), // Overdue! Will trigger alert
    estimatedHours: 12,
    trackedSeconds: 14520, // ~4 hours
    isTracking: false,
    tags: ['Backend', 'Arquitetura', 'Crítico'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 'sub-1', title: 'Definir endpoints de autenticação JWT', completed: true },
      { id: 'sub-2', title: 'Mapear rate limiting e quotas por cliente', completed: true },
      { id: 'sub-3', title: 'Escrever arquivo swagger.json preliminar', completed: false },
      { id: 'sub-4', title: 'Aprovar modelo com @carlos', completed: false },
    ],
    attachments: [
      {
        id: 'att-1',
        name: 'Arquitetura_Gateway_v2.pdf',
        size: 2450000,
        type: 'application/pdf',
        url: '#',
        uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ],
    comments: [
      {
        id: 'c-1',
        userId: 'user-1',
        text: 'Atenção @lucas, precisamos dessa definição até amanhã para liberar o frontend!',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        mentions: ['lucas'],
      },
      {
        id: 'c-2',
        userId: 'user-2',
        text: 'Já adiantei o schema de autenticação e os contratos principais com @carlos.',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        mentions: ['carlos'],
      },
    ],
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    title: 'Refatoração dos componentes do Kanban e Time Tracker',
    description: 'Melhorar a performance de renderização do quadro estilo Runrun.it. Direcionado para @graciele acompanhar os testes de usabilidade.',
    columnId: 'todo',
    priority: 'alta',
    assigneeId: 'user-1', // Graciele
    dueDate: getDateOffset(0), // Due today! Will trigger near deadline alert
    estimatedHours: 8,
    trackedSeconds: 3600,
    isTracking: false,
    tags: ['Frontend', 'UI/UX', 'Performance'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 'sub-21', title: 'Virtualização de listas longas de cards', completed: true },
      { id: 'sub-22', title: 'Otimizar hooks de drag-and-drop', completed: false },
      { id: 'sub-23', title: 'Testar em telas touch e resoluções compactas', completed: false },
    ],
    attachments: [],
    comments: [
      {
        id: 'c-3',
        userId: 'user-3',
        text: 'Fiz o upload do novo grid no Figma. @graciele por favor conferir o espaçamento.',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        mentions: ['graciele'],
      },
    ],
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    title: 'Guia de Estilos e Design System no Figma',
    description: 'Padronizar paleta de cores neutras sofisticadas, botões de ação e modais com @ana.',
    columnId: 'in_progress',
    priority: 'media',
    assigneeId: 'user-3', // Ana
    dueDate: getDateOffset(1), // Due tomorrow!
    estimatedHours: 16,
    trackedSeconds: 21600, // 6h
    isTracking: true, // currently running Runrun.it timer
    trackingStartedAt: Date.now() - 1000 * 60 * 18,
    tags: ['Design', 'Tokens'],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 'sub-31', title: 'Mapear escalas tipográficas com proporção 1.25', completed: true },
      { id: 'sub-32', title: 'Componentizar badges de status e tags de prazo', completed: true },
      { id: 'sub-33', title: 'Exportar tokens para o Tailwind CSS', completed: false },
    ],
    attachments: [
      {
        id: 'att-2',
        name: 'DesignSystem_Tokens.pdf',
        size: 1120000,
        type: 'application/pdf',
        url: '#',
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    comments: [],
  },
  {
    id: 'task-4',
    projectId: 'proj-1',
    title: 'Homologação e testes automatizados de ponta a ponta',
    description: 'Validação da esteira de CI/CD e testes com @mariana para garantir 0 regressões antes do deploy.',
    columnId: 'review',
    priority: 'alta',
    assigneeId: 'user-5', // Mariana
    dueDate: getDateOffset(4),
    estimatedHours: 10,
    trackedSeconds: 28800, // 8h
    isTracking: false,
    tags: ['QA', 'Testes', 'DevOps'],
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 'sub-41', title: 'Criar suíte de testes de upload de anexos', completed: true },
      { id: 'sub-42', title: 'Testar fluxo de menções @usuario em comentários', completed: true },
      { id: 'sub-43', title: 'Validar exportação e importação de PDF', completed: true },
    ],
    attachments: [],
    comments: [],
  },
  {
    id: 'task-5',
    projectId: 'proj-1',
    title: 'Definição da infraestrutura de segurança e backups',
    description: 'Configuração de snapshots periódicos e políticas de retenção conforme LGPD.',
    columnId: 'done',
    priority: 'media',
    assigneeId: 'user-4', // Carlos
    dueDate: getDateOffset(-4),
    estimatedHours: 6,
    trackedSeconds: 21600,
    isTracking: false,
    tags: ['DevOps', 'Segurança'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 'sub-51', title: 'Configurar rotina de dump diário', completed: true },
      { id: 'sub-52', title: 'Simulação de recuperação de desastre', completed: true },
    ],
    attachments: [],
    comments: [],
  },
];
