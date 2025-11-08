INSERT INTO contas (codigo, nome, tipo) VALUES
  ('1',       'Ativo',                'ativo'),
  ('1.1',     'Circulante',           'ativo'),
  ('1.1.1',   'Disponível',           'ativo'),
  ('1.1.1.01','Caixa',                'ativo'),
  ('1.1.1.02','Conta Corrente',       'ativo'),

  ('2',       'Passivo',              'passivo'),
  ('2.1',     'Circulante',           'passivo'),
  ('2.1.1',   'Cartões de Crédito',   'passivo'),
  ('2.1.1.01','Cartão Visa',          'passivo'),

  ('3',       'Patrimônio Líquido',   'patrimonio'),

  ('4',       'Receitas',             'receita'),
  ('4.1',     'Salários',             'receita'),
  ('4.2',     'Outras Receitas',      'receita'),

  ('5',       'Despesas',             'despesa'),
  ('5.1',     'Alimentação',          'despesa'),
  ('5.2',     'Moradia',              'despesa'),
  ('5.3',     'Transporte',           'despesa')
ON CONFLICT (codigo) DO NOTHING;
