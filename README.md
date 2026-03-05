# Portal de Pacientes - HULW (Atualização Cirúrgica)

Este projeto é um front-end desenvolvido em **Angular 19+** com **Tailwind CSS v3** para o Hospital Universitário Lauro Wanderley (HULW). O objetivo do portal é permitir que os pacientes atualizem seus status nas filas de espera cirúrgica de forma digital.

## 🚀 Tecnologias Utilizadas

- **Angular 19+** (Standalone Components)
- **Tailwind CSS v3** (Estilização utilitária e design system responsivo)
- **Reactive Forms** (Controle e validação complexa de formulários)
- **TypeScript & HTML5**
- **RxJS** (Integração assíncrona com o backend via `HttpClient`)

---

## 🏗️ Estrutura do Projeto

A arquitetura do projeto foi construída utilizando componentes _Standalone_, dispensando o uso de módulos complexos (`NgModules`) em prol da simplicidade e desempenho.

### Componentes Principais

1. **`AppComponent` (`app.ts` / `app.html`)**
   - Atua como o componente orquestrador.
   - Gerencia dinamicamente qual tela deve ser exibida ao usuário baseada na variável de estado `isAuthorized`.

2. **`IdentityValidationComponent` (`identity-validation.ts`)**
   - **Objetivo:** Primeira camada de segurança.
   - **Funcionalidade:** Exige que o paciente insira os 3 primeiros dígitos do CPF e a Data de Nascimento para prosseguir.
   - **Comunicação:** Emite um evento `onAuthorized()` informando ao `AppComponent` que a identificação foi bem-sucedida.

3. **`SurgicalUpdateFormComponent` (`surgical-update-form.ts`)**
   - **Objetivo:** O formulário principal (Core) da aplicação coletando as respostas do paciente.
   - **Lógica Condicional:** A pergunta sobre o _motivo_ da desistência só é exibida e exigida como obrigatória (`Validators.required` dinâmico) caso o paciente responda "Não" na primeira etapa.
   - **Integração API:** Coleta as três respostas e aciona o serviço HTTP para envio e atualização bancária. Possui estado de Carregamento (Spinner) e Sucesso/Erro.

### Serviços

- **`FilaService` (`fila.service.ts`)**
  - Serviço injetado na raiz (`providedIn: 'root'`) responsável pela lógica HTTP.
  - **Endpoint principal:** `PATCH http://localhost:8000/fila/{pacienteId}/status`

---

## 🛠️ Como Instalar e Rodar o Projeto

### Pré-requisitos

- Node.js (Recomendamos a versão mais recente LTS - `v20` ou `v22`)
- Angular CLI (Instalado globalmente com `npm install -g @angular/cli`)

### Passos Locais

1. **Clone/Navegue até o Repositório:**
   Entre na pasta do projeto:

   ```bash
   cd "Frontend/portal-paciente"
   ```

2. **Instalação das Dependências:**
   Instale todas as bibliotecas necessárias do Angular, além do Tailwind CSS, PostCSS e AutoPrefixer.

   ```bash
   npm install
   ```

3. **Iniciando o Servidor de Desenvolvimento:**
   Inicie a aplicação local com o Angular CLI.
   ```bash
   ng serve
   ```
   > O servidor será iniciado em `http://localhost:4200/`.

---

## 🎨 Sobre o Design (Tailwind CSS)

O projeto adota uma abordagem **Mobile-First**. As classes utilitárias constroem a interface primariamente para dispositivos móveis, para garantir o fácil acesso da população.

- **Identidade Visual:** Fiel às cores institucionais convencionais para a saúde pública na Paraíba (Tons de Azul Marinho Clássicos, Azul Claro e fundos acinzentados).
- Foi utilizado `bg-gray-50` para o fundo global, destacando os "cards brancos" contendo os respectivos formulários.

## 📝 Próximos Passos Sugeridos (Roadmap)

- Implementar tratamento de token e rotas (Angular Router) quando a aplicação ganhar escala.
- Extrair o endpoint do backend de um ambiente `.env` (Angular Environments).
- Criar a camada interceptora do HTTP caso exista autenticação/JWT na API nas próximas fases do projeto.
