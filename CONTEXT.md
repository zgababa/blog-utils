# Contexte du domaine — @megaclaw/blog-utils

## Glossaire

### Blog Post
Un fichier `.md` ou `.mdx` stocké dans un répertoire de blog. Composé d'un **Frontmatter** et d'un **Content**.

### Frontmatter
Métadonnées YAML en en-tête d'un Blog Post. Champs requis : `title`, `description`, `publishedAt`. Champ optionnel : `cover`.

### Slug
Identifiant d'un Blog Post dérivé du nom de fichier sans extension (ex. `mon-article.md` → `mon-article`).

### Blog Client
Instance créée par `createBlogClient(blogDir)`, liée à un répertoire précis. Expose `getAllPosts`, `getPostBySlug`, `getAllSlugs`.

### Blog Directory
Répertoire du système de fichiers contenant les Blog Posts. Fourni à la création du Blog Client.

## Décisions techniques

- Le package shippe du **JS compilé** (`dist/`) et non la source TypeScript — requis pour que Next.js puisse l'importer sans erreur webpack (RSC loader incompatible avec les types TS raw).
- La compilation se fait via `tsc` (script `build`), exécuté automatiquement par `prepublishOnly` avant chaque `npm publish`.
- Publié sur npm sous `@megaclaw/blog-utils` (org `megaclaw`), accès public forcé via `publishConfig`.
- Les projets consommateurs (`loveyoumake`, `candau`, `rezon`) utilisent un thin wrapper `src/lib/blog.ts` → les pages importent toujours depuis `@/lib/blog`, jamais directement depuis le package.
