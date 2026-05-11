# Casa do Apicultor — Documentação da Aplicação

---

## Descrição geral

A **Gestão de Encomendas da Casa do Apicultor** é uma aplicação web interna que centraliza o registo e acompanhamento de encomendas de produtos apícolas.

O seu objetivo principal é substituir registos manuais em papel ou folhas de cálculo, permitindo a qualquer elemento da equipa registar uma encomenda em segundos e gerar automaticamente os documentos Word necessários para o processo interno: a ordem de maquinação, as etiquetas e o documento de acabamento.

A aplicação corre localmente no computador da empresa (não precisa de internet após a instalação) e guarda todos os dados em ficheiros locais.

---

## Funcionalidades

### Registo de encomendas

- Preenche o nome do cliente, o tipo de cliente (AM, FR ou OUTRO) e a lista de produtos com quantidades e notas
- No momento do registo, a aplicação avisa automaticamente se algum produto não existe no ficheiro de mapeamento (`products_mapping.xlsx`) ou se lhe falta a quantidade de palete — para que os dados sejam completados antes de gerar documentos

### Geração automática de documentos Word

Por cada encomenda registada, são criados automaticamente **3 documentos Word**:

| Documento | Conteúdo |
|---|---|
| **Maquinação** | Ordem de produção com produtos, quantidades e quantidades por palete |
| **Etiquetas** | Etiquetas para identificação dos volumes |
| **Acabamento** | Documento de finalização do processo |

Os documentos ficam guardados em `encomendas_docs/` e podem ser descarregados a qualquer momento a partir do histórico.

### Histórico de encomendas

- Tabela com todas as encomendas registadas, ordenadas da mais recente para a mais antiga
- Filtros por número de encomenda, data, cliente, tipo de cliente e produto
- Possibilidade de editar ou apagar qualquer encomenda (os documentos Word são regenerados automaticamente na edição)
- Exportação do histórico completo para Excel

### Mapeamento de produtos

- Tabela com todos os produtos configurados, lida diretamente do ficheiro `data/products_mapping.xlsx`
- Permite adicionar, editar e apagar produtos sem sair da aplicação
- Campos: nome do produto, referência interna, categoria, quantidade por palete (AM/FR) e notas
- A quantidade por palete usa o formato `AM/FR` (ex: `20/30`), onde o primeiro valor é aplicado a clientes AM e OUTRO, e o segundo a clientes FR

### Gráficos e análise

Página dedicada com 4 gráficos interativos, todos filtráveis por período e por cliente/produto:

| Gráfico | O que mostra |
|---|---|
| Distribuição por tipo de cliente | Proporção de encomendas AM vs FR |
| Top 3 produtos vendidos | Os 3 produtos com maior quantidade encomendada |
| Evolução mensal de encomendas | Número de encomendas por mês ao longo do tempo |
| Evolução mensal de quantidade | Total de unidades encomendadas por mês |

---

## Estrutura do projeto

```
gestao-produtos-casadoapicultor/
│
├── main.py                      # Ponto de entrada — arranca o servidor
│
├── app/                         # Lógica do servidor (backend)
│   ├── config.py                # Caminhos e constantes centralizados
│   ├── models.py                # Definição dos dados recebidos pela API
│   ├── routes/                  # Endpoints da API
│   │   ├── encomendas.py        # Criar, editar, apagar, listar encomendas
│   │   ├── produtos.py          # Gerir o mapeamento de produtos
│   │   └── pages.py             # Servir as páginas HTML
│   └── services/                # Lógica de negócio
│       ├── historico.py         # Leitura e escrita do histórico (JSON)
│       ├── produtos.py          # Operações sobre o products_mapping.xlsx
│       ├── encomenda_factory.py # Construção de uma nova encomenda
│       ├── documentos.py        # Orquestração da geração dos Word
│       └── excel_export.py      # Exportação do histórico para Excel
│
├── generators/                  # Geração dos documentos Word
│   ├── _common.py               # Carregamento do mapping e utilitários partilhados
│   ├── maquinacao.py            # Gera o documento de maquinação
│   ├── etiquetas.py             # Gera o documento de etiquetas
│   └── acabamento.py            # Gera o documento de acabamento
│
├── templates/                   # Páginas HTML
│   ├── index.html               # Página principal (formulário + histórico)
│   ├── graficos.html            # Página de gráficos
│   └── mapeamento.html          # Página de mapeamento de produtos
│
├── static/                      # Ficheiros estáticos (CSS, JS, imagens)
│   ├── css/
│   │   ├── index.css            # Estilos da página principal
│   │   ├── graficos.css         # Estilos da página de gráficos
│   │   └── mapeamento.css       # Estilos da página de mapeamento
│   ├── js/
│   │   ├── ui.js                # Toast e avisos (partilhado)
│   │   ├── form.js              # Formulário de nova encomenda
│   │   ├── historico.js         # Tabela, filtros e histórico
│   │   ├── modal-editar.js      # Modal de edição de encomendas
│   │   ├── graficos.js          # Gráficos do painel da página principal
│   │   ├── graficos-page.js     # Gráficos da página dedicada /graficos
│   │   └── mapeamento.js        # Lógica da página de mapeamento
│   └── logo.png
│
├── data/                        # Dados persistentes (não apagar)
│   ├── historico.json           # Base de dados das encomendas
│   ├── products_mapping.xlsx    # Catálogo de produtos e quantidades de palete
│   ├── historico_encomendas.xlsx# Exportação Excel do histórico
│   └── doc_templates/           # Templates Word base para geração de documentos
│
├── encomendas_docs/             # Documentos Word gerados
│   ├── maquinacao/
│   ├── etiquetas/
│   └── acabamentos/
│
└── requirements.txt             # Dependências Python
```

---

## Tipos de cliente

| Tipo | Descrição | Cálculo de palete |
|---|---|---|
| **AM** | Apicultor/Melhoramento | Usa o valor antes do `/` em `qt_palete_AM_FR` |
| **FR** | França | Usa o valor depois do `/` em `qt_palete_AM_FR` |
| **OUTRO** | Outros clientes | Trata-se como AM |

---

## Ficheiros de dados importantes

### `data/historico.json`
Guarda todas as encomendas registadas. É a "base de dados" da aplicação. Não deve ser apagado.

### `data/products_mapping.xlsx`
Catálogo de produtos. Tem de estar preenchido corretamente para que os documentos Word sejam gerados com as quantidades certas. Colunas esperadas:

| Coluna | Descrição |
|---|---|
| `nome_produto` | Nome do produto (usado para fazer a correspondência com o que é digitado na encomenda) |
| `ref_interna` | Referência interna (identificador único) |
| `categoria_produto` | Categoria do produto |
| `qt_palete_AM_FR` | Quantidade por palete no formato `AM/FR` (ex: `20/30`) |
| `notas` | Notas adicionais que aparecem nos documentos |

### `data/doc_templates/`
Contém os ficheiros `.docx` que servem de base para a geração dos documentos. Não devem ser apagados nem renomeados.

---

## Tecnologias utilizadas

| Componente | Tecnologia |
|---|---|
| Servidor web | FastAPI (Python) |
| Geração de documentos Word | python-docx |
| Leitura/escrita de Excel | pandas + openpyxl |
| Frontend | HTML + CSS + JavaScript (sem frameworks) |
| Gráficos | Chart.js |
| Persistência de dados | JSON + Excel |
