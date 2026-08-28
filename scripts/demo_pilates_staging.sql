-- BeautyFlow - massa staging idempotente para a demo de Pilates
--
-- Requisitos:
--   * PostgreSQL com as migrations BeautyFlow ate 0012 aplicadas.
--   * Execute apenas em staging/local com:
--       psql -v ON_ERROR_STOP=1 -f scripts/demo_pilates_staging.sql
--     O proprio arquivo ja abre e conclui uma transacao.
--   * Preencha v_business_id e v_integration_id com a empresa de staging e a
--     integration da credencial usada pelo main-staging. Ambos precisam estar
--     previamente vinculados a mesma instancia Evolution.
--   * Use um tenant dedicado e limpo para a demo: o script configura e
--     reutiliza registros nominais (Ana, Joao, Mariana e os alunos do cenario),
--     mas aborta se encontrar cadastros ativos estranhos ao roteiro.
--   * Ajuste os telefones abaixo antes do uso. O telefone de Maria DEVE ser o
--     numero real (somente digitos, DDI + DDD + numero) que enviara o WhatsApp.
--   * Este arquivo nao cria empresa, usuario, credencial, integration,
--     business_integration, token/secret nem Evolution instance. Ele exige e
--     reutiliza o tenant e os vinculos que ja recebem o webhook de staging.
--
-- Seguranca/idempotencia:
--   * nao usa DELETE, TRUNCATE ou DROP;
--   * faz UPSERT somente nos registros nominais desta empresa de demonstracao;
--   * nao recria uma ocorrencia de aula se ela ja existir, mesmo cancelada;
--   * nao cria appointment_reminders (os inserts sao diretos no banco).
--   * e um seed, nao um reset: uma aula cancelada ou reposicao criada durante
--     um ensaio permanece assim na reexecucao. Use snapshot/tenant limpo antes
--     da apresentacao ou revise esses appointments manualmente.

BEGIN;

DO $demo$
DECLARE
    -- OBRIGATORIOS: confirme os dois ids com a query comentada no fim.
    v_business_id    integer := NULL;
    v_integration_id integer := NULL;
    -- Protecao contra aplicar a massa em um tenant compartilhado/acidental.
    v_confirm_dedicated_tenant boolean := false;

    -- Valores ajustaveis. Telefones devem ter no maximo 13 digitos.
    v_business_name  text := 'Studio Movimento Pilates Demo';
    v_maria_phone    text := '5511999999999'; -- TROQUE pelo WhatsApp real da demo.
    v_timezone       text := 'America/Sao_Paulo';

    v_service_id integer;
    v_ana_id integer;
    v_joao_id integer;
    v_mariana_id integer;
    v_maria_id integer;
    v_carlos_id integer;
    v_fernanda_id integer;
    v_pedro_id integer;
    v_week_anchor date;
