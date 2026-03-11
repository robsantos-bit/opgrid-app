-- ============================================================
-- SEED DATA - OpGrid - Dados de demonstração
-- Executar no Supabase SQL Editor
-- NÃO recria tabelas, apenas insere dados adicionais
-- ============================================================

-- ============================================================
-- 1. PRESTADORES (~350 registros)
-- Regiões: Vale do Paraíba, Litoral Norte, Grande SP
-- ============================================================

INSERT INTO public.prestadores (nome, cnpj, telefone, tipo, status, latitude, longitude, created_at) VALUES
-- São José dos Campos
('Auto Socorro Vale do Paraíba', '12.345.678/0001-01', '(12) 3921-0001', 'guincho', 'ativo', -23.1896, -45.8841, NOW() - interval '180 days'),
('Guincho Rápido SJC', '12.345.678/0001-02', '(12) 3921-0002', 'guincho', 'ativo', -23.2000, -45.8900, NOW() - interval '175 days'),
('Plataforma Express Campos', '12.345.678/0001-03', '(12) 3921-0003', 'plataforma', 'ativo', -23.1750, -45.8700, NOW() - interval '170 days'),
('SJC Assistência 24h', '12.345.678/0001-04', '(12) 3921-0004', 'guincho', 'ativo', -23.2100, -45.9000, NOW() - interval '168 days'),
('Reboque Dutra SJC', '12.345.678/0001-05', '(12) 3921-0005', 'plataforma', 'ativo', -23.1850, -45.8650, NOW() - interval '165 days'),
('Auto Resgate Aquarius', '12.345.678/0001-06', '(12) 3921-0006', 'guincho', 'inativo', -23.1950, -45.8800, NOW() - interval '160 days'),
('Guincho Urbanova', '12.345.678/0001-07', '(12) 3921-0007', 'apoio', 'ativo', -23.2200, -45.9100, NOW() - interval '155 days'),
('Plataforma Orion SJC', '12.345.678/0001-08', '(12) 3921-0008', 'plataforma', 'ativo', -23.1800, -45.8550, NOW() - interval '150 days'),
('Socorro Mecânico Jd Satélite', '12.345.678/0001-09', '(12) 3921-0009', 'apoio', 'ativo', -23.2050, -45.8950, NOW() - interval '148 days'),
('Guincho 116 SJC', '12.345.678/0001-10', '(12) 3921-0010', 'guincho', 'ativo', -23.1700, -45.8500, NOW() - interval '145 days'),
('Auto Socorro Palmeiras', '12.345.678/0001-11', '(12) 3921-0011', 'guincho', 'ativo', -23.2150, -45.9050, NOW() - interval '140 days'),
('Reboque Floribella', '12.345.678/0001-12', '(12) 3921-0012', 'plataforma', 'inativo', -23.1900, -45.8750, NOW() - interval '138 days'),
('Guincho Putim', '12.345.678/0001-13', '(12) 3921-0013', 'guincho', 'ativo', -23.2300, -45.9200, NOW() - interval '135 days'),
('SJC Plataforma Sul', '12.345.678/0001-14', '(12) 3921-0014', 'plataforma', 'ativo', -23.2250, -45.8850, NOW() - interval '130 days'),
('Assistência Eugênio de Melo', '12.345.678/0001-15', '(12) 3921-0015', 'apoio', 'ativo', -23.1650, -45.8400, NOW() - interval '128 days'),
('Guincho Limoeiro SJC', '12.345.678/0001-16', '(12) 3921-0016', 'guincho', 'ativo', -23.2080, -45.8980, NOW() - interval '125 days'),
('Plataforma Bosque dos Eucaliptos', '12.345.678/0001-17', '(12) 3921-0017', 'plataforma', 'ativo', -23.2350, -45.9150, NOW() - interval '120 days'),
('Reboque Rodoviário SJC', '12.345.678/0001-18', '(12) 3921-0018', 'guincho', 'inativo', -23.1780, -45.8620, NOW() - interval '118 days'),
('Auto Socorro Industrial', '12.345.678/0001-19', '(12) 3921-0019', 'apoio', 'ativo', -23.1920, -45.8780, NOW() - interval '115 days'),
('Guincho Vista Verde', '12.345.678/0001-20', '(12) 3921-0020', 'guincho', 'ativo', -23.2180, -45.9080, NOW() - interval '110 days'),

-- Taubaté
('Guincho Taubaté Centro', '23.456.789/0001-01', '(12) 3632-0001', 'guincho', 'ativo', -23.0204, -45.5558, NOW() - interval '175 days'),
('Plataforma Quiririm', '23.456.789/0001-02', '(12) 3632-0002', 'plataforma', 'ativo', -23.0000, -45.5800, NOW() - interval '170 days'),
('Auto Socorro Tremembé', '23.456.789/0001-03', '(12) 3632-0003', 'guincho', 'ativo', -22.9600, -45.5500, NOW() - interval '165 days'),
('Reboque Dutra Taubaté', '23.456.789/0001-04', '(12) 3632-0004', 'plataforma', 'inativo', -23.0150, -45.5600, NOW() - interval '160 days'),
('Guincho Independência', '23.456.789/0001-05', '(12) 3632-0005', 'guincho', 'ativo', -23.0250, -45.5700, NOW() - interval '155 days'),
('Taubaté Assistência Veicular', '23.456.789/0001-06', '(12) 3632-0006', 'apoio', 'ativo', -23.0100, -45.5450, NOW() - interval '150 days'),
('Plataforma Estiva', '23.456.789/0001-07', '(12) 3632-0007', 'plataforma', 'ativo', -23.0300, -45.5650, NOW() - interval '148 days'),
('Guincho Barranco', '23.456.789/0001-08', '(12) 3632-0008', 'guincho', 'ativo', -23.0350, -45.5750, NOW() - interval '145 days'),
('Auto Resgate Taubaté', '23.456.789/0001-09', '(12) 3632-0009', 'guincho', 'inativo', -23.0050, -45.5350, NOW() - interval '140 days'),
('Socorro 24h Taubaté', '23.456.789/0001-10', '(12) 3632-0010', 'apoio', 'ativo', -23.0180, -45.5520, NOW() - interval '138 days'),
('Guincho Belém Taubaté', '23.456.789/0001-11', '(12) 3632-0011', 'guincho', 'ativo', -23.0220, -45.5580, NOW() - interval '135 days'),
('Plataforma Areão', '23.456.789/0001-12', '(12) 3632-0012', 'plataforma', 'ativo', -23.0280, -45.5680, NOW() - interval '130 days'),
('Reboque São Gonçalo', '23.456.789/0001-13', '(12) 3632-0013', 'guincho', 'ativo', -23.0080, -45.5420, NOW() - interval '125 days'),
('Auto Socorro Campos Elíseos', '23.456.789/0001-14', '(12) 3632-0014', 'apoio', 'ativo', -23.0320, -45.5720, NOW() - interval '120 days'),
('Guincho Vila das Graças', '23.456.789/0001-15', '(12) 3632-0015', 'guincho', 'ativo', -23.0130, -45.5480, NOW() - interval '115 days'),

-- Jacareí
('Guincho Jacareí', '34.567.890/0001-01', '(12) 3951-0001', 'guincho', 'ativo', -23.3025, -45.9660, NOW() - interval '172 days'),
('Plataforma Centro Jacareí', '34.567.890/0001-02', '(12) 3951-0002', 'plataforma', 'ativo', -23.3100, -45.9700, NOW() - interval '168 days'),
('Auto Socorro Parque Meia Lua', '34.567.890/0001-03', '(12) 3951-0003', 'guincho', 'ativo', -23.2950, -45.9600, NOW() - interval '163 days'),
('Reboque Jardim Califórnia', '34.567.890/0001-04', '(12) 3951-0004', 'plataforma', 'inativo', -23.3050, -45.9750, NOW() - interval '158 days'),
('Guincho Bandeirantes Jacareí', '34.567.890/0001-05', '(12) 3951-0005', 'guincho', 'ativo', -23.2900, -45.9550, NOW() - interval '155 days'),
('Assistência Veicular Jacareí', '34.567.890/0001-06', '(12) 3951-0006', 'apoio', 'ativo', -23.3150, -45.9800, NOW() - interval '150 days'),
('Plataforma Rio Comprido', '34.567.890/0001-07', '(12) 3951-0007', 'plataforma', 'ativo', -23.3000, -45.9680, NOW() - interval '145 days'),
('Guincho Veraneio', '34.567.890/0001-08', '(12) 3951-0008', 'guincho', 'ativo', -23.2980, -45.9620, NOW() - interval '140 days'),
('Auto Socorro São João Jacareí', '34.567.890/0001-09', '(12) 3951-0009', 'guincho', 'ativo', -23.3080, -45.9730, NOW() - interval '135 days'),
('Reboque Vila Industrial Jacareí', '34.567.890/0001-10', '(12) 3951-0010', 'plataforma', 'inativo', -23.3120, -45.9770, NOW() - interval '130 days'),
('Guincho São Silvestre', '34.567.890/0001-11', '(12) 3951-0011', 'guincho', 'ativo', -23.2870, -45.9500, NOW() - interval '125 days'),
('Plataforma Cidade Salvador', '34.567.890/0001-12', '(12) 3951-0012', 'plataforma', 'ativo', -23.3180, -45.9830, NOW() - interval '120 days'),

