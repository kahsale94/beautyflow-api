# Checklist de producao

Conclua todos os itens obrigatorios antes de liberar trafego real.

## Testes

- [X] `.\venv\Scripts\python.exe -m pytest` executado com 96 testes aprovados.
- [X] `.\venv\Scripts\python.exe -m compileall -q src tests` executado sem erro.
- [X] `.\venv\Scripts\python.exe -m alembic heads` retornou um unico head: `0010_add_business_attendance`.
- [X] `docker compose --env-file .env.production.example config --quiet` executado sem erro.
- [X] `npx --yes n8nac list` reportou workflows Beautyflow sem conflitos.
- [X] Todos os arquivos de workflow de producao versionados passaram em `npx --yes n8nac skills validate`.

## Versao e artefato

- [ ] Alteracoes revisadas e aprovadas.
- [ ] Commit final criado a partir do estado auditado.
- [ ] Tag de versao criada para o deploy.
- [X] Pipeline de CI concluido sem falhas no commit final.
- [ ] Imagem Docker construida e publicada com tag imutavel.
- [ ] Plano de rollback aponta para a imagem anterior e para a revisao anterior do banco.

## Segredos e acesso

- [X] `.env.production` real existe somente no ambiente seguro e nao foi versionado.
- [X] `.env.production` real nao contem valores `replace-with`.
- [X] `USER_SECRET_KEY`, `INTEGRATION_SECRET_KEY` e `BUSINESS_INTEGRATION_SECRET_KEY` sao diferentes e possuem ao menos 32 caracteres aleatorios.
- [X] Senhas de PostgreSQL e Redis sao fortes, exclusivas e armazenadas em cofre/secret manager.
- [X] `USER_REFRESH_COOKIE_SECURE=true` e `ADMIN_COOKIE_SECURE=true`.
- [X] `CORS_ORIGINS` contem somente dominios HTTPS autorizados.
- [X] `FORWARDED_ALLOW_IPS` e `TRUSTED_PROXY_IPS` contem somente os IPs reais dos proxies.
- [X] Conta superadministradora usa senha forte e exclusiva.
- [X] Chaves n8n, Evolution, provedores de IA e demais credenciais foram rotacionadas quando necessario.

## Infraestrutura

- [X] DNS de producao aponta para o proxy correto.
- [X] Certificado TLS valido e renovacao automatica conferida.
- [X] Proxy reverso encaminha somente para o backend e consulta `/health/ready`.
- [X] Redes externas do Docker existem com os nomes configurados.
- [X] Volumes persistentes do PostgreSQL e Redis estao montados no armazenamento correto.
- [X] Limites de CPU, memoria e disco foram definidos no ambiente de hospedagem.
- [ ] Backup automatizado do PostgreSQL esta ativo.
- [ ] Restauracao de backup foi testada em ambiente separado.
- [ ] Politica de retencao de backups foi documentada.

## Banco e aplicacao

- [ ] Backup realizado imediatamente antes da migracao.
- [ ] `alembic upgrade head` concluido no banco de producao.
- [X] `alembic check` nao detecta novas operacoes no ambiente de deploy.
- [X] `/health/live` retorna HTTP 200 no dominio de producao.
- [X] `/health/ready` retorna HTTP 200 com banco, Redis e migracao saudaveis.
- [ ] Login admin, selecao de empresa, calendario e operacoes CRUD passaram pelo teste de fumaca.
- [ ] Criacao, atualizacao, cancelamento e conclusao de agendamentos foram testadas.
- [ ] Regras de agenda, bloqueios e conflito de horarios foram testados com dados reais de homologacao.
- [X] Logs de erro nao expoem tokens, senhas, headers sensiveis ou dados excessivos de clientes.

## n8n e WhatsApp

- [X] Ambiente ativo confirmado com `npx --yes n8nac env status --json`.
- [X] Os workflows Beautyflow de producao versionados estao sincronizados e sem conflitos.
- [ ] Workflows de producao estao ativos e artefatos locais de staging/teste nao recebem trafego real por engano.
- [ ] Todas as credenciais exigidas pelos workflows existem e foram testadas no n8n.
- [X] Credenciais usadas por artefatos locais de staging/teste foram revisadas para evitar uso acidental de credenciais de producao.
- [X] Creditos, limites e quotas dos provedores de IA foram conferidos.
- [ ] Webhook de erros recebeu um evento de teste autenticado.
- [ ] Cabecalho e segredo do webhook da Evolution coincidem no backend e no n8n.
- [X] Node comunitario da Evolution foi testado manualmente na versao instalada do n8n.
- [ ] Uma nova instancia Evolution foi criada pelo painel sem duplicacao.
- [X] Codigo QR foi exibido e o WhatsApp conectou.
- [X] Uma mensagem recebida e uma mensagem enviada percorreram o fluxo completo.
- [X] Desconexao, reconexao e remocao de instancia foram testadas.
- [ ] `main-prod` foi testado com conversa individual real, nao com grupo.

## Observabilidade e liberacao

- [X] Logs estao centralizados e possuem retencao definida.
- [X] Alertas existem para indisponibilidade, HTTP 5xx, falha de backup, erro de workflow e fila/Redis degradado.
- [ ] Monitor externo consulta `/health/ready`.
- [ ] Webhook n8n de erro esta recebendo eventos do backend com `error_id`.
- [ ] Janela de implantacao e responsaveis pelo rollback estao definidos.
- [ ] Teste final foi feito com uma empresa de homologacao antes de liberar clientes reais.
- [X] Plano de comunicacao para usuarios/clientes esta definido.
