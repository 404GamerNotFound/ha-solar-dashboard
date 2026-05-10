# HA Solar Dashboard Card (Português)

Um cartão Lovelace personalizado para Home Assistant no HACS com visão moderna de energia/PV baseada em imagem.

## Exemplo

![HA Solar Dashboard Card example](images/single_family_home/single_family_home.png)

## Funcionalidades

- Imagem de fundo (casa/design PV)
- Troca automática dia/noite via `sun.sun` (`*_day.png` durante o dia)
- Widgets sobrepostos com posicionamento livre em X/Y
- Layouts de casa selecionáveis da pasta `images`
- Entidades configuráveis (PV, bateria, inversor, wallbox, potência total)
- Caixas individuais podem ser ocultadas

## Instalação (HACS)

1. Adicione este repositório ao HACS como **Custom repository** do tipo **Dashboard**.
2. Instale **HA Solar Dashboard Card**.
3. Reinicie o Home Assistant (ou recarregue os recursos).
4. Adicione o cartão no Lovelace.

> Para opções completas de configuração, consulte a README padrão em inglês: [README.md](README.md)
