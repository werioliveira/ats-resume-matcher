export type AnalysisResult = {
  score: number
  matchedKeywords: string[]
  missingKeywords: string[]
  formatQuality: number
  originalCV: string
  optimizedCV: string
}

export const finetunePrompts = [
  "Mais conciso",
  "Focar em liderança",
  "Destacar resultados com números",
  "Tom mais formal",
]

export const mockAnalysis: AnalysisResult = {
  score: 78,
  matchedKeywords: ["Python", "FastAPI", "PostgreSQL", "Docker", "Git", "React"],
  missingKeywords: ["AWS", "Kubernetes", "CI/CD", "Terraform", "Microserviços"],
  formatQuality: 92,
  originalCV: `WERI OLIVEIRA SANTOS
São Gabriel, BA | (74) 99946-7851 | contact@werioliveira.site

OBJETIVO
Desenvolvedor Fullstack / Backend (Node.js | Python | Next.js)

RESUMO PROFISSIONAL
Sou Desenvolvedor de Software Fullstack com formação em Análise e Desenvolvimento de Sistemas. Tenho experiência sólida no desenvolvimento de aplicações web escaláveis, APIs RESTful e microsserviços. Domino os ecossistemas JavaScript/TypeScript (Next.js, React, Node.js) e Python (FastAPI), trabalhando com bancos de dados relacionais e NoSQL.

EXPERIÊNCIA
- Desenvolvimento de APIs RESTful com Node.js e Python.
- Criação de interfaces com React e Next.js.
- Gerenciamento de bancos de dados PostgreSQL e MongoDB.
- Deploy de aplicações utilizando Docker e Git.`,
  optimizedCV: `WERI OLIVEIRA SANTOS
São Gabriel, BA | (74) 99946-7851 | contact@werioliveira.site

OBJETIVO
Desenvolvedor Backend Pleno (Python | FastAPI | Cloud)

RESUMO PROFISSIONAL
Desenvolvedor de Software Backend com sólida experiência na construção de aplicações web escaláveis e arquiteturas de microsserviços. Especialista em Python (FastAPI) e JavaScript/TypeScript, com forte domínio em bancos de dados relacionais (PostgreSQL) e NoSQL (MongoDB). Focado em alta disponibilidade, integração contínua (CI/CD) e soluções em nuvem (AWS).

EXPERIÊNCIA
- Arquitetura e desenvolvimento de APIs RESTful robustas utilizando Python e FastAPI.
- Implementação de microsserviços escaláveis com Node.js e comunicação via mensageria.
- Otimização de queries complexas e modelagem de dados no PostgreSQL e MongoDB.
- Containerização de ambientes com Docker e orquestração de pipelines de CI/CD.`
}