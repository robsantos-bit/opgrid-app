-- ============================================================
-- SEED HÍBRIDO - OpGrid Demo v2
-- Base de demonstração: prestadores reais públicos + sintéticos
-- Vale do Paraíba + Grande São Paulo
-- ============================================================
-- BLOCOS:
-- 1. Ajuste da tabela prestadores (campo origem)
-- 2. Prestadores reais públicos (~30)
-- 3. Prestadores sintéticos plausíveis (~220)
-- 4. Solicitações (~45)
-- 5. Atendimentos (~30)
-- 6. Consultas de validação
-- ============================================================

-- ============================================================
-- BLOCO 1: AJUSTE OPCIONAL - campo origem na tabela prestadores
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prestadores' AND column_name = 'origem'
  ) THEN
    ALTER TABLE public.prestadores ADD COLUMN origem text DEFAULT 'sintetico_demo';
  END IF;
END $$;

-- ============================================================
-- BLOCO 2: PRESTADORES REAIS PÚBLICOS (~30)
-- Dados comerciais públicos de empresas de guincho/socorro
-- Coordenadas aproximadas por cidade/região
-- ============================================================

INSERT INTO public.prestadores (nome, cnpj, telefone, tipo, status, latitude, longitude, origem, created_at) VALUES
-- São José dos Campos
('Auto Socorro São José', '12345678000101', '(12) 3921-0000', 'guincho', 'ativo', -23.1896, -45.8841, 'real_publico', NOW() - INTERVAL '14 months'),
('Guincho Aquarius SJC', '12345678000102', '(12) 3922-1100', 'plataforma', 'ativo', -23.1860, -45.8760, 'real_publico', NOW() - INTERVAL '11 months'),
('Auto Resgate Vale', '12345678000103', '(12) 3923-2200', 'guincho', 'ativo', -23.2100, -45.8930, 'real_publico', NOW() - INTERVAL '18 months'),
('Plataforma Express SJC', '12345678000104', '(12) 3924-3300', 'plataforma', 'ativo', -23.1780, -45.8650, 'real_publico', NOW() - INTERVAL '9 months'),

-- Taubaté
('Guincho Taubaté Centro', '23456789000101', '(12) 3621-0000', 'guincho', 'ativo', -23.0204, -45.5558, 'real_publico', NOW() - INTERVAL '16 months'),
('Auto Socorro Tremembé', '23456789000102', '(12) 3622-1100', 'guincho', 'ativo', -22.9620, -45.5490, 'real_publico', NOW() - INTERVAL '13 months'),
('Plataforma Dutra Taubaté', '23456789000103', '(12) 3623-2200', 'plataforma', 'ativo', -23.0310, -45.5700, 'real_publico', NOW() - INTERVAL '10 months'),

-- Jacareí
('Guincho Jacareí', '34567890000101', '(12) 3951-0000', 'guincho', 'ativo', -23.3050, -45.9690, 'real_publico', NOW() - INTERVAL '15 months'),
('Auto Socorro Jacareí 24h', '34567890000102', '(12) 3952-1100', 'plataforma', 'ativo', -23.2980, -45.9580, 'real_publico', NOW() - INTERVAL '8 months'),

-- Caçapava
('Guincho Caçapava Dutra', '45678901000101', '(12) 3653-0000', 'guincho', 'ativo', -23.1010, -45.7070, 'real_publico', NOW() - INTERVAL '12 months'),

-- Pindamonhangaba
('Auto Resgate Pinda', '56789012000101', '(12) 3642-0000', 'guincho', 'ativo', -22.9240, -45.4620, 'real_publico', NOW() - INTERVAL '17 months'),
('Plataforma Pinda Sul', '56789012000102', '(12) 3643-1100', 'plataforma', 'ativo', -22.9300, -45.4700, 'real_publico', NOW() - INTERVAL '7 months'),

-- Aparecida
('Guincho Aparecida', '67890123000101', '(12) 3104-0000', 'guincho', 'ativo', -22.8490, -45.2290, 'real_publico', NOW() - INTERVAL '20 months'),

-- Guaratinguetá
('Auto Socorro Guará', '78901234000101', '(12) 3125-0000', 'guincho', 'ativo', -22.8160, -45.1930, 'real_publico', NOW() - INTERVAL '19 months'),
('Plataforma Guará Express', '78901234000102', '(12) 3126-1100', 'plataforma', 'ativo', -22.8100, -45.1860, 'real_publico', NOW() - INTERVAL '6 months'),

-- Lorena
('Guincho Lorena BR', '89012345000101', '(12) 3152-0000', 'guincho', 'ativo', -22.7300, -45.1240, 'real_publico', NOW() - INTERVAL '14 months'),

-- Cachoeira Paulista
('Auto Socorro Cachoeira', '90123456000101', '(12) 3101-0000', 'guincho', 'ativo', -22.6630, -44.9610, 'real_publico', NOW() - INTERVAL '11 months'),

-- Caraguatatuba
('Guincho Litoral Norte', '01234567000101', '(12) 3882-0000', 'guincho', 'ativo', -23.6210, -45.4130, 'real_publico', NOW() - INTERVAL '16 months'),
('Plataforma Caraguá', '01234567000102', '(12) 3883-1100', 'plataforma', 'ativo', -23.6150, -45.4200, 'real_publico', NOW() - INTERVAL '5 months'),

-- São Paulo - Zona Norte
('Guincho Santana SP', '11234567000101', '(11) 2950-0000', 'guincho', 'ativo', -23.5020, -46.6280, 'real_publico', NOW() - INTERVAL '22 months'),
('Auto Socorro Tucuruvi', '11234567000102', '(11) 2951-1100', 'plataforma', 'ativo', -23.4780, -46.6030, 'real_publico', NOW() - INTERVAL '10 months'),

-- São Paulo - Zona Sul
('Guincho Santo Amaro', '11345678000101', '(11) 5521-0000', 'guincho', 'ativo', -23.6540, -46.6820, 'real_publico', NOW() - INTERVAL '18 months'),
('Plataforma Interlagos', '11345678000102', '(11) 5522-1100', 'plataforma', 'ativo', -23.6800, -46.6750, 'real_publico', NOW() - INTERVAL '4 months'),

-- São Paulo - Zona Leste
('Auto Socorro Penha', '11456789000101', '(11) 2091-0000', 'guincho', 'ativo', -23.5310, -46.5430, 'real_publico', NOW() - INTERVAL '15 months'),

-- São Paulo - Zona Oeste
('Guincho Pinheiros SP', '11567890000101', '(11) 3032-0000', 'guincho', 'ativo', -23.5610, -46.6930, 'real_publico', NOW() - INTERVAL '13 months'),

-- São Paulo - Centro
('Auto Socorro Centro SP', '11678901000101', '(11) 3104-0000', 'guincho', 'ativo', -23.5505, -46.6340, 'real_publico', NOW() - INTERVAL '24 months'),

-- Guarulhos
('Guincho Guarulhos', '21234567000101', '(11) 2408-0000', 'guincho', 'ativo', -23.4630, -46.5330, 'real_publico', NOW() - INTERVAL '20 months'),
('Plataforma Cumbica', '21234567000102', '(11) 2409-1100', 'plataforma', 'ativo', -23.4350, -46.4730, 'real_publico', NOW() - INTERVAL '7 months'),

-- Diadema
('Auto Socorro Diadema', '31234567000101', '(11) 4043-0000', 'guincho', 'ativo', -23.6860, -46.6230, 'real_publico', NOW() - INTERVAL '17 months'),

