import {
    fetchProductsRows,
    addProductsToFirestore,
    clearAllProductsFromFirestore,
    addProductToFirestore,
    waitForFirebase
} from './api.js';
import { CartStore } from './cart.js';
import { WishlistStore } from './wishlist.js';
import { initUi, bindNewsletterForm, initProductsShellUi, openAuthModal, showAuthToast } from './ui.js';
import { initAuth, requireAuthForCheckout } from './auth.js';
import { escapeHtml } from './utils.js';

const PRODUCT_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Tech Products & Accessories',
    description: 'Browse our complete catalog of technology products, electronics, and accessories',
    url: 'https://omegatek.co.za/products.html',
    isPartOf: {
        '@type': 'WebSite',
        name: 'Omegatek Solutions',
        url: 'https://omegatek.co.za'
    },
    breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://omegatek.co.za/'
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Products',
                item: 'https://omegatek.co.za/products.html'
            }
        ]
    },
    mainEntity: {
        '@type': 'ItemList',
        numberOfItems: 70,
        itemListElement: []
    }
};

let activeManager = null;

// Shown whenever a product has no image, or its image URL fails to load
// (404, bad data, etc.) — a data URI so it never triggers its own network
// request or a broken-image icon.
const PRODUCT_IMG_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#b30ce6"/><stop offset="1" stop-color="#6d28d9"/>' +
    '</linearGradient></defs>' +
    '<rect width="200" height="200" fill="url(#g)"/>' +
    '<g fill="none" stroke="#ffffff" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" opacity="0.6">' +
    '<rect x="55" y="62" width="90" height="76" rx="8"/>' +
    '<circle cx="82" cy="88" r="7" fill="#ffffff" stroke="none"/>' +
    '<path d="M63 130l23-24 17 16 14-13 20 21"/>' +
    '</g></svg>'
);

const IMG_ERROR_ATTR = `onerror="this.onerror=null;this.src='${PRODUCT_IMG_FALLBACK}';"`;

// The current catalog import has no `category` data at all (every row is
// null). Rather than lump 431 products into one "Uncategorised" bucket —
// which also leaves the category filters/chips empty — guess a reasonable
// category (and a matching icon for the no-photo placeholder) from the
// product name. Order matters: more specific patterns first.
const CATEGORY_RULES = [
    { test: /\bwatch\b/i, category: 'Wearables', icon: 'fa-clock' },
    { test: /\bcamera|cctv|ip\s?cam|webcam/i, category: 'Cameras & Security', icon: 'fa-video' },
    { test: /joystick|gamepad|game controller/i, category: 'Gaming', icon: 'fa-gamepad' },
    { test: /bluetooth (receiver|transmitter)/i, category: 'Audio', icon: 'fa-headphones' },
    { test: /cat5e|cat6|rj45|optical fibre|network (cable|patch)/i, category: 'Networking', icon: 'fa-network-wired' },
    { test: /router|mifi|modem|\b[345]g\b.*wireless/i, category: 'Networking', icon: 'fa-wifi' },
    { test: /\blamp\b|\blight(ing)?\b/i, category: 'Lighting', icon: 'fa-lightbulb' },
    { test: /backpack|sling bag|laptop bag/i, category: 'Bags & Cases', icon: 'fa-briefcase' },
    { test: /clean(ing|er)?\s?kit|cleaning/i, category: 'Cleaning & Care', icon: 'fa-pump-soap' },
    { test: /cable\s?(organiser|organizer|holder|tie|clip)/i, category: 'Cable Management', icon: 'fa-grip-lines' },
    { test: /wall mount|tv mount/i, category: 'TV & Wall Mounts', icon: 'fa-tv' },
    { test: /\bmount\b|\bholder\b|airvent|bike.*mobile/i, category: 'Mounts & Holders', icon: 'fa-mobile-screen-button' },
    { test: /headset|soundbar|sound card|earbud|earphone|headphone|\bspeaker\b/i, category: 'Audio', icon: 'fa-headphones' },
    { test: /hdmi|\bvga\b|displayport|\bdvi\b|multi-display|docking station/i, category: 'Video & Display', icon: 'fa-display' },
    { test: /charger|charging|power ?bank|pd cable|power (cord|supply|socket)/i, category: 'Cables & Chargers', icon: 'fa-bolt' },
    { test: /\b(usb|type-c|usb-c|lightning)\b.*cable|cable.*\b(usb|type-c|lightning)\b|aux.*cable|rca.*cable/i, category: 'Cables & Chargers', icon: 'fa-bolt' },
    { test: /\bssd\b|\bhdd\b|hard drive|\bnvme\b/i, category: 'Storage', icon: 'fa-hard-drive' },
    { test: /\bddr-?\d\b|\bram\b|memory module/i, category: 'Memory (RAM)', icon: 'fa-memory' },
    { test: /\bmouse\b|mousepad/i, category: 'Computer Accessories', icon: 'fa-computer-mouse' },
    { test: /\bkeyboard\b/i, category: 'Computer Accessories', icon: 'fa-keyboard' },
    { test: /cooling.*stand|notebook lock|combination lock|barcode scanner|card reader|usb hub|extension hub|serial adapter|rs232/i, category: 'Computer Accessories', icon: 'fa-desktop' },
    { test: /\bcase\b|\bcover\b|screen protector|tempered glass/i, category: 'Phone Accessories', icon: 'fa-mobile-screen' }
];
const DEFAULT_CATEGORY = { category: 'Tech Accessories', icon: 'fa-microchip' };

function inferCategory(name) {
    const source = String(name || '');
    const match = CATEGORY_RULES.find((rule) => rule.test.test(source));
    return match ? { category: match.category, icon: match.icon } : DEFAULT_CATEGORY;
}

function injectStructuredData() {
    if (document.getElementById('productCatalogSchema')) {
        return;
    }

    const script = document.createElement('script');
    script.id = 'productCatalogSchema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(PRODUCT_SCHEMA);
    document.head.appendChild(script);
}

function initializeAos() {
    if (!window.AOS || window.innerWidth < 768) {
        return;
    }

    window.AOS.init({
        duration: 600,
        once: true,
        disable: window.innerWidth < 768
    });
}

function refreshAos() {
    if (!window.AOS || window.innerWidth < 768) {
        return;
    }

    if (typeof window.AOS.refreshHard === 'function') {
        window.AOS.refreshHard();
        return;
    }

    if (typeof window.AOS.refresh === 'function') {
        window.AOS.refresh();
    }
}

