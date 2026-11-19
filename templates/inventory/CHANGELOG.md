# Changelog

## 1.0.0 (2026-11-14)

- feat: the engine's built-in `inventory` template as an extension (ADR 0049): its 4 collections are declared in `schema/collections/` and created by the engine when the extension is enabled; read and write them through `/api/data/<collection>`
- the template's starter rows and its install-time name prefix are not carried over: the collections start empty and keep their names
- one page, a `zveltio.view/2` tabs view with a list per collection