-- Caçapava
('Guincho Caçapava', '45.678.901/0001-01', '(12) 3653-0001', 'guincho', 'ativo', -23.1006, -45.7076, NOW() - interval '170 days'),
('Plataforma Caçapava Centro', '45.678.901/0001-02', '(12) 3653-0002', 'plataforma', 'ativo', -23.1050, -45.7100, NOW() - interval '165 days'),
('Auto Socorro BR-116 Caçapava', '45.678.901/0001-03', '(12) 3653-0003', 'guincho', 'ativo', -23.0950, -45.7000, NOW() - interval '160 days'),
('Reboque Caçapava Velha', '45.678.901/0001-04', '(12) 3653-0004', 'plataforma', 'inativo', -23.1100, -45.7150, NOW() - interval '155 days'),
('Guincho Bom Sucesso', '45.678.901/0001-05', '(12) 3653-0005', 'guincho', 'ativo', -23.0980, -45.7030, NOW() - interval '150 days'),
('Assistência Rodoviária Caçapava', '45.678.901/0001-06', '(12) 3653-0006', 'apoio', 'ativo', -23.1080, -45.7120, NOW() - interval '145 days'),
('Plataforma Jardim Imperial', '45.678.901/0001-07', '(12) 3653-0007', 'plataforma', 'ativo', -23.1030, -45.7080, NOW() - interval '140 days'),
('Guincho Monte Castelo Caçapava', '45.678.901/0001-08', '(12) 3653-0008', 'guincho', 'ativo', -23.0920, -45.6950, NOW() - interval '135 days'),

-- Pindamonhangaba
('Guincho Pinda', '56.789.012/0001-01', '(12) 3642-0001', 'guincho', 'ativo', -22.9235, -45.4616, NOW() - interval '168 days'),
('Plataforma Moreira César', '56.789.012/0001-02', '(12) 3642-0002', 'plataforma', 'ativo', -22.9300, -45.4700, NOW() - interval '163 days'),
('Auto Socorro Pinda Centro', '56.789.012/0001-03', '(12) 3642-0003', 'guincho', 'ativo', -22.9200, -45.4550, NOW() - interval '158 days'),
('Reboque Araretama', '56.789.012/0001-04', '(12) 3642-0004', 'plataforma', 'ativo', -22.9350, -45.4750, NOW() - interval '153 days'),
('Guincho Mombaça', '56.789.012/0001-05', '(12) 3642-0005', 'guincho', 'inativo', -22.9150, -45.4500, NOW() - interval '148 days'),
('Assistência Rodoviária Pinda', '56.789.012/0001-06', '(12) 3642-0006', 'apoio', 'ativo', -22.9280, -45.4650, NOW() - interval '143 days'),
('Plataforma Pinda Norte', '56.789.012/0001-07', '(12) 3642-0007', 'plataforma', 'ativo', -22.9100, -45.4450, NOW() - interval '138 days'),
('Guincho Santa Clara Pinda', '56.789.012/0001-08', '(12) 3642-0008', 'guincho', 'ativo', -22.9380, -45.4780, NOW() - interval '133 days'),
('Reboque Vila Rica Pinda', '56.789.012/0001-09', '(12) 3642-0009', 'guincho', 'ativo', -22.9250, -45.4580, NOW() - interval '128 days'),
('Auto Socorro Crispim', '56.789.012/0001-10', '(12) 3642-0010', 'apoio', 'ativo', -22.9320, -45.4720, NOW() - interval '123 days'),

-- Aparecida
('Guincho Aparecida', '67.890.123/0001-01', '(12) 3104-0001', 'guincho', 'ativo', -22.8449, -45.2297, NOW() - interval '166 days'),
('Plataforma Basílica', '67.890.123/0001-02', '(12) 3104-0002', 'plataforma', 'ativo', -22.8500, -45.2350, NOW() - interval '161 days'),
('Auto Socorro Ponte Alta', '67.890.123/0001-03', '(12) 3104-0003', 'guincho', 'ativo', -22.8400, -45.2250, NOW() - interval '156 days'),
('Reboque Aparecida do Norte', '67.890.123/0001-04', '(12) 3104-0004', 'plataforma', 'inativo', -22.8550, -45.2400, NOW() - interval '151 days'),
('Guincho Romeiros', '67.890.123/0001-05', '(12) 3104-0005', 'guincho', 'ativo', -22.8380, -45.2200, NOW() - interval '146 days'),
('Assistência Dutra Aparecida', '67.890.123/0001-06', '(12) 3104-0006', 'apoio', 'ativo', -22.8480, -45.2320, NOW() - interval '141 days'),
('Plataforma São Benedito', '67.890.123/0001-07', '(12) 3104-0007', 'plataforma', 'ativo', -22.8420, -45.2270, NOW() - interval '136 days'),
('Guincho Rosário Aparecida', '67.890.123/0001-08', '(12) 3104-0008', 'guincho', 'ativo', -22.8520, -45.2380, NOW() - interval '131 days'),

-- Guaratinguetá
('Guincho Guará Centro', '78.901.234/0001-01', '(12) 3132-0001', 'guincho', 'ativo', -22.8116, -45.1922, NOW() - interval '164 days'),
('Plataforma Pedregulho', '78.901.234/0001-02', '(12) 3132-0002', 'plataforma', 'ativo', -22.8150, -45.1950, NOW() - interval '159 days'),
('Auto Socorro Vila Paraíso Guará', '78.901.234/0001-03', '(12) 3132-0003', 'guincho', 'ativo', -22.8080, -45.1880, NOW() - interval '154 days'),
('Reboque Engenheiro Neiva', '78.901.234/0001-04', '(12) 3132-0004', 'plataforma', 'ativo', -22.8200, -45.2000, NOW() - interval '149 days'),
('Guincho Lorena Road', '78.901.234/0001-05', '(12) 3132-0005', 'guincho', 'inativo', -22.8050, -45.1850, NOW() - interval '144 days'),
('Assistência Veicular Guará', '78.901.234/0001-06', '(12) 3132-0006', 'apoio', 'ativo', -22.8180, -45.1980, NOW() - interval '139 days'),
('Plataforma Santa Luzia Guará', '78.901.234/0001-07', '(12) 3132-0007', 'plataforma', 'ativo', -22.8100, -45.1900, NOW() - interval '134 days'),
('Guincho Dutra Guará', '78.901.234/0001-08', '(12) 3132-0008', 'guincho', 'ativo', -22.8230, -45.2030, NOW() - interval '129 days'),
('Reboque Roseira', '78.901.234/0001-09', '(12) 3132-0009', 'guincho', 'ativo', -22.8000, -45.1800, NOW() - interval '124 days'),
('Auto Socorro Centro Histórico Guará', '78.901.234/0001-10', '(12) 3132-0010', 'apoio', 'ativo', -22.8160, -45.1960, NOW() - interval '119 days'),

-- Cachoeira Paulista
('Guincho Cachoeira Paulista', '89.012.345/0001-01', '(12) 3101-0001', 'guincho', 'ativo', -22.6636, -45.0092, NOW() - interval '162 days'),
('Plataforma Cachoeira Centro', '89.012.345/0001-02', '(12) 3101-0002', 'plataforma', 'ativo', -22.6680, -45.0130, NOW() - interval '157 days'),
('Auto Socorro Dutra Cachoeira', '89.012.345/0001-03', '(12) 3101-0003', 'guincho', 'ativo', -22.6600, -45.0050, NOW() - interval '152 days'),
('Reboque Vila São Pedro', '89.012.345/0001-04', '(12) 3101-0004', 'plataforma', 'inativo', -22.6720, -45.0170, NOW() - interval '147 days'),
('Guincho Comunidade Canção Nova', '89.012.345/0001-05', '(12) 3101-0005', 'guincho', 'ativo', -22.6550, -45.0000, NOW() - interval '142 days'),
('Assistência Rodoviária Cachoeira', '89.012.345/0001-06', '(12) 3101-0006', 'apoio', 'ativo', -22.6660, -45.0110, NOW() - interval '137 days'),

-- Lorena
('Guincho Lorena', '90.123.456/0001-01', '(12) 3152-0001', 'guincho', 'ativo', -22.7300, -45.1200, NOW() - interval '160 days'),
('Plataforma Lorena Centro', '90.123.456/0001-02', '(12) 3152-0002', 'plataforma', 'ativo', -22.7350, -45.1250, NOW() - interval '155 days'),
('Auto Socorro Vila Hepacaré', '90.123.456/0001-03', '(12) 3152-0003', 'guincho', 'ativo', -22.7250, -45.1150, NOW() - interval '150 days'),
('Reboque São Vicente Lorena', '90.123.456/0001-04', '(12) 3152-0004', 'plataforma', 'ativo', -22.7400, -45.1300, NOW() - interval '145 days'),
('Guincho Cabelinha Lorena', '90.123.456/0001-05', '(12) 3152-0005', 'guincho', 'inativo', -22.7200, -45.1100, NOW() - interval '140 days'),
('Assistência 24h Lorena', '90.123.456/0001-06', '(12) 3152-0006', 'apoio', 'ativo', -22.7320, -45.1220, NOW() - interval '135 days'),

