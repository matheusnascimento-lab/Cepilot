import { NextRequest } from 'next/server'
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

const STYLE_LABELS: Record<string, string> = {
  visual: 'aprende melhor com diagramas e esquemas visuais',
  auditivo: 'aprende melhor escutando e em debates',
  leitura: 'aprende melhor por textos e anotações escritas',
  pratico: 'aprende melhor praticando e resolvendo exercícios',
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
    const { messages, onboarding, courses, plan }: {
      messages: { role: 'user' | 'assistant'; content: string }[]
      onboarding: OnboardingData
      courses: CefisCourse[]
      plan: StudyPlan | null
    } = body

    const courseList = courses
      .slice(0, 20)
      .map(c => `- ID:${c.id} | "${c.title}" | ${formatDuration(c.duration)} | Nota: ${c.averageRating?.toFixed(1) || 'N/A'}`)
      .join('\n')

    const planSummary = plan
      ? `PLANO ATUAL: Diagnóstico: ${plan.diagnosis} | Lacunas: ${plan.gaps?.join(', ')} | Primeiros cursos: ${plan.weeks?.[0]?.courses?.map(c => c.title).join(', ') || 'Nenhum'}`
      : ''

    const systemPrompt = `Você é o Mentor CEFIS — tutor de aprendizado inteligente da CEFIS, plataforma líder em educação profissional no Brasil.

PERFIL DO ALUNO:
- Áreas: ${onboarding?.areas?.join(', ')}
- Objetivo: ${GOAL_LABELS[onboarding?.goal] || onboarding?.goal}
- Tempo disponível: ${onboarding?.dailyMinutes} minutos/dia
- Nível: ${onboarding?.level}
- Estilo: ${STYLE_LABELS[onboarding?.learningStyle] || onboarding?.learningStyle}

${planSummary}

CATÁLOGO CEFIS:
${courseList || 'Indisponível no momento'}

Responda em português brasileiro, de forma calorosa e motivadora. Recomende cursos pelo nome. Adapte ao estilo de aprendizagem. Para quizzes, crie 3-5 questões com gabarito. Use emojis com moderação.`

    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) controller.enqueue(new TextEncoder().encode(text))
          }
        } catch (err) {
          console.error('Stream error:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('Chat error:', err)
    return new Response('Erro ao processar mensagem. Tente novamente.', { status: 500 })
  }
}
