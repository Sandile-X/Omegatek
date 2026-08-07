<?php
require_once __DIR__ . '/../config/csrf.php';
// Generate CSRF token on page load so JS can read it from the meta tag
$csrfToken = csrf_token();
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard | Omegatek Solutions</title>
    <meta name="robots" content="noindex, nofollow">
    <?= csrf_meta_tag() ?>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' https:; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com; img-src 'self' data: https:;">

    <link rel="stylesheet" href="../css/tailwind-built.css">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <link rel="icon" type="image/png" href="../images2/favicon.png">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="css/dashboard.css">
</head>
<body>

<!-- ═══════════════════════════════════════════════════════ -->
<!--  TOP BAR                                               -->
<!-- ═══════════════════════════════════════════════════════ -->
<div class="top-bar">
    <div class="brand">
        <img src="../images2/favicon.png" alt="Omegatek">
        <span class="brand-name">Omegatek Admin</span>
    </div>
    <div class="top-bar-right">
        <div class="user-pill">
            <div class="avatar">SM</div>
            <span>Admin</span>
        </div>
        <button class="btn-logout" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i> Logout
        </button>
        <button class="mobile-menu-btn" onclick="document.querySelector('.sidebar').classList.toggle('open')">
            <i class="fas fa-bars"></i>
        </button>
    </div>
</div>

<!-- ═══════════════════════════════════════════════════════ -->
<!--  SIDEBAR                                               -->
<!-- ═══════════════════════════════════════════════════════ -->
<aside class="sidebar">
    <p class="sidebar-label">Overview</p>
    <div class="nav-item active" data-tab="dashboard" onclick="switchTab('dashboard')">
        <i class="fas fa-th-large"></i><span>Dashboard</span>
    </div>

    <p class="sidebar-label">Store</p>
    <div class="nav-item" data-tab="orders" onclick="switchTab('orders')">
        <i class="fas fa-shopping-cart"></i><span>Orders</span>
    </div>
    <div class="nav-item" data-tab="products" onclick="switchTab('products')">
        <i class="fas fa-box"></i><span>Products</span>
    </div>

    <p class="sidebar-label">Repairs</p>
    <div class="nav-item" data-tab="jobs" onclick="switchTab('jobs')">
        <i class="fas fa-tools"></i><span>Repair Jobs</span>
    </div>

    <p class="sidebar-label">Content</p>
    <div class="nav-item" data-tab="blog" onclick="switchTab('blog')">
        <i class="fas fa-blog"></i><span>Blog Posts</span>
    </div>
    <div class="nav-item" data-tab="newsletter" onclick="switchTab('newsletter')">
        <i class="fas fa-newspaper"></i><span>Newsletter</span>
    </div>

    <p class="sidebar-label">Media</p>
    <div class="nav-item" data-tab="gallery" onclick="switchTab('gallery')">
        <i class="fas fa-images"></i><span>Gallery</span>
    </div>

    <p class="sidebar-label">Intelligence</p>
    <div class="nav-item" data-tab="gemini-ai" onclick="switchTab('gemini-ai')">
        <i class="fas fa-robot"></i><span>AI Command Centre</span>
    </div>

    <div class="sidebar-footer">
        <span class="pulse-dot"></span>
        <span>System Online</span>
    </div>
</aside>

