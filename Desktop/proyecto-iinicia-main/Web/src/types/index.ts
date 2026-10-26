export type Role = 'aspirante' | 'estudiante' | 'profesor' | 'coordinador' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  matricula?: string;
  programId?: string;
  programName?: string;
  semester?: number;
  avatar?: string;
  moodleId?: number;
}

export interface Program {
  id: string;
  title: string;
  degree: 'Licenciatura' | 'Ingeniería' | 'Maestría' | 'Diplomado' | 'Certificación';
  area: string;
  duration: string;
  modality: string;
  credits: number;
  rvoe: string;
  description: string;
  objectives: string;
  fieldWork: string;
  image: string;
  featured: boolean;
  syllabus: { semester: string; courses: string[] }[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  professor: string;
  progress: number;
  pendingTasks: number;
  nextDeadline: string;
  grade?: number;
  moodleCourseId: number;
  color: string;
}

export interface AdmissionApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  programId: string;
  programName: string;
  previousSchool: string;
  averageGrade: string;
  status: 'PENDIENTE' | 'EN REVISION' | 'ADMITIDO' | 'RECHAZADO';
  moodleSynced: boolean;
  moodleUserId: number | null;
  date: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  image: string;
  content: string;
}

export interface MoodleTask {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'Pendiente' | 'Entregado' | 'Calificado';
  grade?: string | null;
  submissionDate?: string;
  submissionText?: string;
  fileName?: string;
  rubric?: { criteria: string; points: number }[];
  feedback?: string;
}

export interface ForumReply {
  id: string;
  threadId: string;
  authorName: string;
  authorEmail: string;
  authorRole: Role;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface ForumThread {
  id: string;
  courseId: string;
  title: string;
  category: 'General' | 'Dudas' | 'Debate' | 'Avisos';
  authorName: string;
  authorEmail: string;
  authorRole: Role;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  views: number;
  replies: ForumReply[];
  pinned?: boolean;
}

export interface CourseResource {
  id: string;
  courseId: string;
  unit: string;
  title: string;
  type: 'pdf' | 'video' | 'lab' | 'link';
  url?: string;
  duration?: string;
  date?: string;
  description?: string;
}