-- Caraguatatuba
('Guincho Caraguá', '11.234.567/0001-01', '(12) 3882-0001', 'guincho', 'ativo', -23.6200, -45.4131, NOW() - interval '170 days'),
('Plataforma Litoral Norte', '11.234.567/0001-02', '(12) 3882-0002', 'plataforma', 'ativo', -23.6250, -45.4180, NOW() - interval '165 days'),
('Auto Socorro Martim de Sá', '11.234.567/0001-03', '(12) 3882-0003', 'guincho', 'ativo', -23.6300, -45.4230, NOW() - interval '160 days'),
('Reboque Massaguaçu', '11.234.567/0001-04', '(12) 3882-0004', 'plataforma', 'ativo', -23.6100, -45.4050, NOW() - interval '155 days'),
('Guincho Praia da Tabatinga', '11.234.567/0001-05', '(12) 3882-0005', 'guincho', 'inativo', -23.5950, -45.3900, NOW() - interval '150 days'),
('Assistência Rio-Santos', '11.234.567/0001-06', '(12) 3882-0006', 'apoio', 'ativo', -23.6150, -45.4100, NOW() - interval '145 days'),
('Plataforma Porto Novo', '11.234.567/0001-07', '(12) 3882-0007', 'plataforma', 'ativo', -23.6350, -45.4280, NOW() - interval '140 days'),
('Guincho Sumaré Caraguá', '11.234.567/0001-08', '(12) 3882-0008', 'guincho', 'ativo', -23.6180, -45.4120, NOW() - interval '135 days'),
('Reboque Indaiá', '11.234.567/0001-09', '(12) 3882-0009', 'guincho', 'ativo', -23.6280, -45.4200, NOW() - interval '130 days'),
('Auto Socorro Prainha Caraguá', '11.234.567/0001-10', '(12) 3882-0010', 'apoio', 'ativo', -23.6050, -45.3980, NOW() - interval '125 days'),

-- São Paulo - Zona Norte
('Guincho Santana', '21.345.678/0001-01', '(11) 2221-0001', 'guincho', 'ativo', -23.5020, -46.6280, NOW() - interval '178 days'),
('Plataforma Tucuruvi', '21.345.678/0001-02', '(11) 2221-0002', 'plataforma', 'ativo', -23.4800, -46.6020, NOW() - interval '173 days'),
('Auto Socorro Tremembé SP', '21.345.678/0001-03', '(11) 2221-0003', 'guincho', 'ativo', -23.4650, -46.5900, NOW() - interval '168 days'),
('Reboque Jaçanã', '21.345.678/0001-04', '(11) 2221-0004', 'plataforma', 'ativo', -23.4700, -46.5800, NOW() - interval '163 days'),
('Guincho Casa Verde', '21.345.678/0001-05', '(11) 2221-0005', 'guincho', 'ativo', -23.5150, -46.6550, NOW() - interval '158 days'),
('Assistência Mandaqui', '21.345.678/0001-06', '(11) 2221-0006', 'apoio', 'ativo', -23.4850, -46.6100, NOW() - interval '153 days'),
('Plataforma Horto Florestal', '21.345.678/0001-07', '(11) 2221-0007', 'plataforma', 'inativo', -23.4600, -46.6300, NOW() - interval '148 days'),
('Guincho Limão', '21.345.678/0001-08', '(11) 2221-0008', 'guincho', 'ativo', -23.5200, -46.6650, NOW() - interval '143 days'),
('Reboque Pirituba', '21.345.678/0001-09', '(11) 2221-0009', 'plataforma', 'ativo', -23.4900, -46.7200, NOW() - interval '138 days'),
('Auto Socorro Brasilândia', '21.345.678/0001-10', '(11) 2221-0010', 'guincho', 'ativo', -23.4750, -46.6900, NOW() - interval '133 days'),
('Guincho Freguesia do Ó', '21.345.678/0001-11', '(11) 2221-0011', 'guincho', 'ativo', -23.5100, -46.6800, NOW() - interval '128 days'),
('Plataforma Vila Guilherme', '21.345.678/0001-12', '(11) 2221-0012', 'plataforma', 'ativo', -23.5080, -46.6150, NOW() - interval '123 days'),
('Reboque Cachoeirinha SP', '21.345.678/0001-13', '(11) 2221-0013', 'guincho', 'ativo', -23.4950, -46.6400, NOW() - interval '118 days'),
('Auto Socorro Vila Maria', '21.345.678/0001-14', '(11) 2221-0014', 'apoio', 'ativo', -23.5050, -46.6050, NOW() - interval '113 days'),
('Guincho Edu Chaves', '21.345.678/0001-15', '(11) 2221-0015', 'guincho', 'inativo', -23.4820, -46.5950, NOW() - interval '108 days'),

-- São Paulo - Zona Sul
('Guincho Santo Amaro', '31.456.789/0001-01', '(11) 5521-0001', 'guincho', 'ativo', -23.6530, -46.6730, NOW() - interval '177 days'),
('Plataforma Interlagos', '31.456.789/0001-02', '(11) 5521-0002', 'plataforma', 'ativo', -23.7000, -46.6800, NOW() - interval '172 days'),
('Auto Socorro Jabaquara', '31.456.789/0001-03', '(11) 5521-0003', 'guincho', 'ativo', -23.6350, -46.6400, NOW() - interval '167 days'),
('Reboque Saúde', '31.456.789/0001-04', '(11) 5521-0004', 'plataforma', 'ativo', -23.6200, -46.6350, NOW() - interval '162 days'),
('Guincho Campo Limpo', '31.456.789/0001-05', '(11) 5521-0005', 'guincho', 'ativo', -23.6450, -46.7600, NOW() - interval '157 days'),
('Assistência Capão Redondo', '31.456.789/0001-06', '(11) 5521-0006', 'apoio', 'ativo', -23.6680, -46.7800, NOW() - interval '152 days'),
('Plataforma Vila Mariana', '31.456.789/0001-07', '(11) 5521-0007', 'plataforma', 'inativo', -23.5950, -46.6350, NOW() - interval '147 days'),
('Guincho Ipiranga', '31.456.789/0001-08', '(11) 5521-0008', 'guincho', 'ativo', -23.5900, -46.6100, NOW() - interval '142 days'),
('Reboque Grajaú', '31.456.789/0001-09', '(11) 5521-0009', 'plataforma', 'ativo', -23.7500, -46.6800, NOW() - interval '137 days'),
('Auto Socorro Pedreira', '31.456.789/0001-10', '(11) 5521-0010', 'guincho', 'ativo', -23.6800, -46.6600, NOW() - interval '132 days'),
('Guincho Socorro SP', '31.456.789/0001-11', '(11) 5521-0011', 'guincho', 'ativo', -23.7200, -46.7100, NOW() - interval '127 days'),
('Plataforma Cidade Ademar', '31.456.789/0001-12', '(11) 5521-0012', 'plataforma', 'ativo', -23.6600, -46.6500, NOW() - interval '122 days'),
('Reboque Cursino', '31.456.789/0001-13', '(11) 5521-0013', 'guincho', 'ativo', -23.6100, -46.6200, NOW() - interval '117 days'),
('Auto Socorro Brooklin', '31.456.789/0001-14', '(11) 5521-0014', 'apoio', 'ativo', -23.6250, -46.6700, NOW() - interval '112 days'),
('Guincho Moema', '31.456.789/0001-15', '(11) 5521-0015', 'guincho', 'inativo', -23.6000, -46.6650, NOW() - interval '107 days'),

-- São Paulo - Zona Leste
('Guincho Penha', '41.567.890/0001-01', '(11) 2021-0001', 'guincho', 'ativo', -23.5300, -46.5400, NOW() - interval '176 days'),
('Plataforma São Mateus', '41.567.890/0001-02', '(11) 2021-0002', 'plataforma', 'ativo', -23.6000, -46.4800, NOW() - interval '171 days'),
('Auto Socorro Itaquera', '41.567.890/0001-03', '(11) 2021-0003', 'guincho', 'ativo', -23.5400, -46.4500, NOW() - interval '166 days'),
('Reboque Vila Matilde', '41.567.890/0001-04', '(11) 2021-0004', 'plataforma', 'ativo', -23.5450, -46.5200, NOW() - interval '161 days'),
('Guincho Ermelino Matarazzo', '41.567.890/0001-05', '(11) 2021-0005', 'guincho', 'ativo', -23.5100, -46.4800, NOW() - interval '156 days'),
('Assistência São Miguel', '41.567.890/0001-06', '(11) 2021-0006', 'apoio', 'ativo', -23.4950, -46.4400, NOW() - interval '151 days'),
('Plataforma Guaianases', '41.567.890/0001-07', '(11) 2021-0007', 'plataforma', 'inativo', -23.5350, -46.4100, NOW() - interval '146 days'),
('Guincho Sapopemba', '41.567.890/0001-08', '(11) 2021-0008', 'guincho', 'ativo', -23.5800, -46.5100, NOW() - interval '141 days'),
('Reboque Aricanduva', '41.567.890/0001-09', '(11) 2021-0009', 'plataforma', 'ativo', -23.5600, -46.5000, NOW() - interval '136 days'),
('Auto Socorro Cidade Tiradentes', '41.567.890/0001-10', '(11) 2021-0010', 'guincho', 'ativo', -23.5900, -46.3900, NOW() - interval '131 days'),
('Guincho Vila Ré', '41.567.890/0001-11', '(11) 2021-0011', 'guincho', 'ativo', -23.5250, -46.5300, NOW() - interval '126 days'),
('Plataforma Tatuapé', '41.567.890/0001-12', '(11) 2021-0012', 'plataforma', 'ativo', -23.5400, -46.5700, NOW() - interval '121 days'),
('Reboque Carrão', '41.567.890/0001-13', '(11) 2021-0013', 'guincho', 'ativo', -23.5500, -46.5400, NOW() - interval '116 days'),
('Auto Socorro Mooca', '41.567.890/0001-14', '(11) 2021-0014', 'apoio', 'ativo', -23.5600, -46.5900, NOW() - interval '111 days'),
('Guincho Belém SP', '41.567.890/0001-15', '(11) 2021-0015', 'guincho', 'inativo', -23.5350, -46.5800, NOW() - interval '106 days'),