BEGIN
    IF v_business_id IS NULL THEN
        RAISE EXCEPTION
            'Preencha v_business_id com a empresa staging vinculada a Evolution/main-staging.';
    END IF;

    IF v_integration_id IS NULL THEN
        RAISE EXCEPTION
            'Preencha v_integration_id com a integration da credencial HTTP usada pelo main-staging.';
    END IF;

    IF v_confirm_dedicated_tenant IS NOT TRUE THEN
        RAISE EXCEPTION
            'Confirme que o business_id % e dedicado a demo definindo v_confirm_dedicated_tenant := true.',
            v_business_id;
    END IF;

    IF v_maria_phone = '5511999999999'
       OR v_maria_phone !~ '^[0-9]{10,13}$' THEN
        RAISE EXCEPTION
            'Troque v_maria_phone pelo numero real da demo (10 a 13 digitos, sem simbolos).';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM businesses
        WHERE id = v_business_id AND is_active = true
    ) THEN
        RAISE EXCEPTION
            'business_id % nao existe ou esta inativo',
            v_business_id;
    END IF;

    -- Mantem slug e telefone originais porque eles participam da identidade
    -- operacional da integracao. Apenas configura/apresenta o tenant como studio.
    UPDATE businesses SET
        name = v_business_name,
        type = 'clinic'::businesstype,
        attendance_plan = 'always'::businessattendanceplan,
        timezone = v_timezone,
        email = 'demo.pilates@example.com',
        description = 'Empresa ficticia para demonstracao do fluxo de agenda de Pilates.',
        payment_methods = ARRAY['pix']::businesspaymentmethod[],
        booking_enabled = true,
        slot_interval_minutes = 60,
        minimum_notice_minutes = 0,
        maximum_schedule_days = 30,
        allow_client_cancel = true,
        cancel_limit_hours = 0,
        appointment_confirmation_required = false
    WHERE id = v_business_id;

    -- A autenticacao prioriza X-Evolution-Instance. O mesmo par precisa estar
    -- ativo em evolution_instances e business_integrations antes deste seed.
    IF NOT EXISTS (
        SELECT 1
        FROM evolution_instances AS evolution_instance
        JOIN integrations AS integration
          ON integration.id = evolution_instance.integration_id
        JOIN business_integrations AS business_integration
          ON business_integration.business_id = evolution_instance.business_id
         AND business_integration.integration_id = evolution_instance.integration_id
        WHERE evolution_instance.business_id = v_business_id
          AND evolution_instance.integration_id = v_integration_id
          AND integration.type = 'automation'::integrationtype
          AND integration.is_active = true
          AND business_integration.is_active = true
          AND lower(evolution_instance.state) IN ('open', 'connected')
          AND nullif(btrim(evolution_instance.instance_name), '') IS NOT NULL
    ) THEN
        RAISE EXCEPTION
            'integration_id % nao esta ativa e vinculada a uma Evolution instance conectada da empresa %',
            v_integration_id,
            v_business_id;
    END IF;

    -- Evita que uma empresa staging compartilhada pareca pronta, mas mostre
    -- catalogo/equipe/alunos alheios ao roteiro ou bloqueios antigos de agenda.
    IF EXISTS (
        SELECT 1 FROM services
        WHERE business_id = v_business_id
          AND is_active = true
          AND name <> 'Aula de Pilates'
    ) OR EXISTS (
        SELECT 1 FROM professionals
        WHERE business_id = v_business_id
          AND is_active = true
          AND name NOT IN ('Ana', 'Joao', 'Mariana')
    ) OR EXISTS (
        SELECT 1 FROM clients
        WHERE business_id = v_business_id
          AND is_active = true
          AND coalesce(name, '') NOT IN (
              'Maria Silva', 'Carlos Souza', 'Fernanda Lima', 'Pedro Santos'
          )
    ) OR EXISTS (
        SELECT 1 FROM schedule_blocks
        WHERE business_id = v_business_id
          AND status = 'active'::scheduleblockstatus
    ) THEN
        RAISE EXCEPTION
            'A empresa % nao esta limpa/dedicada ao roteiro. Revise servicos, professores, alunos e bloqueios ativos.',
            v_business_id;
    END IF;

    -- Horario geral do studio. A validacao de appointments usa tambem as
    -- disponibilidades individuais cadastradas abaixo.
    INSERT INTO business_opening_hours (business_id, weekday, start_time, end_time)
    SELECT v_business_id, weekday, time '08:00', time '18:00'
    FROM generate_series(0, 4) AS weekday
    ON CONFLICT (business_id, weekday) DO UPDATE SET
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time;

    INSERT INTO services (
        business_id, name, normalized_name, duration_minutes, price, is_active
    ) VALUES (
        v_business_id, 'Aula de Pilates', 'aula de pilates', 60, 100.00, true
    )
    ON CONFLICT (business_id, name) DO UPDATE SET
        normalized_name = EXCLUDED.normalized_name,
        duration_minutes = EXCLUDED.duration_minutes,
        price = EXCLUDED.price,
        is_active = true
    RETURNING id INTO v_service_id;

    INSERT INTO professionals (business_id, name, normalized_name, email, phone, is_active)
    VALUES (v_business_id, 'Ana', 'ana', 'ana.pilates@example.com', '5511988880101', true)
    ON CONFLICT (business_id, name) DO UPDATE SET
        normalized_name = EXCLUDED.normalized_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        is_active = true
    RETURNING id INTO v_ana_id;

    INSERT INTO professionals (business_id, name, normalized_name, email, phone, is_active)
    VALUES (v_business_id, 'Joao', 'joao', 'joao.pilates@example.com', '5511988880102', true)
    ON CONFLICT (business_id, name) DO UPDATE SET
        normalized_name = EXCLUDED.normalized_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        is_active = true
    RETURNING id INTO v_joao_id;

    INSERT INTO professionals (business_id, name, normalized_name, email, phone, is_active)
    VALUES (v_business_id, 'Mariana', 'mariana', 'mariana.pilates@example.com', '5511988880103', true)
    ON CONFLICT (business_id, name) DO UPDATE SET
        normalized_name = EXCLUDED.normalized_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        is_active = true
    RETURNING id INTO v_mariana_id;

    INSERT INTO professional_services (professional_id, service_id)
    VALUES
        (v_ana_id, v_service_id),
        (v_joao_id, v_service_id),
        (v_mariana_id, v_service_id)
    ON CONFLICT (professional_id, service_id) DO NOTHING;

    -- weekday segue datetime.weekday(): segunda=0 ... domingo=6.
    -- As janelas da Ana deixam exatamente qua 14h, qui 9h e sex 11h como
    -- alternativas para a aula de Maria de terca 10h; qui 10h fica ocupada.
    INSERT INTO availabilities (professional_id, weekday, start_time, end_time)
    VALUES
        (v_ana_id,     1, time '10:00', time '11:00'),
        (v_ana_id,     2, time '14:00', time '15:00'),
        (v_ana_id,     3, time '09:00', time '11:00'),
        (v_ana_id,     4, time '11:00', time '12:00'),
        (v_joao_id,    0, time '15:00', time '17:00'),
        (v_joao_id,    2, time '15:00', time '17:00'),
        (v_mariana_id, 1, time '16:00', time '18:00'),
        (v_mariana_id, 3, time '16:00', time '18:00')
    ON CONFLICT (professional_id, weekday) DO UPDATE SET
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time;

    -- Identifica Maria pelo nome dentro do tenant dedicado para permitir trocar
    -- o telefone real entre ensaios sem criar uma segunda Maria.
    IF (
        SELECT count(*)
        FROM clients
        WHERE business_id = v_business_id AND name = 'Maria Silva'
    ) > 1 THEN
        RAISE EXCEPTION
            'Ha mais de uma Maria Silva na empresa %. Corrija manualmente antes do seed.',
            v_business_id;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM clients
        WHERE business_id = v_business_id
          AND phone = v_maria_phone
          AND name IS DISTINCT FROM 'Maria Silva'
    ) THEN
        RAISE EXCEPTION
            'O telefone de Maria ja pertence a outro aluno na empresa %.',
            v_business_id;
    END IF;

    SELECT id INTO v_maria_id
    FROM clients
    WHERE business_id = v_business_id AND name = 'Maria Silva';

    IF v_maria_id IS NULL THEN
        INSERT INTO clients (business_id, name, phone, is_active)
        VALUES (v_business_id, 'Maria Silva', v_maria_phone, true)
        ON CONFLICT (business_id, phone) DO UPDATE SET
            name = EXCLUDED.name,
            is_active = true
        RETURNING id INTO v_maria_id;
    ELSE
        UPDATE clients SET
            phone = v_maria_phone,
            is_active = true
        WHERE id = v_maria_id
        RETURNING id INTO v_maria_id;
    END IF;

    INSERT INTO clients (business_id, name, phone, is_active)
    VALUES (v_business_id, 'Carlos Souza', '5511988881001', true)
    ON CONFLICT (business_id, phone) DO UPDATE SET
        name = EXCLUDED.name,
        is_active = true
    RETURNING id INTO v_carlos_id;

    INSERT INTO clients (business_id, name, phone, is_active)
    VALUES (v_business_id, 'Fernanda Lima', '5511988881002', true)
    ON CONFLICT (business_id, phone) DO UPDATE SET
        name = EXCLUDED.name,
        is_active = true
    RETURNING id INTO v_fernanda_id;

    INSERT INTO clients (business_id, name, phone, is_active)
    VALUES (v_business_id, 'Pedro Santos', '5511988881003', true)
    ON CONFLICT (business_id, phone) DO UPDATE SET
        name = EXCLUDED.name,
        is_active = true
    RETURNING id INTO v_pedro_id;

    -- Materializa a semana atual e as duas seguintes. Ocorrencias passadas
    -- aparecem como concluidas; futuras ficam agendadas. Assim a agenda abre
    -- preenchida e a terca-feira da semana seguinte segue disponivel para a demo.
    v_week_anchor := date_trunc(
        'week', now() AT TIME ZONE v_timezone
    )::date;

    -- As tres alternativas precisam estar realmente livres. Em tenant novo a
    -- consulta nao encontra nada; em tenant reutilizado ela aborta antes de
    -- produzir um roteiro diferente do ensaiado.
    IF EXISTS (
        WITH candidate_slots (weekday_offset, start_time) AS (
            VALUES
                (2, time '14:00'),
                (3, time '09:00'),
                (4, time '11:00')
        ),
        candidate_occurrences AS (
            SELECT (
                (v_week_anchor + (week_number * 7 + slot.weekday_offset))
                + slot.start_time
            ) AT TIME ZONE v_timezone AS start_at
            FROM candidate_slots AS slot
            CROSS JOIN generate_series(0, 2) AS week_number
        )
        SELECT 1
        FROM appointments AS existing
        JOIN candidate_occurrences AS candidate
          ON candidate.start_at = existing.start_datetime
        WHERE existing.business_id = v_business_id
          AND existing.professional_id = v_ana_id
          AND existing.status = 'scheduled'::appointmentstatus
    ) THEN
        RAISE EXCEPTION
            'Ha aula ativa da Ana em um horario de reposicao (qua 14h, qui 9h ou sex 11h). Use tenant/snapshot limpo.';
    END IF;

    WITH desired_appointments (client_id, professional_id, weekday_offset, start_time) AS (
        VALUES
            -- Maria: happy path principal.
            (v_maria_id,   v_ana_id,     1, time '10:00'), -- terca 10h
            (v_maria_id,   v_ana_id,     3, time '10:00'), -- quinta 10h (ocupado)
            -- Demais alunos deixam a agenda visualmente convincente.
            (v_carlos_id,  v_joao_id,    0, time '15:00'),
            (v_carlos_id,  v_joao_id,    2, time '15:00'),
            (v_pedro_id,   v_joao_id,    0, time '16:00'),
            (v_pedro_id,   v_joao_id,    2, time '16:00'),
            (v_fernanda_id,v_mariana_id, 1, time '16:00'),
            (v_fernanda_id,v_mariana_id, 3, time '16:00')
    ),
    occurrences AS (
        SELECT
            desired.client_id,
            desired.professional_id,
            v_service_id AS service_id,
            (
                (v_week_anchor + (week_number * 7 + desired.weekday_offset))
                + desired.start_time
            ) AT TIME ZONE v_timezone AS start_at
        FROM desired_appointments AS desired
        CROSS JOIN generate_series(0, 2) AS week_number
    )
    INSERT INTO appointments (
        business_id,
        client_id,
        professional_id,
        service_id,
        start_datetime,
        end_datetime,
        status,
        confirmation_pending
    )
    SELECT
        v_business_id,
        occurrence.client_id,
        occurrence.professional_id,
        occurrence.service_id,
        occurrence.start_at,
        occurrence.start_at + interval '60 minutes',
        CASE
            WHEN occurrence.start_at + interval '60 minutes' <= now()
                THEN 'completed'::appointmentstatus
            ELSE 'scheduled'::appointmentstatus
        END,
        false
    FROM occurrences AS occurrence
    WHERE NOT EXISTS (
        SELECT 1
        FROM appointments AS existing
        WHERE existing.business_id = v_business_id
          AND existing.client_id = occurrence.client_id
          AND existing.professional_id = occurrence.professional_id
          AND existing.service_id = occurrence.service_id
          AND existing.start_datetime = occurrence.start_at
    );

    RAISE NOTICE
        'Demo Pilates preparada: business_id=%, integration_id=%, service_id=%, semana inicial=%',
        v_business_id,
        v_integration_id,
        v_service_id,
        v_week_anchor;
