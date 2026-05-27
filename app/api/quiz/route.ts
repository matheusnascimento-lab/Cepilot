import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { areas, level, goal } = await req.json()

    const prompt = `Crie exatamente 5 questões de múltipla escolha sobre ${areas?.join(', ')} para um aluno de nível ${level} com objetivo de ${goal}.

Cada questão deve ser desafiadora mas justa. Responda SOMENTE com JSON válido:

{
  "questions": [
    {
      "question": "Pergunta clara e objetiva",
      "options": ["A) opção", "B) opção", "C) opção", "D) opção"],
      "correct": 0,
      "explanation": "Explicação breve do porquê essa é a resposta correta"
    }
  ]
}

REGRAS:
- correct é o índice (0-3) da opção correta
- Questões práticas, do dia a dia profissional
- Nível adequado: ${level}
- Todo texto em português brasileiro
- Sem emojis`

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0].message.content || '{}'
    const data = JSON.parse(raw)

    return NextResponse.json({ questions: data.questions || [] })
  } catch (err) {
    console.error('Quiz error:', err)
    return NextResponse.json({ questions: [] }, { status: 500 })
  }
}