-- São Paulo - Zona Oeste
('Guincho Pinheiros', '51.678.901/0001-01', '(11) 3021-0001', 'guincho', 'ativo', -23.5670, -46.6920, NOW() - interval '175 days'),
('Plataforma Lapa', '51.678.901/0001-02', '(11) 3021-0002', 'plataforma', 'ativo', -23.5200, -46.7100, NOW() - interval '170 days'),
('Auto Socorro Butantã', '51.678.901/0001-03', '(11) 3021-0003', 'guincho', 'ativo', -23.5700, -46.7300, NOW() - interval '165 days'),
('Reboque Perdizes', '51.678.901/0001-04', '(11) 3021-0004', 'plataforma', 'ativo', -23.5350, -46.6800, NOW() - interval '160 days'),
('Guincho Vila Sônia', '51.678.901/0001-05', '(11) 3021-0005', 'guincho', 'ativo', -23.6000, -46.7400, NOW() - interval '155 days'),
('Assistência Alto de Pinheiros', '51.678.901/0001-06', '(11) 3021-0006', 'apoio', 'ativo', -23.5450, -46.7150, NOW() - interval '150 days'),
('Plataforma Rio Pequeno', '51.678.901/0001-07', '(11) 3021-0007', 'plataforma', 'inativo', -23.5600, -46.7500, NOW() - interval '145 days'),
('Guincho Jaguaré', '51.678.901/0001-08', '(11) 3021-0008', 'guincho', 'ativo', -23.5500, -46.7450, NOW() - interval '140 days'),
('Reboque Vila Leopoldina', '51.678.901/0001-09', '(11) 3021-0009', 'plataforma', 'ativo', -23.5250, -46.7350, NOW() - interval '135 days'),
('Auto Socorro Raposo Tavares', '51.678.901/0001-10', '(11) 3021-0010', 'guincho', 'ativo', -23.5800, -46.7600, NOW() - interval '130 days'),
('Guincho Barra Funda', '51.678.901/0001-11', '(11) 3021-0011', 'guincho', 'ativo', -23.5250, -46.6700, NOW() - interval '125 days'),
('Plataforma Pompéia', '51.678.901/0001-12', '(11) 3021-0012', 'plataforma', 'ativo', -23.5300, -46.6850, NOW() - interval '120 days'),

-- São Paulo - Centro
('Guincho República', '61.789.012/0001-01', '(11) 3121-0001', 'guincho', 'ativo', -23.5430, -46.6420, NOW() - interval '174 days'),
('Plataforma Sé', '61.789.012/0001-02', '(11) 3121-0002', 'plataforma', 'ativo', -23.5505, -46.6340, NOW() - interval '169 days'),
('Auto Socorro Liberdade', '61.789.012/0001-03', '(11) 3121-0003', 'guincho', 'ativo', -23.5600, -46.6350, NOW() - interval '164 days'),
('Reboque Bom Retiro', '61.789.012/0001-04', '(11) 3121-0004', 'plataforma', 'ativo', -23.5250, -46.6380, NOW() - interval '159 days'),
('Guincho Brás', '61.789.012/0001-05', '(11) 3121-0005', 'guincho', 'ativo', -23.5450, -46.6100, NOW() - interval '154 days'),
('Assistência Consolação', '61.789.012/0001-06', '(11) 3121-0006', 'apoio', 'ativo', -23.5500, -46.6600, NOW() - interval '149 days'),
('Plataforma Bela Vista', '61.789.012/0001-07', '(11) 3121-0007', 'plataforma', 'inativo', -23.5600, -46.6500, NOW() - interval '144 days'),
('Guincho Santa Cecília', '61.789.012/0001-08', '(11) 3121-0008', 'guincho', 'ativo', -23.5350, -46.6520, NOW() - interval '139 days'),
('Reboque Campos Elíseos SP', '61.789.012/0001-09', '(11) 3121-0009', 'plataforma', 'ativo', -23.5300, -46.6450, NOW() - interval '134 days'),
('Auto Socorro Pari', '61.789.012/0001-10', '(11) 3121-0010', 'guincho', 'ativo', -23.5300, -46.6150, NOW() - interval '129 days'),

-- Guarulhos
('Guincho Guarulhos Centro', '71.890.123/0001-01', '(11) 2401-0001', 'guincho', 'ativo', -23.4628, -46.5333, NOW() - interval '173 days'),
('Plataforma Cumbica', '71.890.123/0001-02', '(11) 2401-0002', 'plataforma', 'ativo', -23.4350, -46.4750, NOW() - interval '168 days'),
('Auto Socorro Bonsucesso GRU', '71.890.123/0001-03', '(11) 2401-0003', 'guincho', 'ativo', -23.4700, -46.5200, NOW() - interval '163 days'),
('Reboque Vila Galvão', '71.890.123/0001-04', '(11) 2401-0004', 'plataforma', 'ativo', -23.4650, -46.5500, NOW() - interval '158 days'),
('Guincho Gopouva', '71.890.123/0001-05', '(11) 2401-0005', 'guincho', 'ativo', -23.4680, -46.5400, NOW() - interval '153 days'),
('Assistência Dutra Guarulhos', '71.890.123/0001-06', '(11) 2401-0006', 'apoio', 'ativo', -23.4500, -46.5100, NOW() - interval '148 days'),
('Plataforma Taboão GRU', '71.890.123/0001-07', '(11) 2401-0007', 'plataforma', 'inativo', -23.4580, -46.5250, NOW() - interval '143 days'),
('Guincho Aeroporto GRU', '71.890.123/0001-08', '(11) 2401-0008', 'guincho', 'ativo', -23.4320, -46.4700, NOW() - interval '138 days'),
('Reboque Jardim Presidente Dutra', '71.890.123/0001-09', '(11) 2401-0009', 'plataforma', 'ativo', -23.4550, -46.5050, NOW() - interval '133 days'),
('Auto Socorro Pimentas', '71.890.123/0001-10', '(11) 2401-0010', 'guincho', 'ativo', -23.4900, -46.4200, NOW() - interval '128 days'),
('Guincho Lavras GRU', '71.890.123/0001-11', '(11) 2401-0011', 'guincho', 'ativo', -23.4750, -46.4900, NOW() - interval '123 days'),
('Plataforma Vila Augusta', '71.890.123/0001-12', '(11) 2401-0012', 'plataforma', 'ativo', -23.4600, -46.5450, NOW() - interval '118 days'),

-- Diadema
('Guincho Diadema Centro', '81.901.234/0001-01', '(11) 4043-0001', 'guincho', 'ativo', -23.6861, -46.6228, NOW() - interval '172 days'),
('Plataforma Piraporinha', '81.901.234/0001-02', '(11) 4043-0002', 'plataforma', 'ativo', -23.7000, -46.6300, NOW() - interval '167 days'),
('Auto Socorro Eldorado Diadema', '81.901.234/0001-03', '(11) 4043-0003', 'guincho', 'ativo', -23.6950, -46.6250, NOW() - interval '162 days'),
('Reboque Serraria Diadema', '81.901.234/0001-04', '(11) 4043-0004', 'plataforma', 'ativo', -23.6900, -46.6180, NOW() - interval '157 days'),
('Guincho Conceição Diadema', '81.901.234/0001-05', '(11) 4043-0005', 'guincho', 'inativo', -23.6830, -46.6150, NOW() - interval '152 days'),
('Assistência Vila Nogueira', '81.901.234/0001-06', '(11) 4043-0006', 'apoio', 'ativo', -23.6920, -46.6280, NOW() - interval '147 days'),
('Plataforma Campanário', '81.901.234/0001-07', '(11) 4043-0007', 'plataforma', 'ativo', -23.6970, -46.6350, NOW() - interval '142 days'),
('Guincho Taboão Diadema', '81.901.234/0001-08', '(11) 4043-0008', 'guincho', 'ativo', -23.6800, -46.6100, NOW() - interval '137 days'),

