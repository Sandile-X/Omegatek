/**
 * api.js — Central API module for Omegatek Solutions
 *
 * Supabase client is created once in supabaseClient.js and re-exported here
 * so there is a single source of truth for the credentials.
 *
 * Firebase config: projectId, appId etc. are Firebase PUBLIC identifiers
 * (like a YouTube channel ID). They are NOT secret and are designed to be
 * in client-side code. Security is enforced via Firebase Security Rules.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

// ── Supabase ────────────────────────────────────────────────────────────────
// NOTE: The anon key is a PUBLIC key by design (like an API key for a CDN).
// It does NOT grant write access — that is controlled by Row Level Security
// (RLS) policies in Supabase. The key must be present in client-side code
// for the Supabase JS client to function.
const SUPABASE_URL      = 'https://pefjkiijqratjixskmdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZmpraWlqcXJhdGppeHNrbWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MzkwNDQsImV4cCI6MjA4ODAxNTA0NH0.x6s38k7avvoszJATabbUcp2zv9kjUVYRjKPT7n-pQJA';

// ── Firebase (public identifiers — not secrets) ─────────────────────────────
const FIREBASE_CONFIG = {
    apiKey           : document.querySelector('meta[name="fb-ak"]')?.content || '',
    authDomain       : 'omegatek-products.firebaseapp.com',
    projectId        : 'omegatek-products',
    storageBucket    : 'omegatek-products.firebasestorage.app',
    messagingSenderId: '963359726483',
    appId            : '1:963359726483:web:729da448e9f17c087d6666'
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession  : true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    }
});

let firebaseAppInstance = null;
let firestoreInstance = null;

export function getPhpBase() {
    const isLocalFile = location.protocol === 'file:';
    const isAltLocalhost =
        (location.hostname === '127.0.0.1' || location.hostname === 'localhost') &&
        location.port !== '8000';

    return isLocalFile || isAltLocalhost ? 'http://127.0.0.1:8000' : '';
}

function ensureFirebase() {
    if (!firebaseAppInstance) {
        firebaseAppInstance = initializeApp(FIREBASE_CONFIG);
    }

    if (!firestoreInstance) {
        firestoreInstance = getFirestore(firebaseAppInstance);
    }

    return {
        app: firebaseAppInstance,
        db: firestoreInstance,
        collection,
        getDocs,
        addDoc,
        deleteDoc,
        doc
    };
}

export async function fetchProductsRows() {
    // NOTE: cost_price is intentionally excluded — this query is public-facing
    // (storefront catalog) and cost_price is internal wholesale/margin data.
    const { data, error } = await supabase
        .from('products')
        .select('part_no,model_no,name,description,variant_color,price,image_url,category,warranty,is_new,stock,featured,tags,supplier,created_at')
        .order('name', { ascending: true });

    if (error) {
        throw error;
    }

    return data || [];
}

export async function subscribeNewsletter({ email, name = '' }) {
    const response = await fetch(getPhpBase() + '/admin/newsletter-api.php?action=subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
    });

    return response.json();
}

export async function fetchPublishedBlogPosts() {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('id,title,slug,excerpt,category,cover_image,created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data || [];
}

export async function fetchBlogPostBySlug(slug) {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data || null;
}

export async function placeOrder(orderData) {
    const response = await fetch(getPhpBase() + '/admin/orders-api.php?action=place_order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });

    return response.json();
}

export async function fetchOrderById(orderId) {
    const response = await fetch(getPhpBase() + `/admin/orders-api.php?action=get_order&orderId=${encodeURIComponent(orderId)}`);
    return response.json();
}

export async function syncOrderToSupabase(orderData, phpOrderId) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                order_number: phpOrderId,
                customer_id: user?.id || null,
                customer_email: orderData.customer.email,
                customer_name: orderData.customer.fullName,
                customer_phone: orderData.customer.phone,
                status: 'pending',
                payment_status: 'pending',
                payment_method: orderData.paymentMethod,
                subtotal: orderData.subtotal,
                shipping_amount: orderData.deliveryFee,
                total_amount: orderData.total,
                shipping_address: JSON.stringify(orderData.address),
                notes: orderData.notes || ''
            })
            .select()
            .single();

        if (orderError || !order || !orderData.items?.length) {
            if (orderError) {
                console.warn('Supabase order sync warning:', orderError.message);
            }
            return;
        }

        const items = orderData.items.map((item) => ({
            order_id: order.id,
            product_id: item.id?.toString() || null,
            product_name: item.name,
            product_image: item.image || null,
            quantity: item.quantity ?? item.qty ?? 1,
            unit_price: item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(items);

        if (itemsError) {
            console.warn('Supabase order items sync warning:', itemsError.message);
        }
    } catch (error) {
        console.warn('Supabase sync failed (non-critical):', error.message);
    }
}

export async function getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session || null;
}

export function onSupabaseAuthChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback({ event, session, user: session?.user || null });
    });
}

export async function signInWithEmail({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        throw error;
    }
    return data;
}

export async function signUpWithEmail({ firstName, lastName, email, phone, password }) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                phone,
                full_name: `${firstName} ${lastName}`.trim()
            }
        }
    });

    if (error) {
        throw error;
    }

    if (data.session && data.user) {
        await upsertProfileRow({
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            phone
        });
    }

    return data;
}

export async function signOutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
}

export async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account-reset.html`
    });

    if (error) {
        throw error;
    }
}

export async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
        throw error;
    }
}

export async function reauthenticateUser({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        throw error;
    }
}

export async function deleteCurrentUser() {
    const { error } = await supabase.rpc('delete_user');
    if (error) {
        throw error;
    }
}

export async function fetchOrdersByEmail(email) {
    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data || [];
}

export async function fetchRepairTicketsByEmail(email) {
    // NOTE: repair_jobs (admin/js/jobs.js) is the internal staff work-board
    // and is being locked to admin-only RLS — do not read it from the
    // storefront. repair_tickets is the customer-facing table, though
    // nothing currently writes to it (no self-service booking form yet).
    const { data, error } = await supabase
        .from('repair_tickets')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data || [];
}

export async function fetchProfileRow(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        return null;
    }

    return data;
}

export async function upsertProfileRow(profile) {
    const { error } = await supabase.from('profiles').upsert(profile);
    if (error) {
        throw error;
    }
}

export async function waitForFirebase() {
    return ensureFirebase();
}

export async function addProductsToFirestore(products) {
    const { db } = ensureFirebase();

    for (const product of products) {
        const productData = {
            ...product,
            dateAdded: new Date(product.dateAdded)
        };
        delete productData.id;

        await addDoc(collection(db, 'products'), productData);
    }
}

export async function clearAllProductsFromFirestore() {
    const { db } = ensureFirebase();
    const snapshot = await getDocs(collection(db, 'products'));

    await Promise.all(
        snapshot.docs.map((snapshotItem) => deleteDoc(doc(db, 'products', snapshotItem.id)))
    );
}

export async function addProductToFirestore(productData) {
    const { db } = ensureFirebase();

    return addDoc(collection(db, 'products'), {
        ...productData,
        dateAdded: new Date()
    });
}