<!-- ═══════════════════════════════════════════════════════ -->
<!--  MAIN CONTENT                                          -->
<!-- ═══════════════════════════════════════════════════════ -->
<div class="main-wrap" id="mainContentWrap">

    <!-- ─── DASHBOARD ─────────────────────────────────── -->
    <section id="dashboard" class="content-section active">

        <!-- Greeting Banner -->
        <div class="dash-greeting-banner">
            <div class="dash-greeting-text">
                <h1 class="page-title" id="dashGreeting">Good morning, Admin</h1>
                <p class="page-subtitle">Here's your business at a glance — <span id="dashDate"></span></p>
            </div>
            <div class="dash-greeting-badge">
                <i class="fas fa-bolt"></i> Last sync: <span id="lastUpdate">Now</span>
            </div>
        </div>

        <!-- Stat Cards — each clickable → goes to its section -->
        <div class="stats-grid">
            <div class="stat-card" data-accent="purple" onclick="switchTab('orders')">
                <div class="stat-icon purple"><i class="fas fa-shopping-cart"></i></div>
                <div class="stat-label">Total Orders</div>
                <div class="stat-value" id="totalOrders">0</div>
                <div class="stat-trend up" id="ordersTrend"><i class="fas fa-arrow-up"></i> <span>--</span></div>
            </div>
            <div class="stat-card" data-accent="orange" onclick="switchTab('products')">
                <div class="stat-icon orange"><i class="fas fa-box"></i></div>
                <div class="stat-label">Total Products</div>
                <div class="stat-value" id="totalProducts">0</div>
                <div class="stat-trend neutral" id="productsTrend"><i class="fas fa-database"></i> <span>Catalog</span></div>
            </div>
            <div class="stat-card" data-accent="blue" onclick="switchTab('blog')">
                <div class="stat-icon blue"><i class="fas fa-blog"></i></div>
                <div class="stat-label">Blog Posts</div>
                <div class="stat-value" id="totalBlogPosts">0</div>
                <div class="stat-trend neutral" id="blogTrend"><i class="fas fa-pen"></i> <span>Published</span></div>
            </div>
            <div class="stat-card" data-accent="green" onclick="switchTab('newsletter')">
                <div class="stat-icon green"><i class="fas fa-users"></i></div>
                <div class="stat-label">Subscribers</div>
                <div class="stat-value" id="totalSubscribers">0</div>
                <div class="stat-trend up" id="subsTrend"><i class="fas fa-arrow-up"></i> <span>Active</span></div>
            </div>
            <div class="stat-card" data-accent="sky" onclick="switchTab('jobs')">
                <div class="stat-icon sky"><i class="fas fa-tools"></i></div>
                <div class="stat-label">Active Repairs</div>
                <div class="stat-value" id="totalRepairs" style="color:#0ea5e9">0</div>
                <div class="stat-trend neutral" id="repairsTrend"><i class="fas fa-wrench"></i> <span>In queue</span></div>
            </div>
            <div class="stat-card" data-accent="pink" onclick="switchTab('gallery')">
                <div class="stat-icon pink"><i class="fas fa-images"></i></div>
                <div class="stat-label">Gallery Items</div>
                <div class="stat-value" id="totalGallery">0</div>
                <div class="stat-trend neutral"><i class="fas fa-photo-video"></i> <span>Media</span></div>
            </div>
        </div>

        <!-- Charts Row -->
        <div class="dashboard-grid-2" style="margin-bottom:24px">
            <div class="card">
                <div class="card-title"><i class="fas fa-chart-line"></i> Subscriber Growth (Last 30 days)</div>
                <div style="position:relative;height:220px">
                    <canvas id="subsChart"></canvas>
                </div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-chart-bar"></i> Orders by Status</div>
                <div style="position:relative;height:220px">
                    <canvas id="ordersChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Map + Activity Row -->
        <div class="dashboard-grid-2">
            <div class="card" style="padding:0;overflow:hidden">
                <div class="card-title" style="padding:18px 22px 12px"><i class="fas fa-map-marked-alt"></i> Newsletter Subscribers — South Africa</div>
                <div id="saMap" style="height:340px;border-radius:0 0 var(--radius) var(--radius)"></div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-clock"></i> Recent Orders</div>
                <div id="recentOrders" class="space-y-3" style="max-height:300px;overflow-y:auto">
                    <p class="text-gray-500 text-sm">No orders yet</p>
                </div>
                <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:14px">
                    <div class="card-title" style="margin-bottom:10px"><i class="fas fa-heartbeat"></i> System Status</div>
                    <div class="space-y-2">
                        <div class="status-row">
                            <span class="font-medium text-gray-700 text-sm">Store Status</span>
                            <span class="badge badge-success">Active</span>
                        </div>
                        <div class="status-row">
                            <span class="font-medium text-gray-700 text-sm">System Health</span>
                            <span class="text-green-600 text-sm"><i class="fas fa-check-circle"></i> Good</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ─── REPAIR JOBS ───────────────────────────────── -->
    <section id="jobs" class="content-section">
        <div class="section-header" style="border-left:4px solid #0ea5e9">
            <div>
                <h1 class="page-title">Repair Jobs</h1>
                <p class="page-subtitle">Track device repairs &mdash; clients can check status from their account</p>
            </div>
            <button onclick="showAddJobModal()" class="btn-primary" style="background:linear-gradient(135deg,#0ea5e9,#0284c7)">
                <i class="fas fa-plus"></i> Log New Job
            </button>
        </div>

        <div class="flex gap-2 mb-4 flex-wrap">
            <button onclick="filterJobs('all')" id="jobFilter-all" class="job-filter-btn active-filter">All</button>
            <button onclick="filterJobs('received')"    id="jobFilter-received"    class="job-filter-btn">Received</button>
            <button onclick="filterJobs('diagnosed')"   id="jobFilter-diagnosed"   class="job-filter-btn">Diagnosed</button>
            <button onclick="filterJobs('in_progress')" id="jobFilter-in_progress" class="job-filter-btn">In Progress</button>
            <button onclick="filterJobs('ready')"       id="jobFilter-ready"       class="job-filter-btn">Ready</button>
            <button onclick="filterJobs('collected')"   id="jobFilter-collected"   class="job-filter-btn">Collected</button>
        </div>

        <div id="jobsContainer" class="space-y-3">
            <div class="card text-gray-500">Loading repair jobs&hellip;</div>
        </div>
    </section>

    <!-- ─── ORDERS ────────────────────────────────────── -->
    <section id="orders" class="content-section">
        <div class="section-header">
            <div>
                <h1 class="page-title">Orders Management</h1>
                <p class="page-subtitle">View and manage customer orders</p>
            </div>
            <button onclick="location.href='pages/orders-admin.html'" class="btn-primary">
                <i class="fas fa-external-link-alt"></i> Full View
            </button>
        </div>
        <div class="card">
            <p class="text-gray-600">Loading orders...</p>
        </div>
    </section>

    <!-- ─── PRODUCTS ──────────────────────────────────── -->
    <section id="products" class="content-section">
        <div class="section-header">
            <div>
                <h1 class="page-title">Store Management</h1>
                <p class="page-subtitle">Manage your product catalog</p>
            </div>
            <button onclick="showAddProductModal()" class="btn-primary">
                <i class="fas fa-plus"></i> Add Product
            </button>
        </div>

        <!-- Sub-tabs -->
        <div class="flex gap-0 mb-5 border-b border-gray-200">
            <button id="storeTab-products" onclick="switchStoreTab('products')" class="store-tab store-tab-active">
                <i class="fas fa-th-large mr-2"></i>Products
            </button>
            <button id="storeTab-import" onclick="switchStoreTab('import')" class="store-tab">
                <i class="fas fa-file-upload mr-2"></i>Import CSV / XLSX
            </button>
            <button id="storeTab-images" onclick="switchStoreTab('images')" class="store-tab">
                <i class="fas fa-images mr-2"></i>Bulk Upload Images
            </button>
        </div>

        <!-- Products Grid Panel -->
        <div id="storePanel-products">
            <div id="productsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="card"><p class="text-gray-600">Loading products...</p></div>
            </div>
        </div>

        <!-- Import Panel -->
        <div id="storePanel-import" class="hidden">
            <p class="text-sm text-gray-500 mb-4">Upload your CSV/XLSX pricelist, or sync directly from Google Sheets. Rows are auto-filled (blank Name/Model inherits from the row above). Edit before pushing.</p>

            <!-- ── Google Sheets Sync ──────────────────────────── -->
            <div class="mb-5 p-4 rounded-xl border border-green-200 bg-green-50">
                <h4 class="font-bold text-gray-800 mb-1 flex items-center gap-2 text-sm">
                    <i class="fas fa-table text-green-600"></i> Sync from Google Sheets
                </h4>
                <p class="text-xs text-gray-500 mb-3">Make sure the sheet is shared as <strong>Anyone with the link → Viewer</strong>, then paste the CSV export URL below.</p>
                <div class="flex gap-2">
                    <input id="sheetsUrl" type="url" value="https://docs.google.com/spreadsheets/d/1K5VWvTwiXh1mlHx8Dv_oVTwDscsZil-C/edit?usp=sharing"
                        placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                        class="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-400 font-mono">
                    <button onclick="_syncFromGoogleSheets()" id="sheetsSyncBtn" class="btn-primary px-4 py-2 text-sm whitespace-nowrap flex items-center gap-2">
                        <i class="fas fa-sync"></i> Fetch &amp; Preview
                    </button>
                </div>
                <div id="sheetsStatus" class="hidden mt-2 text-xs text-red-600 font-medium"></div>
            </div>

            <div class="flex items-center gap-3 mb-5 text-xs text-gray-400">
                <div class="flex-1 border-t border-gray-200"></div>
                <span>or upload a file</span>
                <div class="flex-1 border-t border-gray-200"></div>
            </div>

            <div id="importDropZone" class="import-drop-zone" onclick="document.getElementById('importFileInput').click()" ondragover="_importDragOver(event)" ondragleave="_importDragLeave(event)" ondrop="_importDrop(event)">
                <i class="fas fa-cloud-upload-alt text-5xl text-purple-400 mb-3"></i>
                <p class="font-semibold text-gray-700 text-lg">Drop your Astrum CSV or XLSX here</p>
                <p class="text-sm text-gray-400 mt-1">or click to browse files</p>
                <p class="text-xs text-gray-400 mt-2">Supported: .csv &nbsp;&bull;&nbsp; .xlsx &nbsp;&bull;&nbsp; .xls</p>
                <input type="file" id="importFileInput" accept=".csv,.xlsx,.xls" class="hidden" onchange="_importFileSelected(event)">
            </div>
            <div id="importStatus" class="hidden mt-4 p-3 rounded-lg bg-purple-50 border border-purple-200 text-sm text-purple-700 flex items-center gap-2">
                <i class="fas fa-spinner fa-spin"></i>
                <span id="importStatusText">Parsing&hellip;</span>
            </div>
            <div id="importPreviewWrap" class="hidden mt-5">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                        <span class="font-bold text-gray-800 text-lg" id="importRowCount">0</span>
                        <span class="text-sm text-gray-500 ml-1">product rows ready</span>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <select id="importBulkCategory" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none">
                            <option value="">-- Bulk set category --</option>
                            <option>Wearables</option><option>Networking</option><option>Laptop Bags</option>
                            <option>Accessories</option><option>Camera</option><option>Lighting</option>
                            <option>TV Mounts</option><option>Mobile Holders</option>
                            <option>Cable Management</option><option>Cleaning Kits</option>
                        </select>
                        <button onclick="_applyBulkCategory()" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg">Apply to All</button>
                        <button onclick="_pushImportToSupabase()" id="importPushBtn" class="btn-primary px-5 py-1.5 text-sm">
                            <i class="fas fa-database mr-2"></i>Push to Supabase
                        </button>
                    </div>
                </div>
                <div class="import-table-wrap">
                    <table class="import-table">
                        <thead>
                            <tr>
                                <th>Part No</th><th>Model No</th><th>Name</th>
                                <th>Colour</th><th>Cost&nbsp;R</th><th>SRP&nbsp;R</th>
                                <th>Warranty</th><th>New?</th><th>Category</th>
                                <th>Supplier</th><th>Stock</th><th>&times;</th>
                            </tr>
                        </thead>
                        <tbody id="importPreviewBody"></tbody>
                    </table>
                </div>
                <div id="importResult" class="hidden mt-3 p-3 rounded-lg text-sm font-medium"></div>
            </div>
        </div>

        <!-- Images Bulk Upload Panel -->
        <div id="storePanel-images" class="hidden">
            <div class="mb-4">
                <h3 class="font-bold text-gray-800 text-lg mb-1">Bulk Image Upload</h3>
                <p class="text-sm text-gray-500">Name your image files after their <strong>Part No</strong> (e.g. <code class="bg-gray-100 px-1 rounded">A61531-B.jpg</code>). Drop as many as you like — they auto-match and upload to Supabase Storage, then update the product's image URL.</p>
            </div>
            <div id="imgDropZone" class="import-drop-zone" onclick="document.getElementById('imgFileInput').click()" ondragover="_imgDragOver(event)" ondragleave="_imgDragLeave(event)" ondrop="_imgDrop(event)">
                <i class="fas fa-photo-video text-5xl text-pink-400 mb-3"></i>
                <p class="font-semibold text-gray-700 text-lg">Drop product images here</p>
                <p class="text-sm text-gray-400 mt-1">or click to browse &mdash; select multiple files at once</p>
                <p class="text-xs text-gray-400 mt-2">JPG &bull; PNG &bull; WEBP &bull; AVIF &bull; GIF &mdash; filename = Part No</p>
                <input type="file" id="imgFileInput" accept="image/*" multiple class="hidden" onchange="_imgFilesSelected(event)">
            </div>
            <div class="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <i class="fas fa-info-circle mt-0.5 shrink-0"></i>
                <span>Images are uploaded to the <strong>product-images</strong> Supabase Storage bucket. Make sure it exists and is set to <strong>Public</strong> in Supabase &rarr; Storage.</span>
            </div>
            <div id="imgUploadList" class="hidden mt-5 space-y-2"></div>
            <div id="imgUploadSummary" class="hidden mt-3 p-3 rounded-lg text-sm font-medium"></div>
        </div>
    </section>

    <!-- ─── BLOG ──────────────────────────────────────── -->
    <section id="blog" class="content-section">
        <div class="section-header">
            <div>
                <h1 class="page-title">Blog Management</h1>
                <p class="page-subtitle">Create and manage your blog posts</p>
            </div>
            <div class="flex gap-2">
                <a href="migrate-posts.html" class="btn-outline text-sm">
                    <i class="fas fa-database"></i> Migrate Old Posts
                </a>
                <button onclick="showAddBlogModal()" class="btn-primary">
                    <i class="fas fa-plus"></i> New Post
                </button>
            </div>
        </div>
        <div id="blogContainer" class="space-y-4">
            <div class="card"><p class="text-gray-600">No blog posts yet. Create your first post!</p></div>
        </div>
    </section>

    <!-- ─── NEWSLETTER ────────────────────────────────── -->
    <section id="newsletter" class="content-section">
        <div class="section-header">
            <div>
                <h1 class="page-title">Newsletter Management</h1>
                <p class="page-subtitle">Manage subscribers and send campaigns</p>
            </div>
            <button onclick="showComposeModal()" class="btn-primary">
                <i class="fas fa-pen"></i> Compose &amp; Send
            </button>
        </div>
        <div class="stats-grid" style="margin-bottom:24px">
            <div class="stat-card" data-accent="purple">
                <div class="stat-icon purple"><i class="fas fa-users"></i></div>
                <div class="stat-label">Total Subscribers</div>
                <div class="stat-value" id="nlTotal">-</div>
            </div>
            <div class="stat-card" data-accent="green">
                <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
                <div class="stat-label">Active</div>
                <div class="stat-value" id="nlActive">-</div>
            </div>
            <div class="stat-card" data-accent="blue">
                <div class="stat-icon blue"><i class="fas fa-paper-plane"></i></div>
                <div class="stat-label">Newsletters Sent</div>
                <div class="stat-value" id="nlSent">-</div>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card">
                <div class="card-title"><i class="fas fa-users"></i> Subscribers</div>
                <div id="subscribersList" class="space-y-2 max-h-96 overflow-y-auto">
                    <p class="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-history"></i> Send History</div>
                <div id="newsletterHistory" class="space-y-3 max-h-96 overflow-y-auto">
                    <p class="text-gray-500 text-sm">No newsletters sent yet.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ─── GALLERY ───────────────────────────────────── -->
    <section id="gallery" class="content-section">
        <div class="section-header">
            <div>
                <h1 class="page-title">Gallery Management</h1>
                <p class="page-subtitle">Upload and manage media for your website</p>
            </div>
            <button onclick="document.getElementById('galleryFileInput').click()" class="btn-primary">
                <i class="fas fa-cloud-upload-alt"></i> Upload Media
            </button>
        </div>
        <input type="file" id="galleryFileInput" accept="image/*,video/*" multiple class="hidden" onchange="handleGalleryUpload(event)">

        <!-- Gallery drop zone -->
        <div id="galleryDropZone" class="import-drop-zone mb-6" onclick="document.getElementById('galleryFileInput').click()"
             ondragover="event.preventDefault();this.classList.add('drag-over')"
             ondragleave="this.classList.remove('drag-over')"
             ondrop="event.preventDefault();this.classList.remove('drag-over');handleGalleryDrop(event)">
            <i class="fas fa-images text-5xl text-purple-400 mb-3"></i>
            <p class="font-semibold text-gray-700 text-lg">Drop images or videos here</p>
            <p class="text-sm text-gray-400 mt-1">or click to browse &mdash; supports JPG, PNG, WEBP, MP4</p>
        </div>

        <div id="galleryGrid" class="gallery-grid">
            <div class="gallery-empty">
                <i class="fas fa-images"></i>
                <p>No media uploaded yet. Drop files above to get started.</p>
            </div>
        </div>
    </section>

    <!-- ─── AI COMMAND CENTRE ─────────────────────────── -->
    <section id="gemini-ai" class="content-section">

        <!-- AI Header -->
        <div class="ai-header flex items-end justify-between gap-4 flex-wrap">
            <div>
                <h1 class="page-title">AI Command Centre</h1>
                <p class="page-subtitle">Powered by OpenRouter &mdash; your intelligent business co-pilot</p>
            </div>
            <div class="flex items-end gap-3 flex-shrink-0 flex-wrap">
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Model</label>
                    <select id="aiModelSelect" class="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none bg-white shadow-sm" style="min-width:220px">
                        <option value="openai/gpt-4o-mini">&#9889; GPT-4o Mini &mdash; Fast &amp; Efficient</option>
                        <option value="openai/gpt-4o">&#128142; GPT-4o &mdash; Most Capable</option>
                        <option value="anthropic/claude-3-haiku">&#127807; Claude 3 Haiku &mdash; Balanced</option>
                        <option value="anthropic/claude-3.5-sonnet">&#129504; Claude 3.5 Sonnet &mdash; Best Quality</option>
                        <option value="meta-llama/llama-3.1-8b-instruct:free">&#127382; Llama 3.1 8B &mdash; Free Tier</option>
                        <option value="google/gemini-2.0-flash-exp:free">&#127382; Gemini 2.0 Flash &mdash; Free Tier</option>
                    </select>
                </div>
                <div class="flex items-center gap-2 pb-0.5">
                    <span id="aiStatus" class="ai-status-badge ai-status-idle">
                        <span class="ai-status-dot"></span>
                        <span id="aiStatusText">Connecting&hellip;</span>
                    </span>
                    <button onclick="runFullAutomation()" title="Run Full Automation" class="btn-primary flex items-center gap-2" style="padding:.5rem .85rem;font-size:.875rem">
                        <i class="fas fa-bolt"></i> Full Auto
                    </button>
                </div>
            </div>
        </div>

        <!-- AI Body: History + Quick Actions (left) + Chat (right) -->
        <div class="ai-body">

            <!-- Left Panel -->
            <div class="ai-left-panel">
                <button class="hist-new-btn" onclick="_hNew()">
                    <i class="fas fa-plus"></i> New Chat
                </button>

                <div id="chatHistoryList" class="flex-1 overflow-y-auto min-h-0 space-y-0.5 pr-0.5"></div>

                <div class="flex-shrink-0 border-t border-gray-200 pt-2 mt-1 space-y-1 overflow-y-auto" style="max-height:52%">
                    <p class="hist-section-lbl">Quick Actions</p>
                    <button class="ai-qa-btn" onclick="runAIAction('analyze_orders')">
                        <i class="fas fa-chart-bar text-purple-500" style="font-size:.8rem"></i>
                        <div>
                            <p class="font-semibold text-gray-700 text-xs leading-tight">Analyse Orders</p>
                            <p class="text-xs text-gray-400" style="font-size:.68rem">Priorities &amp; tasks</p>
                        </div>
                    </button>
                    <button class="ai-qa-btn" onclick="triggerBlogGeneration()">
                        <i class="fas fa-pen-nib text-blue-500" style="font-size:.8rem"></i>
                        <div>
                            <p class="font-semibold text-gray-700 text-xs leading-tight">Write Blog Post</p>
                            <p class="text-xs text-gray-400" style="font-size:.68rem">SEO-ready content</p>
                        </div>
                    </button>
                    <button class="ai-qa-btn" onclick="fillBlogFromAI()">
                        <i class="fas fa-upload text-green-500" style="font-size:.8rem"></i>
                        <div>
                            <p class="font-semibold text-gray-700 text-xs leading-tight">Publish AI Draft</p>
                            <p class="text-xs text-gray-400" style="font-size:.68rem">Push to blog editor</p>
                        </div>
                    </button>
                    <button class="ai-qa-btn" onclick="triggerNewsletterGeneration()">
                        <i class="fas fa-envelope-open-text text-pink-500" style="font-size:.8rem"></i>
                        <div>
                            <p class="font-semibold text-gray-700 text-xs leading-tight">Write Newsletter</p>
                            <p class="text-xs text-gray-400" style="font-size:.68rem">AI-crafted campaign</p>
                        </div>
                    </button>
                    <button class="ai-qa-btn" onclick="fillNewsletterFromAI()">
                        <i class="fas fa-paper-plane text-rose-500" style="font-size:.8rem"></i>
                        <div>
                            <p class="font-semibold text-gray-700 text-xs leading-tight">Send AI Drop</p>
                            <p class="text-xs text-gray-400" style="font-size:.68rem">Push draft to composer</p>
                        </div>
                    </button>
                    <button class="ai-qa-btn" onclick="runAIAction('analyze_customers')">
                        <i class="fas fa-users text-orange-500" style="font-size:.8rem"></i>
                        <div>
                            <p class="font-semibold text-gray-700 text-xs leading-tight">Customer Insights</p>
                            <p class="text-xs text-gray-400" style="font-size:.68rem">VIP &amp; re-engagement</p>
                        </div>
                    </button>
                    <button class="ai-qa-btn" onclick="runAIAction('send_reminders')">
                        <i class="fas fa-bell text-yellow-500" style="font-size:.8rem"></i>
                        <div>
                            <p class="font-semibold text-gray-700 text-xs leading-tight">Overdue Reminders</p>
                            <p class="text-xs text-gray-400" style="font-size:.68rem">Follow-up items</p>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Chat Interface -->
            <div class="ai-chat-container">
                <div id="aiMessages" class="flex-1 overflow-y-auto p-5 space-y-5" style="background:#f8fafc"></div>

                <div id="aiTyping" class="hidden px-5 py-3 border-t border-gray-100 bg-white">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm" style="background:linear-gradient(135deg,#b30ce6,#7c3aed)">
                            <i class="fas fa-robot text-white" style="font-size:.7rem"></i>
                        </div>
                        <div class="flex gap-1.5 items-center bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100">
                            <div class="dot-bounce w-2 h-2 bg-gray-400 rounded-full"></div>
                            <div class="dot-bounce w-2 h-2 bg-gray-400 rounded-full" style="animation-delay:.15s"></div>
                            <div class="dot-bounce w-2 h-2 bg-gray-400 rounded-full" style="animation-delay:.3s"></div>
                        </div>
                    </div>
                </div>

                <div class="ai-input-bar">
                    <div class="input-row">
                        <textarea id="aiManualCommand" rows="1"
                            placeholder="Ask anything about your business &mdash; orders, blog posts, newsletters, customer insights&hellip;"
                            onkeydown="handleAIInputKey(event)"
                            oninput="autoResizeTextarea(this)"></textarea>
                        <button onclick="sendManualAICommand()" id="aiSendBtn" class="send-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="hint">Enter to send &nbsp;&middot;&nbsp; Shift+Enter for new line</div>
                </div>
            </div>
        </div>
    </section>

</div><!-- /main-wrap -->

<!-- ═══════════════════════════════════════════════════════ -->
<!--  MODALS                                                -->
<!-- ═══════════════════════════════════════════════════════ -->

<!-- Add / Edit Product Modal -->
<div id="addProductModal" class="modal">
    <div class="modal-content" style="max-width:700px">
        <div class="flex items-center justify-between mb-4">
            <h2 id="productModalTitle" class="text-2xl font-bold text-gray-800">Add Product</h2>
            <button onclick="closeModal('addProductModal')" class="text-gray-500 hover:text-gray-700 text-2xl"><i class="fas fa-times"></i></button>
        </div>
        <form onsubmit="handleAddProduct(event)" class="space-y-3">
            <input type="hidden" id="productEditPartNo">
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Part No <span class="text-red-500">*</span></label>
                    <input type="text" id="productPartNo" required placeholder="e.g. A61531-B" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Model No</label>
                    <input type="text" id="productModelNo" placeholder="e.g. MT310" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Product Name <span class="text-red-500">*</span></label>
                <input type="text" id="productName" required placeholder="Smart Watch BT Calling..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea id="productDescription" rows="2" placeholder="Full product specifications..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Colour / Variant</label>
                    <input type="text" id="productColor" placeholder="Black, Blue, Silver..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select id="productCategory" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                        <option value="">-- Select --</option>
                        <option>Wearables</option><option>Networking</option><option>Laptop Bags</option>
                        <option>Accessories</option><option>Camera</option><option>Lighting</option>
                        <option>TV Mounts</option><option>Mobile Holders</option>
                        <option>Cable Management</option><option>Cleaning Kits</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Cost Price (R)</label>
                    <input type="number" id="productCostPrice" step="0.01" min="0" placeholder="0.00" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Sell Price / SRP (R) <span class="text-red-500">*</span></label>
                    <input type="number" id="productPrice" required step="0.01" min="0" placeholder="0.00" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input type="number" id="productStock" min="0" placeholder="0" value="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Warranty</label>
                    <input type="text" id="productWarranty" placeholder="12 Months" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <input type="text" id="productSupplier" value="Astrum" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input type="text" id="productImageUrl" placeholder="https://..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
            </div>
            <div class="flex items-center gap-6 py-1">
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" id="productIsNew" class="rounded"> Mark as New Arrival
                </label>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" id="productFeatured" class="rounded"> Featured
                </label>
            </div>
            <div class="flex gap-3 pt-1">
                <button type="button" onclick="closeModal('addProductModal')" class="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" id="productSubmitBtn" class="flex-1 btn-primary py-2">Save Product</button>
            </div>
        </form>
    </div>
</div>

<!-- Add Blog Post Modal -->
<div id="addBlogModal" class="modal">
    <div class="modal-content">
        <div class="flex items-center justify-between mb-4">
            <h2 id="blogModalTitle" class="text-2xl font-bold text-gray-800">Write Blog Post</h2>
            <button onclick="closeModal('addBlogModal')" class="text-gray-500 hover:text-gray-700 text-2xl"><i class="fas fa-times"></i></button>
        </div>
        <form id="blogForm" onsubmit="handleAddBlog(event)" class="space-y-4">
            <input type="hidden" id="blogEditId">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Post Title</label>
                <input type="text" id="blogTitle" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input type="text" id="blogCategory" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="General">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Excerpt <span class="text-xs text-gray-400">(optional)</span></label>
                    <input type="text" id="blogExcerpt" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Short summary...">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Cover Image URL <span class="text-xs text-gray-400">(optional)</span></label>
                <input type="url" id="blogCoverImage" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="https://... or images2/blog/filename.jpg">
                <div id="coverPreview" class="mt-2 hidden">
                    <img id="coverPreviewImg" src="" alt="Cover preview" class="h-20 rounded-lg border border-gray-200 object-cover">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <div class="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                    <div class="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
                        <button type="button" onclick="blogFmt('bold')" title="Bold" class="editor-btn"><b>B</b></button>
                        <button type="button" onclick="blogFmt('italic')" title="Italic" class="editor-btn"><i>I</i></button>
                        <button type="button" onclick="blogFmt('h2')" title="Heading 2" class="editor-btn text-xs font-bold">H2</button>
                        <button type="button" onclick="blogFmt('h3')" title="Heading 3" class="editor-btn text-xs font-bold">H3</button>
                        <button type="button" onclick="blogFmt('ul')" title="Bullet List" class="editor-btn"><i class="fas fa-list-ul"></i></button>
                        <button type="button" onclick="blogFmt('link')" title="Insert Link" class="editor-btn"><i class="fas fa-link"></i></button>
                        <button type="button" onclick="blogInsertImage()" title="Insert Image" class="editor-btn"><i class="fas fa-image"></i></button>
                        <div class="w-px bg-gray-200 mx-1"></div>
                        <button type="button" onclick="importPlainText()" title="Paste plain text and auto-format" class="editor-btn" style="color:#7c3aed;font-weight:600;font-size:.75rem">&#10022; Import Text</button>
                    </div>
                    <div id="blogEditor" contenteditable="true"
                        class="min-h-48 max-h-64 overflow-y-auto p-3 outline-none"
                        oninput="syncBlogContent()"
                        onpaste="handleEditorPaste(event)"></div>
                </div>
                <textarea id="blogContent" class="hidden"></textarea>
                <p class="text-xs text-gray-400 mt-1.5">
                    Type directly &nbsp;&bull;&nbsp; <strong>&#10022; Import Text</strong> to paste raw text &nbsp;&bull;&nbsp; Use <strong>AI Command Centre</strong> to generate a full post, then hit "Publish AI Draft"
                </p>
            </div>
            <div class="flex gap-3">
                <button type="button" onclick="saveBlogAsDraft()" class="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm">Save as Draft</button>
                <button type="submit" id="blogSubmitBtn" class="flex-1 btn-primary py-2">Publish Post</button>
            </div>
        </form>
    </div>
</div>

<!-- Add / Edit Job Modal -->
<div id="addJobModal" class="modal">
    <div class="modal-content" style="max-width:640px">
        <div class="flex items-center justify-between mb-5">
            <h2 id="jobModalTitle" class="text-2xl font-bold text-gray-800">Log Repair Job</h2>
            <button onclick="closeModal('addJobModal')" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <form id="jobForm" onsubmit="handleJobSubmit(event)" class="space-y-4">
            <input type="hidden" id="jobEditId">
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input type="text" id="jobCustomerName" required placeholder="Full name" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone / WhatsApp</label>
                    <input type="tel" id="jobPhone" placeholder="+27 ..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" id="jobEmail" placeholder="customer@email.com" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                    <select id="jobDeviceType" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white">
                        <option>Laptop</option><option>Desktop PC</option><option>Smartphone</option>
                        <option>Tablet</option><option>Gaming Console</option><option>Printer</option><option>Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Device Model</label>
                    <input type="text" id="jobDeviceModel" placeholder="e.g. HP Pavilion 15" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Problem Description</label>
                <textarea id="jobProblem" required rows="3" placeholder="Describe the issue..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (R)</label>
                    <input type="number" id="jobCost" step="0.01" placeholder="0.00" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select id="jobStatus" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white">
                        <option value="received">Received</option>
                        <option value="diagnosed">Diagnosed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="ready">Ready for Collection</option>
                        <option value="collected">Collected</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Technician Notes <span class="text-xs text-gray-400">(internal)</span></label>
                <textarea id="jobNotes" rows="2" placeholder="Internal notes..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"></textarea>
            </div>
            <div class="flex gap-3 pt-2">
                <button type="button" onclick="closeModal('addJobModal')" class="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" id="jobSubmitBtn" class="flex-1 btn-primary py-2" style="background:linear-gradient(135deg,#0ea5e9,#0284c7)">Save Job</button>
            </div>
        </form>
    </div>
</div>

<!-- Compose Newsletter Modal -->
<div id="composeModal" class="modal">
    <div class="modal-content" style="max-width:700px">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Compose Newsletter</h2>
            <button onclick="closeModal('composeModal')" class="text-gray-500 hover:text-gray-700 text-2xl"><i class="fas fa-times"></i></button>
        </div>
        <form onsubmit="handleSendNewsletter(event)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                <input type="text" id="nlSubject" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Your subject line...">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Content <span class="text-xs text-gray-400 font-normal">(use <code class="bg-gray-100 px-1 rounded text-pink-600">{{name}}</code> to personalise)</span></label>
                <div class="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                    <div class="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
                        <button type="button" onclick="nlFmt('bold')" title="Bold" class="editor-btn"><b>B</b></button>
                        <button type="button" onclick="nlFmt('italic')" title="Italic" class="editor-btn"><i>I</i></button>
                        <button type="button" onclick="nlFmt('h2')" title="Heading 2" class="editor-btn text-xs font-bold">H2</button>
                        <button type="button" onclick="nlFmt('h3')" title="Heading 3" class="editor-btn text-xs font-bold">H3</button>
                        <button type="button" onclick="nlFmt('ul')" title="Bullet List" class="editor-btn"><i class="fas fa-list-ul"></i></button>
                        <button type="button" onclick="nlFmt('link')" title="Insert Link" class="editor-btn"><i class="fas fa-link"></i></button>
                        <div class="w-px bg-gray-200 mx-1"></div>
                        <button type="button" onclick="nlFmt('cta')" title="Add CTA Button" class="editor-btn" style="color:#ec4899;font-weight:600;font-size:.75rem">&#43; CTA</button>
                        <button type="button" onclick="nlFmt('divider')" title="Horizontal rule" class="editor-btn text-xs text-gray-400">&mdash;</button>
                        <div class="w-px bg-gray-200 mx-1"></div>
                        <button type="button" onclick="nlClear()" title="Clear all content" class="editor-btn text-xs" style="color:#ef4444">&#10005; Clear</button>
                    </div>
                    <div id="nlEditor" contenteditable="true"
                        class="min-h-52 max-h-72 overflow-y-auto p-3 outline-none text-sm"
                        oninput="syncNlContent()"
                        onpaste="handleNlPaste(event)"
                        style="line-height:1.75"></div>
                </div>
                <textarea id="nlContent" class="hidden"></textarea>
                <p class="text-xs text-gray-400 mt-1.5">Format directly &nbsp;&bull;&nbsp; <strong>AI Command Centre &rarr; Write Newsletter &rarr; Send AI Drop</strong> to auto-fill &nbsp;&bull;&nbsp; <strong>Preview</strong> renders the final email</p>
            </div>
            <div class="flex gap-3">
                <button type="button" onclick="previewNewsletter()" class="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-purple-50 transition-colors">
                    <i class="fas fa-eye mr-2"></i>Preview
                </button>
                <button type="submit" id="nlSendBtn" class="flex-1 btn-primary py-2">
                    <i class="fas fa-paper-plane mr-2"></i>Send to All Subscribers
                </button>
            </div>
        </form>
    </div>
</div>

<!-- ═══════════════════════════════════════════════════════ -->
<!--  JS Modules (loaded in dependency order)               -->
<!-- ═══════════════════════════════════════════════════════ -->
<script src="js/config.js"></script>
<script src="js/ai-chat.js"></script>
<script src="js/blog.js"></script>
<script src="js/newsletter.js"></script>
<script src="js/jobs.js"></script>
<script src="js/products.js"></script>
<script src="js/orders.js"></script>
<script src="js/gallery.js"></script>
<script src="js/app.js"></script>
<script src="js/dashboard-analytics.js"></script>

</body>
</html>