class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.userRatings = JSON.parse(localStorage.getItem('omegatek_ratings')) || {};
        this.currentView = 'grid';
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.filterFrame = null;
        this.sortBy = 'featured';
        this.filters = {
            search: '',
            categories: [],
            priceRange: { min: 0, max: 10000 },
            inStock: false,
            onSale: false,
            rating: null
        };
        this.cart = new CartStore();
        this.wishlist = new WishlistStore();
        this.filterPlaceholder = document.createComment('products-filter-placeholder');
    }

    async init() {
        injectStructuredData();
        this.showLoadingState();
        await this.loadProducts();
        this.setupEventListeners();
        this.updateCartUI();
        this.updateWishlistUI();
        this.populateFilters();
        this.renderCategoryChips();
        this.renderProducts();
        this.hideLoadingState();
        initializeAos();
    }

    renderCategoryChips() {
        const bar = document.getElementById('catChipsBar');
        if (!bar) return;
        const categories = [...new Set(this.products.map((p) => p.category))].sort((a, b) => a.localeCompare(b));
        bar.innerHTML = [
            '<button class="cat-chip active" data-cat="">All Products</button>',
            ...categories.map((cat) => `<button class="cat-chip" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`)
        ].join('');
    }

    normalizeProduct(product) {
        const tags = Array.isArray(product.tags) ? [...product.tags] : [];
        const variantColor = product.variant_color || product.variantColor || '';
        const inferred = inferCategory(product.name);
        const category = product.category || inferred.category;
        const placeholderIcon = product.category ? DEFAULT_CATEGORY.icon : inferred.icon;
        const partNo = product.part_no || product.partNo || product.sku || product.id || '';
        const modelNo = product.model_no || product.modelNo || '';

        if (variantColor && !tags.includes(variantColor)) {
            tags.push(variantColor);
        }

        if (category && !tags.includes(category)) {
            tags.push(category);
        }

        return {
            id: product.id || partNo,
            partNo,
            modelNo,
            name: product.name || 'Untitled Product',
            description: product.description || '',
            price: Number.parseFloat(product.price) || 0,
            costPrice: Number.parseFloat(product.cost_price ?? product.costPrice) || 0,
            image: product.image_url || product.image || '',
            category,
            placeholderIcon,
            warranty: product.warranty || '',
            variantColor,
            supplier: product.supplier || 'Astrum',
            rating: Number.parseFloat(product.rating) || 0,
            reviews: Number.parseInt(product.reviews, 10) || 0,
            inStock: Boolean(product.inStock ?? (Number(product.stock) > 0)),
            stockQuantity: Number.parseInt(product.stockQuantity ?? product.stock, 10) || 0,
            onSale: Boolean(product.onSale),
            isNew: Boolean(product.is_new ?? product.isNew),
            featured: Boolean(product.featured),
            tags,
            dateAdded: product.created_at ? new Date(product.created_at) : (product.dateAdded ? new Date(product.dateAdded) : new Date()),
            originalPrice: product.originalPrice ? Number.parseFloat(product.originalPrice) : null,
            specifications: product.specifications || null
        };
    }

    async loadProducts() {
        try {
            const rows = await fetchProductsRows();
            this.products = rows.map((row) => this.normalizeProduct(row));

            this.products.forEach((product) => {
                if (this.userRatings[product.id] !== undefined) {
                    product.rating = this.userRatings[product.id];
                    if (!product.reviews) {
                        product.reviews = 1;
                    }
                }
            });

            if (!this.products.length) {
                this.products = this.loadDemoProducts().map((product) => this.normalizeProduct(product));
            }

            this.filteredProducts = [...this.products];
        } catch {
            this.products = this.loadDemoProducts().map((product) => this.normalizeProduct(product));
            this.filteredProducts = [...this.products];
        }
    }

    loadDemoProducts() {
        return [
            {
                id: 'demo_001',
                partNo: 'DEMO-001',
                modelNo: 'D001',
                name: 'Demo Product',
                description: 'This is a demo product shown when product loading fails.',
                price: 99,
                costPrice: 49,
                warranty: '12 Months',
                image: PRODUCT_IMG_FALLBACK,
                category: 'Demo Category',
                rating: 4,
                reviews: 10,
                inStock: true,
                stockQuantity: 25,
                onSale: true,
                tags: ['phone', 'case', 'protection', 'wireless-charging'],
                dateAdded: new Date('2024-01-15'),
                featured: true,
                specifications: {
                    material: 'Premium TPU + PC',
                    compatibility: 'Samsung Galaxy S24 Ultra',
                    protection: 'Military Grade Drop Protection'
                }
            },
            {
                id: 'prod_002',
                partNo: 'ANK-USBC-100W-3M',
                name: 'USB-C Fast Charging Cable 3m',
                description: 'High-speed 100W charging cable with 480Mbps data transfer and braided design.',
                price: 89.99,
                image: PRODUCT_IMG_FALLBACK,
                category: 'Cables & Chargers',
                rating: 4.6,
                reviews: 156,
                inStock: true,
                stockQuantity: 50,
                onSale: false,
                featured: true,
                tags: ['cable', 'usb-c', 'charging', 'fast-charging', '100w'],
                dateAdded: new Date('2024-01-10')
            },
            {
                id: 'prod_003',
                partNo: 'SNY-WH1000XM5-BLK',
                name: 'Sony WH-1000XM5 Wireless Earbuds',
                description: 'Industry-leading noise cancellation with 30-hour battery life and premium sound quality.',
                price: 1299.99,
                originalPrice: 1599.99,
                image: PRODUCT_IMG_FALLBACK,
                category: 'Audio & Headphones',
                rating: 4.9,
                reviews: 89,
                inStock: true,
                stockQuantity: 15,
                onSale: true,
                featured: true,
                tags: ['earbuds', 'wireless', 'audio', 'noise-cancelling', 'bluetooth'],
                dateAdded: new Date('2024-01-20')
            },
            {
                id: 'prod_004',
                partNo: 'APL-MAGSAFE-WHT',
                name: 'Apple MagSafe Wireless Charger',
                description: 'Official Apple MagSafe charger with 15W fast wireless charging for iPhone 12 and later.',
                price: 649.99,
                image: PRODUCT_IMG_FALLBACK,
                category: 'Cables & Chargers',
                rating: 4.7,
                reviews: 312,
                inStock: true,
                stockQuantity: 30,
                onSale: false,
                featured: true,
                tags: ['wireless-charger', 'magsafe', 'iphone', 'apple', '15w'],
                dateAdded: new Date('2024-01-25')
            },
            {
                id: 'prod_005',
                partNo: 'LOG-MXM3S-BLK',
                name: 'Logitech MX Master 3S Wireless Mouse',
                description: 'Advanced wireless mouse with ultra-precise scrolling and ergonomic design.',
                price: 899.99,
                image: PRODUCT_IMG_FALLBACK,
                category: 'Computer Accessories',
                rating: 4.8,
                reviews: 445,
                inStock: true,
                stockQuantity: 20,
                onSale: false,
                featured: false,
                tags: ['mouse', 'wireless', 'gaming', 'productivity', 'ergonomic'],
                dateAdded: new Date('2024-01-18')
            }
        ];
    }

    showLoadingState() {
        document.getElementById('loadingSkeleton')?.classList.remove('hidden');
        document.getElementById('productsGrid')?.classList.add('hidden');
        document.getElementById('productsList')?.classList.add('hidden');
        document.getElementById('noResults')?.classList.add('hidden');
    }

    hideLoadingState() {
        const skeleton = document.getElementById('loadingSkeleton');
        if (skeleton) {
            skeleton.classList.add('hidden');
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                window.clearTimeout(this.searchTimer);
                this.searchTimer = window.setTimeout(() => {
                    this.filters.search = event.target.value.toLowerCase();
                    this.applyFilters();
                }, 300);
            });
        }

        document.getElementById('clearSearch')?.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
            }
            this.filters.search = '';
            this.applyFilters();
        });

        document.getElementById('gridView')?.addEventListener('click', () => this.setView('grid'));
        document.getElementById('listView')?.addEventListener('click', () => this.setView('list'));
        document.getElementById('sortSelect')?.addEventListener('change', (event) => {
            this.sortBy = event.target.value;
            this.applySort();
        });

        document.getElementById('minPrice')?.addEventListener('input', () => this.updatePriceFilter());
        document.getElementById('maxPrice')?.addEventListener('input', () => this.updatePriceFilter());
        document.getElementById('priceRange')?.addEventListener('input', (event) => {
            document.getElementById('maxPrice').value = event.target.value;
            this.updatePriceFilter();
        });

        document.addEventListener('change', (event) => {
            if (event.target.matches('.category-filter')) {
                this.updateCategoryFilters();
                return;
            }

            if (event.target.id === 'inStock') {
                this.filters.inStock = event.target.checked;
                this.applyFilters();
                return;
            }

            if (event.target.id === 'onSale') {
                this.filters.onSale = event.target.checked;
                this.applyFilters();
                return;
            }

            if (event.target.matches('input[name="rating"]')) {
                this.filters.rating = event.target.checked ? Number.parseInt(event.target.value, 10) : null;
                this.applyFilters();
            }
        });

        document.getElementById('clearFilters')?.addEventListener('click', () => this.clearAllFilters());
        document.getElementById('resetFilters')?.addEventListener('click', () => this.clearAllFilters());

        document.getElementById('catChipsBar')?.addEventListener('click', (event) => {
            const chip = event.target.closest('.cat-chip');
            if (!chip) return;
            document.querySelectorAll('.cat-chip').forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            const cat = chip.dataset.cat;
            this.filters.categories = cat ? [cat] : [];
            this.applyFilters();
        });

        document.getElementById('cartButton')?.addEventListener('click', () => this.openCart());
        document.getElementById('closeCart')?.addEventListener('click', () => this.closeCart());
        document.getElementById('cartOverlay')?.addEventListener('click', () => this.closeCart());
        document.getElementById('continueShoppingBtn')?.addEventListener('click', () => this.closeCart());
        document.getElementById('checkoutBtn')?.addEventListener('click', () => this.checkout());

        document.getElementById('wishlistBtn')?.addEventListener('click', () => this.showWishlist());
        document.getElementById('closeWishlist')?.addEventListener('click', () => this.closeWishlist());
        document.getElementById('wishlistOverlay')?.addEventListener('click', () => this.closeWishlist());

        document.getElementById('closeQuickView')?.addEventListener('click', () => this.closeQuickView());
        document.getElementById('quickViewModal')?.addEventListener('click', (event) => {
            if (event.target.id === 'quickViewModal') {
                this.closeQuickView();
            }
        });

        document.getElementById('scrollToTop')?.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            const scrollButton = document.getElementById('scrollToTop');
            if (!scrollButton) {
                return;
            }
            scrollButton.classList.toggle('hidden', window.pageYOffset <= 300);
        }, { passive: true });

        this.setupProductActionDelegation();
        this.setupMobileFilters();
    }

    setupProductActionDelegation() {
        document.addEventListener('click', (event) => {
            const actionElement = event.target.closest('[data-product-action]');
            if (!actionElement) {
                return;
            }

            const { productAction, productId, filterType, filterValue, quantity } = actionElement.dataset;
            event.preventDefault();

            switch (productAction) {
                case 'toggle-wishlist':
                    this.toggleWishlist(productId);
                    break;
                case 'open-quick-view':
                    this.openQuickView(productId);
                    break;
                case 'add-to-cart':
                    this.addToCart(productId);
                    break;
                case 'rate-product':
                    event.stopPropagation();
                    this.rateProduct(productId, Number.parseInt(quantity, 10));
                    break;
                case 'cart-quantity-decrease':
                case 'cart-quantity-increase':
                    this.updateCartQuantity(productId, Number.parseInt(quantity, 10));
                    break;
                case 'remove-from-cart':
                    this.removeFromCart(productId);
                    break;
                case 'wishlist-remove':
                    this.toggleWishlist(productId);
                    this.renderWishlistItems();
                    break;
                case 'remove-filter':
                    this.removeFilter(filterType, filterValue);
                    break;
                case 'quickview-add-to-cart':
                    this.addToCart(productId);
                    this.closeQuickView();
                    break;
                case 'quickview-toggle-wishlist':
                    this.toggleWishlist(productId);
                    break;
                default:
                    break;
            }
        });
    }

    setupMobileFilters() {
        const filterCard = document.querySelector('#filterSidebar > div');
        const filterSidebar = document.getElementById('filterSidebar');
        const mobileFilterOverlay = document.getElementById('mobileFilterOverlay');
        const mobileFilterPanel = document.getElementById('mobileFilterPanel');
        const mobileFilterContent = mobileFilterPanel?.querySelector('.p-4');
        const filterToggleButton = document.getElementById('filterToggleBtn');
        const closeMobileFilters = document.getElementById('closeMobileFilters');

        if (!filterCard || !filterSidebar || !mobileFilterContent || !mobileFilterOverlay || !mobileFilterPanel) {
            return;
        }

        if (!this.filterPlaceholder.parentNode) {
            filterCard.parentNode.insertBefore(this.filterPlaceholder, filterCard);
        }

        const moveFiltersToMobile = () => {
            if (window.innerWidth < 1024 && filterCard.parentElement !== mobileFilterContent) {
                mobileFilterContent.appendChild(filterCard);
            }
        };

        const restoreFiltersToDesktop = () => {
            if (window.innerWidth >= 1024 && filterCard.parentElement !== this.filterPlaceholder.parentNode) {
                this.filterPlaceholder.parentNode.insertBefore(filterCard, this.filterPlaceholder.nextSibling);
            }
        };

        const closePanel = () => {
            mobileFilterPanel.classList.add('-translate-x-full');
            window.setTimeout(() => {
                mobileFilterOverlay.classList.remove('active');
                mobileFilterOverlay.classList.add('hidden');
                restoreFiltersToDesktop();
            }, 300);
        };

        filterToggleButton?.addEventListener('click', () => {
            moveFiltersToMobile();
            mobileFilterOverlay.classList.add('active');
            mobileFilterOverlay.classList.remove('hidden');
            window.setTimeout(() => {
                mobileFilterPanel.classList.remove('-translate-x-full');
            }, 10);
        });

        closeMobileFilters?.addEventListener('click', closePanel);
        mobileFilterOverlay.addEventListener('click', (event) => {
            if (event.target === mobileFilterOverlay) {
                closePanel();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                mobileFilterOverlay.classList.remove('active');
                mobileFilterOverlay.classList.add('hidden');
                mobileFilterPanel.classList.add('-translate-x-full');
                restoreFiltersToDesktop();
            }
        });
    }

    populateFilters() {
        const categoryContainer = document.getElementById('categoryFilters');
        if (!categoryContainer) {
            return;
        }

        const categories = [...new Set(this.products.map((product) => product.category))].sort((left, right) => left.localeCompare(right));
        categoryContainer.innerHTML = categories.map((category) => `
            <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" value="${escapeHtml(category)}" class="category-filter rounded border-gray-300 text-primary focus:ring-primary mr-3">
                <span class="text-sm text-gray-700">${escapeHtml(category)}</span>
                <span class="ml-auto text-xs text-gray-500">(${this.products.filter((product) => product.category === category).length})</span>
            </label>
        `).join('');
    }

    updateCategoryFilters() {
        this.filters.categories = Array.from(document.querySelectorAll('.category-filter:checked')).map((checkbox) => checkbox.value);
        this.applyFilters();
    }

    updatePriceFilter() {
        const minValue = document.getElementById('minPrice')?.value || '';
        const maxValue = document.getElementById('maxPrice')?.value || '';

        this.filters.priceRange.min = minValue ? Number.parseFloat(minValue) : 0;
        this.filters.priceRange.max = maxValue ? Number.parseFloat(maxValue) : 10000;
        this.applyFilters();
    }

    applyFilters() {
        if (this.filterFrame) {
            cancelAnimationFrame(this.filterFrame);
        }

        this.filterFrame = requestAnimationFrame(() => {
            const searchTerm = this.filters.search;
            this.filteredProducts = this.products.filter((product) => {
                const matchesSearch = !searchTerm || [
                    product.name,
                    product.description,
                    product.partNo,
                    ...(product.tags || [])
                ].some((value) => String(value || '').toLowerCase().includes(searchTerm));

                const matchesCategory = !this.filters.categories.length || this.filters.categories.includes(product.category);
                const matchesPrice = product.price >= this.filters.priceRange.min && product.price <= this.filters.priceRange.max;
                const matchesStock = !this.filters.inStock || product.inStock;
                const matchesSale = !this.filters.onSale || product.onSale;
                const matchesRating = !this.filters.rating || product.rating >= this.filters.rating;

                return matchesSearch && matchesCategory && matchesPrice && matchesStock && matchesSale && matchesRating;
            });

            this.currentPage = 1;
            this.applySort();
        });
    }

    applySort() {
        switch (this.sortBy) {
            case 'price-low':
                this.filteredProducts.sort((left, right) => left.price - right.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((left, right) => right.price - left.price);
                break;
            case 'name-az':
                this.filteredProducts.sort((left, right) => left.name.localeCompare(right.name));
                break;
            case 'name-za':
                this.filteredProducts.sort((left, right) => right.name.localeCompare(left.name));
                break;
            case 'newest':
                this.filteredProducts.sort((left, right) => right.dateAdded - left.dateAdded);
                break;
            case 'rating':
                this.filteredProducts.sort((left, right) => right.rating - left.rating);
                break;
            default:
                this.filteredProducts.sort((left, right) => Number(right.featured) - Number(left.featured));
                break;
        }

        this.renderProducts();
    }

    setView(view) {
        this.currentView = view;
        document.querySelectorAll('.view-toggle').forEach((button) => button.classList.remove('active'));
        document.getElementById(`${view}View`)?.classList.add('active');
        this.renderProducts();
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const list = document.getElementById('productsList');
        const resultCount = document.getElementById('resultsCount');
        const noResults = document.getElementById('noResults');

        if (!grid || !list || !resultCount || !noResults) {
            return;
        }

        grid.classList.toggle('hidden', this.currentView !== 'grid');
        list.classList.toggle('hidden', this.currentView !== 'list');
        resultCount.textContent = `Showing ${this.filteredProducts.length} product${this.filteredProducts.length === 1 ? '' : 's'}`;

        if (!this.filteredProducts.length) {
            noResults.classList.remove('hidden');
            grid.classList.add('hidden');
            list.classList.add('hidden');
            return;
        }

        noResults.classList.add('hidden');

        if (this.currentView === 'grid') {
            this.renderGridView(grid);
        } else {
            this.renderListView(list);
        }

        this.updateActiveFiltersDisplay();
        refreshAos();
    }

    getSaleBadge(product) {
        return product.onSale ? '<span class="store-badge store-badge-sale">On sale</span>' : '';
    }

    renderStaticStars(rating, sizeClass = '') {
        return [1, 2, 3, 4, 5].map((index) => {
            const filled = index <= Math.round(rating);
            return `<i class="${filled ? 'fas' : 'far'} fa-star ${sizeClass}"></i>`;
        }).join('');
    }

    renderInteractiveStars(productId, rating) {
        return [1, 2, 3, 4, 5].map((index) => {
            const filled = index <= Math.round(rating);
            return `
                <i class="${filled ? 'fas' : 'far'} fa-star cursor-pointer hover:text-yellow-300 transition-colors"
                   data-product-action="rate-product"
                   data-product-id="${escapeHtml(productId)}"
                   data-quantity="${index}"
                   title="Rate ${index} star${index === 1 ? '' : 's'}"></i>
            `;
        }).join('');
    }

    getAvailabilityBadge(product) {
        if (product.inStock) {
            const label = product.stockQuantity > 0 ? `${product.stockQuantity} ready` : 'Available now';
            return `<span class="store-stock store-stock-live"><i class="fas fa-circle text-xs"></i>${escapeHtml(label)}</span>`;
        }

        return '<span class="store-stock store-stock-wait"><i class="fas fa-clock text-xs"></i>Order on request</span>';
    }

    getInventoryCopy(product) {
        if (product.inStock && product.stockQuantity > 0) {
            return `${product.stockQuantity} units in stock`;
        }

        if (product.inStock) {
            return 'Available to order';
        }

        return 'Check lead time';
    }

    renderDetailPills(product) {
        const details = [
            product.warranty || null,
            product.supplier || null,
            product.modelNo ? `Model ${product.modelNo}` : (product.partNo ? `Part ${product.partNo}` : null)
        ].filter(Boolean).slice(0, 3);

        return details.map((label) => `<span class="store-inline-pill">${escapeHtml(label)}</span>`).join('');
    }

    renderTagPills(product, limit = 2) {
        const candidates = [product.category, product.variantColor, ...(product.tags || [])].filter(Boolean);
        const tags = [...new Set(candidates)].slice(0, limit);
        return tags.map((tag) => `<span class="store-badge">${escapeHtml(tag)}</span>`).join('');
    }

    renderSpecificationGrid(product) {
        if (!product.specifications || typeof product.specifications !== 'object') {
            return '';
        }

        const entries = Object.entries(product.specifications)
            .filter(([, value]) => value !== null && value !== undefined && value !== '')
            .slice(0, 4);

        if (!entries.length) {
            return '';
        }

        return `
            <div class="store-spec-grid">
                ${entries.map(([label, value]) => `
                    <div class="store-spec-item">
                        <span>${escapeHtml(label)}</span>
                        <strong>${escapeHtml(value)}</strong>
                    </div>
                `).join('')}
            </div>
        `;
    }

    buildGridMedia(product) {
        const isWishlisted = this.isInWishlist(product.id);
        const badges = [
            product.onSale ? '<span class="prd-badge prd-badge-sale"><i class="fas fa-bolt-lightning"></i> Sale</span>' : '',
            product.isNew  ? '<span class="prd-badge prd-badge-new">New</span>' : ''
        ].filter(Boolean).join('');

        const stockHtml = product.inStock
            ? `<span class="prd-avail prd-avail-in"><span class="prd-avail-dot"></span>${product.stockQuantity > 0 ? product.stockQuantity + ' ready' : 'Available'}</span>`
            : '<span class="prd-avail prd-avail-out"><i class="fas fa-clock"></i> Order in</span>';

        const mediaContent = product.image
            ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" ${IMG_ERROR_ATTR}>`
            : `<div class="prd-img-fallback"><i class="fas ${product.placeholderIcon || 'fa-microchip'}"></i><p>${escapeHtml(product.category)}</p></div>`;

        return `
            <div class="prd-img-wrap">
                ${mediaContent}
                ${badges ? `<div class="prd-badges">${badges}</div>` : ''}
                <button class="prd-wish ${isWishlisted ? 'active' : ''}"
                        type="button"
                        data-product-action="toggle-wishlist"
                        data-product-id="${escapeHtml(product.id)}">
                    <i class="fas fa-heart"></i>
                </button>
                <div class="prd-img-foot">${stockHtml}</div>
                <div class="prd-hover-cta"><span>Quick View &nbsp;<i class="fas fa-arrow-right"></i></span></div>
            </div>
        `;
    }

    renderGridView(container) {
        container.innerHTML = this.filteredProducts.map((product) => {
            const stars = this.renderStaticStars(product.rating);
            const discount = (product.originalPrice && product.originalPrice > product.price)
                ? Math.round((1 - product.price / product.originalPrice) * 100)
                : 0;

            return `
                <article class="prd-card"
                         data-aos="fade-up"
                         data-product-action="open-quick-view"
                         data-product-id="${escapeHtml(product.id)}">
                    ${this.buildGridMedia(product)}
                    <div class="prd-body">
                        <p class="prd-cat">${escapeHtml(product.category)}</p>
                        <h3 class="prd-name">${escapeHtml(product.name)}</h3>
                        ${product.rating ? `
                        <div class="prd-stars-row">
                            <span class="prd-stars">${stars}</span>
                            <span class="prd-reviews">(${product.reviews || 0})</span>
                        </div>` : ''}
                        <div class="prd-price-row">
                            <span class="prd-price">R${product.price.toFixed(2)}</span>
                            ${product.originalPrice ? `<span class="prd-orig">R${product.originalPrice.toFixed(2)}</span>` : ''}
                            ${discount >= 10 ? `<span class="prd-disc">-${discount}%</span>` : ''}
                        </div>
                        <button class="prd-btn-cart"
                                type="button"
                                data-product-action="add-to-cart"
                                data-product-id="${escapeHtml(product.id)}">
                            <i class="fas fa-shopping-bag"></i><span>Add to Cart</span>
                        </button>
                    </div>
                </article>
            `;
        }).join('');
    }

    renderListView(container) {
        container.innerHTML = this.filteredProducts.map((product) => `
            <article class="product-card store-card store-list-card flex flex-col xl:flex-row" data-aos="fade-up">
                ${product.image ? `
                    <div class="store-list-media product-image-container">
                        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-cover" loading="lazy" ${IMG_ERROR_ATTR}>
                        <div class="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                            <span class="store-badge">${escapeHtml(product.category)}</span>
                            ${this.getSaleBadge(product)}
                        </div>
                        <div class="absolute left-4 bottom-4 z-10">
                            ${this.getAvailabilityBadge(product)}
                        </div>
                    </div>
                ` : `
                    <div class="store-list-media store-media-fallback product-image-container">
                        <div class="text-center text-white p-6">
                            <i class="fas ${product.placeholderIcon || 'fa-microchip'} text-5xl mb-3 opacity-60"></i>
                            <h4 class="text-lg font-semibold">${escapeHtml(product.name)}</h4>
                            <p class="text-sm opacity-80 mt-2">${escapeHtml(product.category)}</p>
                        </div>
                        <div class="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                            <span class="store-badge">${escapeHtml(product.category)}</span>
                            ${this.getSaleBadge(product)}
                        </div>
                    </div>
                `}

                <div class="store-card-body flex-1 flex flex-col justify-between">
                    <div>
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${this.renderTagPills(product, 3)}
                        </div>

                        <div class="flex items-start justify-between gap-4 mb-4">
                            <div class="min-w-0">
                                <p class="store-meta mb-2">${escapeHtml(product.partNo ? `Part ${product.partNo}` : product.supplier)}</p>
                                <h3 class="text-3xl font-bold text-slate-900 leading-tight">${escapeHtml(product.name)}</h3>
                            </div>
                            <button class="wishlist-btn store-icon-chip flex-shrink-0 ${this.isInWishlist(product.id) ? 'active' : ''}"
                                    type="button"
                                    data-product-action="toggle-wishlist"
                                    data-product-id="${escapeHtml(product.id)}">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>

                        <p class="text-slate-600 mb-6 text-lg leading-relaxed">${escapeHtml(product.description)}</p>

                        <div class="flex flex-wrap gap-2 mb-6">
                            ${this.renderDetailPills(product)}
                        </div>
                    </div>

                    <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                        <div>
                            <div class="flex items-center flex-wrap gap-3 mb-3">
                                ${this.renderInteractiveStars(product.id, product.rating)}
                                <span class="text-sm text-slate-500">${product.reviews || 0} reviews</span>
                            </div>
                            <div class="flex items-center gap-3 flex-wrap">
                                <span class="text-4xl font-bold text-primary">R${product.price.toFixed(2)}</span>
                                ${product.originalPrice ? `<span class="text-xl text-slate-400 line-through">R${product.originalPrice.toFixed(2)}</span>` : ''}
                                <span class="store-inventory">${escapeHtml(this.getInventoryCopy(product))}</span>
                            </div>
                        </div>

                        <div class="flex flex-wrap gap-3">
                            <button class="store-button-primary bg-primary hover:bg-secondary text-white px-6 py-3.5 shadow-lg"
                                    type="button"
                                    data-product-action="add-to-cart"
                                    data-product-id="${escapeHtml(product.id)}">
                                <i class="fas fa-shopping-cart"></i>Add to Cart
                            </button>
                            <button class="store-button-secondary store-button-secondary-outline px-5 py-3.5"
                                    type="button"
                                    data-product-action="open-quick-view"
                                    data-product-id="${escapeHtml(product.id)}">
                                <i class="fas fa-eye"></i>Quick View
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `).join('');
    }

    rateProduct(productId, rating) {
        this.userRatings[productId] = rating;
        localStorage.setItem('omegatek_ratings', JSON.stringify(this.userRatings));

        const product = this.products.find((entry) => entry.id === productId);
        if (product) {
            product.rating = rating;
            if (!product.reviews) {
                product.reviews = 1;
            }
        }

        this.applyFilters();
    }

    addToCart(productId) {
        const product = this.products.find((entry) => entry.id === productId);
        if (!product) {
            return;
        }

        this.cart.add(product);
        this.updateCartUI();
        this.showToast('cartToast');
        this.renderCartItems();
    }

    removeFromCart(productId) {
        this.cart.remove(productId);
        this.updateCartUI();
        this.renderCartItems();
    }

    updateCartQuantity(productId, quantity) {
        this.cart.updateQuantity(productId, quantity);
        this.updateCartUI();
        this.renderCartItems();
    }

    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        if (!cartCount) {
            return;
        }

        const totalItems = this.cart.getCount();
        cartCount.textContent = totalItems;
        cartCount.classList.toggle('hidden', totalItems <= 0);
    }

    openCart() {
        document.getElementById('cartSidebar')?.classList.remove('translate-x-full');
        document.getElementById('cartOverlay')?.classList.remove('hidden');
        this.renderCartItems();
    }

    closeCart() {
        document.getElementById('cartSidebar')?.classList.add('translate-x-full');
        document.getElementById('cartOverlay')?.classList.add('hidden');
    }

    renderCartItems() {
        const container = document.getElementById('cartItems');
        const emptyCart = document.getElementById('emptyCart');
        const cartFooter = document.getElementById('cartFooter');
        if (!container || !emptyCart || !cartFooter) {
            return;
        }

        const items = this.cart.getItems();
        if (!items.length) {
            container.classList.add('hidden');
            emptyCart.classList.remove('hidden');
            cartFooter.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        emptyCart.classList.add('hidden');
        cartFooter.classList.remove('hidden');

        container.innerHTML = items.map((item) => `
            <div class="flex items-center gap-4 p-4 border-b border-gray-200">
                <img src="${escapeHtml(item.image || PRODUCT_IMG_FALLBACK)}" alt="${escapeHtml(item.name)}" class="w-16 h-16 object-cover rounded-lg" loading="lazy" ${IMG_ERROR_ATTR}>
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-800">${escapeHtml(item.name)}</h4>
                    <p class="text-primary font-bold">R${item.price.toFixed(2)}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                            type="button"
                            data-product-action="cart-quantity-decrease"
                            data-product-id="${escapeHtml(item.id)}"
                            data-quantity="${item.quantity - 1}">
                        <i class="fas fa-minus text-sm"></i>
                    </button>
                    <span class="w-8 text-center font-semibold">${item.quantity}</span>
                    <button class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                            type="button"
                            data-product-action="cart-quantity-increase"
                            data-product-id="${escapeHtml(item.id)}"
                            data-quantity="${item.quantity + 1}">
                        <i class="fas fa-plus text-sm"></i>
                    </button>
                </div>
                <button class="text-red-500 hover:text-red-700 transition-colors"
                        type="button"
                        data-product-action="remove-from-cart"
                        data-product-id="${escapeHtml(item.id)}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        document.getElementById('cartTotal').textContent = `R${this.cart.getTotal().toFixed(2)}`;
    }

    checkout() {
        if (!this.cart.getItems().length) {
            window.alert('Your cart is empty.');
            return;
        }

        const proceed = (user) => {
            sessionStorage.setItem('pendingCart', JSON.stringify(this.cart.getItems()));
            if (user) {
                sessionStorage.setItem('checkoutUser', JSON.stringify({
                    email: user.email,
                    name: user.user_metadata?.full_name || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || '',
                    phone: user.user_metadata?.phone || ''
                }));
            }

            window.location.href = 'checkout.html';
        };

        if (requireAuthForCheckout(proceed)) {
            openAuthModal('login', true);
        }
    }

    toggleWishlist(productId) {
        const added = this.wishlist.toggle(productId);
        this.updateWishlistUI();
        this.renderProducts();

        if (added) {
            this.showToast('wishlistToast');
        }
    }

    isInWishlist(productId) {
        return this.wishlist.has(productId);
    }

    updateWishlistUI() {
        const wishlistCount = document.getElementById('wishlistCount');
        if (!wishlistCount) {
            return;
        }

        const total = this.wishlist.count();
        wishlistCount.textContent = total;
        wishlistCount.classList.toggle('hidden', total <= 0);
    }

    showWishlist() {
        document.getElementById('wishlistSidebar')?.classList.remove('-translate-x-full');
        document.getElementById('wishlistOverlay')?.classList.remove('hidden');
        this.renderWishlistItems();
    }

    closeWishlist() {
        document.getElementById('wishlistSidebar')?.classList.add('-translate-x-full');
        document.getElementById('wishlistOverlay')?.classList.add('hidden');
    }

    renderWishlistItems() {
        const container = document.getElementById('wishlistItems');
        const empty = document.getElementById('emptyWishlist');
        if (!container || !empty) {
            return;
        }

        const items = this.products.filter((product) => this.wishlist.has(product.id));
        if (!items.length) {
            container.classList.add('hidden');
            empty.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        empty.classList.add('hidden');
        container.innerHTML = items.map((product) => {
            const imageMarkup = product.image
                ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-cover" loading="lazy" ${IMG_ERROR_ATTR}>`
                : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500"><i class="fas ${product.placeholderIcon || 'fa-microchip'} text-white text-xl"></i></div>`;
            const stockMarkup = product.inStock
                ? '<span class="text-green-600">In Stock</span>'
                : '<span class="text-red-400">Out of Stock</span>';

            return `
                <div class="flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div class="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">${imageMarkup}</div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-gray-800 text-sm leading-snug mb-1 line-clamp-2">${escapeHtml(product.name)}</h4>
                        <p class="text-purple-600 font-bold text-sm">R${product.price.toFixed(2)}</p>
                        <p class="text-xs mt-0.5">${stockMarkup}</p>
                    </div>
                    <div class="flex flex-col gap-2 flex-shrink-0">
                        <button class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                type="button"
                                data-product-action="add-to-cart"
                                data-product-id="${escapeHtml(product.id)}">
                            <i class="fas fa-cart-plus mr-1"></i>Add
                        </button>
                        <button class="border border-red-300 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                type="button"
                                data-product-action="wishlist-remove"
                                data-product-id="${escapeHtml(product.id)}">
                            <i class="fas fa-trash-alt mr-1"></i>Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openQuickView(productId) {
        const product = this.products.find((entry) => entry.id === productId);
        if (!product) {
            return;
        }

        const content = document.getElementById('quickViewContent');
        if (!content) {
            return;
        }

        const media = product.image
            ? `
                <div class="store-media store-media-flat product-image-container">
                    <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="store-quick-view-image" loading="lazy" ${IMG_ERROR_ATTR}>
                    <div class="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                        <span class="store-badge">${escapeHtml(product.category)}</span>
                        ${this.getSaleBadge(product)}
                    </div>
                    <div class="absolute left-4 bottom-4 z-10">
                        ${this.getAvailabilityBadge(product)}
                    </div>
                </div>
            `
            : `
                <div class="store-media store-media-flat store-media-fallback product-image-container">
                    <div class="text-center text-white p-8">
                        <i class="fas ${product.placeholderIcon || 'fa-microchip'} text-6xl mb-4 opacity-60"></i>
                        <h3 class="text-2xl font-semibold">${escapeHtml(product.name)}</h3>
                        <p class="text-sm opacity-80 mt-3">${escapeHtml(product.category)}</p>
                    </div>
                </div>
            `;

        const detailPills = this.renderDetailPills(product);
        const specificationGrid = this.renderSpecificationGrid(product);

        content.innerHTML = `
            <div class="store-quick-view-grid">
                <div>
                    ${media}
                </div>
                <div class="store-panel p-6 md:p-8">
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${this.renderTagPills(product, 3)}
                    </div>
                    <p class="store-meta mb-3">${escapeHtml(product.partNo ? `Part ${product.partNo}` : product.supplier)}</p>
                    <h2 style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:800;color:var(--ot-ink,#1c1c1e);margin-bottom:1rem;line-height:1.25;">${escapeHtml(product.name)}</h2>
                    <div class="flex items-center flex-wrap gap-4 mb-6">
                        <div class="flex text-yellow-400 text-xl gap-0.5">
                            ${this.renderStaticStars(product.rating, 'mr-1')}
                        </div>
                        <span style="color:var(--ot-muted,#6c7384);font-size:1rem;">${product.reviews || 0} reviews</span>
                        ${this.getAvailabilityBadge(product)}
                    </div>
                    <p style="color:var(--ot-muted,#6c7384);font-size:1rem;line-height:1.7;margin-bottom:1.5rem;">${escapeHtml(product.description)}</p>
                    ${detailPills ? `<div class="flex flex-wrap gap-2 mb-6">${detailPills}</div>` : ''}
                    ${specificationGrid}
                    <div class="flex items-end justify-between gap-4 flex-wrap mt-8 mb-8">
                        <div class="flex items-center gap-3 flex-wrap">
                            <span style="font-size:2.8rem;font-weight:800;color:#b30ce6;line-height:1;">R${product.price.toFixed(2)}</span>
                            ${product.originalPrice ? `<span style="font-size:1.3rem;color:var(--ot-faint,#94a3b8);text-decoration:line-through;">R${product.originalPrice.toFixed(2)}</span>` : ''}
                        </div>
                        <span class="store-inventory">${escapeHtml(this.getInventoryCopy(product))}</span>
                    </div>
                    <div class="store-quick-view-actions">
                        <button style="background:linear-gradient(135deg,#b30ce6,#7c2d92);color:#fff;border:none;border-radius:14px;padding:1rem 1.5rem;font-size:1rem;font-weight:700;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 8px 28px rgba(179,12,230,0.35);transition:opacity .2s,transform .2s;"
                                onmouseover="this.style.opacity='.88';this.style.transform='translateY(-2px)'"
                                onmouseout="this.style.opacity='1';this.style.transform='none'"
                                type="button"
                                data-product-action="quickview-add-to-cart"
                                data-product-id="${escapeHtml(product.id)}">
                            <i class="fas fa-shopping-bag"></i>Add to Cart
                        </button>
                        <button class="store-button-secondary store-button-secondary-outline px-6 py-4 text-lg ${this.isInWishlist(product.id) ? 'active' : ''}"
                                type="button"
                                data-product-action="quickview-toggle-wishlist"
                                data-product-id="${escapeHtml(product.id)}">
                            <i class="fas fa-heart"></i>Save
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('quickViewModal')?.classList.remove('hidden');
    }

    closeQuickView() {
        document.getElementById('quickViewModal')?.classList.add('hidden');
    }

    showToast(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) {
            return;
        }

        toast.classList.add('show');
        window.setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    updateActiveFiltersDisplay() {
        const container = document.getElementById('activeFilters');
        if (!container) {
            return;
        }

        const activeFilters = [];
        if (this.filters.categories.length) {
            activeFilters.push(...this.filters.categories.map((category) => ({ type: 'category', value: category })));
        }
        if (this.filters.inStock) {
            activeFilters.push({ type: 'stock', value: 'In Stock' });
        }
        if (this.filters.onSale) {
            activeFilters.push({ type: 'sale', value: 'On Sale' });
        }

        container.innerHTML = activeFilters.map((filter) => `
            <span class="bg-primary text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                ${escapeHtml(filter.value)}
                <button class="hover:bg-white hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center"
                        type="button"
                        data-product-action="remove-filter"
                        data-filter-type="${escapeHtml(filter.type)}"
                        data-filter-value="${escapeHtml(filter.value)}">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </span>
        `).join('');
    }

    removeFilter(type, value) {
        switch (type) {
            case 'category':
                this.filters.categories = this.filters.categories.filter((category) => category !== value);
                document.querySelectorAll('.category-filter').forEach((checkbox) => {
                    if (checkbox.value === value) {
                        checkbox.checked = false;
                    }
                });
                break;
            case 'stock':
                this.filters.inStock = false;
                document.getElementById('inStock').checked = false;
                break;
            case 'sale':
                this.filters.onSale = false;
                document.getElementById('onSale').checked = false;
                break;
            default:
                break;
        }

        this.applyFilters();
    }

    clearAllFilters() {
        this.filters = {
            search: '',
            categories: [],
            priceRange: { min: 0, max: 10000 },
            inStock: false,
            onSale: false,
            rating: null
        };

        document.getElementById('searchInput').value = '';
        document.querySelectorAll('.category-filter').forEach((checkbox) => { checkbox.checked = false; });
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('priceRange').value = '10000';
        document.getElementById('inStock').checked = false;
        document.getElementById('onSale').checked = false;
        document.querySelectorAll('input[name="rating"]').forEach((radio) => { radio.checked = false; });
        document.querySelectorAll('.cat-chip').forEach((c) => c.classList.remove('active'));
        document.querySelector('.cat-chip[data-cat=""]')?.classList.add('active');
        this.applyFilters();
    }

    async addDemoProductsToFirestore() {
        const demoProducts = this.loadDemoProducts();
        await addProductsToFirestore(demoProducts);
        await this.loadProducts();
        this.populateFilters();
        this.renderProducts();
    }

    async clearProductsFromFirestore() {
        await clearAllProductsFromFirestore();
        await this.loadProducts();
        this.populateFilters();
        this.renderProducts();
    }

    async addProductToFirestore(productData) {
        const docReference = await addProductToFirestore(productData);
        await this.loadProducts();
        this.populateFilters();
        this.renderProducts();
        return docReference.id;
    }

    async waitForFirebase() {
        return waitForFirebase();
    }
}

function bindAdminHelpers() {
    window.adminHelpers = {
        addDemoProducts: async () => {
            if (!activeManager) {
                throw new Error('ProductManager is not initialized yet.');
            }
            await activeManager.addDemoProductsToFirestore();
        },
        clearAllProducts: async () => {
            if (!activeManager) {
                throw new Error('ProductManager is not initialized yet.');
            }
            const confirmed = window.confirm('Are you sure you want to delete ALL products from Firestore? This cannot be undone.');
            if (!confirmed) {
                return;
            }
            await activeManager.clearProductsFromFirestore();
        },
        addProduct: async (productData) => {
            if (!activeManager) {
                throw new Error('ProductManager is not initialized yet.');
            }
            return activeManager.addProductToFirestore(productData);
        }
    };
}

const CONSTRUCTION_BANNER_KEY = 'omegatek_construction_banner_dismissed';

function initConstructionBanner() {
    const banner = document.getElementById('storeConstructionBanner');
    const dismissBtn = document.getElementById('dismissConstructionBanner');
    if (!banner) {
        return;
    }

    if (window.sessionStorage.getItem(CONSTRUCTION_BANNER_KEY) === 'true') {
        banner.classList.add('is-dismissed');
        return;
    }

    dismissBtn?.addEventListener('click', () => {
        banner.classList.add('is-dismissed');
        window.sessionStorage.setItem(CONSTRUCTION_BANNER_KEY, 'true');
    });
}

async function bootstrapProductsPage() {
    if (!document.getElementById('productsGrid')) {
        return;
    }

    initConstructionBanner();
    await initUi();
    await initAuth();
    bindNewsletterForm();
    initProductsShellUi();

    activeManager = new ProductManager();
    window.productManager = activeManager;
    bindAdminHelpers();
    await activeManager.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapProductsPage, { once: true });
} else {
    bootstrapProductsPage();
}

export { ProductManager, bootstrapProductsPage };
