-- BeautyFlow - massa staging idempotente para a demo de Pilates

-- Requisitos:
--   * PostgreSQL com as migrations BeautyFlow ate 0012 aplicadas.
--   * Execute apenas em staging/local com:
--       psql -v ON_ERROR_STOP=1 -f scripts/demo_pilates_staging.sql
--     O proprio arquivo ja abre e conclui uma transacao.
--   * Preencha v_business_id e v_integration_id com a empresa de staging e a
--     integration da credencial usada pelo main-staging. Ambos precisam estar
--     previamente vinculados a mesma instancia Evolution.
--   * Use um tenant dedicado e limpo para a demo: o script configura e
--     reutiliza registros nominais da equipe e dos alunos do cenario, mas
--     aborta se encontrar cadastros ativos estranhos ao roteiro.
--   * Ajuste os telefones abaixo antes do uso. O telefone de Maria DEVE ser o
--     numero real (somente digitos, DDI + DDD + numero) que enviara o WhatsApp.
--   * Este arquivo nao cria empresa, usuario, credencial, integration,
--     business_integration, token/secret nem Evolution instance. Ele exige e
--     reutiliza o tenant e os vinculos que ja recebem o webhook de staging.
----------------------------------------------------------------------------

-- Seguranca/idempotencia:
--   * nao usa DELETE, TRUNCATE ou DROP;
--   * faz UPSERT somente nos registros nominais desta empresa de demonstracao;
--   * nao recria uma ocorrencia de aula se ela ja existir, mesmo cancelada;
--   * nao cria appointment_reminders (os inserts sao diretos no banco);
--   * materializa a semana atual e as quatro semanas seguintes;
--   * e um seed, nao um reset: uma aula cancelada ou reposicao criada durante
--     um ensaio permanece assim na reexecucao. Use snapshot/tenant limpo antes
--     da apresentacao ou revise esses appointments manualmente.

BEGIN;

DO $demo$
DECLARE
-- OBRIGATORIOS: confirme os dois ids com a query comentada no fim.
v_business_id    integer := 1;
v_integration_id integer := 1;
-- Protecao contra aplicar a massa em um tenant compartilhado/acidental.
v_confirm_dedicated_tenant boolean := true;

-- Valores ajustaveis. Telefones devem ter no maximo 13 digitos.
v_business_name  text := 'Studio Movimento Pilates Demo';
v_maria_phone    text := '5511991549118'; -- TROQUE pelo WhatsApp real da demo.
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
    SELECT 1
    FROM businesses
    WHERE id = v_business_id
      AND is_active = true
) THEN
    RAISE EXCEPTION
        'business_id % nao existe ou esta inativo',
        v_business_id;
END IF;

-- Mantem slug e telefone originais porque eles participam da identidade
-- operacional da integracao. Apenas configura/apresenta o tenant como studio.
UPDATE businesses
SET
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
    maximum_schedule_days = 35,
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
    SELECT 1
    FROM services
    WHERE business_id = v_business_id
      AND is_active = true
      AND name <> 'Aula de Pilates'
) OR EXISTS (
    SELECT 1
    FROM professionals
    WHERE business_id = v_business_id
      AND is_active = true
      AND name NOT IN (
          'Ana',
          'Joao',
          'Mariana',
          'Beatriz',
          'Rafael',
          'Lucas',
          'Camila'
      )
) OR EXISTS (
    SELECT 1
    FROM clients
    WHERE business_id = v_business_id
      AND is_active = true
      AND coalesce(name, '') NOT IN (
          'Maria Silva',
          'Carlos Souza',
          'Fernanda Lima',
          'Pedro Santos',
          'Juliana Costa',
          'Ricardo Alves',
          'Bianca Rocha',
          'Gustavo Martins',
          'Luana Ribeiro',
          'Diego Oliveira',
          'Patricia Gomes',
          'Bruno Carvalho',
          'Renata Moreira',
          'Marcelo Araujo',
          'Sofia Nunes',
          'Thiago Ferreira'
      )
) OR EXISTS (
    SELECT 1
    FROM schedule_blocks
    WHERE business_id = v_business_id
      AND status = 'active'::scheduleblockstatus
) THEN
    RAISE EXCEPTION
        'A empresa % nao esta limpa/dedicada ao roteiro. Revise servicos, professores, alunos e bloqueios ativos.',
        v_business_id;
