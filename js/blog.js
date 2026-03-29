/**
 * Blog CRUD — Supabase-backed.
 * Table: blog_posts (see supabase-blog-schema.sql)
 *
 * All admin write operations require an authenticated Supabase session.
 * Public reads use the anon key via Row Level Security (RLS) policies.
 *
 * Import style (ES module):
 *   import { fetchPublishedPosts, createPost, updatePost, deletePost, togglePublish } from '/js/blog.js';
 */

import { supabase } from './supabaseClient.js';

const TABLE = 'blog_posts';

// ── Helpers ────────────────────────────────────────────────

function slugify(title = '') {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ── Public reads ───────────────────────────────────────────

/**
 * Fetch all published posts, newest first.
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function fetchPublishedPosts() {
    return supabase
        .from(TABLE)
        .select('id, title, slug, excerpt, cover_image, category, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });
}

/**
 * Fetch a single post by its slug (for the public blog post page).
 * @param {string} slug
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function fetchPostBySlug(slug) {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
    return { data, error };
}

// ── Admin reads ────────────────────────────────────────────

/**
 * Fetch ALL posts (published + drafts) for admin dashboard.
 * Requires authenticated session.
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function fetchAllPosts() {
    return supabase
        .from(TABLE)
        .select('id, title, slug, excerpt, cover_image, category, published, created_at')
        .order('created_at', { ascending: false });
}

// ── Admin writes ───────────────────────────────────────────

/**
 * Create a new blog post.
 * @param {{ title: string, content: string, excerpt?: string, cover_image?: string, category?: string, published?: boolean }} postData
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createPost(postData) {
    const { title, content, excerpt = '', cover_image = '', category = 'General', published = false } = postData;

    if (!title || !content) {
        return { data: null, error: { message: 'Title and content are required.' } };
    }

    const slug = slugify(title) + '-' + Date.now();

    const { data, error } = await supabase
        .from(TABLE)
        .insert([{ title, slug, content, excerpt, cover_image, category, published }])
        .select()
        .single();

    return { data, error };
}

/**
 * Update an existing blog post.
 * @param {string} id  — UUID primary key
 * @param {Partial<{title, slug, content, excerpt, cover_image, category, published}>} updates
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updatePost(id, updates) {
    if (!id) return { data: null, error: { message: 'Post ID is required.' } };

    // Re-slugify if title changed
    if (updates.title && !updates.slug) {
        updates.slug = slugify(updates.title) + '-' + Date.now();
    }

    const { data, error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    return { data, error };
}

/**
 * Delete a blog post permanently.
 * @param {string} id — UUID primary key
 * @returns {Promise<{error: object|null}>}
 */
export async function deletePost(id) {
    if (!id) return { error: { message: 'Post ID is required.' } };
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    return { error };
}

/**
 * Toggle the published status of a post.
 * @param {string} id
 * @param {boolean} published
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function togglePublish(id, published) {
    return updatePost(id, { published: Boolean(published) });
}