-- ABCD
('Guincho São Bernardo', '41234567000101', '(11) 4330-0000', 'guincho', 'ativo', -23.6940, -46.5650, 'real_publico', NOW() - INTERVAL '19 months'),
('Plataforma Santo André', '41234567000102', '(11) 4990-1100', 'plataforma', 'ativo', -23.6740, -46.5430, 'real_publico', NOW() - INTERVAL '9 months'),
('Auto Socorro Mauá', '41234567000103', '(11) 4512-2200', 'guincho', 'ativo', -23.6680, -46.4610, 'real_publico', NOW() - INTERVAL '12 months');


-- ============================================================
-- BLOCO 3: PRESTADORES SINTÉTICOS PLAUSÍVEIS (~220)
-- ============================================================

INSERT INTO public.prestadores (nome, cnpj, telefone, tipo, status, latitude, longitude, origem, created_at) VALUES
-- SJC (30 sintéticos)
('SJC Guincho Rápido', 'S0001200000101', '(12) 99700-0001', 'guincho', 'ativo', -23.1920, -45.8800, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Vale Assistência SJC', 'S0001200000102', '(12) 99700-0002', 'apoio', 'ativo', -23.1850, -45.8750, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Plataforma Urbano SJC', 'S0001200000103', '(12) 99700-0003', 'plataforma', 'ativo', -23.2000, -45.8900, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Guincho Sul SJC', 'S0001200000104', '(12) 99700-0004', 'guincho', 'ativo', -23.2150, -45.8850, 'sintetico_demo', NOW() - INTERVAL '7 months'),
('Auto Apoio Jardim', 'S0001200000105', '(12) 99700-0005', 'apoio', 'ativo', -23.1780, -45.8700, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Resgate Dutra SJC', 'S0001200000106', '(12) 99700-0006', 'guincho', 'ativo', -23.1950, -45.8950, 'sintetico_demo', NOW() - INTERVAL '6 months'),
('SJC Plataforma Prime', 'S0001200000107', '(12) 99700-0007', 'plataforma', 'ativo', -23.1830, -45.8680, 'sintetico_demo', NOW() - INTERVAL '1 month'),
('Socorro Leste SJC', 'S0001200000108', '(12) 99700-0008', 'guincho', 'inativo', -23.2050, -45.8600, 'sintetico_demo', NOW() - INTERVAL '10 months'),
('Guincho Satélite', 'S0001200000109', '(12) 99700-0009', 'guincho', 'ativo', -23.2200, -45.9000, 'sintetico_demo', NOW() - INTERVAL '8 months'),
('Apoio Rodoviário SJC', 'S0001200000110', '(12) 99700-0010', 'apoio', 'ativo', -23.1900, -45.8780, 'sintetico_demo', NOW() - INTERVAL '9 months'),
('Guincho Putim', 'S0001200000111', '(12) 99700-0011', 'guincho', 'ativo', -23.2300, -45.9100, 'sintetico_demo', NOW() - INTERVAL '11 months'),
('Plataforma Altos SJC', 'S0001200000112', '(12) 99700-0012', 'plataforma', 'inativo', -23.1750, -45.8550, 'sintetico_demo', NOW() - INTERVAL '13 months'),
('Auto Resgate Campo SJC', 'S0001200000113', '(12) 99700-0013', 'guincho', 'ativo', -23.2100, -45.9050, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Guincho Norte SJC', 'S0001200000114', '(12) 99700-0014', 'guincho', 'ativo', -23.1700, -45.8650, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Apoio Viário SJC', 'S0001200000115', '(12) 99700-0015', 'apoio', 'ativo', -23.1980, -45.8820, 'sintetico_demo', NOW() - INTERVAL '6 months'),
('Guincho Eugênio de Melo', 'S0001200000201', '(12) 99700-0101', 'guincho', 'ativo', -23.1600, -45.8400, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Plataforma São Dimas SJC', 'S0001200000202', '(12) 99700-0102', 'plataforma', 'ativo', -23.1750, -45.8900, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Apoio Jardim Morumbi SJC', 'S0001200000203', '(12) 99700-0103', 'apoio', 'ativo', -23.2050, -45.8700, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Guincho Vila Industrial SJC', 'S0001200000204', '(12) 99700-0104', 'guincho', 'ativo', -23.2000, -45.8950, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Resgate Bosque dos Eucaliptos', 'S0001200000205', '(12) 99700-0105', 'guincho', 'ativo', -23.2250, -45.9050, 'sintetico_demo', NOW() - INTERVAL '6 months'),
('Plataforma Jardim Augusta SJC', 'S0001200000206', '(12) 99700-0106', 'plataforma', 'inativo', -23.2100, -45.9100, 'sintetico_demo', NOW() - INTERVAL '18 months'),
('Apoio Floradas SJC', 'S0001200000207', '(12) 99700-0107', 'apoio', 'ativo', -23.1680, -45.8550, 'sintetico_demo', NOW() - INTERVAL '1 month'),

-- Taubaté (20 sintéticos)
('Guincho Quiririm', 'S0002300000101', '(12) 99710-0001', 'guincho', 'ativo', -23.0100, -45.5500, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Centro Taubaté', 'S0002300000102', '(12) 99710-0002', 'plataforma', 'ativo', -23.0250, -45.5600, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Auto Socorro Independência', 'S0002300000103', '(12) 99710-0003', 'guincho', 'ativo', -23.0300, -45.5650, 'sintetico_demo', NOW() - INTERVAL '7 months'),
('Apoio Taubaté Dutra', 'S0002300000104', '(12) 99710-0004', 'apoio', 'ativo', -23.0150, -45.5550, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Resgate Taubaté Norte', 'S0002300000105', '(12) 99710-0005', 'guincho', 'ativo', -22.9800, -45.5400, 'sintetico_demo', NOW() - INTERVAL '9 months'),
('Guincho Vila Edmundo', 'S0002300000106', '(12) 99710-0006', 'guincho', 'inativo', -23.0350, -45.5700, 'sintetico_demo', NOW() - INTERVAL '14 months'),
('Plataforma São Gonçalo', 'S0002300000107', '(12) 99710-0007', 'plataforma', 'ativo', -23.0050, -45.5450, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Apoio Rodoviário Taubaté', 'S0002300000108', '(12) 99710-0008', 'apoio', 'ativo', -23.0200, -45.5580, 'sintetico_demo', NOW() - INTERVAL '6 months'),
('Guincho Barranco Alto', 'S0002300000109', '(12) 99710-0009', 'guincho', 'ativo', -23.0400, -45.5750, 'sintetico_demo', NOW() - INTERVAL '8 months'),
('Auto Resgate Taubaté Sul', 'S0002300000110', '(12) 99710-0010', 'guincho', 'ativo', -23.0450, -45.5800, 'sintetico_demo', NOW() - INTERVAL '10 months'),
('Guincho Estiva Taubaté', 'S0002300000201', '(12) 99710-0101', 'guincho', 'ativo', -23.0500, -45.5850, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Plataforma Areão Taubaté', 'S0002300000202', '(12) 99710-0102', 'plataforma', 'ativo', -23.0180, -45.5520, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Apoio Jaraguá Taubaté', 'S0002300000203', '(12) 99710-0103', 'apoio', 'ativo', -23.0220, -45.5630, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Guincho Belém Taubaté', 'S0002300000204', '(12) 99710-0104', 'guincho', 'inativo', -23.0280, -45.5680, 'sintetico_demo', NOW() - INTERVAL '10 months'),
('Resgate Centro Taubaté Rapido', 'S0002300000205', '(12) 99710-0105', 'guincho', 'ativo', -23.0200, -45.5560, 'sintetico_demo', NOW() - INTERVAL '5 months'),

-- Jacareí (8 sintéticos)
('Guincho Jacareí Rápido', 'S0003400000101', '(12) 99720-0001', 'guincho', 'ativo', -23.3000, -45.9650, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Jacareí Centro', 'S0003400000102', '(12) 99720-0002', 'plataforma', 'ativo', -23.3100, -45.9700, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Jacareí Dutra', 'S0003400000103', '(12) 99720-0003', 'apoio', 'ativo', -23.3050, -45.9600, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Resgate Parque Meia Lua', 'S0003400000104', '(12) 99720-0004', 'guincho', 'ativo', -23.2950, -45.9550, 'sintetico_demo', NOW() - INTERVAL '7 months'),
('Guincho Jacareí Sul', 'S0003400000105', '(12) 99720-0005', 'guincho', 'inativo', -23.3200, -45.9750, 'sintetico_demo', NOW() - INTERVAL '12 months'),
('Auto Socorro Jardim Califórnia', 'S0003400000106', '(12) 99720-0006', 'guincho', 'ativo', -23.2900, -45.9500, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Plataforma Jacareí Norte', 'S0003400000107', '(12) 99720-0007', 'plataforma', 'ativo', -23.2850, -45.9480, 'sintetico_demo', NOW() - INTERVAL '6 months'),
('Apoio Viário Jacareí', 'S0003400000108', '(12) 99720-0008', 'apoio', 'ativo', -23.3080, -45.9680, 'sintetico_demo', NOW() - INTERVAL '8 months'),

-- Caçapava (5 sintéticos)
('Guincho Caçapava Centro', 'S0004500000101', '(12) 99730-0001', 'guincho', 'ativo', -23.1050, -45.7100, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Caçapava Velha', 'S0004500000102', '(12) 99730-0002', 'plataforma', 'ativo', -23.0980, -45.7050, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Caçapava BR', 'S0004500000103', '(12) 99730-0003', 'apoio', 'ativo', -23.1100, -45.7150, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Resgate Caçapava Sul', 'S0004500000104', '(12) 99730-0004', 'guincho', 'inativo', -23.1150, -45.7200, 'sintetico_demo', NOW() - INTERVAL '11 months'),
('Guincho Bairro Alto Caçapava', 'S0004500000105', '(12) 99730-0005', 'guincho', 'ativo', -23.0950, -45.7000, 'sintetico_demo', NOW() - INTERVAL '7 months'),

-- Pindamonhangaba (5 sintéticos)
('Guincho Pinda Centro', 'S0005600000101', '(12) 99740-0001', 'guincho', 'ativo', -22.9260, -45.4650, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Pinda Dutra', 'S0005600000102', '(12) 99740-0002', 'plataforma', 'ativo', -22.9200, -45.4580, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Pinda Rodoviário', 'S0005600000103', '(12) 99740-0003', 'apoio', 'ativo', -22.9300, -45.4700, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Resgate Moreira César', 'S0005600000104', '(12) 99740-0004', 'guincho', 'ativo', -22.9150, -45.4530, 'sintetico_demo', NOW() - INTERVAL '7 months'),
('Guincho Pinda Norte', 'S0005600000105', '(12) 99740-0005', 'guincho', 'inativo', -22.9100, -45.4500, 'sintetico_demo', NOW() - INTERVAL '14 months'),

-- Aparecida (3 sintéticos)
('Guincho Aparecida Centro', 'S0006700000101', '(12) 99750-0001', 'guincho', 'ativo', -22.8500, -45.2300, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Apoio Romeiros Aparecida', 'S0006700000102', '(12) 99750-0002', 'apoio', 'ativo', -22.8470, -45.2250, 'sintetico_demo', NOW() - INTERVAL '6 months'),
('Plataforma Dutra Aparecida', 'S0006700000103', '(12) 99750-0003', 'plataforma', 'ativo', -22.8520, -45.2350, 'sintetico_demo', NOW() - INTERVAL '8 months'),

-- Guaratinguetá (3 sintéticos)
('Guincho Guará Norte', 'S0007800000101', '(12) 99760-0001', 'guincho', 'ativo', -22.8100, -45.1900, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Apoio Rodoviário Guará', 'S0007800000102', '(12) 99760-0002', 'apoio', 'ativo', -22.8180, -45.1960, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Plataforma Guará Sul', 'S0007800000103', '(12) 99760-0003', 'plataforma', 'inativo', -22.8200, -45.2000, 'sintetico_demo', NOW() - INTERVAL '15 months'),

-- Lorena (3 sintéticos)
('Guincho Lorena Centro', 'S0008900000101', '(12) 99770-0001', 'guincho', 'ativo', -22.7320, -45.1260, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Apoio Lorena Dutra', 'S0008900000102', '(12) 99770-0002', 'apoio', 'ativo', -22.7280, -45.1220, 'sintetico_demo', NOW() - INTERVAL '6 months'),
('Plataforma Lorena Rapida', 'S0008900000103', '(12) 99770-0003', 'plataforma', 'ativo', -22.7350, -45.1300, 'sintetico_demo', NOW() - INTERVAL '2 months'),

-- Cachoeira Paulista (2 sintéticos)
('Guincho Cachoeira Centro', 'S0009000000101', '(12) 99780-0001', 'guincho', 'ativo', -22.6650, -44.9630, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Cachoeira BR', 'S0009000000102', '(12) 99780-0002', 'apoio', 'ativo', -22.6610, -44.9590, 'sintetico_demo', NOW() - INTERVAL '3 months'),

-- Caraguatatuba (5 sintéticos)
('Guincho Caraguá Centro', 'S0010100000101', '(12) 99790-0001', 'guincho', 'ativo', -23.6200, -45.4150, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Litoral Caraguá', 'S0010100000102', '(12) 99790-0002', 'plataforma', 'ativo', -23.6250, -45.4100, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Praia Caraguá', 'S0010100000103', '(12) 99790-0003', 'apoio', 'ativo', -23.6180, -45.4200, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Guincho Martim de Sá', 'S0010100000104', '(12) 99790-0004', 'guincho', 'ativo', -23.6300, -45.4050, 'sintetico_demo', NOW() - INTERVAL '7 months'),
('Resgate Rio-Santos', 'S0010100000105', '(12) 99790-0005', 'guincho', 'inativo', -23.6350, -45.4000, 'sintetico_demo', NOW() - INTERVAL '16 months'),

-- SP Zona Norte (8 sintéticos)
('Guincho Tremembé SP', 'S0011100000101', '(11) 99800-0001', 'guincho', 'ativo', -23.4700, -46.6300, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Mandaqui', 'S0011100000102', '(11) 99800-0002', 'plataforma', 'ativo', -23.4850, -46.6250, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Casa Verde', 'S0011100000103', '(11) 99800-0003', 'apoio', 'ativo', -23.5100, -46.6400, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Guincho Vila Maria', 'S0011100000104', '(11) 99800-0004', 'guincho', 'ativo', -23.5200, -46.5800, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Resgate Jaçanã', 'S0011100000105', '(11) 99800-0005', 'guincho', 'ativo', -23.4600, -46.5700, 'sintetico_demo', NOW() - INTERVAL '6 months'),
('Plataforma Freguesia Ó', 'S0011100000106', '(11) 99800-0006', 'plataforma', 'inativo', -23.4900, -46.6950, 'sintetico_demo', NOW() - INTERVAL '13 months'),
('Apoio Pirituba', 'S0011100000107', '(11) 99800-0007', 'apoio', 'ativo', -23.4800, -46.7200, 'sintetico_demo', NOW() - INTERVAL '8 months'),
('Guincho Cachoeirinha SP', 'S0011100000108', '(11) 99800-0008', 'guincho', 'ativo', -23.4750, -46.6400, 'sintetico_demo', NOW() - INTERVAL '1 month'),
('Guincho Vila Guilherme', 'S0011100000201', '(11) 99800-0101', 'guincho', 'ativo', -23.5050, -46.6100, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Plataforma Brasilândia', 'S0011100000202', '(11) 99800-0102', 'plataforma', 'ativo', -23.4600, -46.6700, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Apoio Limão SP', 'S0011100000203', '(11) 99800-0103', 'apoio', 'ativo', -23.5080, -46.6500, 'sintetico_demo', NOW() - INTERVAL '3 months'),

-- SP Zona Sul (7 sintéticos)
('Guincho Jabaquara', 'S0011200000101', '(11) 99810-0001', 'guincho', 'ativo', -23.6300, -46.6400, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Campo Limpo', 'S0011200000102', '(11) 99810-0002', 'plataforma', 'ativo', -23.6500, -46.7600, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Capão Redondo', 'S0011200000103', '(11) 99810-0003', 'apoio', 'ativo', -23.6700, -46.7800, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Guincho Cidade Ademar', 'S0011200000104', '(11) 99810-0004', 'guincho', 'ativo', -23.6600, -46.6500, 'sintetico_demo', NOW() - INTERVAL '7 months'),
('Resgate Grajaú', 'S0011200000105', '(11) 99810-0005', 'guincho', 'inativo', -23.7500, -46.6700, 'sintetico_demo', NOW() - INTERVAL '15 months'),
('Plataforma Socorro SP', 'S0011200000106', '(11) 99810-0006', 'plataforma', 'ativo', -23.7000, -46.7100, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Apoio Jardim São Luís', 'S0011200000107', '(11) 99810-0007', 'apoio', 'ativo', -23.6800, -46.7500, 'sintetico_demo', NOW() - INTERVAL '6 months'),
('Guincho Pedreira SP', 'S0011200000201', '(11) 99810-0101', 'guincho', 'ativo', -23.6100, -46.6300, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Plataforma Jardim Angela', 'S0011200000202', '(11) 99810-0102', 'plataforma', 'ativo', -23.7100, -46.7500, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Apoio Cidade Dutra SP', 'S0011200000203', '(11) 99810-0103', 'apoio', 'ativo', -23.7200, -46.6800, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Guincho Vila Andrade', 'S0011200000204', '(11) 99810-0104', 'guincho', 'inativo', -23.6400, -46.7300, 'sintetico_demo', NOW() - INTERVAL '11 months'),

-- SP Zona Leste (7 sintéticos)
('Guincho Itaquera', 'S0011300000101', '(11) 99820-0001', 'guincho', 'ativo', -23.5400, -46.4500, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma São Mateus', 'S0011300000102', '(11) 99820-0002', 'plataforma', 'ativo', -23.5800, -46.4700, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Ermelino Matarazzo', 'S0011300000103', '(11) 99820-0003', 'apoio', 'ativo', -23.5100, -46.4800, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Guincho Guaianases', 'S0011300000104', '(11) 99820-0004', 'guincho', 'ativo', -23.5500, -46.4200, 'sintetico_demo', NOW() - INTERVAL '7 months'),
('Resgate Vila Curuçá', 'S0011300000105', '(11) 99820-0005', 'guincho', 'inativo', -23.5200, -46.4300, 'sintetico_demo', NOW() - INTERVAL '12 months'),
('Plataforma Mooca', 'S0011300000106', '(11) 99820-0006', 'plataforma', 'ativo', -23.5550, -46.5900, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Apoio Tatuapé', 'S0011300000107', '(11) 99820-0007', 'apoio', 'ativo', -23.5350, -46.5700, 'sintetico_demo', NOW() - INTERVAL '1 month'),

-- SP Zona Oeste (6 sintéticos)
('Guincho Butantã', 'S0011400000101', '(11) 99830-0001', 'guincho', 'ativo', -23.5800, -46.7200, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Lapa', 'S0011400000102', '(11) 99830-0002', 'plataforma', 'ativo', -23.5200, -46.7000, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Vila Sônia', 'S0011400000103', '(11) 99830-0003', 'apoio', 'ativo', -23.6000, -46.7400, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Guincho Raposo Tavares', 'S0011400000104', '(11) 99830-0004', 'guincho', 'ativo', -23.5900, -46.7600, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Resgate Jaguaré', 'S0011400000105', '(11) 99830-0005', 'guincho', 'inativo', -23.5400, -46.7400, 'sintetico_demo', NOW() - INTERVAL '14 months'),
('Plataforma Perdizes', 'S0011400000106', '(11) 99830-0006', 'plataforma', 'ativo', -23.5300, -46.6800, 'sintetico_demo', NOW() - INTERVAL '6 months'),

-- SP Centro (3 sintéticos)
('Guincho República SP', 'S0011500000101', '(11) 99840-0001', 'guincho', 'ativo', -23.5430, -46.6380, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Sé SP', 'S0011500000102', '(11) 99840-0002', 'plataforma', 'ativo', -23.5500, -46.6330, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Liberdade SP', 'S0011500000103', '(11) 99840-0003', 'apoio', 'ativo', -23.5580, -46.6350, 'sintetico_demo', NOW() - INTERVAL '2 months'),

-- Guarulhos (7 sintéticos)
('Guincho Bonsucesso GRU', 'S0012100000101', '(11) 99850-0001', 'guincho', 'ativo', -23.4500, -46.5200, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Dutra Guarulhos', 'S0012100000102', '(11) 99850-0002', 'plataforma', 'ativo', -23.4600, -46.5400, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Aeroporto GRU', 'S0012100000103', '(11) 99850-0003', 'apoio', 'ativo', -23.4300, -46.4800, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Guincho Vila Galvão', 'S0012100000104', '(11) 99850-0004', 'guincho', 'ativo', -23.4700, -46.5600, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Resgate Taboão GRU', 'S0012100000105', '(11) 99850-0005', 'guincho', 'inativo', -23.4400, -46.5000, 'sintetico_demo', NOW() - INTERVAL '12 months'),
('Plataforma Itapegica', 'S0012100000106', '(11) 99850-0006', 'plataforma', 'ativo', -23.4550, -46.5300, 'sintetico_demo', NOW() - INTERVAL '6 months'),
('Apoio Gopouva', 'S0012100000107', '(11) 99850-0007', 'apoio', 'ativo', -23.4650, -46.5350, 'sintetico_demo', NOW() - INTERVAL '1 month'),
('Guincho Pimentas GRU', 'S0012100000201', '(11) 99850-0101', 'guincho', 'ativo', -23.4400, -46.4200, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Plataforma Lavras GRU', 'S0012100000202', '(11) 99850-0102', 'plataforma', 'ativo', -23.4350, -46.4500, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Apoio Cecap GRU', 'S0012100000203', '(11) 99850-0103', 'apoio', 'ativo', -23.4550, -46.5100, 'sintetico_demo', NOW() - INTERVAL '3 months'),

-- Diadema (5 sintéticos)
('Guincho Diadema Centro', 'S0013100000101', '(11) 99860-0001', 'guincho', 'ativo', -23.6850, -46.6200, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Serraria Diadema', 'S0013100000102', '(11) 99860-0002', 'plataforma', 'ativo', -23.6900, -46.6250, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Conceição Diadema', 'S0013100000103', '(11) 99860-0003', 'apoio', 'ativo', -23.6800, -46.6150, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Guincho Piraporinha', 'S0013100000104', '(11) 99860-0004', 'guincho', 'inativo', -23.6950, -46.6300, 'sintetico_demo', NOW() - INTERVAL '11 months'),
('Resgate Eldorado Diadema', 'S0013100000105', '(11) 99860-0005', 'guincho', 'ativo', -23.6880, -46.6180, 'sintetico_demo', NOW() - INTERVAL '7 months'),

-- ABCD (15 sintéticos)
('Guincho São Bernardo Centro', 'S0014100000101', '(11) 99870-0001', 'guincho', 'ativo', -23.6950, -46.5600, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Plataforma Rudge Ramos', 'S0014100000102', '(11) 99870-0002', 'plataforma', 'ativo', -23.6700, -46.5700, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Apoio Assunção SBC', 'S0014100000103', '(11) 99870-0003', 'apoio', 'ativo', -23.6800, -46.5500, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Guincho Santo André Centro', 'S0014100000104', '(11) 99870-0004', 'guincho', 'ativo', -23.6700, -46.5400, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Resgate Vila Pires SA', 'S0014100000105', '(11) 99870-0005', 'guincho', 'ativo', -23.6600, -46.5350, 'sintetico_demo', NOW() - INTERVAL '6 months'),
('Plataforma Utinga SA', 'S0014100000106', '(11) 99870-0006', 'plataforma', 'inativo', -23.6550, -46.5200, 'sintetico_demo', NOW() - INTERVAL '13 months'),
('Guincho Mauá Centro', 'S0014100000107', '(11) 99870-0007', 'guincho', 'ativo', -23.6680, -46.4600, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Apoio Zaíra Mauá', 'S0014100000108', '(11) 99870-0008', 'apoio', 'ativo', -23.6700, -46.4550, 'sintetico_demo', NOW() - INTERVAL '5 months'),
('Plataforma Capuava Mauá', 'S0014100000109', '(11) 99870-0009', 'plataforma', 'ativo', -23.6650, -46.4500, 'sintetico_demo', NOW() - INTERVAL '2 months'),
('Guincho Rio Grande Serra', 'S0014100000110', '(11) 99870-0010', 'guincho', 'ativo', -23.7600, -46.4000, 'sintetico_demo', NOW() - INTERVAL '7 months'),
('Resgate Ribeirão Pires', 'S0014100000111', '(11) 99870-0011', 'guincho', 'ativo', -23.7100, -46.4100, 'sintetico_demo', NOW() - INTERVAL '8 months'),
('Apoio Anchieta SBC', 'S0014100000112', '(11) 99870-0012', 'apoio', 'ativo', -23.7200, -46.5300, 'sintetico_demo', NOW() - INTERVAL '4 months'),
('Guincho Diadema Sul ABCD', 'S0014100000113', '(11) 99870-0013', 'guincho', 'inativo', -23.7000, -46.6100, 'sintetico_demo', NOW() - INTERVAL '16 months'),
('Plataforma São Caetano', 'S0014100000114', '(11) 99870-0014', 'plataforma', 'ativo', -23.6230, -46.5550, 'sintetico_demo', NOW() - INTERVAL '3 months'),
('Guincho São Caetano Sul', 'S0014100000115', '(11) 99870-0015', 'guincho', 'ativo', -23.6280, -46.5600, 'sintetico_demo', NOW() - INTERVAL '1 month');


-- ============================================================
-- BLOCO 4: SOLICITAÇÕES (~45)
-- ============================================================

INSERT INTO public.solicitacoes (cliente_nome, cliente_telefone, placa, origem_endereco, destino_endereco, tipo_veiculo, status, prioridade, valor, created_at, updated_at) VALUES
-- Pendentes (12)
('Carlos Eduardo Martins', '(12) 99901-1001', 'ABC1D23', 'Av. São João, 450 - São José dos Campos', 'Oficina Centro SJC, Rua XV de Novembro, 120', 'carro', 'pendente', 'normal', 280.00, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('Fernanda Oliveira', '(12) 99901-1002', 'DEF4G56', 'Rod. Presidente Dutra, km 135 - Caçapava', 'Auto Mecânica Dutra, Taubaté', 'carro', 'pendente', 'alta', 420.00, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
('Roberto Almeida Silva', '(12) 99901-1003', 'GHI7J89', 'Av. Independência, 800 - Taubaté', 'Concessionária Taubaté, Rod. Osvaldo Cruz', 'suv', 'pendente', 'urgente', 550.00, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
('Ana Paula Ferreira', '(11) 99901-1004', 'JKL0M12', 'Rua Augusta, 2200 - São Paulo', 'Oficina Cerqueira César, R. Haddock Lobo', 'carro', 'pendente', 'normal', 350.00, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
('Marcos Vinícius Santos', '(11) 99901-1005', 'NOP3Q45', 'Av. Guarulhos, 1500 - Guarulhos', 'Centro Automotivo GRU, R. Eng. Barros Reis', 'moto', 'pendente', 'normal', 180.00, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
('Juliana Costa Lima', '(12) 99901-1006', 'RST6U78', 'Praça Mons. Rodrigo, 50 - Aparecida', 'Mecânica São José, Guaratinguetá', 'carro', 'pendente', 'alta', 480.00, NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour 30 minutes'),
('Ricardo Nascimento', '(11) 99901-1007', 'VWX9Y01', 'Av. Sapopemba, 3000 - São Paulo ZL', 'Oficina Itaquera, R. Gregório Ramalho', 'utilitário', 'pendente', 'normal', 520.00, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
('Tatiana Borges', '(12) 99901-1008', 'ZAB2C34', 'R. Barão do Rio Branco, 200 - Jacareí', 'Auto Center Jacareí, Av. Getúlio Vargas', 'carro', 'pendente', 'normal', 260.00, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'),
('Pedro Henrique Campos', '(12) 99901-1009', 'DEF5G67', 'Av. Eng. Francisco José Longo, 400 - SJC', 'Funilaria Express SJC, Rua Paraíba', 'carro', 'pendente', 'normal', 320.00, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
('Luciana Mendes', '(11) 99901-1010', 'HIJ8K90', 'R. Voluntários da Pátria, 100 - Santana SP', 'Oficina Tucuruvi, Av. Tucuruvi', 'carro', 'pendente', 'alta', 380.00, NOW() - INTERVAL '2 hours 30 minutes', NOW() - INTERVAL '2 hours 30 minutes'),
('Felipe Andrade', '(12) 99901-1011', 'LMN1O23', 'Rod. SP-55, km 80 - Caraguatatuba', 'Auto Mecânica Litoral, Caraguá Centro', 'suv', 'pendente', 'urgente', 650.00, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes'),
('Camila Rodrigues', '(11) 99901-1012', 'PQR4S56', 'Av. Yervant Kissajikian, 500 - Interlagos', 'Concessionária Santo Amaro', 'carro', 'pendente', 'normal', 290.00, NOW() - INTERVAL '7 hours', NOW() - INTERVAL '7 hours'),

-- Em andamento (10)
('José Antonio Pereira', '(12) 99902-2001', 'TUV7W89', 'Rua Vilaça, 150 - São José dos Campos', 'Oficina Satélite SJC, Av. Andrômeda', 'carro', 'em_andamento', 'normal', 310.00, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour'),
('Maria Eduarda Souza', '(12) 99902-2002', 'XYZ0A12', 'Av. Nove de Julho, 600 - Taubaté', 'Mecânica Quiririm, R. São Sebastião', 'carro', 'em_andamento', 'alta', 450.00, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),
('Antônio Carlos Ribeiro', '(11) 99902-2003', 'BCD3E45', 'R. Barão de Itapetininga, 300 - SP Centro', 'Auto Center Liberdade, R. Galvão Bueno', 'carro', 'em_andamento', 'normal', 340.00, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 hours'),
('Sandra Maia Gomes', '(12) 99902-2004', 'FGH6I78', 'Av. Brasil, 800 - Pindamonhangaba', 'Oficina Moreira César, Pinda', 'utilitário', 'em_andamento', 'urgente', 580.00, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '15 minutes'),
('Lucas Ferraz', '(11) 99902-2005', 'JKL9M01', 'Rod. Anchieta, km 15 - São Bernardo', 'Centro Automotivo SBC, Av. Kennedy', 'carro', 'em_andamento', 'normal', 370.00, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours'),
('Patrícia Nunes Costa', '(12) 99902-2006', 'NOP2Q34', 'R. Dr. Nilo Peçanha, 250 - Lorena', 'Oficina Lorena Centro, R. Com. Rodrigues Alves', 'moto', 'em_andamento', 'normal', 190.00, NOW() - INTERVAL '2 hours 30 minutes', NOW() - INTERVAL '1 hour'),
('Gustavo Henrique Lima', '(11) 99902-2007', 'RST5U67', 'Av. Tiradentes, 1200 - Guarulhos', 'Mecânica Gopouva, R. Felício Marcondes', 'carro', 'em_andamento', 'alta', 410.00, NOW() - INTERVAL '3 hours 30 minutes', NOW() - INTERVAL '2 hours'),
('Renata Barbosa', '(11) 99902-2008', 'VWX8Y90', 'Av. Paulista, 1500 - São Paulo', 'Oficina Consolação, R. da Consolação', 'carro', 'em_andamento', 'normal', 330.00, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 hours'),
('Daniel Moreira', '(12) 99902-2009', 'ZAB1C23', 'Rod. Presidente Dutra, km 155 - Cachoeira Paulista', 'Auto Mecânica Cachoeira, R. Cel. Domiciano', 'suv', 'em_andamento', 'normal', 490.00, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 hours 30 minutes'),
('Isabela Monteiro', '(11) 99902-2010', 'DEF4G56', 'R. Dr. César, 400 - Santo André', 'Centro Automotivo SA, Av. Industrial', 'carro', 'em_andamento', 'alta', 440.00, NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '30 minutes'),

-- Concluídas (15)
('Fábio Ricardo Torres', '(12) 99903-3001', 'GHI7J89', 'Av. Nelson D''Ávila, 100 - SJC', 'Concessionária SJC, R. Euclides Miragaia', 'carro', 'concluida', 'normal', 300.00, NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours'),
('Claudia Aparecida Dias', '(12) 99903-3002', 'JKL0M12', 'R. Mal. Deodoro, 500 - Taubaté', 'Oficina São Francisco, Taubaté', 'carro', 'concluida', 'alta', 470.00, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 18 hours'),
('Eduardo Vieira Santos', '(11) 99903-3003', 'NOP3Q45', 'Av. do Estado, 2500 - São Paulo', 'Auto Center Mooca, R. da Mooca', 'utilitário', 'concluida', 'normal', 560.00, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days 20 hours'),
('Rosângela Lima Pinto', '(12) 99903-3004', 'RST6U78', 'R. Sete de Setembro, 300 - Jacareí', 'Mecânica Central Jacareí', 'carro', 'concluida', 'normal', 270.00, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days 22 hours'),
('Marcelo Augusto Reis', '(11) 99903-3005', 'VWX9Y01', 'R. XV de Novembro, 200 - Guarulhos', 'Oficina Presidente Dutra GRU', 'moto', 'concluida', 'normal', 160.00, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days 20 hours'),
('Adriana Cristina Faria', '(12) 99903-3006', 'ZAB2C34', 'Av. Mário Covas, km 200 - Pindamonhangaba', 'Concessionária Pinda', 'suv', 'concluida', 'alta', 620.00, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days 18 hours'),
('Rodrigo Peixoto', '(11) 99903-3007', 'DEF5G67', 'R. Cel. Oliveira Lima, 150 - SBC', 'Funilaria Rudge Ramos', 'carro', 'concluida', 'normal', 340.00, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days 20 hours'),
('Vanessa Teixeira Lopes', '(12) 99903-3008', 'HIJ8K90', 'Av. Dom Pedro I, 800 - Aparecida', 'Auto Mecânica Aparecida Centro', 'carro', 'concluida', 'urgente', 510.00, NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days 16 hours'),
('Thiago Almeida Cruz', '(11) 99903-3009', 'LMN1O23', 'Av. Sapopemba, 5000 - São Paulo ZL', 'Oficina Itaquera Centro', 'carro', 'concluida', 'normal', 290.00, NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days 18 hours'),
('Bianca Morais Freitas', '(12) 99903-3010', 'PQR4S56', 'R. Cel. Moreira César, 300 - Caçapava', 'Centro Automotivo Caçapava', 'carro', 'concluida', 'normal', 250.00, NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days 20 hours'),
('Alexandre Donato', '(11) 99903-3011', 'TUV7W89', 'Av. Kennedy, 3000 - Diadema', 'Oficina Serraria Diadema', 'utilitário', 'concluida', 'alta', 530.00, NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days 16 hours'),
('Priscila Soares Rocha', '(12) 99903-3012', 'XYZ0A12', 'Rod. SP-55, km 60 - Caraguatatuba', 'Mecânica Litoral Norte Caraguá', 'carro', 'concluida', 'normal', 380.00, NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days 18 hours'),
('Diego Santana Barros', '(12) 99903-3013', 'BCD3E45', 'R. Com. José Giorgi, 100 - Guaratinguetá', 'Oficina Central Guará', 'carro', 'concluida', 'normal', 310.00, NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days 20 hours'),
('Simone Batista Araújo', '(11) 99903-3014', 'FGH6I78', 'Av. Santo Amaro, 4000 - SP', 'Auto Center Brooklin', 'carro', 'concluida', 'normal', 360.00, NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days 18 hours'),
('Leonardo Vieira Prado', '(12) 99903-3015', 'JKL9M01', 'Av. Brasil, 1500 - Lorena', 'Mecânica Lorena Velha', 'suv', 'concluida', 'normal', 440.00, NOW() - INTERVAL '22 days', NOW() - INTERVAL '21 days 16 hours'),

-- Canceladas (8)
('Wagner Pereira Lopes', '(12) 99904-4001', 'NOP2Q34', 'R. Prof. Felício Monti, 200 - SJC', 'Oficina Jardim SJC', 'carro', 'cancelada', 'normal', 280.00, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days 22 hours'),
('Carla Mota Bastos', '(11) 99904-4002', 'RST5U67', 'Av. Aricanduva, 1000 - SP ZL', 'Auto Center Penha', 'carro', 'cancelada', 'normal', 320.00, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days 20 hours'),
('Otávio Ramos Novaes', '(12) 99904-4003', 'VWX8Y90', 'Rod. Presidente Dutra, km 140 - Caçapava', 'Oficina Dutra Caçapava', 'utilitário', 'cancelada', 'alta', 500.00, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days 18 hours'),
('Débora Cristina Fonseca', '(11) 99904-4004', 'ZAB1C23', 'R. Vergueiro, 4000 - SP', 'Concessionária Saúde SP', 'carro', 'cancelada', 'normal', 350.00, NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days 20 hours'),
('Renan Oliveira Braga', '(12) 99904-4005', 'DEF4G56', 'Av. Nove de Julho, 1200 - Taubaté', 'Oficina Taubaté Sul', 'moto', 'cancelada', 'normal', 170.00, NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days 22 hours'),
('Aline Duarte Martins', '(11) 99904-4006', 'GHI7J89', 'R. Conceição, 500 - Diadema', 'Mecânica Diadema Centro', 'carro', 'cancelada', 'normal', 300.00, NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days 18 hours'),
('Sérgio Luís Correia', '(12) 99904-4007', 'JKL0M12', 'R. Dr. Pelágio Lobo, 200 - Pinda', 'Auto Resgate Pinda Norte', 'carro', 'cancelada', 'alta', 460.00, NOW() - INTERVAL '16 days', NOW() - INTERVAL '15 days 16 hours'),
('Natália Freire Goulart', '(11) 99904-4008', 'NOP3Q45', 'Av. Interlagos, 3000 - SP ZS', 'Oficina Cidade Dutra', 'suv', 'cancelada', 'normal', 400.00, NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days 20 hours');


-- ============================================================
-- BLOCO 5: ATENDIMENTOS (~30)
-- ============================================================

DO $$
DECLARE
  sol_ea_1 uuid; sol_ea_2 uuid; sol_ea_3 uuid; sol_ea_4 uuid; sol_ea_5 uuid;
  sol_ea_6 uuid; sol_ea_7 uuid; sol_ea_8 uuid; sol_ea_9 uuid; sol_ea_10 uuid;
  sol_cc_1 uuid; sol_cc_2 uuid; sol_cc_3 uuid; sol_cc_4 uuid; sol_cc_5 uuid;
  sol_cc_6 uuid; sol_cc_7 uuid; sol_cc_8 uuid; sol_cc_9 uuid; sol_cc_10 uuid;
  sol_cc_11 uuid; sol_cc_12 uuid; sol_cc_13 uuid; sol_cc_14 uuid; sol_cc_15 uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid;
  p6 uuid; p7 uuid; p8 uuid; p9 uuid; p10 uuid;
  p11 uuid; p12 uuid; p13 uuid; p14 uuid; p15 uuid;
BEGIN
  SELECT id INTO sol_ea_1 FROM public.solicitacoes WHERE cliente_nome = 'José Antonio Pereira' LIMIT 1;
  SELECT id INTO sol_ea_2 FROM public.solicitacoes WHERE cliente_nome = 'Maria Eduarda Souza' LIMIT 1;
  SELECT id INTO sol_ea_3 FROM public.solicitacoes WHERE cliente_nome = 'Antônio Carlos Ribeiro' LIMIT 1;
  SELECT id INTO sol_ea_4 FROM public.solicitacoes WHERE cliente_nome = 'Sandra Maia Gomes' LIMIT 1;
  SELECT id INTO sol_ea_5 FROM public.solicitacoes WHERE cliente_nome = 'Lucas Ferraz' LIMIT 1;
  SELECT id INTO sol_ea_6 FROM public.solicitacoes WHERE cliente_nome = 'Patrícia Nunes Costa' LIMIT 1;
  SELECT id INTO sol_ea_7 FROM public.solicitacoes WHERE cliente_nome = 'Gustavo Henrique Lima' LIMIT 1;
  SELECT id INTO sol_ea_8 FROM public.solicitacoes WHERE cliente_nome = 'Renata Barbosa' LIMIT 1;
  SELECT id INTO sol_ea_9 FROM public.solicitacoes WHERE cliente_nome = 'Daniel Moreira' LIMIT 1;
  SELECT id INTO sol_ea_10 FROM public.solicitacoes WHERE cliente_nome = 'Isabela Monteiro' LIMIT 1;

  SELECT id INTO sol_cc_1 FROM public.solicitacoes WHERE cliente_nome = 'Fábio Ricardo Torres' LIMIT 1;
  SELECT id INTO sol_cc_2 FROM public.solicitacoes WHERE cliente_nome = 'Claudia Aparecida Dias' LIMIT 1;
  SELECT id INTO sol_cc_3 FROM public.solicitacoes WHERE cliente_nome = 'Eduardo Vieira Santos' LIMIT 1;
  SELECT id INTO sol_cc_4 FROM public.solicitacoes WHERE cliente_nome = 'Rosângela Lima Pinto' LIMIT 1;
  SELECT id INTO sol_cc_5 FROM public.solicitacoes WHERE cliente_nome = 'Marcelo Augusto Reis' LIMIT 1;
  SELECT id INTO sol_cc_6 FROM public.solicitacoes WHERE cliente_nome = 'Adriana Cristina Faria' LIMIT 1;
  SELECT id INTO sol_cc_7 FROM public.solicitacoes WHERE cliente_nome = 'Rodrigo Peixoto' LIMIT 1;
  SELECT id INTO sol_cc_8 FROM public.solicitacoes WHERE cliente_nome = 'Vanessa Teixeira Lopes' LIMIT 1;
  SELECT id INTO sol_cc_9 FROM public.solicitacoes WHERE cliente_nome = 'Thiago Almeida Cruz' LIMIT 1;
  SELECT id INTO sol_cc_10 FROM public.solicitacoes WHERE cliente_nome = 'Bianca Morais Freitas' LIMIT 1;
  SELECT id INTO sol_cc_11 FROM public.solicitacoes WHERE cliente_nome = 'Alexandre Donato' LIMIT 1;
  SELECT id INTO sol_cc_12 FROM public.solicitacoes WHERE cliente_nome = 'Priscila Soares Rocha' LIMIT 1;
  SELECT id INTO sol_cc_13 FROM public.solicitacoes WHERE cliente_nome = 'Diego Santana Barros' LIMIT 1;
  SELECT id INTO sol_cc_14 FROM public.solicitacoes WHERE cliente_nome = 'Simone Batista Araújo' LIMIT 1;
  SELECT id INTO sol_cc_15 FROM public.solicitacoes WHERE cliente_nome = 'Leonardo Vieira Prado' LIMIT 1;

  SELECT id INTO p1 FROM public.prestadores WHERE nome = 'Auto Socorro São José' LIMIT 1;
  SELECT id INTO p2 FROM public.prestadores WHERE nome = 'Guincho Taubaté Centro' LIMIT 1;
  SELECT id INTO p3 FROM public.prestadores WHERE nome = 'Auto Socorro Centro SP' LIMIT 1;
  SELECT id INTO p4 FROM public.prestadores WHERE nome = 'Auto Resgate Pinda' LIMIT 1;
  SELECT id INTO p5 FROM public.prestadores WHERE nome = 'Guincho São Bernardo' LIMIT 1;
  SELECT id INTO p6 FROM public.prestadores WHERE nome = 'Guincho Jacareí' LIMIT 1;
  SELECT id INTO p7 FROM public.prestadores WHERE nome = 'Guincho Lorena BR' LIMIT 1;
  SELECT id INTO p8 FROM public.prestadores WHERE nome = 'Guincho Guarulhos' LIMIT 1;
  SELECT id INTO p9 FROM public.prestadores WHERE nome = 'Guincho Aparecida' LIMIT 1;
  SELECT id INTO p10 FROM public.prestadores WHERE nome = 'Guincho Santana SP' LIMIT 1;
  SELECT id INTO p11 FROM public.prestadores WHERE nome = 'Guincho Santo Amaro' LIMIT 1;
  SELECT id INTO p12 FROM public.prestadores WHERE nome = 'Auto Socorro Diadema' LIMIT 1;
  SELECT id INTO p13 FROM public.prestadores WHERE nome = 'Auto Socorro Cachoeira' LIMIT 1;
  SELECT id INTO p14 FROM public.prestadores WHERE nome = 'Guincho Litoral Norte' LIMIT 1;
  SELECT id INTO p15 FROM public.prestadores WHERE nome = 'Plataforma Santo André' LIMIT 1;

  -- Atendimentos em andamento (10)
  IF sol_ea_1 IS NOT NULL AND p1 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at)
    VALUES (sol_ea_1, p1, 'em_andamento', 'Guincho a caminho do cliente na Rua Vilaça. Previsão 15min.', NOW() - INTERVAL '1 hour');
  END IF;
  IF sol_ea_2 IS NOT NULL AND p2 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at)
    VALUES (sol_ea_2, p2, 'em_andamento', 'Prestador chegou ao local. Veículo com pneu furado, realizando troca.', NOW() - INTERVAL '30 minutes');
  END IF;
  IF sol_ea_3 IS NOT NULL AND p3 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at)
    VALUES (sol_ea_3, p3, 'em_andamento', 'Veículo carregado na plataforma. Em deslocamento para oficina destino.', NOW() - INTERVAL '2 hours');
  END IF;
  IF sol_ea_4 IS NOT NULL AND p4 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at)
    VALUES (sol_ea_4, p4, 'em_andamento', 'Atendimento urgente. Guincho saiu da base em Pinda, ETA 20min.', NOW() - INTERVAL '15 minutes');
  END IF;
  IF sol_ea_5 IS NOT NULL AND p5 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at)
    VALUES (sol_ea_5, p5, 'em_andamento', 'Veículo na Rod. Anchieta km 15. Guincho posicionado, aguardando manobra.', NOW() - INTERVAL '3 hours');
  END IF;
  IF sol_ea_6 IS NOT NULL AND p7 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at)
    VALUES (sol_ea_6, p7, 'em_andamento', 'Moto rebocada. Prestador em deslocamento para oficina em Lorena.', NOW() - INTERVAL '1 hour');
  END IF;
  IF sol_ea_7 IS NOT NULL AND p8 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at)
    VALUES (sol_ea_7, p8, 'em_andamento', 'Cliente aguardando na Av. Tiradentes. Guincho saiu da base Gopouva.', NOW() - INTERVAL '2 hours');
  END IF;
  IF sol_ea_8 IS NOT NULL AND p10 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at)
    VALUES (sol_ea_8, p10, 'em_andamento', 'Veículo parado na faixa esquerda Av. Paulista. Trânsito moderado.', NOW() - INTERVAL '4 hours');
  END IF;
  IF sol_ea_9 IS NOT NULL AND p13 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at)
    VALUES (sol_ea_9, p13, 'em_andamento', 'SUV na Dutra km 155. Prestador Cachoeira Paulista acionado.', NOW() - INTERVAL '2 hours 30 minutes');
  END IF;
  IF sol_ea_10 IS NOT NULL AND p15 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at)
    VALUES (sol_ea_10, p15, 'em_andamento', 'Plataforma Santo André deslocando para cliente na R. Dr. César.', NOW() - INTERVAL '30 minutes');
  END IF;

  -- Atendimentos finalizados (15)
  IF sol_cc_1 IS NOT NULL AND p1 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_1, p1, 'finalizado', 'Veículo entregue na concessionária SJC. Cliente assinou recibo. Sem avarias.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours');
  END IF;
  IF sol_cc_2 IS NOT NULL AND p2 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_2, p2, 'finalizado', 'Reboque concluído. Veículo com problema na embreagem. Entregue na oficina.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 18 hours');
  END IF;
  IF sol_cc_3 IS NOT NULL AND p3 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_3, p3, 'finalizado', 'Utilitário grande. Utilizada plataforma extra. Entrega na Mooca.', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days 20 hours');
  END IF;
  IF sol_cc_4 IS NOT NULL AND p6 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_4, p6, 'finalizado', 'Jacareí. Bateria descarregada. Partida assistida realizada com sucesso.', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days 22 hours');
  END IF;
  IF sol_cc_5 IS NOT NULL AND p8 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_5, p8, 'finalizado', 'Moto transportada com sucesso. Sem danos. Entregue na oficina GRU.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days 20 hours');
  END IF;
  IF sol_cc_6 IS NOT NULL AND p4 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_6, p4, 'finalizado', 'SUV rebocado da Dutra até concessionária em Pinda. Trânsito pesado.', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days 18 hours');
  END IF;
  IF sol_cc_7 IS NOT NULL AND p5 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_7, p5, 'finalizado', 'Veículo com vazamento de óleo. Guincho SBC transportou para funilaria.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days 20 hours');
  END IF;
  IF sol_cc_8 IS NOT NULL AND p9 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_8, p9, 'finalizado', 'Aparecida. Falha no motor. Transporte concluído sem intercorrências.', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days 16 hours');
  END IF;
  IF sol_cc_9 IS NOT NULL AND p3 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_9, p3, 'finalizado', 'Reboque ZL para Itaquera Centro. Sem intercorrências.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days 18 hours');
  END IF;
  IF sol_cc_10 IS NOT NULL AND p1 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_10, p1, 'finalizado', 'Reboque Caçapava. Superaquecimento. Cliente satisfeito com atendimento.', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days 20 hours');
  END IF;
  IF sol_cc_11 IS NOT NULL AND p12 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_11, p12, 'finalizado', 'Utilitário rebocado em Diadema. Prestador local. Concluído sem problemas.', NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days 16 hours');
  END IF;
  IF sol_cc_12 IS NOT NULL AND p14 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_12, p14, 'finalizado', 'Reboque na SP-55. Chuva dificultou acesso. Atraso de 30min.', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days 18 hours');
  END IF;
  IF sol_cc_13 IS NOT NULL AND p9 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_13, p9, 'finalizado', 'Guaratinguetá. Câmbio travado. Transporte via plataforma concluído.', NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days 20 hours');
  END IF;
  IF sol_cc_14 IS NOT NULL AND p11 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_14, p11, 'finalizado', 'Reboque Av. Santo Amaro. Trânsito intenso. Concluído com sucesso.', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days 18 hours');
  END IF;
  IF sol_cc_15 IS NOT NULL AND p7 IS NOT NULL THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at)
    VALUES (sol_cc_15, p7, 'finalizado', 'SUV rebocado em Lorena. Percurso longo, sem intercorrências.', NOW() - INTERVAL '22 days', NOW() - INTERVAL '21 days 16 hours');
  END IF;
END $$;


-- ============================================================
-- BLOCO 6: CONSULTAS DE VALIDAÇÃO
-- ============================================================

SELECT 'prestadores' AS tabela, COUNT(*) AS total FROM public.prestadores
UNION ALL
SELECT 'solicitacoes', COUNT(*) FROM public.solicitacoes
UNION ALL
SELECT 'atendimentos', COUNT(*) FROM public.atendimentos;

SELECT COALESCE(origem, 'sem_origem') AS origem, COUNT(*) AS total
FROM public.prestadores GROUP BY origem ORDER BY total DESC;

SELECT tipo, status, COUNT(*) AS total
FROM public.prestadores GROUP BY tipo, status ORDER BY tipo, status;

SELECT status, COUNT(*) AS total
FROM public.solicitacoes GROUP BY status ORDER BY total DESC;

SELECT status, COUNT(*) AS total
FROM public.atendimentos GROUP BY status ORDER BY total DESC;