-- ABCD (Santo André, São Bernardo, São Caetano, Mauá, Ribeirão Pires)
('Guincho Santo André Centro', '91.012.345/0001-01', '(11) 4421-0001', 'guincho', 'ativo', -23.6737, -46.5432, NOW() - interval '171 days'),
('Plataforma Utinga', '91.012.345/0001-02', '(11) 4421-0002', 'plataforma', 'ativo', -23.6500, -46.5300, NOW() - interval '166 days'),
('Auto Socorro Vila Pires SA', '91.012.345/0001-03', '(11) 4421-0003', 'guincho', 'ativo', -23.6600, -46.5500, NOW() - interval '161 days'),
('Guincho São Bernardo Rudge Ramos', '91.012.345/0001-04', '(11) 4121-0001', 'guincho', 'ativo', -23.6650, -46.5750, NOW() - interval '156 days'),
('Plataforma Paulicéia SBC', '91.012.345/0001-05', '(11) 4121-0002', 'plataforma', 'ativo', -23.6950, -46.5650, NOW() - interval '151 days'),
('Auto Socorro Baeta Neves', '91.012.345/0001-06', '(11) 4121-0003', 'guincho', 'ativo', -23.6800, -46.5800, NOW() - interval '146 days'),
('Reboque Demarchi SBC', '91.012.345/0001-07', '(11) 4121-0004', 'plataforma', 'inativo', -23.7100, -46.5700, NOW() - interval '141 days'),
('Guincho São Caetano Centro', '91.012.345/0001-08', '(11) 4221-0001', 'guincho', 'ativo', -23.6236, -46.5515, NOW() - interval '136 days'),
('Plataforma Fundação SCS', '91.012.345/0001-09', '(11) 4221-0002', 'plataforma', 'ativo', -23.6300, -46.5600, NOW() - interval '131 days'),
('Auto Socorro Prosperidade SCS', '91.012.345/0001-10', '(11) 4221-0003', 'guincho', 'ativo', -23.6200, -46.5450, NOW() - interval '126 days'),
('Guincho Mauá Centro', '91.012.345/0001-11', '(11) 4541-0001', 'guincho', 'ativo', -23.6678, -46.4614, NOW() - interval '121 days'),
('Plataforma Vila Assis Mauá', '91.012.345/0001-12', '(11) 4541-0002', 'plataforma', 'ativo', -23.6750, -46.4700, NOW() - interval '116 days'),
('Auto Socorro Jardim Zaíra', '91.012.345/0001-13', '(11) 4541-0003', 'guincho', 'ativo', -23.6600, -46.4550, NOW() - interval '111 days'),
('Reboque Capuava Mauá', '91.012.345/0001-14', '(11) 4541-0004', 'plataforma', 'ativo', -23.6500, -46.4800, NOW() - interval '106 days'),
('Guincho Ribeirão Pires', '91.012.345/0001-15', '(11) 4821-0001', 'guincho', 'ativo', -23.7111, -46.4095, NOW() - interval '101 days'),
('Plataforma Centro RP', '91.012.345/0001-16', '(11) 4821-0002', 'plataforma', 'inativo', -23.7150, -46.4150, NOW() - interval '96 days'),
('Assistência Ouro Fino RP', '91.012.345/0001-17', '(11) 4821-0003', 'apoio', 'ativo', -23.7200, -46.4200, NOW() - interval '91 days'),

-- Mais prestadores para atingir ~350 - Regiões mistas
('Guincho Marginal Tietê', '99.111.222/0001-01', '(11) 3333-0001', 'guincho', 'ativo', -23.5100, -46.6600, NOW() - interval '90 days'),
('Plataforma Marginal Pinheiros', '99.111.222/0001-02', '(11) 3333-0002', 'plataforma', 'ativo', -23.5700, -46.7000, NOW() - interval '88 days'),
('Auto Socorro Anchieta', '99.111.222/0001-03', '(11) 3333-0003', 'guincho', 'ativo', -23.6500, -46.5800, NOW() - interval '86 days'),
('Reboque Imigrantes', '99.111.222/0001-04', '(11) 3333-0004', 'plataforma', 'ativo', -23.7100, -46.6200, NOW() - interval '84 days'),
('Guincho Fernão Dias', '99.111.222/0001-05', '(11) 3333-0005', 'guincho', 'ativo', -23.4200, -46.5800, NOW() - interval '82 days'),
('Assistência Bandeirantes SP', '99.111.222/0001-06', '(11) 3333-0006', 'apoio', 'ativo', -23.5300, -46.7200, NOW() - interval '80 days'),
('Plataforma Castello Branco', '99.111.222/0001-07', '(11) 3333-0007', 'plataforma', 'ativo', -23.5150, -46.7600, NOW() - interval '78 days'),
('Guincho Rodoanel Oeste', '99.111.222/0001-08', '(11) 3333-0008', 'guincho', 'inativo', -23.5800, -46.8200, NOW() - interval '76 days'),
('Reboque Rodoanel Leste', '99.111.222/0001-09', '(11) 3333-0009', 'plataforma', 'ativo', -23.5500, -46.4500, NOW() - interval '74 days'),
('Auto Socorro Ayrton Senna', '99.111.222/0001-10', '(11) 3333-0010', 'guincho', 'ativo', -23.5000, -46.5200, NOW() - interval '72 days'),
('Guincho Presidente Dutra SP', '99.111.222/0001-11', '(11) 3333-0011', 'guincho', 'ativo', -23.4800, -46.5600, NOW() - interval '70 days'),
('Plataforma Régis Bittencourt', '99.111.222/0001-12', '(11) 3333-0012', 'plataforma', 'ativo', -23.7500, -46.7500, NOW() - interval '68 days'),
('Reboque Anhanguera', '99.111.222/0001-13', '(11) 3333-0013', 'guincho', 'ativo', -23.4500, -46.7300, NOW() - interval '66 days'),
('Auto Socorro Raposo SP', '99.111.222/0001-14', '(11) 3333-0014', 'apoio', 'ativo', -23.5900, -46.7800, NOW() - interval '64 days'),
('Guincho Capivari', '99.111.222/0001-15', '(11) 3333-0015', 'guincho', 'ativo', -23.4300, -46.6800, NOW() - interval '62 days'),

-- Mais SJC / Vale do Paraíba extras
('Guincho Residencial Galo Branco', '99.222.333/0001-01', '(12) 3921-1001', 'guincho', 'ativo', -23.2050, -45.8750, NOW() - interval '60 days'),
('Plataforma Jd Morumbi SJC', '99.222.333/0001-02', '(12) 3921-1002', 'plataforma', 'ativo', -23.2200, -45.9000, NOW() - interval '58 days'),
('Auto Socorro Jd das Indústrias', '99.222.333/0001-03', '(12) 3921-1003', 'guincho', 'ativo', -23.1800, -45.8400, NOW() - interval '56 days'),
('Reboque Vila Adyana', '99.222.333/0001-04', '(12) 3921-1004', 'plataforma', 'inativo', -23.1950, -45.8700, NOW() - interval '54 days'),
('Guincho Bosque dos Pinheiros', '99.222.333/0001-05', '(12) 3921-1005', 'guincho', 'ativo', -23.2100, -45.8900, NOW() - interval '52 days'),
('Assistência Alto da Ponte SJC', '99.222.333/0001-06', '(12) 3921-1006', 'apoio', 'ativo', -23.1900, -45.8600, NOW() - interval '50 days'),
('Plataforma Chácaras Reunidas', '99.222.333/0001-07', '(12) 3921-1007', 'plataforma', 'ativo', -23.2150, -45.9050, NOW() - interval '48 days'),
('Guincho Pq Industrial', '99.222.333/0001-08', '(12) 3921-1008', 'guincho', 'ativo', -23.1850, -45.8350, NOW() - interval '46 days'),
('Reboque Vila Maria SJC', '99.222.333/0001-09', '(12) 3921-1009', 'guincho', 'ativo', -23.2000, -45.8800, NOW() - interval '44 days'),
('Auto Socorro Jd Paulista SJC', '99.222.333/0001-10', '(12) 3921-1010', 'apoio', 'ativo', -23.1950, -45.8650, NOW() - interval '42 days'),

-- Mais Taubaté extras
('Guincho Vila São José Taubaté', '99.333.444/0001-01', '(12) 3632-1001', 'guincho', 'ativo', -23.0200, -45.5500, NOW() - interval '40 days'),
('Plataforma Esplanada Taubaté', '99.333.444/0001-02', '(12) 3632-1002', 'plataforma', 'ativo', -23.0150, -45.5550, NOW() - interval '38 days'),
('Auto Socorro Jd Ana Rosa', '99.333.444/0001-03', '(12) 3632-1003', 'guincho', 'ativo', -23.0250, -45.5650, NOW() - interval '36 days'),
('Reboque Vila dos Comerciários', '99.333.444/0001-04', '(12) 3632-1004', 'plataforma', 'ativo', -23.0100, -45.5400, NOW() - interval '34 days'),
('Guincho Parque Urupês', '99.333.444/0001-05', '(12) 3632-1005', 'guincho', 'inativo', -23.0300, -45.5700, NOW() - interval '32 days'),

