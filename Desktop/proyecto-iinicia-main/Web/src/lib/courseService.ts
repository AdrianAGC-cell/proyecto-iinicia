import { Course, MoodleTask, ForumThread, ForumReply, CourseResource, Role } from '../types';
import { MOCK_STUDENT_COURSES, MOCK_TASKS, MOCK_FORUM_THREADS, MOCK_RESOURCES } from '../data/mockData';

const STORAGE_KEYS = {
  COURSES: 'iinicia_lms_courses_v2',
  TASKS: 'iinicia_lms_tasks_v2',
  FORUMS: 'iinicia_lms_forums_v2',
  RESOURCES: 'iinicia_lms_resources_v2'
};

// Initialize LocalStorage with rich mock data if empty
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(MOCK_STUDENT_COURSES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(MOCK_TASKS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FORUMS)) {
    localStorage.setItem(STORAGE_KEYS.FORUMS, JSON.stringify(MOCK_FORUM_THREADS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESOURCES)) {
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(MOCK_RESOURCES));
  }
}

export const courseService = {
  // COURSES
  async getCourses(): Promise<Course[]> {
    initializeStorage();
    try {
      const res = await fetch('http://localhost:5000/api/courses');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Sync with local
          const localTasks = this.getStoredTasks();
          return data.map((c: any) => {
            const courseTasks = localTasks.filter(t => t.courseId === c.id);
            const pendingCount = courseTasks.filter(t => t.status === 'Pendiente').length;
            const completedCount = courseTasks.filter(t => t.status !== 'Pendiente').length;
            const dynamicProgress = courseTasks.length > 0
              ? Math.round((completedCount / courseTasks.length) * 100)
              : c.progress || 75;
            return {
              ...c,
              pendingTasks: pendingCount,
              progress: dynamicProgress
            };
          });
        }
      }
    } catch (_) {
      // Fallback
    }

    const saved = localStorage.getItem(STORAGE_KEYS.COURSES);
    const courses: Course[] = saved ? JSON.parse(saved) : MOCK_STUDENT_COURSES;
    const localTasks = this.getStoredTasks();

    return courses.map(c => {
      const courseTasks = localTasks.filter(t => t.courseId === c.id);
      const pendingCount = courseTasks.filter(t => t.status === 'Pendiente').length;
      const completedCount = courseTasks.filter(t => t.status !== 'Pendiente').length;
      const dynamicProgress = courseTasks.length > 0
        ? Math.round((completedCount / courseTasks.length) * 100)
        : c.progress;
      return {
        ...c,
        pendingTasks: pendingCount,
        progress: dynamicProgress
      };
    });
  },

  async getCourseById(id: string): Promise<Course | undefined> {
    const courses = await this.getCourses();
    return courses.find(c => c.id === id || String(c.moodleCourseId) === id) || courses[0];
  },

  // TASKS
  getStoredTasks(): MoodleTask[] {
    initializeStorage();
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    return saved ? JSON.parse(saved) : MOCK_TASKS;
  },

  async getTasks(courseId?: string): Promise<MoodleTask[]> {
    const tasks = this.getStoredTasks();
    if (courseId) {
      return tasks.filter(t => t.courseId === courseId);
    }
    return tasks;
  },

  async submitTask(
    courseId: string, 
    taskId: string, 
    submission: { text: string; fileName?: string }
  ): Promise<MoodleTask> {
    const tasks = this.getStoredTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    const now = new Date().toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (idx !== -1) {
      tasks[idx] = {
        ...tasks[idx],
        status: 'Entregado',
        submissionDate: now,
        submissionText: submission.text,
        fileName: submission.fileName || 'evidencia_tarea.pdf',
        feedback: 'Entrega recibida en el sistema de Moodle. Pendiente de revisión por el docente.'
      };
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

      // Try notifying backend API
      try {
        await fetch(`http://localhost:5000/api/courses/${courseId}/tasks/${taskId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tasks[idx])
        });
      } catch (_) {}

      // Recalculate course progress
      await this.updateCourseProgress(courseId);

      return tasks[idx];
    }
    throw new Error('Tarea no encontrada');
  },

  async updateCourseProgress(courseId: string) {
    const courses = await this.getCourses();
    const tasks = this.getStoredTasks().filter(t => t.courseId === courseId);
    if (tasks.length === 0) return;

    const completed = tasks.filter(t => t.status !== 'Pendiente').length;
    const newProgress = Math.round((completed / tasks.length) * 100);

    const updatedCourses = courses.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          progress: newProgress,
          pendingTasks: tasks.filter(t => t.status === 'Pendiente').length
        };
      }
      return c;
    });

    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(updatedCourses));
  },

  // FORUMS
  getStoredForums(): ForumThread[] {
    initializeStorage();
    const saved = localStorage.getItem(STORAGE_KEYS.FORUMS);
    return saved ? JSON.parse(saved) : MOCK_FORUM_THREADS;
  },

  async getForums(courseId?: string): Promise<ForumThread[]> {
    const forums = this.getStoredForums();
    if (courseId) {
      return forums.filter(f => f.courseId === courseId);
    }
    return forums;
  },

  async createThread(
    courseId: string,
    threadData: {
      title: string;
      category: 'General' | 'Dudas' | 'Debate' | 'Avisos';
      content: string;
      authorName: string;
      authorEmail: string;
      authorRole: Role;
      authorAvatar?: string;
    }
  ): Promise<ForumThread> {
    const forums = this.getStoredForums();
    const newThread: ForumThread = {
      id: `FT-${Date.now()}`,
      courseId,
      title: threadData.title,
      category: threadData.category,
      authorName: threadData.authorName,
      authorEmail: threadData.authorEmail,
      authorRole: threadData.authorRole,
      authorAvatar: threadData.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      content: threadData.content,
      createdAt: 'Hace un momento',
      views: 1,
      replies: [],
      pinned: false
    };

    forums.unshift(newThread);
    localStorage.setItem(STORAGE_KEYS.FORUMS, JSON.stringify(forums));

    // Notify backend
    try {
      await fetch(`http://localhost:5000/api/courses/${courseId}/forums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThread)
      });
    } catch (_) {}

    return newThread;
  },

  async addReply(
    courseId: string,
    threadId: string,
    replyData: {
      content: string;
      authorName: string;
      authorEmail: string;
      authorRole: Role;
      authorAvatar?: string;
    }
  ): Promise<ForumReply> {
    const forums = this.getStoredForums();
    const thread = forums.find(f => f.id === threadId);
    if (!thread) throw new Error('Hilo no encontrado');

    const newReply: ForumReply = {
      id: `FR-${Date.now()}`,
      threadId,
      authorName: replyData.authorName,
      authorEmail: replyData.authorEmail,
      authorRole: replyData.authorRole,
      authorAvatar: replyData.authorAvatar,
      content: replyData.content,
      createdAt: 'Hace un momento',
      likes: 0
    };

    thread.replies.push(newReply);
    thread.views += 1;
    localStorage.setItem(STORAGE_KEYS.FORUMS, JSON.stringify(forums));

    // Notify backend
    try {
      await fetch(`http://localhost:5000/api/courses/${courseId}/forums/${threadId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReply)
      });
    } catch (_) {}

    return newReply;
  },

  async toggleLikeReply(threadId: string, replyId: string): Promise<number> {
    const forums = this.getStoredForums();
    const thread = forums.find(f => f.id === threadId);
    if (!thread) return 0;
    const reply = thread.replies.find(r => r.id === replyId);
    if (!reply) return 0;

    reply.likes = (reply.likes || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.FORUMS, JSON.stringify(forums));
    return reply.likes;
  },

  // RESOURCES
  async getResources(courseId?: string): Promise<CourseResource[]> {
    initializeStorage();
    const saved = localStorage.getItem(STORAGE_KEYS.RESOURCES);
    const resources: CourseResource[] = saved ? JSON.parse(saved) : MOCK_RESOURCES;
    if (courseId) {
      return resources.filter(r => r.courseId === courseId);
    }
    return resources;
  }
};