END IF;

-- Horario geral do studio.
INSERT INTO business_opening_hours (
    business_id,
    weekday,
    start_time,
    end_time
)
SELECT
    v_business_id,
    weekday,
    time '08:00',
    time '18:00'
FROM generate_series(0, 4) AS weekday
ON CONFLICT (business_id, weekday) DO UPDATE
SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time;

INSERT INTO services (
    business_id,
    name,
    normalized_name,
    duration_minutes,
    price,
    is_active
)
VALUES (
    v_business_id,
    'Aula de Pilates',
    'aula de pilates',
    60,
    100.00,
    true
)
ON CONFLICT (business_id, name) DO UPDATE
SET
    normalized_name = EXCLUDED.normalized_name,
    duration_minutes = EXCLUDED.duration_minutes,
    price = EXCLUDED.price,
    is_active = true
RETURNING id INTO v_service_id;

INSERT INTO professionals (
    business_id,
    name,
    normalized_name,
    email,
    phone,
    is_active
)
VALUES (
    v_business_id,
    'Ana',
    'ana',
    'ana.pilates@example.com',
    '5511988880101',
    true
)
ON CONFLICT (business_id, name) DO UPDATE
SET
    normalized_name = EXCLUDED.normalized_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    is_active = true
RETURNING id INTO v_ana_id;

INSERT INTO professionals (
    business_id,
    name,
    normalized_name,
    email,
    phone,
    is_active
)
VALUES (
    v_business_id,
    'Joao',
    'joao',
    'joao.pilates@example.com',
    '5511988880102',
    true
)
ON CONFLICT (business_id, name) DO UPDATE
SET
    normalized_name = EXCLUDED.normalized_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    is_active = true
RETURNING id INTO v_joao_id;

INSERT INTO professionals (
    business_id,
    name,
    normalized_name,
    email,
    phone,
    is_active
)
VALUES (
    v_business_id,
    'Mariana',
    'mariana',
    'mariana.pilates@example.com',
    '5511988880103',
    true
)
ON CONFLICT (business_id, name) DO UPDATE
SET
    normalized_name = EXCLUDED.normalized_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    is_active = true
RETURNING id INTO v_mariana_id;

INSERT INTO professionals (
    business_id,
    name,
    normalized_name,
    email,
    phone,
    is_active
)
VALUES
    (
        v_business_id,
        'Beatriz',
        'beatriz',
        'beatriz.pilates@example.com',
        '5511988880104',
        true
    ),
    (
        v_business_id,
        'Rafael',
        'rafael',
        'rafael.pilates@example.com',
        '5511988880105',
        true
    ),
    (
        v_business_id,
        'Lucas',
        'lucas',
        'lucas.pilates@example.com',
        '5511988880106',
        true
    ),
    (
        v_business_id,
        'Camila',
        'camila',
        'camila.pilates@example.com',
        '5511988880107',
        true
    )
ON CONFLICT (business_id, name) DO UPDATE
SET
    normalized_name = EXCLUDED.normalized_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    is_active = true;

INSERT INTO professional_services (
    professional_id,
    service_id
)
SELECT
    professional.id,
    v_service_id
FROM professionals AS professional
WHERE professional.business_id = v_business_id
  AND professional.name IN (
      'Ana',
      'Joao',
      'Mariana',
      'Beatriz',
      'Rafael',
      'Lucas',
      'Camila'
  )
ON CONFLICT (professional_id, service_id) DO NOTHING;

-- weekday segue datetime.weekday(): segunda=0 ... domingo=6.
--
-- Ana:
--   terca 10h-11h
--   quarta 14h-15h
--   quinta 09h-11h
--   sexta 11h-12h
--
-- Os slots qua 14h, qui 09h e sex 11h continuam reservados como
-- alternativas de reposicao para Maria.
--
-- Demais profissionais recebem janelas maiores para formar uma agenda
-- significativamente mais populada sem sobreposicoes.
INSERT INTO availabilities (
    professional_id,
    weekday,
    start_time,
    end_time
)
SELECT
    professional.id,
    availability.weekday,
    availability.start_time,
    availability.end_time