-- Mais ABCD extras
('Guincho Vila Metalúrgica SA', '99.444.555/0001-01', '(11) 4421-1001', 'guincho', 'ativo', -23.6550, -46.5350, NOW() - interval '30 days'),
('Plataforma Parque das Nações SA', '99.444.555/0001-02', '(11) 4421-1002', 'plataforma', 'ativo', -23.6650, -46.5450, NOW() - interval '28 days'),
('Auto Socorro Jardim Bela Vista SA', '99.444.555/0001-03', '(11) 4421-1003', 'guincho', 'ativo', -23.6700, -46.5550, NOW() - interval '26 days'),
('Reboque Riacho Grande SBC', '99.444.555/0001-04', '(11) 4121-1001', 'plataforma', 'ativo', -23.7800, -46.5500, NOW() - interval '24 days'),
('Guincho Ferrazópolis SBC', '99.444.555/0001-05', '(11) 4121-1002', 'guincho', 'ativo', -23.7000, -46.5550, NOW() - interval '22 days'),
('Assistência Assunção SBC', '99.444.555/0001-06', '(11) 4121-1003', 'apoio', 'ativo', -23.6850, -46.5700, NOW() - interval '20 days'),
('Plataforma Centro SBC', '99.444.555/0001-07', '(11) 4121-1004', 'plataforma', 'ativo', -23.6950, -46.5500, NOW() - interval '18 days'),
('Guincho Jardim do Mar SBC', '99.444.555/0001-08', '(11) 4121-1005', 'guincho', 'inativo', -23.6780, -46.5650, NOW() - interval '16 days'),

-- Mais Guarulhos extras
('Guincho Ponte Grande GRU', '99.555.666/0001-01', '(11) 2401-1001', 'guincho', 'ativo', -23.4600, -46.5400, NOW() - interval '14 days'),
('Plataforma Vila Barros GRU', '99.555.666/0001-02', '(11) 2401-1002', 'plataforma', 'ativo', -23.4650, -46.5350, NOW() - interval '12 days'),
('Auto Socorro Torres Tibagy', '99.555.666/0001-03', '(11) 2401-1003', 'guincho', 'ativo', -23.4700, -46.5250, NOW() - interval '10 days'),
('Reboque Jardim Santa Francisca', '99.555.666/0001-04', '(11) 2401-1004', 'plataforma', 'ativo', -23.4550, -46.5150, NOW() - interval '8 days'),
('Guincho Cecap GRU', '99.555.666/0001-05', '(11) 2401-1005', 'guincho', 'ativo', -23.4500, -46.5300, NOW() - interval '6 days'),
('Assistência São João GRU', '99.555.666/0001-06', '(11) 2401-1006', 'apoio', 'ativo', -23.4750, -46.5100, NOW() - interval '4 days'),
('Plataforma Morros GRU', '99.555.666/0001-07', '(11) 2401-1007', 'plataforma', 'ativo', -23.4800, -46.5000, NOW() - interval '2 days'),

-- Mais prestadores avulsos - cidades diversas
('Guincho Cruzeiro', '99.666.777/0001-01', '(12) 3144-0001', 'guincho', 'ativo', -22.5768, -44.9634, NOW() - interval '95 days'),
('Plataforma Lavrinhas', '99.666.777/0001-02', '(12) 3145-0001', 'plataforma', 'ativo', -22.5700, -44.9000, NOW() - interval '93 days'),
('Auto Socorro Queluz', '99.666.777/0001-03', '(12) 3146-0001', 'guincho', 'ativo', -22.5350, -44.7770, NOW() - interval '91 days'),
('Reboque Silveiras', '99.666.777/0001-04', '(12) 3147-0001', 'plataforma', 'inativo', -22.6640, -44.8530, NOW() - interval '89 days'),
('Guincho Areias', '99.666.777/0001-05', '(12) 3148-0001', 'guincho', 'ativo', -22.5780, -44.7000, NOW() - interval '87 days'),
('Auto Socorro Cunha', '99.666.777/0001-06', '(12) 3149-0001', 'guincho', 'ativo', -23.0745, -44.9580, NOW() - interval '85 days'),
('Plataforma São Luiz do Paraitinga', '99.666.777/0001-07', '(12) 3150-0001', 'plataforma', 'ativo', -23.2225, -45.3108, NOW() - interval '83 days'),
('Guincho Natividade da Serra', '99.666.777/0001-08', '(12) 3151-0001', 'guincho', 'ativo', -23.3706, -45.4450, NOW() - interval '81 days'),
('Reboque Redenção da Serra', '99.666.777/0001-09', '(12) 3152-0011', 'plataforma', 'ativo', -23.2625, -45.5428, NOW() - interval '79 days'),
('Auto Socorro Paraibuna', '99.666.777/0001-10', '(12) 3153-0001', 'guincho', 'ativo', -23.3860, -45.6612, NOW() - interval '77 days'),
('Guincho Santa Branca', '99.666.777/0001-11', '(12) 3154-0001', 'guincho', 'ativo', -23.3965, -45.8855, NOW() - interval '75 days'),
('Plataforma Igaratá', '99.666.777/0001-12', '(12) 3155-0001', 'plataforma', 'ativo', -23.2050, -46.1550, NOW() - interval '73 days'),
('Reboque São Sebastião', '99.666.777/0001-13', '(12) 3156-0001', 'guincho', 'ativo', -23.7960, -45.4100, NOW() - interval '71 days'),
('Auto Socorro Ilhabela', '99.666.777/0001-14', '(12) 3157-0001', 'guincho', 'inativo', -23.7780, -45.3580, NOW() - interval '69 days'),
('Guincho Ubatuba', '99.666.777/0001-15', '(12) 3158-0001', 'guincho', 'ativo', -23.4341, -45.0710, NOW() - interval '67 days'),
('Plataforma Ubatuba Centro', '99.666.777/0001-16', '(12) 3158-0002', 'plataforma', 'ativo', -23.4380, -45.0750, NOW() - interval '65 days'),
('Assistência Litoral Norte Ubatuba', '99.666.777/0001-17', '(12) 3158-0003', 'apoio', 'ativo', -23.4300, -45.0650, NOW() - interval '63 days'),
('Guincho Campos do Jordão', '99.666.777/0001-18', '(12) 3662-0001', 'guincho', 'ativo', -22.7396, -45.5914, NOW() - interval '100 days'),
('Plataforma Capivari CJ', '99.666.777/0001-19', '(12) 3662-0002', 'plataforma', 'ativo', -22.7400, -45.5800, NOW() - interval '98 days'),
('Auto Socorro Jaguari CJ', '99.666.777/0001-20', '(12) 3662-0003', 'guincho', 'ativo', -22.7350, -45.5950, NOW() - interval '96 days'),

-- Mais SP e rodovias
('Guincho Osasco', '99.777.888/0001-01', '(11) 3601-0001', 'guincho', 'ativo', -23.5325, -46.7917, NOW() - interval '55 days'),
('Plataforma Carapicuíba', '99.777.888/0001-02', '(11) 4161-0001', 'plataforma', 'ativo', -23.5231, -46.8356, NOW() - interval '53 days'),
('Auto Socorro Barueri', '99.777.888/0001-03', '(11) 4191-0001', 'guincho', 'ativo', -23.5114, -46.8763, NOW() - interval '51 days'),
('Reboque Alphaville', '99.777.888/0001-04', '(11) 4191-0002', 'plataforma', 'ativo', -23.4850, -46.8500, NOW() - interval '49 days'),
('Guincho Santana de Parnaíba', '99.777.888/0001-05', '(11) 4152-0001', 'guincho', 'ativo', -23.4439, -46.9178, NOW() - interval '47 days'),
('Assistência Cotia', '99.777.888/0001-06', '(11) 4612-0001', 'apoio', 'ativo', -23.6038, -46.9192, NOW() - interval '45 days'),
('Plataforma Itapecerica', '99.777.888/0001-07', '(11) 4666-0001', 'plataforma', 'ativo', -23.7182, -46.8493, NOW() - interval '43 days'),
('Guincho Embu das Artes', '99.777.888/0001-08', '(11) 4781-0001', 'guincho', 'inativo', -23.6489, -46.8524, NOW() - interval '41 days'),
('Reboque Taboão da Serra', '99.777.888/0001-09', '(11) 4131-0001', 'plataforma', 'ativo', -23.6267, -46.7583, NOW() - interval '39 days'),
('Auto Socorro Itapevi', '99.777.888/0001-10', '(11) 4141-0001', 'guincho', 'ativo', -23.5489, -46.9342, NOW() - interval '37 days'),
('Guincho Jandira', '99.777.888/0001-11', '(11) 4611-0001', 'guincho', 'ativo', -23.5274, -46.9028, NOW() - interval '35 days'),
('Plataforma Ferraz de Vasconcelos', '99.777.888/0001-12', '(11) 4671-0001', 'plataforma', 'ativo', -23.5411, -46.3681, NOW() - interval '33 days'),
('Reboque Poá', '99.777.888/0001-13', '(11) 4631-0001', 'guincho', 'ativo', -23.5286, -46.3481, NOW() - interval '31 days'),
('Auto Socorro Suzano', '99.777.888/0001-14', '(11) 4741-0001', 'guincho', 'ativo', -23.5425, -46.3108, NOW() - interval '29 days'),
('Guincho Mogi das Cruzes', '99.777.888/0001-15', '(11) 4721-0001', 'guincho', 'ativo', -23.5225, -46.1883, NOW() - interval '27 days'),
('Plataforma Biritiba-Mirim', '99.777.888/0001-16', '(11) 4693-0001', 'plataforma', 'ativo', -23.5703, -46.0389, NOW() - interval '25 days'),
('Assistência Salesópolis', '99.777.888/0001-17', '(11) 4696-0001', 'apoio', 'ativo', -23.5297, -45.8464, NOW() - interval '23 days'),
('Guincho Guararema', '99.777.888/0001-18', '(11) 4693-1001', 'guincho', 'ativo', -23.4128, -46.0406, NOW() - interval '21 days'),
('Reboque Santa Isabel', '99.777.888/0001-19', '(11) 4656-0001', 'plataforma', 'ativo', -23.3175, -46.2228, NOW() - interval '19 days'),
('Auto Socorro Arujá', '99.777.888/0001-20', '(11) 4651-0001', 'guincho', 'ativo', -23.3961, -46.3206, NOW() - interval '17 days'),

