import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { CefisCourse, OnboardingData, StudyPlan } from '@/lib/types'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const GOAL_LABELS: Record<string, string> = {
  concurso: 'Passar em Concurso Público',
  oab: 'Aprovação na OAB',
  atualizacao: 'Atualização Profissional',
  carreira: 'Transição de Carreira',
  crescimento: 'Crescimento na Empresa',
  conhecimento: 'Aprendizado Pessoal',
}

const LEVEL_LABELS: Record<string, string> = {
  iniciante: 'Iniciante',
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

const STYLE_LABELS: Record<string, string> = {
  visual: 'Visual (diagramas e esquemas)',
  auditivo: 'Auditivo (escuta e debate)',
  leitura: 'Leitura/Escrita (textos e anotações)',
  pratico: 'Prático (exercícios e aplicação)',
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ''}`
  return `${m}min`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { onboarding, courses }: { onboarding: OnboardingData; courses: CefisCourse[] } = body

    const courseList = courses
      .slice(0, 25)
      .map(c =>
        `- ID:${c.id} | "${c.title}"${c.subtitle ? ` — ${c.subtitle}` : ''} | ${formatDuration(c.duration)} | ${c.lessonCount} aulas | Nota: ${c.averageRating?.toFixed(1) || 'N/A'} ${c.crcActive ? '| CRC ativo' : ''}`
      )
      .join('\n')

    const prompt = `Você é um tutor especializado da CEFIS, plataforma líder em educação profissional no Brasil.

PERFIL DO ALUNO:
- Áreas de interesse: ${onboarding.areas.join(', ')}
- Objetivo principal: ${GOAL_LABELS[onboarding.goal] || onboarding.goal}
- Tempo disponível: ${onboarding.dailyMinutes} minutos por dia
- Nível atual: ${LEVEL_LABELS[onboarding.level] || onboarding.level}
- Estilo de aprendizagem: ${STYLE_LABELS[onboarding.learningStyle] || onboarding.learningStyle}

CURSOS DISPONÍVEIS NO CATÁLOGO CEFIS:
${courseList || 'Nenhum curso disponível no momento'}

Crie um plano de estudos personalizado. Responda SOMENTE com JSON válido, sem markdown:

{
  "diagnosis": "Análise do perfil em 2-3 frases",
  "gaps": ["lacuna 1", "lacuna 2", "lacuna 3"],
  "firstStep": "O que fazer HOJE para começar",
  "weeks": [
    {
      "week": 1,
      "focus": "Tema central da semana",
      "courses": [
        { "id": 123, "title": "Título exato do curso", "reason": "Por que este curso" }
      ],
      "tip": "Dica baseada no estilo de aprendizagem"
    }
  ]
}

Use SOMENTE cursos da lista com IDs reais. Crie 3-4 semanas. Máximo 2-3 cursos por semana. Todo texto em português brasileiro.`

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0].message.content || '{}'
    const plan: StudyPlan = JSON.parse(raw)

    return NextResponse.json({ plan })
  } catch (err) {
    console.error('Plan generation error:', err)
    return NextResponse.json({
      plan: {
        diagnosis: 'Analisamos seu perfil e identificamos as melhores oportunidades de aprendizado para você.',
        gaps: ['Fundamentos da área escolhida', 'Aplicação prática dos conceitos', 'Atualização da legislação vigente'],
        firstStep: 'Explore o catálogo CEFIS e comece pelo curso mais bem avaliado na sua área de interesse.',
        weeks: [
          {
            week: 1,
            focus: 'Fundamentos',
            courses: [],
            tip: 'Dedique pelo menos 20 minutos contínuos sem distrações.',
          },
        ],
      },
    })
  }
}
