# @megaclaw/blog-utils

Utilitaires pour lire des articles de blog depuis un répertoire de fichiers Markdown.

## Installation

```sh
pnpm add @megaclaw/blog-utils
```

## Usage

```ts
import { createBlogClient } from '@megaclaw/blog-utils'

const blog = createBlogClient('/path/to/your/posts')

// Tous les articles triés du plus récent au plus ancien
const posts = await blog.getAllPosts()

// Un article par son slug
const post = await blog.getPostBySlug('mon-article')

// Tous les slugs (utile pour la génération statique)
const slugs = await blog.getAllSlugs()
```

## Format des fichiers

Les fichiers `.md` et `.mdx` sont supportés. Chaque fichier doit avoir un frontmatter YAML avec les champs suivants :

```md
---
title: Mon article
description: Un résumé court.
publishedAt: "2024-06-01"
cover: /images/cover.jpg   # optionnel
---

Contenu de l'article en Markdown.
```

Le nom du fichier (sans extension) devient le **slug** de l'article.

## API

### `createBlogClient(blogDir: string)`

Crée un client lié au répertoire `blogDir`.

#### `getAllPosts(): Promise<BlogListItem[]>`

Retourne tous les articles triés par `publishedAt` décroissant. Lève une erreur si un frontmatter est incomplet.

#### `getPostBySlug(slug: string): Promise<BlogPost | null>`

Retourne l'article complet avec le contenu Markdown (`content`) et le HTML généré (`html`). Retourne `null` si le slug n'existe pas. Préfère `.md` sur `.mdx` en cas de conflit.

#### `getAllSlugs(): Promise<string[]>`

Retourne la liste de tous les slugs. Utile pour `getStaticPaths` dans Next.js / SvelteKit / Astro.

## Types

```ts
type BlogFrontmatter = {
  title: string
  description: string
  publishedAt: string
  cover?: string
}

type BlogListItem = BlogFrontmatter & { slug: string }

type BlogPost = BlogListItem & {
  content: string  // Markdown brut
  html: string     // HTML généré par marked
}
```