FROM (
    VALUES
        ('Ana',     1, time '10:00', time '11:00'),
        ('Ana',     2, time '14:00', time '15:00'),
        ('Ana',     3, time '09:00', time '11:00'),
        ('Ana',     4, time '11:00', time '12:00'),

        ('Joao',    0, time '15:00', time '17:00'),
        ('Joao',    2, time '15:00', time '17:00'),

        ('Mariana', 1, time '16:00', time '18:00'),
        ('Mariana', 3, time '16:00', time '18:00'),

        ('Beatriz', 0, time '08:00', time '12:00'),
        ('Beatriz', 1, time '13:00', time '17:00'),
        ('Beatriz', 3, time '08:00', time '12:00'),

        ('Rafael',  0, time '13:00', time '18:00'),
        ('Rafael',  2, time '08:00', time '12:00'),
        ('Rafael',  4, time '13:00', time '17:00'),

        ('Lucas',   1, time '08:00', time '12:00'),
        ('Lucas',   2, time '13:00', time '18:00'),
        ('Lucas',   3, time '13:00', time '18:00'),

        ('Camila',  0, time '08:00', time '13:00'),
        ('Camila',  1, time '13:00', time '18:00'),
        ('Camila',  2, time '08:00', time '13:00'),
        ('Camila',  4, time '08:00', time '13:00')
) AS availability(
    professional_name,
    weekday,
    start_time,
    end_time
)
JOIN professionals AS professional
  ON professional.business_id = v_business_id
 AND professional.name = availability.professional_name
ON CONFLICT (professional_id, weekday) DO UPDATE
SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time;