END
$demo$;

COMMIT;

-- Descoberta/confirmacao somente leitura ANTES da execucao. Confirme que o
-- integration_id e o da credencial HTTP usada pelo main-staging:
-- SELECT b.id AS business_id, b.name, ei.instance_name, ei.state,
--        ei.integration_id, i.name AS integration_name, bi.is_active
-- FROM businesses b
-- JOIN evolution_instances ei ON ei.business_id = b.id
-- JOIN integrations i ON i.id = ei.integration_id
-- JOIN business_integrations bi
--   ON bi.business_id = b.id AND bi.integration_id = i.id
-- WHERE b.is_active = true AND i.is_active = true
-- ORDER BY b.id;
--
-- Verificacao opcional e somente leitura DEPOIS da execucao; substitua <ID>:
-- SELECT b.id, b.name, b.slug, b.timezone, b.booking_enabled,
--        b.cancel_limit_hours
-- FROM businesses b WHERE b.id = <ID>;
--
-- SELECT c.name AS aluno, p.name AS professor, a.start_datetime, a.status
-- FROM appointments a
-- JOIN clients c ON c.id = a.client_id
-- JOIN professionals p ON p.id = a.professional_id
-- WHERE a.business_id = <ID>
-- ORDER BY a.start_datetime, p.name, c.name;
