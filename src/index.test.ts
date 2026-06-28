import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createBlogClient } from './index.js'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'blog-test-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

async function writePost(name: string, content: string) {
  await fs.writeFile(path.join(tmpDir, name), content, 'utf8')
}

// --- getAllPosts ---

describe('getAllPosts', () => {
  it('retourne un tableau vide si le dossier nexiste pas', async () => {
    const client = createBlogClient('/nonexistent/path/to/blog')
    const posts = await client.getAllPosts()
    expect(posts).toEqual([])
  })

  it('retourne les posts avec le frontmatter à plat', async () => {
    await writePost('hello.md', `---
title: Hello
description: A test post
publishedAt: "2024-01-15"
---
# Hello World
`)
    const client = createBlogClient(tmpDir)
    const posts = await client.getAllPosts()
    expect(posts).toHaveLength(1)
    expect(posts[0]).toMatchObject({
      slug: 'hello',
      title: 'Hello',
      description: 'A test post',
      publishedAt: '2024-01-15',
    })
  })

  it('supporte les fichiers .mdx', async () => {
    await writePost('article.mdx', `---
title: MDX Article
description: An mdx post
publishedAt: "2024-03-01"
---
Content here.
`)
    const client = createBlogClient(tmpDir)
    const posts = await client.getAllPosts()
    expect(posts).toHaveLength(1)
    expect(posts[0]!.slug).toBe('article')
  })

  it('trie par publishedAt décroissant', async () => {
    await writePost('old.md', `---
title: Old
description: Older post
publishedAt: "2023-01-01"
---
`)
    await writePost('new.md', `---
title: New
description: Newer post
publishedAt: "2024-06-01"
---
`)
    const client = createBlogClient(tmpDir)
    const posts = await client.getAllPosts()
    expect(posts[0]!.slug).toBe('new')
    expect(posts[1]!.slug).toBe('old')
  })

  it('ignore les fichiers non-markdown', async () => {
    await writePost('image.png', 'binary')
    await writePost('data.json', '{}')
    await writePost('real.md', `---
title: Real
description: Real post
publishedAt: "2024-01-01"
---
`)
    const client = createBlogClient(tmpDir)
    const posts = await client.getAllPosts()
    expect(posts).toHaveLength(1)
  })

  it('lève une erreur si le frontmatter est incomplet', async () => {
    await writePost('broken.md', `---
title: No description here
---
Content.
`)
    const client = createBlogClient(tmpDir)
    await expect(client.getAllPosts()).rejects.toThrow('broken')
  })
})

// --- getPostBySlug ---

describe('getPostBySlug', () => {
  it('retourne null pour un slug inconnu', async () => {
    const client = createBlogClient(tmpDir)
    const post = await client.getPostBySlug('unknown')
    expect(post).toBeNull()
  })

  it('retourne le post complet avec html', async () => {
    await writePost('my-post.md', `---
title: My Post
description: A description
publishedAt: "2024-05-10"
cover: /images/cover.jpg
---
## Hello

This is content.
`)
    const client = createBlogClient(tmpDir)
    const post = await client.getPostBySlug('my-post')
    expect(post).not.toBeNull()
    expect(post!.slug).toBe('my-post')
    expect(post!.title).toBe('My Post')
    expect(post!.description).toBe('A description')
    expect(post!.publishedAt).toBe('2024-05-10')
    expect(post!.cover).toBe('/images/cover.jpg')
    expect(post!.content).toContain('## Hello')
    expect(post!.html).toContain('<h2')
    expect(post!.html).toContain('Hello')
  })

  it('trouve un fichier .mdx via son slug', async () => {
    await writePost('component.mdx', `---
title: MDX
description: A mdx post
publishedAt: "2024-04-01"
---
Content.
`)
    const client = createBlogClient(tmpDir)
    const post = await client.getPostBySlug('component')
    expect(post).not.toBeNull()
    expect(post!.slug).toBe('component')
  })

  it('préfère .md sur .mdx si les deux existent', async () => {
    await writePost('dual.md', `---
title: Markdown
description: md version
publishedAt: "2024-01-01"
---
`)
    await writePost('dual.mdx', `---
title: MDX
description: mdx version
publishedAt: "2024-01-01"
---
`)
    const client = createBlogClient(tmpDir)
    const post = await client.getPostBySlug('dual')
    expect(post!.title).toBe('Markdown')
  })
})

// --- getAllSlugs ---

describe('getAllSlugs', () => {
  it('retourne les slugs sans extension', async () => {
    await writePost('alpha.md', `---
title: Alpha
description: Alpha post
publishedAt: "2024-01-01"
---
`)
    await writePost('beta.mdx', `---
title: Beta
description: Beta post
publishedAt: "2024-01-01"
---
`)
    const client = createBlogClient(tmpDir)
    const slugs = await client.getAllSlugs()
    expect(slugs).toHaveLength(2)
    expect(slugs).toContain('alpha')
    expect(slugs).toContain('beta')
  })

  it('retourne un tableau vide si dossier vide', async () => {
    const client = createBlogClient(tmpDir)
    const slugs = await client.getAllSlugs()
    expect(slugs).toEqual([])
  })
})

// --- createBlogClient (isolation) ---

describe('createBlogClient', () => {
  it('utilise le blogDir passé en argument, indépendamment de process.cwd()', async () => {
    await writePost('isolated.md', `---
title: Isolated
description: Isolated post
publishedAt: "2024-01-01"
---
`)
    const client = createBlogClient(tmpDir)
    const posts = await client.getAllPosts()
    expect(posts.some((p) => p.slug === 'isolated')).toBe(true)
  })
})