-- Extras para atingir ~350
('Guincho São José Operário SJC', '99.888.999/0001-01', '(12) 3921-2001', 'guincho', 'ativo', -23.2050, -45.8900, NOW() - interval '15 days'),
('Plataforma Jd América SJC', '99.888.999/0001-02', '(12) 3921-2002', 'plataforma', 'ativo', -23.1900, -45.8750, NOW() - interval '13 days'),
('Guincho Vila Betânia SJC', '99.888.999/0001-03', '(12) 3921-2003', 'guincho', 'ativo', -23.2000, -45.8850, NOW() - interval '11 days'),
('Auto Socorro Jd Aquarius II', '99.888.999/0001-04', '(12) 3921-2004', 'apoio', 'ativo', -23.1850, -45.8650, NOW() - interval '9 days'),
('Reboque Vila Ema SJC', '99.888.999/0001-05', '(12) 3921-2005', 'plataforma', 'ativo', -23.2100, -45.9000, NOW() - interval '7 days'),
('Guincho CTA SJC', '99.888.999/0001-06', '(12) 3921-2006', 'guincho', 'ativo', -23.2150, -45.8700, NOW() - interval '5 days'),
('Plataforma Vila Tesouro', '99.888.999/0001-07', '(12) 3921-2007', 'plataforma', 'inativo', -23.1950, -45.8800, NOW() - interval '3 days'),
('Assistência Campo dos Alemães', '99.888.999/0001-08', '(12) 3921-2008', 'apoio', 'ativo', -23.2300, -45.9150, NOW() - interval '1 day');


-- ============================================================
-- 2. SOLICITAÇÕES (30 registros)
-- ============================================================

INSERT INTO public.solicitacoes (cliente_nome, cliente_telefone, placa, origem_endereco, destino_endereco, tipo_veiculo, status, prioridade, valor, created_at, updated_at) VALUES
('Carlos Eduardo Silva', '(12) 99101-2001', 'ABC-1D23', 'Av. São João, 120 - Centro, São José dos Campos', 'Av. Eng. Francisco José Longo, 500 - Jd. São Dimas, SJC', 'carro', 'pendente', 'normal', 180.00, NOW() - interval '2 days', NOW() - interval '2 days'),
('Maria Aparecida Santos', '(12) 99102-2002', 'DEF-4G56', 'Rod. Presidente Dutra, km 148 - Caçapava', 'Rua XV de Novembro, 200 - Centro, Taubaté', 'carro', 'em_andamento', 'alta', 350.00, NOW() - interval '1 day', NOW() - interval '12 hours'),
('José Roberto Oliveira', '(12) 99103-2003', 'GHI-7J89', 'Rua Barão do Rio Branco, 85 - Centro, Jacareí', 'Av. Lucas Nogueira Garcez, 300 - Jacareí', 'moto', 'concluida', 'normal', 120.00, NOW() - interval '5 days', NOW() - interval '4 days'),
('Ana Paula Ferreira', '(12) 99104-2004', 'JKL-0M12', 'Av. Independência, 1200 - Taubaté', 'Rod. Oswaldo Cruz, km 10 - Taubaté', 'carro', 'em_andamento', 'urgente', 450.00, NOW() - interval '6 hours', NOW() - interval '3 hours'),
('Ricardo Mendes Costa', '(11) 99105-2005', 'MNO-3P45', 'Av. Guarulhos, 1500 - Guarulhos', 'Rua Augusta, 800 - Consolação, SP', 'caminhonete', 'pendente', 'normal', 280.00, NOW() - interval '3 days', NOW() - interval '3 days'),
('Fernanda Lima Rodrigues', '(12) 99106-2006', 'PQR-6S78', 'Rua Cel. Fernando Prestes, 300 - Centro, Pindamonhangaba', 'Av. Trabalhadores, 100 - Pinda', 'carro', 'concluida', 'normal', 150.00, NOW() - interval '8 days', NOW() - interval '7 days'),
('Marcos Antônio Pereira', '(12) 99107-2007', 'STU-9V01', 'Av. Monsenhor Salim, 50 - Centro, Aparecida', 'Rod. Presidente Dutra, km 70 - Aparecida', 'van', 'cancelada', 'normal', 0.00, NOW() - interval '10 days', NOW() - interval '9 days'),
('Juliana de Souza Alves', '(11) 99108-2008', 'VWX-2Y34', 'Rua Haddock Lobo, 400 - Cerqueira César, SP', 'Av. Paulista, 1000 - Bela Vista, SP', 'carro', 'em_andamento', 'alta', 220.00, NOW() - interval '4 hours', NOW() - interval '2 hours'),
('Pedro Henrique Barbosa', '(12) 99109-2009', 'ZAB-5C67', 'Rod. dos Tamoios, km 45 - Caraguatatuba', 'Av. Dr. Arthur Costa Filho, 200 - Caraguá', 'carro', 'pendente', 'urgente', 500.00, NOW() - interval '1 day', NOW() - interval '1 day'),
('Luciana Martins Gomes', '(12) 99110-2010', 'CDE-8F90', 'Rua Marechal Deodoro, 150 - Centro, Guaratinguetá', 'Rod. Presidente Dutra, km 60 - Lorena', 'carro', 'concluida', 'normal', 200.00, NOW() - interval '12 days', NOW() - interval '11 days'),
('Thiago Nascimento', '(11) 99111-2011', 'FGH-1I23', 'Av. do Estado, 3200 - Cambuci, SP', 'Rua Vergueiro, 1500 - Liberdade, SP', 'moto', 'pendente', 'normal', 90.00, NOW() - interval '2 days', NOW() - interval '2 days'),
('Beatriz Cardoso Lima', '(11) 99112-2012', 'IJK-4L56', 'Rua Voluntários da Pátria, 800 - Santana, SP', 'Av. Cruzeiro do Sul, 1200 - Canindé, SP', 'carro', 'em_andamento', 'normal', 180.00, NOW() - interval '8 hours', NOW() - interval '4 hours'),
('Gabriel Almeida Torres', '(12) 99113-2013', 'LMN-7O89', 'Rua Major Novaes, 60 - Centro, Caçapava', 'Av. São João, 500 - SJC', 'caminhonete', 'concluida', 'alta', 380.00, NOW() - interval '15 days', NOW() - interval '14 days'),
('Camila Vieira Santos', '(12) 99114-2014', 'OPQ-0R12', 'Av. Brasil, 700 - Centro, Pindamonhangaba', 'Rod. Presidente Dutra, km 90 - Roseira', 'carro', 'pendente', 'normal', 160.00, NOW() - interval '1 day', NOW() - interval '1 day'),
('Rafael Moreira Souza', '(11) 99115-2015', 'RST-3U45', 'Av. Jabaquara, 2000 - Jabaquara, SP', 'Av. Interlagos, 3500 - Interlagos, SP', 'carro', 'em_andamento', 'alta', 250.00, NOW() - interval '5 hours', NOW() - interval '2 hours'),
('Isabela Rocha Fernandes', '(12) 99116-2016', 'UVW-6X78', 'Rua José Alencar, 100 - Jacareí', 'Av. São José, 300 - Jacareí', 'moto', 'cancelada', 'normal', 0.00, NOW() - interval '7 days', NOW() - interval '6 days'),
('Mateus Oliveira Campos', '(11) 99117-2017', 'XYZ-9A01', 'Rua Augusta, 1500 - Consolação, SP', 'Av. Rebouças, 800 - Pinheiros, SP', 'carro', 'concluida', 'normal', 170.00, NOW() - interval '20 days', NOW() - interval '19 days'),
('Larissa Prado Costa', '(12) 99118-2018', 'BCD-2E34', 'Rod. Presidente Dutra, km 155 - Caçapava', 'Rua Barão da Bocaina, 200 - SJC', 'van', 'em_andamento', 'urgente', 520.00, NOW() - interval '3 hours', NOW() - interval '1 hour'),
('Diego Santana Reis', '(11) 99119-2019', 'EFG-5H67', 'Av. Guarulhos, 2500 - Vila Augusta, Guarulhos', 'Rua Barão de Ladário, 500 - GRU', 'carro', 'pendente', 'normal', 190.00, NOW() - interval '4 days', NOW() - interval '4 days'),
('Renata Dias Silveira', '(12) 99120-2020', 'HIJ-8K90', 'Av. Dr. Januário Miraglia, 300 - Aparecida', 'Rod. Presidente Dutra, km 65 - Guaratinguetá', 'carro', 'concluida', 'normal', 230.00, NOW() - interval '18 days', NOW() - interval '17 days'),
('Felipe Castro Borges', '(11) 99121-2021', 'KLM-1N23', 'Av. Santo André, 1800 - Santo André', 'Rua Catequese, 500 - SA', 'carro', 'pendente', 'alta', 300.00, NOW() - interval '1 day', NOW() - interval '1 day'),
('Patricia Guimarães', '(12) 99122-2022', 'NOP-4Q56', 'Rua Anchieta, 200 - Taubaté', 'Av. Charles Schnyder, 800 - Taubaté', 'carro', 'em_andamento', 'normal', 175.00, NOW() - interval '10 hours', NOW() - interval '5 hours'),
('Vinícius Lopes Mendonça', '(11) 99123-2023', 'QRS-7T89', 'Rua Oscar Freire, 700 - Pinheiros, SP', 'Al. Santos, 1200 - Jardins, SP', 'moto', 'concluida', 'normal', 110.00, NOW() - interval '25 days', NOW() - interval '24 days'),
('Amanda Ferreira Alves', '(12) 99124-2024', 'TUV-0W12', 'Av. Dr. Adhemar de Barros, 500 - SJC', 'Rua Prudente de Morais, 300 - Centro, SJC', 'carro', 'pendente', 'normal', 140.00, NOW() - interval '2 days', NOW() - interval '2 days'),
('Bruno Henrique Ramos', '(11) 99125-2025', 'WXY-3Z45', 'Av. Conceição, 200 - Diadema', 'Av. Piraporinha, 800 - Diadema', 'caminhonete', 'em_andamento', 'alta', 420.00, NOW() - interval '7 hours', NOW() - interval '3 hours'),
('Carolina Melo Duarte', '(12) 99126-2026', 'ZAB-6C78', 'Rod. dos Tamoios, km 30 - Paraibuna', 'Rua Central, 100 - Santa Branca', 'carro', 'cancelada', 'normal', 0.00, NOW() - interval '14 days', NOW() - interval '13 days'),
('Leandro Nunes Faria', '(12) 99127-2027', 'CDE-9F01', 'Av. Tiradentes, 400 - Centro, Cachoeira Paulista', 'Rod. Presidente Dutra, km 55 - Cachoeira', 'carro', 'concluida', 'normal', 160.00, NOW() - interval '22 days', NOW() - interval '21 days'),
('Mariana Costa Braga', '(11) 99128-2028', 'FGH-2I34', 'Rua Barão de Itapetininga, 200 - República, SP', 'Av. Ipiranga, 500 - República, SP', 'carro', 'pendente', 'urgente', 280.00, NOW() - interval '5 hours', NOW() - interval '5 hours'),
('Rodrigo Teixeira Lima', '(12) 99129-2029', 'IJK-5L67', 'Rua Floriano Peixoto, 150 - Centro, Lorena', 'Av. Peixoto de Castro, 400 - Lorena', 'moto', 'em_andamento', 'normal', 130.00, NOW() - interval '9 hours', NOW() - interval '4 hours'),
('Tatiana Sousa Pinto', '(11) 99130-2030', 'LMN-8O90', 'Av. São Caetano, 600 - São Caetano do Sul', 'Rua Amazonas, 300 - SCS', 'carro', 'concluida', 'normal', 155.00, NOW() - interval '30 days', NOW() - interval '29 days');


