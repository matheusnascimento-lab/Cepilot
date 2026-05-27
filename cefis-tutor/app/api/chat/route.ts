import { NextRequest } from 'next/server'
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
    const {
      messages,
      onboarding,
      courses,
      plan,
    }: {
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
      ? `PLANO ATUAL DO ALUNO:
Diagnóstico: ${plan.diagnosis}
Lacunas: ${plan.gaps?.join(', ')}
Primeiros cursos: ${plan.weeks?.[0]?.courses?.map(c => c.title).join(', ') || 'Nenhum'}`
      : ''

    const systemPrompt = `Você é o Mentor CEFIS — tutor de aprendizado inteligente e personalizado da CEFIS, plataforma líder em educação profissional no Brasil (contabilidade, fiscal, trabalhista, direito, gestão).

PERFIL DO SEU ALUNO:
- Áreas de interesse: ${onboarding?.areas?.join(', ')}
- Objetivo: ${GOAL_LABELS[onboarding?.goal] || onboarding?.goal}
- Tempo disponível: ${onboarding?.dailyMinutes} minutos/dia
- Nível: ${onboarding?.level}
- Estilo: ${STYLE_LABELS[onboarding?.learningStyle] || onboarding?.learningStyle}

${planSummary}

CATÁLOGO CEFIS DISPONÍVEL:
${courseList || 'Catálogo indisponível no momento'}

INSTRUÇÕES COMO TUTOR:
1. Sempre responda em português brasileiro, de forma calorosa e motivadora
2. Recomende cursos específicos pelo nome quando relevante
3. Adapte as explicações ao estilo de aprendizagem do aluno
4. Quando o aluno pedir "tenho X minutos", crie uma microlição focada e objetiva
5. Para quizzes, crie 3-5 questões de múltipla escolha com gabarito comentado
6. Para resumos, use títulos em negrito e listas organizadas
7. Seja direto mas empático — você conhece bem este aluno
8. Mencione cursos reais do catálogo CEFIS pelo nome quando sugerir conteúdo
9. Use emojis com moderação para tornar a conversa mais leve`

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text))
            }
          }
        } catch (err) {
          console.error('Stream error:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('Chat error:', err)
    return new Response('Erro ao processar mensagem. Tente novamente.', { status: 500 })
  }
}
