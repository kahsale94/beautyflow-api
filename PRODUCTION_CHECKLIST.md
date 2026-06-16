# Checklist de produção

Conclua todos os itens obrigatórios antes de liberar tráfego real.

## Versão e artefato

- [X] Alterações revisadas, commitadas e identificadas com uma tag de versão.
- [X] Pipeline de CI concluído sem falhas.
- [ ] Imagem Docker construída e publicada com uma tag imutável.
- [ ] Plano de rollback aponta para a imagem e a revisão anterior do banco.

## Segredos e acesso

- [ ] `.env` de produção contém valores reais e nenhum texto `replace-with`.
- [ ] Segredos JWT são diferentes entre si e possuem ao menos 32 caracteres aleatórios.
- [ ] Senhas do PostgreSQL e Redis são fortes e exclusivas.
- [X] Cookies de autenticação estão com `Secure=true`.
- [ ] `CORS_ORIGINS` contém apenas domínios HTTPS autorizados.
- [ ] `FORWARDED_ALLOW_IPS` e `TRUSTED_PROXY_IPS` contêm somente os proxies reais.
- [ ] Conta superadministradora usa senha forte e exclusiva.

## Infraestrutura

- [X] DNS e certificado TLS estão válidos.
- [ ] Proxy reverso encaminha somente para o backend e consulta `/health/ready`.
- [X] Redes externas do Docker existem com os nomes configurados.
- [X] Volumes persistentes do PostgreSQL e Redis estão montados no armazenamento correto.
- [X] Limites de CPU, memória e disco foram definidos no ambiente de hospedagem.
- [ ] Backup automatizado do PostgreSQL está ativo.
- [ ] Restauração de backup foi testada em ambiente separado.

## Banco e aplicação

- [ ] Backup realizado imediatamente antes da migração.
- [ ] `alembic upgrade head` concluído.
- [ ] `alembic check` não detecta novas operações.
- [ ] `/health/live` retorna HTTP 200.
- [ ] `/health/ready` retorna HTTP 200 com banco, Redis e migração saudáveis.
- [ ] Login, seleção de empresa, calendário e operações CRUD passaram pelo teste de fumaça.
- [ ] Criação, atualização, cancelamento e conclusão de agendamentos foram testadas.

## n8n e WhatsApp

- [X] Os nove workflows do Beautyflow estão sincronizados e ativos.
- [ ] Todas as credenciais exigidas pelos workflows existem e estão válidas.
- [X] Créditos e limites dos provedores de IA foram conferidos.
- [X] Webhook de erros recebeu um evento de teste autenticado.
- [ ] Cabeçalho e segredo do webhook da Evolution coincidem no backend e no n8n.
- [X] Node comunitário da Evolution foi testado manualmente na versão instalada do n8n.
- [ ] Uma nova instância foi criada pelo painel sem duplicação.
- [X] Código QR foi exibido e o WhatsApp conectado.
- [X] Uma mensagem recebida e uma mensagem enviada percorreram o fluxo completo.
- [X] Desconexão, reconexão e remoção de instância foram testadas.

## Observabilidade e liberação

- [ ] Logs estão centralizados e possuem retenção definida.
- [ ] Alertas existem para indisponibilidade, erros HTTP 5xx e falha de backup.
- [ ] Monitor externo consulta `/health/ready`.
- [ ] Janela de implantação e responsáveis pelo rollback estão definidos.
- [ ] Teste final foi feito com uma empresa de homologação antes de liberar clientes reais.
