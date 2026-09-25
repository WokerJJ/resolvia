# ADR 0011 — Licencia AGPL-3.0 con opción de licencia comercial

**Estado:** Aceptada · **Fecha:** 2026-09-25

> Este documento explica una decisión del proyecto; **no es asesoría legal**. Antes de firmar contratos comerciales conviene consultarlo con un abogado.

## Contexto

Resolvia se publicó bajo la licencia MIT. La MIT permite que cualquiera tome el código, lo modifique y lo ofrezca como servicio en la nube sin compartir nada de vuelta. Como uno de los modelos previstos es precisamente vender Resolvia como servicio o como instalación con soporte, una licencia tan permisiva permitiría que un tercero compita con el propio proyecto usando su código sin aportar nada.

## Decisión

- El proyecto pasa a la **GNU Affero General Public License v3.0 (AGPL-3.0)**.
- La AGPL mantiene el código abierto: cualquiera puede usarlo, estudiarlo, modificarlo e instalarlo en su organización. A diferencia de la GPL, su sección 13 obliga a quien ofrezca una versión modificada **a través de una red** (por ejemplo, como servicio en la nube) a poner el código de sus modificaciones a disposición de sus usuarios.
- **Licencia dual:** además de la AGPL, el autor puede ofrecer una **licencia comercial** a organizaciones que quieran usar o modificar Resolvia sin las obligaciones de la AGPL. Se solicita contactando al autor.

## Consecuencias

- Instituciones y empresas pueden usar Resolvia libremente en sus instalaciones; si ofrecen una versión modificada como servicio, deben publicar sus cambios.
- Para poder seguir ofreciendo la licencia comercial, el autor debe tener los derechos sobre todo el código. Por eso, aceptar contribuciones externas requerirá un **acuerdo de contribución (CLA)** en el que el contribuidor otorgue esos derechos.
- Casi todas las dependencias actuales usan licencias permisivas (MIT, Apache 2.0, BSD, ISC). Algunas herramientas de desarrollo y compilación usan licencias con copyleft débil: `lightningcss` (MPL-2.0) y `elkjs` (EPL-2.0, dentro de Prisma Studio). Antes de empaquetar la versión on-premise se revisará la compatibilidad de todo lo que se distribuya, y cada dependencia nueva debe revisarse con ese criterio.
- Las versiones ya publicadas bajo MIT siguen disponibles bajo MIT para quien las obtuvo; la AGPL aplica desde este cambio en adelante.
- Algunas empresas evitan el software AGPL por política interna; para ellas existe la licencia comercial.
- **La licencia cubre el código, no la marca.** El nombre "Resolvia" y su logo quedan reservados: el README lo indica en la sección "Marca", apoyándose en la sección 7 de la AGPL, que permite negar derechos sobre marcas. Una versión modificada debe usar otro nombre. Para una protección legal efectiva del nombre, habría que registrar la marca ante la Superintendencia de Industria y Comercio (SIC) si el proyecto se comercializa.
