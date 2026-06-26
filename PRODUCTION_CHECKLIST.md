# Checklist de producao

Conclua todos os itens obrigatorios antes de liberar trafego real.

## Status desta auditoria

Auditoria executada em 2026-06-26 a partir do workspace local e da instancia
n8n ativa resolvida por `npx --yes n8nac env status --json`.

- [X] Arquitetura do backend, painel admin, migracoes, seguranca, integracoes e workflows revisada antes de editar arquivos.
- [X] `.\venv\Scripts\python.exe -m pytest` executado com 96 testes aprovados.
- [X] `.\venv\Scripts\python.exe -m compileall -q src tests` executado sem erro.
- [X] `.\venv\Scripts\python.exe -m alembic heads` retornou um unico head: `0010_add_business_attendance`.
- [X] `docker compose --env-file .env.production.example config --quiet` executado sem erro.
- [X] `npx --yes n8nac list` reportou 21 workflows Beautyflow rastreados e 0 conflitos.
- [X] Todos os 21 arquivos `workflows/*.workflow.ts` passaram em `npx --yes n8nac skills validate`.
- [X] `main-staging` foi corrigido, enviado com `npx --yes n8nac push "workflows\main-staging.workflow.ts" --verify` e apresentado como workflow remoto `4HdDMg12MHYD0pW0`.

Observacoes da auditoria:

- Avisos remanescentes do validador n8n sao esperados para nodes comunitarios `n8n-nodes-evolution-api`, porque o schema desses nodes nao esta disponivel para validacao estatica.
- Existem 13 workflows remotos fora do conjunto Beautyflow rastreado. Eles nao foram alterados.
- A liberacao de producao ainda depende das validacoes manuais abaixo, porque segredos, credenciais, TLS, backups, smoke tests reais e monitoramento nao podem ser provados somente pelo codigo local.

## Versao e artefato

- [ ] Alteracoes revisadas e aprovadas.
- [ ] Commit final criado a partir do estado auditado.
- [ ] Tag de versao criada para o deploy.
- [ ] Pipeline de CI concluido sem falhas no commit final.
- [ ] Imagem Docker construida e publicada com tag imutavel.
- [ ] Plano de rollback aponta para a imagem anterior e para a revisao anterior do banco.

## Segredos e acesso

- [ ] `.env.production` real existe somente no ambiente seguro e nao foi versionado.
- [ ] `.env.production` real nao contem valores `replace-with`.
- [ ] `USER_SECRET_KEY`, `INTEGRATION_SECRET_KEY` e `BUSINESS_INTEGRATION_SECRET_KEY` sao diferentes e possuem ao menos 32 caracteres aleatorios.
- [ ] Senhas de PostgreSQL e Redis sao fortes, exclusivas e armazenadas em cofre/secret manager.
- [ ] `USER_REFRESH_COOKIE_SECURE=true` e `ADMIN_COOKIE_SECURE=true`.
- [ ] `CORS_ORIGINS` contem somente dominios HTTPS autorizados.
- [ ] `FORWARDED_ALLOW_IPS` e `TRUSTED_PROXY_IPS` contem somente os IPs reais dos proxies.
- [ ] Conta superadministradora usa senha forte e exclusiva.
- [ ] Chaves n8n, Evolution, provedores de IA e demais credenciais foram rotacionadas quando necessario.

## Infraestrutura

- [ ] DNS de producao aponta para o proxy correto.
- [ ] Certificado TLS valido e renovacao automatica conferida.
- [ ] Proxy reverso encaminha somente para o backend e consulta `/health/ready`.
- [ ] Redes externas do Docker existem com os nomes configurados.
- [ ] Volumes persistentes do PostgreSQL e Redis estao montados no armazenamento correto.
- [ ] Limites de CPU, memoria e disco foram definidos no ambiente de hospedagem.
- [ ] Backup automatizado do PostgreSQL esta ativo.
- [ ] Restauracao de backup foi testada em ambiente separado.
- [ ] Politica de retencao de backups foi documentada.

## Banco e aplicacao

- [ ] Backup realizado imediatamente antes da migracao.
- [ ] `alembic upgrade head` concluido no banco de producao.
- [ ] `alembic check` nao detecta novas operacoes no ambiente de deploy.
- [ ] `/health/live` retorna HTTP 200 no dominio de producao.
- [ ] `/health/ready` retorna HTTP 200 com banco, Redis e migracao saudaveis.
- [ ] Login admin, selecao de empresa, calendario e operacoes CRUD passaram pelo teste de fumaca.
- [ ] Criacao, atualizacao, cancelamento e conclusao de agendamentos foram testadas.
- [ ] Regras de agenda, bloqueios e conflito de horarios foram testados com dados reais de homologacao.
- [ ] Logs de erro nao expoem tokens, senhas, headers sensiveis ou dados excessivos de clientes.

## n8n e WhatsApp

- [ ] Ambiente ativo confirmado com `npx --yes n8nac env status --json`.
- [ ] Os 21 workflows Beautyflow rastreados estao sincronizados e sem conflitos.
- [ ] Workflows de producao estao ativos e os de staging/teste nao recebem trafego real por engano.
- [ ] Todas as credenciais exigidas pelos workflows existem e foram testadas no n8n.
- [ ] Credenciais usadas por workflows `*-staging` foram revisadas para evitar uso acidental de credenciais de producao.
- [ ] Creditos, limites e quotas dos provedores de IA foram conferidos.
- [ ] Webhook de erros recebeu um evento de teste autenticado.
- [ ] Cabecalho e segredo do webhook da Evolution coincidem no backend e no n8n.
- [ ] Node comunitario da Evolution foi testado manualmente na versao instalada do n8n.
- [ ] Uma nova instancia Evolution foi criada pelo painel sem duplicacao.
- [ ] Codigo QR foi exibido e o WhatsApp conectou.
- [ ] Uma mensagem recebida e uma mensagem enviada percorreram o fluxo completo.
- [ ] Desconexao, reconexao e remocao de instancia foram testadas.
- [ ] `main-prod` foi testado com conversa individual real, nao com grupo.

## Observabilidade e liberacao

- [ ] Logs estao centralizados e possuem retencao definida.
- [ ] Alertas existem para indisponibilidade, HTTP 5xx, falha de backup, erro de workflow e fila/Redis degradado.
- [ ] Monitor externo consulta `/health/ready`.
- [ ] Webhook n8n de erro esta recebendo eventos do backend com `error_id`.
- [ ] Janela de implantacao e responsaveis pelo rollback estao definidos.
- [ ] Teste final foi feito com uma empresa de homologacao antes de liberar clientes reais.
- [ ] Plano de comunicacao para usuarios/clientes esta definido.
