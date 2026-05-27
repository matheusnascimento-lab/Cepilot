export interface CefisUser {
  id: number;
  name: string;
  first_name: string;
  email: string;
  avatar?: string;
  profile?: string;
  occupation?: string;
  nivel?: number;
  is_premium: boolean;
}

export interface CefisCourse {
  id: number;
  title: string;
  subtitle?: string;
  summary?: string;
  banner?: string;
  duration: number;
  lessonCount: number;
  categories: number[];
  averageRating?: number;
  ratingQuantity?: number;
  crcActive?: boolean;
  crcCreditHours?: number;
  launchDate?: string;
  teacher?: { id: number; name: string; avatar?: string };
  progress?: { percentage: number };
}

export interface OnboardingData {
  areas: string[];
  goal: string;
  dailyMinutes: number;
  level: string;
  learningStyle: string;
}

export interface StudyPlan {
  diagnosis: string;
  gaps: string[];
  weeks: {
    week: number;
    focus: string;
    courses: { id: number; title: string; reason: string; duration: string }[];
    tip: string;
  }[];
  firstStep: string;
}

export type Category = {
  id: number;
  label: string;
  icon: string;
};

export const CATEGORIES: Category[] = [
  { id: 1, label: 'Contabilidade', icon: '📊' },
  { id: 2, label: 'Fiscal / Tributário', icon: '🏛️' },
  { id: 3, label: 'Trabalhista', icon: '⚖️' },
  { id: 4, label: 'Direito', icon: '📜' },
  { id: 5, label: 'Gestão', icon: '🎯' },
  { id: 6, label: 'Desenvolvimento Pessoal', icon: '🚀' },
  { id: 7, label: 'Concursos Públicos', icon: '🏆' },
];

export const GOALS = [
  { id: 'concurso', label: 'Passar em Concurso Público', icon: '🏆' },
  { id: 'oab', label: 'Aprovação na OAB', icon: '⚖️' },
  { id: 'atualizacao', label: 'Atualização Profissional', icon: '📈' },
  { id: 'carreira', label: 'Transição de Carreira', icon: '🔄' },
  { id: 'crescimento', label: 'Crescimento na Empresa', icon: '⬆️' },
  { id: 'conhecimento', label: 'Aprendizado Pessoal', icon: '🧠' },
];

export const TIME_OPTIONS = [
  { value: 10, label: '10 min/dia', desc: 'Microssessões focadas' },
  { value: 30, label: '30 min/dia', desc: 'Ritmo constante' },
  { value: 60, label: '1 hora/dia', desc: 'Progresso acelerado' },
  { value: 120, label: '2+ horas/dia', desc: 'Imersão total' },
];

export const LEVELS = [
  { id: 'iniciante', label: 'Iniciante', desc: 'Pouco ou nenhum contato com a área' },
  { id: 'basico', label: 'Básico', desc: 'Conhecimentos fundamentais' },
  { id: 'intermediario', label: 'Intermediário', desc: 'Experiência prática na área' },
  { id: 'avancado', label: 'Avançado', desc: 'Domínio sólido, busco especialização' },
];

export const LEARNING_STYLES = [
  { id: 'visual', label: 'Visual', desc: 'Aprendo melhor com diagramas, mapas e esquemas', icon: '👁️' },
  { id: 'auditivo', label: 'Auditivo', desc: 'Prefiro escutar explicações e debates', icon: '🎧' },
  { id: 'leitura', label: 'Leitura/Escrita', desc: 'Assimilo bem por textos e anotações', icon: '📝' },
  { id: 'pratico', label: 'Prático', desc: 'Aprendo fazendo exercícios e aplicando', icon: '⚡' },
];
