# HA Solar Dashboard Card (Español)

Una tarjeta Lovelace personalizada para Home Assistant en HACS con una vista moderna de energía/PV basada en imagen.

## Ejemplo

![HA Solar Dashboard Card example](images/home.png)

## Características

- Imagen de fondo (casa/diseño PV)
- Cambio automático día/noche mediante `sun.sun` (`*_tag.png` durante el día)
- Widgets superpuestos con posicionamiento libre X/Y
- Diseños de casa seleccionables desde la carpeta `images`
- Entidades configurables (PV, batería, inversor, wallbox, potencia total)
- Se pueden ocultar cajas individuales

## Instalación (HACS)

1. Añade este repositorio a HACS como **Custom repository** de tipo **Dashboard**.
2. Instala **HA Solar Dashboard Card**.
3. Reinicia Home Assistant (o recarga recursos).
4. Añade la tarjeta en Lovelace.

> Para todas las opciones de configuración detalladas, revisa la README estándar en inglés: [README.md](README.md)
