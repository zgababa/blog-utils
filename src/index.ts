import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'

export type BlogFrontmatter = {
  title: string
  description: string
  publishedAt: string
  cover?: string
}

export type BlogListItem = BlogFrontmatter & {
  slug: string
}

export type BlogPost = BlogListItem & {
  content: string
  html: string
}

const SUPPORTED_EXTENSIONS = new Set(['.md', '.mdx'])

function getSlugFromFilename(fileName: string) {
  return path.basename(fileName, path.extname(fileName))
}

function normalizeFrontmatter(data: Record<string, unknown>, slug: string): BlogFrontmatter {
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const description = typeof data.description === 'string' ? data.description.trim() : ''
  const publishedAt = typeof data.publishedAt === 'string' ? data.publishedAt.trim() : ''
  const cover = typeof data.cover === 'string' ? data.cover.trim() : undefined

  if (!title || !description || !publishedAt) {
    throw new Error(`Blog post "${slug}" has incomplete frontmatter (title, description, publishedAt are required).`)
  }

  return { title, description, publishedAt, cover }
}

async function listMarkdownFiles(blogDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(blogDir, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name)))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

function sortByPublishedDate(a: BlogListItem, b: BlogListItem) {
  const aTime = Date.parse(a.publishedAt)
  const bTime = Date.parse(b.publishedAt)
  if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
    return a.title.localeCompare(b.title)
  }
  return bTime - aTime
}

async function resolvePostPath(blogDir: string, slug: string): Promise<string | null> {
  for (const ext of ['.md', '.mdx']) {
    const candidate = path.join(blogDir, `${slug}${ext}`)
    try {
      const stats = await fs.stat(candidate)
      if (stats.isFile()) return candidate
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
  return null
}

export function createBlogClient(blogDir: string) {
  async function getAllSlugs(): Promise<string[]> {
    const files = await listMarkdownFiles(blogDir)
    return files.map(getSlugFromFilename)
  }

  async function getAllPosts(): Promise<BlogListItem[]> {
    const files = await listMarkdownFiles(blogDir)
    const posts = await Promise.all(
      files.map(async (fileName) => {
        const slug = getSlugFromFilename(fileName)
        const filePath = path.join(blogDir, fileName)
        const fileContent = await fs.readFile(filePath, 'utf8')
        const { data } = matter(fileContent)
        const frontmatter = normalizeFrontmatter(data as Record<string, unknown>, slug)
        return { slug, ...frontmatter }
      }),
    )
    return posts.sort(sortByPublishedDate)
  }

  async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    const filePath = await resolvePostPath(blogDir, slug)
    if (!filePath) return null

    const fileContent = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(fileContent)
    const frontmatter = normalizeFrontmatter(data as Record<string, unknown>, slug)
    const html = await Promise.resolve(marked.parse(content))

    return { slug, ...frontmatter, content, html }
  }

  return { getAllPosts, getPostBySlug, getAllSlugs }
}
