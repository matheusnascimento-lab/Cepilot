import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CefisCourse, OnboardingData, StudyPlan } from '@/lib/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
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
        `- ID:${c.id} | "${c.title}"${c.subtitle ? ` — ${c.subtitle}` : ''} | ${formatDuration(c.duration)} | ${c.lessonCount} aulas | Nota: ${c.averageRating?.toFixed(1) || 'N/A'} | Categorias: ${c.categories?.join(',')} ${c.crcActive ? '| CRC ativo' : ''}`
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

Crie um plano de estudos personalizado e detalhado. Responda SOMENTE com JSON válido, sem markdown, sem texto antes ou depois:

{
  "diagnosis": "Análise do perfil e situação atual do aluno em 2-3 frases",
  "gaps": ["lacuna 1", "lacuna 2", "lacuna 3"],
  "firstStep": "O que o aluno deve fazer HOJE para começar",
  "weeks": [
    {
      "week": 1,
      "focus": "Tema central da semana",
      "courses": [
        { "id": 123, "title": "Título exato do curso", "reason": "Por que este curso para este aluno" }
      ],
      "tip": "Dica específica para este aluno baseada no estilo de aprendizagem"
    }
  ]
}

REGRAS:
- Use SOMENTE cursos da lista acima com IDs reais
- Crie 3-4 semanas de plano
- Máximo 2-3 cursos por semana
- Adapte as dicas ao estilo de aprendizagem informado
- Se não houver cursos relevantes, sugira 1-2 e preencha com recomendações gerais
- Todo texto deve estar em português brasileiro`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    // Parse JSON
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const plan: StudyPlan = JSON.parse(cleaned)

    return NextResponse.json({ plan })
  } catch (err) {
    console.error('Plan generation error:', err)
    // Return fallback plan
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
