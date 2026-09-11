import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Task, User, Column, TeamChatMessage, Project } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Always provide firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// SKILL SPECIFICATION: OperationType and FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('Connected to Firebase Firestore successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, check configuration.');
    }
    return false;
  }
}
testConnection();

// Clean task payload for Firestore (ensure no undefined fields)
function cleanTaskPayload(task: Task): Record<string, unknown> {
  return {
    id: task.id,
    title: task.title || '',
    description: task.description || '',
    columnId: task.columnId,
    priority: task.priority,
    assigneeId: task.assigneeId || '',
    subtasks: task.subtasks || [],
    attachments: task.attachments || [],
    comments: task.comments || [],
    dueDate: task.dueDate || '',
    estimatedHours: Number(task.estimatedHours) || 0,
    trackedSeconds: Number(task.trackedSeconds) || 0,
    tags: task.tags || [],
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
    projectId: task.projectId || 'p-1',
  };
}

// ----------------------------------------------------
// Real-time Listeners & Cloud Operations
// ----------------------------------------------------

/**
 * Subscribe to tasks with real-time syncing
 */
export function subscribeToTasks(
  onTasksUpdate: (tasks: Task[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'tasks';
  const unsubscribe = onSnapshot(
    collection(db, path),
    (snapshot) => {
      const tasks: Task[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          columnId: data.columnId || 'todo',
          priority: data.priority || 'media',
          assigneeId: data.assigneeId || undefined,
          subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
          attachments: Array.isArray(data.attachments) ? data.attachments : [],
          comments: Array.isArray(data.comments) ? data.comments : [],
          dueDate: data.dueDate || '',
          estimatedHours: Number(data.estimatedHours) || 0,
          trackedSeconds: Number(data.trackedSeconds) || 0,
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          projectId: data.projectId || 'p-1',
        };
      });
      onTasksUpdate(tasks);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
  return unsubscribe;
}

/**
 * Save / Update Task to Firestore
 */
export async function saveTaskToCloud(task: Task): Promise<void> {
  const path = `tasks/${task.id}`;
  try {
    await setDoc(doc(db, 'tasks', task.id), cleanTaskPayload(task), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete Task from Firestore
 */
export async function deleteTaskFromCloud(taskId: string): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to Users/Members with real-time syncing
 */
export function subscribeToUsers(
  onUsersUpdate: (users: User[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'users';
  const unsubscribe = onSnapshot(
    collection(db, path),
    (snapshot) => {
      const users: User[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name || 'Membro',
          username: d.username || 'usuario',
          email: d.email || '',
          avatarBg: d.avatarBg || 'bg-indigo-600 text-white',
          role: d.role || 'Colaborador',
        };
      });
      onUsersUpdate(users);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
  return unsubscribe;
}

/**
 * Save / Update User in Firestore
 */
export async function saveUserToCloud(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(
      doc(db, 'users', user.id),
      {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarBg: user.avatarBg,
        role: user.role,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete User from Firestore
 */
export async function deleteUserFromCloud(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to Columns
 */
export function subscribeToColumns(
  onColumnsUpdate: (columns: Column[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'columns';
  const unsubscribe = onSnapshot(
    collection(db, path),
    (snapshot) => {
      const columns: Column[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id as Column['id'],
          title: d.title || '',
          description: d.description || '',
          color: d.color || 'bg-slate-100 dark:bg-slate-800',
        };
      });
      if (columns.length > 0) {
        // Sort according to standard order if available
        const order = ['todo', 'in_progress', 'review', 'done'];
        columns.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        onColumnsUpdate(columns);
      }
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
  return unsubscribe;
}

/**
 * Save Column to Firestore
 */
export async function saveColumnToCloud(column: Column): Promise<void> {
  const path = `columns/${column.id}`;
  try {
    await setDoc(
      doc(db, 'columns', column.id),
      {
        id: column.id,
        title: column.title,
        description: column.description,
        color: column.color,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to Team Messages in real time
 */
export function subscribeToMessages(
  onMessagesUpdate: (messages: TeamChatMessage[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'messages';
  const unsubscribe = onSnapshot(
    collection(db, path),
    (snapshot) => {
      const msgs: TeamChatMessage[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          projectId: d.projectId || 'p-1',
          userId: d.userId || '',
          text: d.text || '',
          createdAt: d.createdAt || new Date().toISOString(),
        };
      });
      // Sort chronologically
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onMessagesUpdate(msgs);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
  return unsubscribe;
}

/**
 * Save chat message to Firestore
 */
export async function saveMessageToCloud(msg: TeamChatMessage): Promise<void> {
  const path = `messages/${msg.id}`;
  try {
    await setDoc(doc(db, 'messages', msg.id), {
      id: msg.id,
      projectId: msg.projectId,
      userId: msg.userId,
      text: msg.text,
      createdAt: msg.createdAt,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Seed initial data to cloud if collections are empty so existing tasks/members persist
 */
export async function seedInitialCloudDataIfEmpty(
  defaultTasks: Task[],
  defaultUsers: User[],
  defaultColumns: Column[],
  defaultProjects: Project[]
): Promise<void> {
  try {
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    if (tasksSnap.empty) {
      console.info('Seeding initial tasks and users to Firestore cloud database...');
      const batch = writeBatch(db);

      // Seed tasks
      for (const t of defaultTasks) {
        batch.set(doc(db, 'tasks', t.id), cleanTaskPayload(t));
      }

      // Seed users
      for (const u of defaultUsers) {
        batch.set(doc(db, 'users', u.id), {
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          avatarBg: u.avatarBg,
          role: u.role,
        });
      }

      // Seed columns
      for (const c of defaultColumns) {
        batch.set(doc(db, 'columns', c.id), {
          id: c.id,
          title: c.title,
          description: c.description,
          color: c.color,
        });
      }

      // Seed project
      for (const p of defaultProjects) {
        batch.set(doc(db, 'projects', p.id), {
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
        });
      }

      await batch.commit();
      console.info('Initial data successfully seeded to Firestore.');
    }
  } catch (e) {
    console.warn('Could not check or seed cloud database:', e);
  }
}
