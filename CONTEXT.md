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
