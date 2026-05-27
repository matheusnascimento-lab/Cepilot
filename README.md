# 🎓 Mentor CEFIS — Tutor de IA Personalizado

Protótipo funcional para o **Hackathon de Inovação em Aprendizado CEFIS 2026**.

Tutor de IA que conhece o aluno, identifica lacunas e cria um plano de estudos personalizado com cursos reais do catálogo CEFIS.

---

## ✨ Funcionalidades

- **Login com conta CEFIS real** — integração direta com a API
- **Onboarding personalizado** — área, objetivo, tempo disponível, nível, estilo de aprendizagem
- **Diagnóstico por IA** — Claude identifica lacunas e cria plano de estudos
- **Cursos reais do catálogo CEFIS** — integrado via API v3
- **Chat com tutor** — responde perguntas, cria quizzes, faz resumos, microlições de 10min
- **Design responsivo** — funciona em desktop e mobile

---

## 🚀 Deploy no Vercel (passo a passo)

### 1. Criar conta no GitHub (se não tiver)
Acesse [github.com](https://github.com) e crie uma conta gratuita.

### 2. Criar repositório
- Clique em **"New repository"**
- Nome: `cefis-tutor`
- Deixe como **Public**
- Clique em **"Create repository"**

### 3. Fazer upload dos arquivos
Na página do repositório criado, clique em **"uploading an existing file"** e faça upload de todos os arquivos desta pasta (mantendo a estrutura de pastas).

### 4. Criar conta no Vercel
Acesse [vercel.com](https://vercel.com) e entre com sua conta GitHub.

### 5. Importar projeto
- Clique em **"New Project"**
- Selecione o repositório `cefis-tutor`
- Clique em **"Import"**

### 6. Configurar variável de ambiente ⚠️ OBRIGATÓRIO
Antes de clicar em Deploy, na seção **"Environment Variables"**:
- Nome: `ANTHROPIC_API_KEY`
- Valor: sua chave da API Anthropic (obtenha em [console.anthropic.com](https://console.anthropic.com))

### 7. Deploy!
Clique em **"Deploy"** e aguarde ~2 minutos.

Seu app estará disponível em: `https://cefis-tutor.vercel.app` (ou similar)

---

## 🔑 Obter chave Anthropic

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Crie uma conta gratuita
3. Vá em **"API Keys"** → **"Create Key"**
4. Copie a chave e use na variável `ANTHROPIC_API_KEY`

> ⚠️ Você precisará adicionar créditos ($5 é suficiente para o hackathon)

---

## 🛠️ Rodar localmente (opcional)

```bash
# Instalar dependências
npm install

# Criar arquivo .env.local
cp .env.example .env.local
# Edite .env.local e coloque sua ANTHROPIC_API_KEY

# Rodar em desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

---

## 📁 Estrutura do Projeto

```
cefis-tutor/
├── app/
│   ├── page.tsx              # Login com CEFIS
│   ├── onboarding/page.tsx   # Onboarding (4 etapas)
│   ├── tutor/page.tsx        # Plano + Chat
│   └── api/
│       ├── login/route.ts    # Proxy login CEFIS
│       ├── courses/route.ts  # Catálogo CEFIS
│       ├── plan/route.ts     # Geração do plano (Claude)
│       └── chat/route.ts     # Chat streaming (Claude)
└── lib/
    └── types.ts              # Tipos e dados estáticos
```

---

## 🏆 Critérios do Hackathon

| Critério | Como atendemos |
|---|---|
| Funcionalidade (30pts) | Login → Onboarding → Diagnóstico → Plano → Chat |
| Integração CEFIS (25pts) | API de login + catálogo de cursos reais |
| Qualidade da IA (20pts) | Claude com contexto completo do aluno |
| Inovação (15pts) | Microlições, quizzes on-demand, estilo de aprendizagem |
| UX (10pts) | Design dark premium, responsivo, animações suaves |

---

Desenvolvido para o Hackathon CEFIS · 26 de maio de 2026