-- ============================================================
-- 3. ATENDIMENTOS (20 registros)
-- Vinculados a solicitações e prestadores reais
-- Usa subqueries para pegar IDs reais
-- ============================================================

-- Atendimentos para solicitações em_andamento e concluídas
DO $$
DECLARE
  sol_ids uuid[];
  prest_ids uuid[];
BEGIN
  -- Pegar IDs de solicitações (as que acabamos de inserir + existentes)
  SELECT array_agg(id ORDER BY created_at DESC) INTO sol_ids
  FROM public.solicitacoes LIMIT 30;

  -- Pegar IDs de prestadores ativos
  SELECT array_agg(id ORDER BY created_at DESC) INTO prest_ids
  FROM public.prestadores WHERE status = 'ativo' LIMIT 50;

  -- Inserir atendimentos
  IF array_length(sol_ids, 1) >= 10 AND array_length(prest_ids, 1) >= 10 THEN
    INSERT INTO public.atendimentos (solicitacao_id, prestador_id, status, notas, created_at, finalizado_at) VALUES
    (sol_ids[1], prest_ids[1], 'em_andamento', 'Prestador a caminho do local. ETA 15 minutos.', NOW() - interval '2 hours', NULL),
    (sol_ids[2], prest_ids[2], 'em_andamento', 'Guincho posicionado. Aguardando liberação da via.', NOW() - interval '1 hour', NULL),
    (sol_ids[3], prest_ids[3], 'finalizado', 'Veículo rebocado com sucesso até a oficina indicada pelo cliente.', NOW() - interval '5 days', NOW() - interval '4 days' + interval '3 hours'),
    (sol_ids[4], prest_ids[4], 'em_andamento', 'Situação urgente. Veículo na faixa da direita da Dutra. Guincho grande acionado.', NOW() - interval '3 hours', NULL),
    (sol_ids[6], prest_ids[5], 'finalizado', 'Atendimento concluído sem intercorrências. Cliente satisfeito.', NOW() - interval '8 days', NOW() - interval '7 days' + interval '2 hours'),
    (sol_ids[8], prest_ids[6], 'em_andamento', 'Deslocamento para Haddock Lobo. Trânsito intenso na região.', NOW() - interval '2 hours', NULL),
    (sol_ids[10], prest_ids[7], 'finalizado', 'Veículo entregue no destino. Documentação assinada.', NOW() - interval '12 days', NOW() - interval '11 days' + interval '4 hours'),
    (sol_ids[12], prest_ids[8], 'em_andamento', 'Prestador no local. Preparando içamento do veículo.', NOW() - interval '4 hours', NULL),
    (sol_ids[13], prest_ids[9], 'finalizado', 'Caminhonete rebocada de Caçapava até SJC. Sem avarias adicionais.', NOW() - interval '15 days', NOW() - interval '14 days' + interval '5 hours'),
    (sol_ids[15], prest_ids[10], 'em_andamento', 'Guincho saiu da base em Jabaquara. Previsão de 20 min para chegada.', NOW() - interval '2 hours', NULL),
    (sol_ids[17], prest_ids[11], 'finalizado', 'Moto transportada com sucesso. Cliente acompanhou no veículo do prestador.', NOW() - interval '20 days', NOW() - interval '19 days' + interval '1 hour'),
    (sol_ids[18], prest_ids[12], 'em_andamento', 'Van na Dutra sentido RJ. Plataforma grande acionada.', NOW() - interval '1 hour', NULL),
    (sol_ids[20], prest_ids[13], 'finalizado', 'Atendimento em Aparecida finalizado. Veículo na oficina em Guaratinguetá.', NOW() - interval '18 days', NOW() - interval '17 days' + interval '6 hours'),
    (sol_ids[22], prest_ids[14], 'em_andamento', 'Prestador de Taubaté atendendo. Cliente aguardando no posto de combustível.', NOW() - interval '5 hours', NULL),
    (sol_ids[23], prest_ids[15], 'finalizado', 'Moto esportiva transportada com cuidado extra. Entrega confirmada.', NOW() - interval '25 days', NOW() - interval '24 days' + interval '2 hours'),
    (sol_ids[25], prest_ids[16], 'em_andamento', 'Atendimento em Diadema. Caminhonete com pneu estourado na av. Conceição.', NOW() - interval '3 hours', NULL),
    (sol_ids[27], prest_ids[17], 'finalizado', 'Veículo rebocado de Cachoeira Paulista até oficina na Dutra. Sem problemas.', NOW() - interval '22 days', NOW() - interval '21 days' + interval '3 hours'),
    (sol_ids[29], prest_ids[18], 'em_andamento', 'Moto em Lorena. Prestador local acionado com previsão de 10 min.', NOW() - interval '4 hours', NULL),
    (sol_ids[30], prest_ids[19], 'finalizado', 'Atendimento em SCS concluído rapidamente. Veículo leve, sem complicações.', NOW() - interval '30 days', NOW() - interval '29 days' + interval '1 hour'),
    (sol_ids[5], prest_ids[20], 'em_andamento', 'Deslocamento de Guarulhos para São Paulo. Trânsito na Dutra.', NOW() - interval '1 hour', NULL);
  END IF;
END $$;

-- ============================================================
-- FIM DO SEED
-- ============================================================