-- Identifica Maria pelo nome dentro do tenant dedicado para permitir trocar
-- o telefone real entre ensaios sem criar uma segunda Maria.
IF (
    SELECT count(*)
    FROM clients
    WHERE business_id = v_business_id
      AND name = 'Maria Silva'
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

SELECT id
INTO v_maria_id
FROM clients
WHERE business_id = v_business_id
  AND name = 'Maria Silva';

IF v_maria_id IS NULL THEN
    INSERT INTO clients (
        business_id,
        name,
        phone,
        is_active
    )
    VALUES (
        v_business_id,
        'Maria Silva',
        v_maria_phone,
        true
    )
    ON CONFLICT (business_id, phone) DO UPDATE
    SET
        name = EXCLUDED.name,
        is_active = true
    RETURNING id INTO v_maria_id;
ELSE
    UPDATE clients
    SET
        phone = v_maria_phone,
        is_active = true
    WHERE id = v_maria_id
    RETURNING id INTO v_maria_id;
END IF;

INSERT INTO clients (
    business_id,
    name,
    phone,
    is_active
)
VALUES (
    v_business_id,
    'Carlos Souza',
    '5511988881001',
    true
)
ON CONFLICT (business_id, phone) DO UPDATE
SET
    name = EXCLUDED.name,
    is_active = true
RETURNING id INTO v_carlos_id;

INSERT INTO clients (
    business_id,
    name,
    phone,
    is_active
)
VALUES (
    v_business_id,
    'Fernanda Lima',
    '5511988881002',
    true
)
ON CONFLICT (business_id, phone) DO UPDATE
SET
    name = EXCLUDED.name,
    is_active = true
RETURNING id INTO v_fernanda_id;

INSERT INTO clients (
    business_id,
    name,
    phone,
    is_active
)
VALUES (
    v_business_id,
    'Pedro Santos',
    '5511988881003',
    true
)
ON CONFLICT (business_id, phone) DO UPDATE
SET
    name = EXCLUDED.name,
    is_active = true
RETURNING id INTO v_pedro_id;

-- Novos alunos.
INSERT INTO clients (
    business_id,
    name,
    phone,
    is_active
)
VALUES
    (
        v_business_id,
        'Juliana Costa',
        '5511988882001',
        true
    ),
    (
        v_business_id,
        'Ricardo Alves',
        '5511988882002',
        true
    ),
    (
        v_business_id,
        'Bianca Rocha',
        '5511988882003',
        true
    ),
    (
        v_business_id,
        'Gustavo Martins',
        '5511988882004',
        true
    ),
    (
        v_business_id,
        'Luana Ribeiro',
        '5511988882005',
        true
    ),
    (
        v_business_id,
        'Diego Oliveira',
        '5511988882006',
        true
    ),
    (
        v_business_id,
        'Patricia Gomes',
        '5511988882007',
        true
    ),
    (
        v_business_id,
        'Bruno Carvalho',
        '5511988882008',
        true
    ),
    (
        v_business_id,
        'Renata Moreira',
        '5511988882009',
        true
    ),
    (
        v_business_id,
        'Marcelo Araujo',
        '5511988882010',
        true
    ),
    (
        v_business_id,
        'Sofia Nunes',
        '5511988882011',
        true
    ),
    (
        v_business_id,
        'Thiago Ferreira',
        '5511988882012',
        true
    )
ON CONFLICT (business_id, phone) DO UPDATE
SET
    name = EXCLUDED.name,
    is_active = true;

-- Segunda-feira da semana corrente na timezone operacional do negocio.
--
-- A partir desta data sao geradas cinco semanas:
--   week_number = 0 -> semana atual
--   week_number = 1 -> semana seguinte
--   week_number = 2 -> segunda semana seguinte
--   week_number = 3 -> terceira semana seguinte
--   week_number = 4 -> quarta semana seguinte
v_week_anchor := date_trunc(
    'week',
    now() AT TIME ZONE v_timezone
)::date;

-- As tres alternativas da Ana precisam continuar realmente livres nas
-- cinco semanas para preservar o fluxo de reposicao da demonstracao.
IF EXISTS (
    WITH candidate_slots (
        weekday_offset,
        start_time
    ) AS (
        VALUES
            (2, time '14:00'),
            (3, time '09:00'),
            (4, time '11:00')
    ),
    candidate_occurrences AS (
        SELECT
            (
                (
                    v_week_anchor
                    + (
                        week_number * 7
                        + slot.weekday_offset
                    )
                )
                + slot.start_time
            ) AT TIME ZONE v_timezone AS start_at
        FROM candidate_slots AS slot
        CROSS JOIN generate_series(0, 4) AS week_number
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

-- Verifica se algum appointment ativo preexistente utiliza um dos slots
-- recorrentes abaixo com outro aluno ou outro professor.
--
-- Uma ocorrencia exatamente igual ao seed e permitida, pois a insercao
-- posterior e idempotente e nao a recria.
IF EXISTS (
    WITH desired_appointments (
        client_phone,
        professional_name,
        weekday_offset,
        start_time
    ) AS (
        VALUES
            -- Agenda original.
            (v_maria_phone,   'Ana',     1, time '10:00'),
            (v_maria_phone,   'Ana',     3, time '10:00'),

            ('5511988881001', 'Joao',    0, time '15:00'),
            ('5511988881001', 'Joao',    2, time '15:00'),

            ('5511988881003', 'Joao',    0, time '16:00'),
            ('5511988881003', 'Joao',    2, time '16:00'),

            ('5511988881002', 'Mariana', 1, time '16:00'),
            ('5511988881002', 'Mariana', 3, time '16:00'),

            -- Beatriz.
            ('5511988882001', 'Beatriz', 0, time '08:00'),
            ('5511988882001', 'Beatriz', 3, time '08:00'),

            ('5511988882002', 'Beatriz', 0, time '09:00'),
            ('5511988882002', 'Beatriz', 3, time '09:00'),

            ('5511988882003', 'Beatriz', 1, time '13:00'),
            ('5511988882003', 'Beatriz', 3, time '10:00'),

            -- Rafael.
            ('5511988882004', 'Rafael',  0, time '13:00'),
            ('5511988882004', 'Rafael',  4, time '13:00'),

            ('5511988882005', 'Rafael',  0, time '14:00'),
            ('5511988882005', 'Rafael',  4, time '14:00'),

            ('5511988882006', 'Rafael',  2, time '08:00'),
            ('5511988882006', 'Rafael',  4, time '15:00'),

            -- Lucas.
            ('5511988882007', 'Lucas',   1, time '08:00'),
            ('5511988882007', 'Lucas',   3, time '13:00'),

            ('5511988882008', 'Lucas',   1, time '09:00'),
            ('5511988882008', 'Lucas',   3, time '14:00'),

            ('5511988882009', 'Lucas',   2, time '13:00'),
            ('5511988882009', 'Lucas',   3, time '15:00'),

            -- Camila.
            ('5511988882010', 'Camila',  0, time '08:00'),
            ('5511988882010', 'Camila',  4, time '08:00'),

            ('5511988882011', 'Camila',  0, time '09:00'),
            ('5511988882011', 'Camila',  4, time '09:00'),

            ('5511988882012', 'Camila',  1, time '13:00'),
            ('5511988882012', 'Camila',  2, time '08:00')
    ),
    occurrences AS (
        SELECT
            client.id AS client_id,
            professional.id AS professional_id,
            v_service_id AS service_id,
            (
                (
                    v_week_anchor
                    + (
                        week_number * 7
                        + desired.weekday_offset
                    )
                )
                + desired.start_time
            ) AT TIME ZONE v_timezone AS start_at
        FROM desired_appointments AS desired
        JOIN clients AS client
          ON client.business_id = v_business_id
         AND client.phone = desired.client_phone
        JOIN professionals AS professional
          ON professional.business_id = v_business_id
         AND professional.name = desired.professional_name
        CROSS JOIN generate_series(0, 4) AS week_number
    )
    SELECT 1
    FROM occurrences AS occurrence
    JOIN appointments AS existing
      ON existing.business_id = v_business_id
     AND existing.start_datetime = occurrence.start_at
     AND (
         existing.professional_id = occurrence.professional_id
         OR existing.client_id = occurrence.client_id
     )
    WHERE existing.status = 'scheduled'::appointmentstatus
      AND NOT (
          existing.client_id = occurrence.client_id
          AND existing.professional_id = occurrence.professional_id
          AND existing.service_id = occurrence.service_id
      )
) THEN
    RAISE EXCEPTION
        'Ha appointment ativo conflitante com a grade fixa de cinco semanas. Revise o tenant antes de executar o seed.';
END IF;

-- Grade semanal recorrente.
--
-- Sao 32 sessoes por semana:
--   * 8 sessoes da agenda original;
--   * 24 sessoes dos novos alunos/profissionais.
--
-- Em cinco semanas o seed pode materializar ate 160 appointments.
WITH desired_appointments (
    client_phone,
    professional_name,
    weekday_offset,
    start_time
) AS (
    VALUES
        -- ================================================================
        -- AGENDA ORIGINAL
        -- ================================================================

        -- Maria com Ana:
        -- terca 10h e quinta 10h.
        (v_maria_phone,   'Ana',     1, time '10:00'),
        (v_maria_phone,   'Ana',     3, time '10:00'),

        -- Carlos com Joao:
        -- segunda 15h e quarta 15h.
        ('5511988881001', 'Joao',    0, time '15:00'),
        ('5511988881001', 'Joao',    2, time '15:00'),

        -- Pedro com Joao:
        -- segunda 16h e quarta 16h.
        ('5511988881003', 'Joao',    0, time '16:00'),
        ('5511988881003', 'Joao',    2, time '16:00'),

        -- Fernanda com Mariana:
        -- terca 16h e quinta 16h.
        ('5511988881002', 'Mariana', 1, time '16:00'),
        ('5511988881002', 'Mariana', 3, time '16:00'),

        -- ================================================================
        -- NOVA AGENDA - BEATRIZ
        -- ================================================================

        -- Juliana Costa:
        -- segunda 08h e quinta 08h.
        ('5511988882001', 'Beatriz', 0, time '08:00'),
        ('5511988882001', 'Beatriz', 3, time '08:00'),

        -- Ricardo Alves:
        -- segunda 09h e quinta 09h.
        ('5511988882002', 'Beatriz', 0, time '09:00'),
        ('5511988882002', 'Beatriz', 3, time '09:00'),

        -- Bianca Rocha:
        -- terca 13h e quinta 10h.
        ('5511988882003', 'Beatriz', 1, time '13:00'),
        ('5511988882003', 'Beatriz', 3, time '10:00'),

        -- ================================================================
        -- NOVA AGENDA - RAFAEL
        -- ================================================================

        -- Gustavo Martins:
        -- segunda 13h e sexta 13h.
        ('5511988882004', 'Rafael',  0, time '13:00'),
        ('5511988882004', 'Rafael',  4, time '13:00'),

        -- Luana Ribeiro:
        -- segunda 14h e sexta 14h.
        ('5511988882005', 'Rafael',  0, time '14:00'),
        ('5511988882005', 'Rafael',  4, time '14:00'),

        -- Diego Oliveira:
        -- quarta 08h e sexta 15h.
        ('5511988882006', 'Rafael',  2, time '08:00'),
        ('5511988882006', 'Rafael',  4, time '15:00'),

        -- ================================================================
        -- NOVA AGENDA - LUCAS
        -- ================================================================

        -- Patricia Gomes:
        -- terca 08h e quinta 13h.
        ('5511988882007', 'Lucas',   1, time '08:00'),
        ('5511988882007', 'Lucas',   3, time '13:00'),

        -- Bruno Carvalho:
        -- terca 09h e quinta 14h.
        ('5511988882008', 'Lucas',   1, time '09:00'),
        ('5511988882008', 'Lucas',   3, time '14:00'),

        -- Renata Moreira:
        -- quarta 13h e quinta 15h.
        ('5511988882009', 'Lucas',   2, time '13:00'),
        ('5511988882009', 'Lucas',   3, time '15:00'),

        -- ================================================================
        -- NOVA AGENDA - CAMILA
        -- ================================================================

        -- Marcelo Araujo:
        -- segunda 08h e sexta 08h.
        ('5511988882010', 'Camila',  0, time '08:00'),
        ('5511988882010', 'Camila',  4, time '08:00'),

        -- Sofia Nunes:
        -- segunda 09h e sexta 09h.
        ('5511988882011', 'Camila',  0, time '09:00'),
        ('5511988882011', 'Camila',  4, time '09:00'),

        -- Thiago Ferreira:
        -- terca 13h e quarta 08h.
        ('5511988882012', 'Camila',  1, time '13:00'),
        ('5511988882012', 'Camila',  2, time '08:00')
),
occurrences AS (
    SELECT
        client.id AS client_id,
        professional.id AS professional_id,
        v_service_id AS service_id,
        (
            (
                v_week_anchor
                + (
                    week_number * 7
                    + desired.weekday_offset
                )
            )
            + desired.start_time
        ) AT TIME ZONE v_timezone AS start_at
    FROM desired_appointments AS desired
    JOIN clients AS client
      ON client.business_id = v_business_id
     AND client.phone = desired.client_phone
    JOIN professionals AS professional
      ON professional.business_id = v_business_id
     AND professional.name = desired.professional_name
    CROSS JOIN generate_series(0, 4) AS week_number
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
    'Demo Pilates preparada: business_id=%, integration_id=%, service_id=%, semana inicial=%, semanas=5',
    v_business_id,
    v_integration_id,
    v_service_id,
    v_week_anchor;

END
$demo$;

COMMIT;

-- Descoberta/confirmacao somente leitura ANTES da execucao.
-- Confirme que o integration_id e o da credencial HTTP usada pelo main-staging:
--------------------------------------------------------------------------------

-- SELECT
--     b.id AS business_id,
--     b.name,
--     ei.instance_name,
--     ei.state,
--     ei.integration_id,
--     i.name AS integration_name,
--     bi.is_active
-- FROM businesses b
-- JOIN evolution_instances ei
--   ON ei.business_id = b.id
-- JOIN integrations i
--   ON i.id = ei.integration_id
-- JOIN business_integrations bi
--   ON bi.business_id = b.id
--  AND bi.integration_id = i.id
-- WHERE b.is_active = true
--   AND i.is_active = true
-- ORDER BY b.id;
-----------------

-- Verificacao opcional e somente leitura DEPOIS da execucao:

-- SELECT
--     b.id,
--     b.name,
--     b.slug,
--     b.timezone,
--     b.booking_enabled,
--     b.cancel_limit_hours,
--     b.maximum_schedule_days
-- FROM businesses b
-- WHERE b.id = <ID>;
---------------------

-- SELECT
--     c.name AS aluno,
--     p.name AS professor,
--     a.start_datetime,
--     a.end_datetime,
--     a.status
-- FROM appointments a
-- JOIN clients c
--   ON c.id = a.client_id
-- JOIN professionals p
--   ON p.id = a.professional_id
-- WHERE a.business_id = <ID>
-- ORDER BY
--     a.start_datetime,
--     p.name,
--     c.name;
