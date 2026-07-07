

import { supabase } from './supabaseClient.js';

const TABLE = 'blog_posts';

function slugify(title = '') {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export async function fetchPublishedPosts() {
    return supabase
        .from(TABLE)
        .select('id, title, slug, excerpt, cover_image, category, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });
}

export async function fetchPostBySlug(slug) {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
    return { data, error };
}

export async function fetchAllPosts() {
    return supabase
        .from(TABLE)
        .select('id, title, slug, excerpt, cover_image, category, published, created_at')
        .order('created_at', { ascending: false });
}

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

export async function updatePost(id, updates) {
    if (!id) return { data: null, error: { message: 'Post ID is required.' } };

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

export async function deletePost(id) {
    if (!id) return { error: { message: 'Post ID is required.' } };
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    return { error };
}

export async function togglePublish(id, published) {
    return updatePost(id, { published: Boolean(published) });
}
