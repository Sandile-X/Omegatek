/* ═══════════════════════════════════════════════════════════
   products.js — Products CRUD, CSV/XLSX import, bulk images
   ═══════════════════════════════════════════════════════════ */

async function loadProducts() {
    try {
        const { data: products, error } = await _sb
            .from('products')
            .select('part_no,model_no,name,variant_color,price,cost_price,warranty,is_new,category,stock,featured,image_url,supplier')
            .order('name', { ascending: true });
        if (error) throw error;
        const list = products || [];
        document.getElementById('totalProducts').textContent = list.length;
        renderProductsGrid(list);
    } catch (err) {
        console.warn('Products load error:', err);
        document.getElementById('productsContainer').innerHTML =
            '<div class="card"><p class="text-red-500 text-sm">Could not load products: ' + escHtml(err.message) +
            '</p><p class="text-xs text-gray-400 mt-1">Run products-v2-migration.sql in Supabase first.</p></div>';
    }
}

function renderProductsGrid(products) {
    const el = document.getElementById('productsContainer');
    if (!products.length) {
        el.innerHTML = '<div class="card text-center py-10"><i class="fas fa-box-open text-4xl text-gray-300 mb-3"></i><p class="text-gray-500">No products yet. Use Import CSV/XLSX to bulk load your pricelist.</p></div>';
        return;
    }
    el.innerHTML = products.map(function(p) {
        const price = p.price ? 'R' + Number(p.price).toFixed(2) : '\u2014';
        const cost  = p.cost_price ? '<span class="text-xs text-gray-400">Cost: R' + Number(p.cost_price).toFixed(2) + '</span>' : '';
        const newBadge = p.is_new ? '<span class="new-badge ml-1">NEW</span>' : '';
        const chip  = p.variant_color ? '<span class="variant-chip">' + escHtml(p.variant_color) + '</span>' : '';
        const cat   = p.category ? '<span class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">' + escHtml(p.category) + '</span>' : '';
        const warr  = p.warranty ? '<span class="text-xs text-gray-400">\u23f1 ' + escHtml(p.warranty) + '</span>' : '';
        return '<div class="card flex flex-col gap-2">' +
            '<div class="flex items-start justify-between gap-2">' +
                '<div class="flex-1 min-w-0">' +
                    '<div class="flex items-center gap-1.5 mb-0.5">' +
                        '<span class="text-xs text-gray-400 font-mono">' + escHtml(p.part_no) + '</span>' + newBadge +
                    '</div>' +
                    '<h3 class="font-bold text-gray-800 text-sm leading-tight">' + escHtml(p.name) + '</h3>' +
                    '<div class="mt-1">' + chip + '</div>' +
                '</div>' +
                '<div class="text-right shrink-0">' +
                    '<div class="font-bold text-purple-700">' + price + '</div>' + cost +
                '</div>' +
            '</div>' +
            '<div class="flex items-center gap-2 flex-wrap">' + cat + warr + '</div>' +
            '<div class="flex gap-2 mt-1">' +
                '<button onclick="editProduct(' + JSON.stringify(p.part_no) + ')" class="flex-1 px-2 py-1 text-xs rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors">Edit</button>' +
                '<button onclick="deleteProduct(' + JSON.stringify(p.part_no) + ')" class="px-2 py-1 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors">Delete</button>' +
            '</div>' +
        '</div>';
    }).join('');
}

function showAddProductModal() {
    document.getElementById('productEditPartNo').value = '';
    document.getElementById('productPartNo').value = '';
    document.getElementById('productPartNo').disabled = false;
    document.getElementById('productModelNo').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productColor').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productCostPrice').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '0';
    document.getElementById('productWarranty').value = '';
    document.getElementById('productSupplier').value = 'Astrum';
    document.getElementById('productImageUrl').value = '';
    document.getElementById('productIsNew').checked = false;
    document.getElementById('productFeatured').checked = false;
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productSubmitBtn').textContent = 'Save Product';
    document.getElementById('addProductModal').classList.add('active');
}

async function handleAddProduct(e) {
    e.preventDefault();
    const btn = document.getElementById('productSubmitBtn');
    const origText = btn.textContent;
    btn.disabled = true; btn.textContent = 'Saving...';
    const editPartNo = document.getElementById('productEditPartNo').value.trim();
    const row = {
        part_no:       document.getElementById('productPartNo').value.trim(),
        model_no:      document.getElementById('productModelNo').value.trim() || null,
        name:          document.getElementById('productName').value.trim(),
        description:   document.getElementById('productDescription').value.trim() || null,
        variant_color: document.getElementById('productColor').value.trim() || null,
        category:      document.getElementById('productCategory').value || null,
        cost_price:    parseFloat(document.getElementById('productCostPrice').value) || null,
        price:         parseFloat(document.getElementById('productPrice').value) || 0,
        stock:         parseInt(document.getElementById('productStock').value) || 0,
        warranty:      document.getElementById('productWarranty').value.trim() || null,
        supplier:      document.getElementById('productSupplier').value.trim() || 'Astrum',
        image_url:     document.getElementById('productImageUrl').value.trim() || null,
        is_new:        document.getElementById('productIsNew').checked,
        featured:      document.getElementById('productFeatured').checked
    };
    try {
        const { error } = editPartNo
            ? await _sb.from('products').update(row).eq('part_no', editPartNo)
            : await _sb.from('products').upsert([row], { onConflict: 'part_no' });
        if (error) throw error;
        closeModal('addProductModal');
        loadProducts();
    } catch (err) {
        alert('Save failed: ' + err.message);
    } finally {
        btn.disabled = false; btn.textContent = origText;
    }
}

async function editProduct(partNo) {
    const { data, error } = await _sb.from('products').select('*').eq('part_no', partNo).single();
    if (error || !data) { alert('Could not load product: ' + (error ? error.message : 'Not found')); return; }
    document.getElementById('productEditPartNo').value = data.part_no;
    document.getElementById('productPartNo').value = data.part_no;
    document.getElementById('productPartNo').disabled = true;
    document.getElementById('productModelNo').value = data.model_no || '';
    document.getElementById('productName').value = data.name || '';
    document.getElementById('productDescription').value = data.description || '';
    document.getElementById('productColor').value = data.variant_color || '';
    document.getElementById('productCategory').value = data.category || '';
    document.getElementById('productCostPrice').value = data.cost_price || '';
    document.getElementById('productPrice').value = data.price || '';
    document.getElementById('productStock').value = data.stock || 0;
    document.getElementById('productWarranty').value = data.warranty || '';
    document.getElementById('productSupplier').value = data.supplier || 'Astrum';
    document.getElementById('productImageUrl').value = data.image_url || '';
    document.getElementById('productIsNew').checked = !!data.is_new;
    document.getElementById('productFeatured').checked = !!data.featured;
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    document.getElementById('productSubmitBtn').textContent = 'Save Changes';
    document.getElementById('addProductModal').classList.add('active');
}

async function deleteProduct(partNo) {
    if (!confirm('Delete product ' + partNo + '? This cannot be undone.')) return;
    const { error } = await _sb.from('products').delete().eq('part_no', partNo);
    if (error) { alert('Delete failed: ' + error.message); return; }
    loadProducts();
}

// ── Store sub-tab switching ─────────────────────────────────
function switchStoreTab(tab) {
    ['products','import','images'].forEach(function(t) {
        document.getElementById('storePanel-' + t).classList.toggle('hidden', t !== tab);
        document.getElementById('storeTab-' + t).classList.toggle('store-tab-active', t === tab);
    });
    if (tab === 'products') loadProducts();
}

// ── Bulk Image Upload Engine ──────────────────────────
const _IMG_BUCKET = 'product-images';

function _imgDragOver(e) {
    e.preventDefault();
    document.getElementById('imgDropZone').classList.add('drag-over');
}
function _imgDragLeave() {
    document.getElementById('imgDropZone').classList.remove('drag-over');
}
function _imgDrop(e) {
    e.preventDefault();
    document.getElementById('imgDropZone').classList.remove('drag-over');
    if (e.dataTransfer.files.length) _bulkUploadImages(Array.from(e.dataTransfer.files));
}
function _imgFilesSelected(e) {
    if (e.target.files.length) _bulkUploadImages(Array.from(e.target.files));
    e.target.value = '';
}

async function _bulkUploadImages(files) {
    const imgFiles = files.filter(function(f) { return f.type.startsWith('image/'); });
    if (!imgFiles.length) { alert('No image files selected.'); return; }

    const listEl    = document.getElementById('imgUploadList');
    const summaryEl = document.getElementById('imgUploadSummary');
    listEl.innerHTML = '';
    listEl.classList.remove('hidden');
    summaryEl.classList.add('hidden');

    let knownParts = {};
    try {
        const { data } = await _sb.from('products').select('part_no').order('part_no');
        (data || []).forEach(function(r) { knownParts[r.part_no.toUpperCase()] = r.part_no; });
    } catch(e) {}

    let matched = 0, unmatched = [], errors = [];

    for (let i = 0; i < imgFiles.length; i++) {
        const file     = imgFiles[i];
        const ext      = file.name.split('.').pop();
        const baseName = file.name.replace(/\.[^.]+$/, '').trim();
        const partKey  = baseName.toUpperCase();
        const realPart = knownParts[partKey] || baseName;
        const isKnown  = !!knownParts[partKey];

        const rowDiv = document.createElement('div');
        rowDiv.className = 'flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm';
        rowDiv.innerHTML =
            '<span class="font-mono text-gray-600 w-40 shrink-0 truncate" title="' + escHtml(file.name) + '">' + escHtml(file.name) + '</span>' +
            (isKnown
                ? '<span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-semibold">Matched: ' + escHtml(realPart) + '</span>'
                : '<span class="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold">No match \u2014 still uploading</span>') +
            '<span id="imgRow_' + i + '" class="ml-auto text-gray-400"><i class="fas fa-spinner fa-spin"></i></span>';
        listEl.appendChild(rowDiv);

        try {
            const storagePath = realPart + '.' + ext;
            const { error: uploadErr } = await _sb.storage
                .from(_IMG_BUCKET)
                .upload(storagePath, file, { upsert: true, contentType: file.type });
            if (uploadErr) throw uploadErr;

            const { data: urlData } = _sb.storage.from(_IMG_BUCKET).getPublicUrl(storagePath);
            const publicUrl = urlData?.publicUrl;

            if (isKnown && publicUrl) {
                const { error: updateErr } = await _sb.from('products')
                    .update({ image_url: publicUrl })
                    .eq('part_no', realPart);
                if (updateErr) throw updateErr;
                matched++;
                document.getElementById('imgRow_' + i).innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
            } else {
                unmatched.push(file.name);
                document.getElementById('imgRow_' + i).innerHTML = '<span class="text-amber-500" title="Uploaded, but no product found with this name">\u2714 uploaded (no product match)</span>';
            }
        } catch (err) {
            errors.push(file.name + ': ' + err.message);
            document.getElementById('imgRow_' + i).innerHTML = '<span class="text-red-500" title="' + escHtml(err.message) + '">\u2716 error</span>';
        }
    }

    summaryEl.classList.remove('hidden');
    if (!errors.length) {
        summaryEl.className = 'mt-3 p-3 rounded-lg text-sm font-medium bg-green-50 border border-green-200 text-green-800';
        summaryEl.innerHTML = '\u2705 Done! <strong>' + matched + '</strong> product image(s) updated in Supabase.' +
            (unmatched.length ? ' <strong>' + unmatched.length + '</strong> uploaded to Storage without a matching product (check filenames match Part No exactly).' : '');
    } else {
        summaryEl.className = 'mt-3 p-3 rounded-lg text-sm font-medium bg-red-50 border border-red-200 text-red-800';
        summaryEl.innerHTML = '\u26a0\ufe0f ' + matched + ' updated, ' + errors.length + ' error(s): ' + errors.slice(0,3).map(escHtml).join('; ');
    }
    document.getElementById('storeTab-products').classList.contains('store-tab-active') && loadProducts();
}

// ── CSV / XLSX Import Engine ────────────────────────────────
let _importRows = [];

function _importDragOver(e) {
    e.preventDefault();
    document.getElementById('importDropZone').classList.add('drag-over');
}
function _importDragLeave(e) {
    document.getElementById('importDropZone').classList.remove('drag-over');
}
function _importDrop(e) {
    e.preventDefault();
    document.getElementById('importDropZone').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) _parseSupplierFile(file);
}
function _importFileSelected(e) {
    const file = e.target.files[0];
    if (file) _parseSupplierFile(file);
}

function _parsePriceStr(s) {
    if (!s) return null;
    const n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
}

function _parseSupplierFile(file) {
    const statusEl = document.getElementById('importStatus');
    const statusTxtEl = document.getElementById('importStatusText');
    statusEl.classList.remove('hidden');
    statusTxtEl.textContent = 'Reading ' + escHtml(file.name) + '...';
    document.getElementById('importPreviewWrap').classList.add('hidden');

    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            statusTxtEl.textContent = 'Parsing spreadsheet...';
            const data = new Uint8Array(ev.target.result);
            const wb   = XLSX.read(data, { type: 'array' });
            const ws   = wb.Sheets[wb.SheetNames[0]];
            const raw  = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            const rows = _normalizeSupplierRows(raw);
            _importRows = rows;
            _renderImportPreview(rows);
            statusEl.classList.add('hidden');
        } catch (err) {
            statusTxtEl.textContent = 'Parse error: ' + err.message;
            statusEl.style.background = '#fef2f2';
            statusEl.style.borderColor = '#fecaca';
            statusEl.style.color = '#dc2626';
            statusEl.querySelector('i').className = 'fas fa-exclamation-circle';
        }
    };
    reader.readAsArrayBuffer(file);
}

function _normalizeSupplierRows(raw) {
    if (!raw || raw.length < 2) return [];
    let headerIdx = 0;
    for (let i = 0; i < Math.min(raw.length, 15); i++) {
        const joined = raw[i].join('').toLowerCase();
        if (joined.includes('part no') || joined.includes('partno')) { headerIdx = i; break; }
    }
    const headers = raw[headerIdx].map(function(h) { return String(h).trim().toLowerCase(); });
    const ci = function(name) {
        const idx = headers.indexOf(name);
        return idx >= 0 ? idx : -1;
    };
    const iPartNo  = ci('part no');
    const iModelNo = ci('model no');
    const iImage   = ci('image');
    const iName    = headers.indexOf('name');
    const iDesc    = headers.indexOf('description');
    const hasOptionsCol = ci('options') >= 0;
    let iOptions   = ci('options');
    if (iOptions < 0) {
        iOptions = iDesc + 3;
    }
    let iPrice     = headers.findIndex(function(h) { return h.includes('price') && !h.includes('sale'); });
    if (iPrice < 0) iPrice = iOptions + 1;
    let iSRP       = headers.findIndex(function(h) { return h.includes('srp') || (h.includes('price') && h !== headers[iPrice]); });
    if (iSRP < 0) iSRP = iPrice + 1;
    let iWarranty  = ci('warranty');
    if (iWarranty < 0) iWarranty = iSRP + 1;
    // Invalidate options fallback if it collides with price/SRP/warranty columns
    if (!hasOptionsCol && (iOptions >= iPrice || iOptions === iWarranty)) iOptions = -1;
    const iNewFlag = iWarranty + 1;

    const rows = [];
    let lastPartNo = '', lastModelNo = '', lastName = '', lastDesc = '', lastWarranty = '';
    const junk = ['johannesburg','durban','cape town','tel:','email:','http','origin park','corporate park','download','place order','check stock'];

    for (let r = headerIdx + 1; r < raw.length; r++) {
        const row = raw[r];
        const partNo  = String(row[iPartNo]  || '').trim();
        const name    = String(iName  >= 0 ? row[iName]   || '' : '').trim();
        const options = String(iOptions >= 0 ? row[iOptions] || '' : '').trim();
        const priceRaw = _parsePriceStr(row[iPrice]);
        const srpRaw   = _parsePriceStr(row[iSRP]);

        if (!partNo && !options) continue;
        if (!partNo && !name && !options) continue;
        const rowText = row.join('').toLowerCase();
        if (junk.some(function(j) { return rowText.includes(j); })) continue;
        if (priceRaw === null && srpRaw === null && !name && !options) continue;

        if (name)  lastName    = name;
        if (iModelNo >= 0 && row[iModelNo]) lastModelNo = String(row[iModelNo]).trim();
        if (iDesc  >= 0 && row[iDesc]) lastDesc  = String(row[iDesc]).trim();
        if (iWarranty >= 0 && row[iWarranty]) lastWarranty = String(row[iWarranty]).trim();
        if (partNo) lastPartNo = partNo;

        if (!partNo || !lastName) continue;

        rows.push({
            part_no:       partNo,
            model_no:      lastModelNo,
            name:          lastName,
            description:   lastDesc,
            variant_color: options,
            cost_price:    priceRaw,
            price:         srpRaw || priceRaw || 0,
            warranty:      lastWarranty,
            is_new:        String(row[iNewFlag] || '').trim().toLowerCase() === 'new',
            image_url:     iImage >= 0 ? String(row[iImage] || '').trim() : '',
            supplier:      'Astrum',
            category:      '',
            stock:         0
        });
    }
    return rows;
}

function _renderImportPreview(rows) {
    document.getElementById('importRowCount').textContent = rows.length;
    document.getElementById('importResult').classList.add('hidden');
    const tbody = document.getElementById('importPreviewBody');
    const catOptions = ['','Wearables','Networking','Laptop Bags','Accessories','Camera','Lighting','TV Mounts','Mobile Holders','Cable Management','Cleaning Kits'];
    const catSel = function(val, idx) {
        return '<select class="import-cat-sel" data-row="' + idx + '">' +
            catOptions.map(function(c) { return '<option' + (c === val ? ' selected' : '') + '>' + escHtml(c) + '</option>'; }).join('') +
        '</select>';
    };
    tbody.innerHTML = rows.map(function(r, i) {
        return '<tr id="irow_' + i + '">' +
            '<td><input value="' + escHtml(r.part_no)       + '" data-f="part_no"       data-row="' + i + '"></td>' +
            '<td><input value="' + escHtml(r.model_no)      + '" data-f="model_no"      data-row="' + i + '"></td>' +
            '<td><input value="' + escHtml(r.name)          + '" data-f="name"          data-row="' + i + '" style="min-width:150px"></td>' +
            '<td><input value="' + escHtml(r.variant_color) + '" data-f="variant_color" data-row="' + i + '"></td>' +
            '<td><input type="number" value="' + (r.cost_price || '') + '" data-f="cost_price" data-row="' + i + '"></td>' +
            '<td><input type="number" value="' + (r.price || '')      + '" data-f="price"      data-row="' + i + '"></td>' +
            '<td><input value="' + escHtml(r.warranty)      + '" data-f="warranty"      data-row="' + i + '"></td>' +
            '<td><input type="checkbox" data-f="is_new" data-row="' + i + '"' + (r.is_new ? ' checked' : '') + '></td>' +
            '<td>' + catSel(r.category, i) + '</td>' +
            '<td><input value="' + escHtml(r.supplier)      + '" data-f="supplier"      data-row="' + i + '"></td>' +
            '<td><input type="number" value="' + (r.stock || 0) + '" data-f="stock" data-row="' + i + '" style="min-width:45px"></td>' +
            '<td class="del-col"><button onclick="_importDelRow(' + i + ')" title="Remove row">&times;</button></td>' +
        '</tr>';
    }).join('');
    document.getElementById('importPreviewWrap').classList.remove('hidden');
}

function _importDelRow(idx) {
    const row = document.getElementById('irow_' + idx);
    if (row) { row.remove(); }
}

function _applyBulkCategory() {
    const cat = document.getElementById('importBulkCategory').value;
    if (!cat) return;
    document.querySelectorAll('.import-cat-sel').forEach(function(sel) { sel.value = cat; });
}

function _collectImportRows() {
    const rows = [];
    document.querySelectorAll('#importPreviewBody tr').forEach(function(tr) {
        const get = function(f) {
            const el = tr.querySelector('[data-f="' + f + '"]');
            if (!el) return '';
            if (el.type === 'checkbox') return el.checked;
            return el.value;
        };
        const partNo = get('part_no').trim();
        const name   = get('name').trim();
        if (!partNo || !name) return;
        const srp    = parseFloat(get('price'));
        rows.push({
            part_no:       partNo,
            model_no:      get('model_no').trim() || null,
            name:          name,
            variant_color: get('variant_color').trim() || null,
            cost_price:    parseFloat(get('cost_price')) || null,
            price:         isNaN(srp) ? 0 : srp,
            warranty:      get('warranty').trim() || null,
            is_new:        get('is_new'),
            category:      tr.querySelector('.import-cat-sel')?.value || null,
            supplier:      get('supplier').trim() || 'Astrum',
            stock:         parseInt(get('stock')) || 0
        });
    });
    return rows;
}

// ── Google Sheets Sync Engine ─────────────────────────────
async function _syncFromGoogleSheets() {
    const rawUrl = (document.getElementById('sheetsUrl').value || '').trim();
    if (!rawUrl) { alert('Please paste a Google Sheets URL.'); return; }

    const statusEl    = document.getElementById('importStatus');
    const statusTxtEl = document.getElementById('importStatusText');
    const errEl       = document.getElementById('sheetsStatus');
    const btn         = document.getElementById('sheetsSyncBtn');

    errEl.classList.add('hidden');
    statusEl.classList.remove('hidden');
    statusTxtEl.textContent = 'Fetching from Google Sheets\u2026';
    document.getElementById('importPreviewWrap').classList.add('hidden');
    btn.disabled = true;

    try {
        // Build XLSX export URL so all tabs are included
        const sheetIdMatch2 = rawUrl.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
        const sheetId = sheetIdMatch2 ? sheetIdMatch2[1] : null;
        if (!sheetId) throw new Error('Could not extract sheet ID from URL.');
        const xlsxExportUrl = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/export?format=xlsx';

        // Route through PHP proxy to avoid CORS
        const proxyUrl = (window.location.origin || '') + '/admin/sheets-proxy.php?url=' + encodeURIComponent(xlsxExportUrl);
        const resp = await fetch(proxyUrl);
        const contentType = resp.headers.get('content-type') || '';

        if (!resp.ok || contentType.includes('application/json')) {
            const json = await resp.json().catch(function() { return {}; });
            throw new Error(json.error || 'HTTP ' + resp.status);
        }

        statusTxtEl.textContent = 'Parsing spreadsheet\u2026';
        const arrayBuffer = await resp.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: 'array' });

        // Scan ALL sheets — collect products from every tab that has a 'Part No' header
        const productSheets = [];
        for (let si = 0; si < wb.SheetNames.length; si++) {
            const candidate = wb.Sheets[wb.SheetNames[si]];
            const preview = XLSX.utils.sheet_to_json(candidate, { header: 1, defval: '', range: 0 });
            const hasHeader = preview.slice(0, 15).some(function(row) {
                return row.join('').toLowerCase().includes('part no') || row.join('').toLowerCase().includes('partno');
            });
            if (hasHeader) { productSheets.push({ name: wb.SheetNames[si], ws: candidate }); }
        }

        if (!productSheets.length) {
            throw new Error(
                'No sheet with a "Part No" column found in this workbook. ' +
                'Sheets found: ' + wb.SheetNames.join(', ')
            );
        }

        statusTxtEl.textContent = 'Found ' + productSheets.length + ' product sheet(s). Parsing\u2026';

        // Merge rows from all product sheets, skipping duplicate part_nos
        const seenPartNos = new Set();
        let allRows = [];
        for (let pi = 0; pi < productSheets.length; pi++) {
            const raw = XLSX.utils.sheet_to_json(productSheets[pi].ws, { header: 1, defval: '' });
            const sheetRows = _normalizeSupplierRows(raw).filter(function(r) {
                if (seenPartNos.has(r.part_no)) return false;
                seenPartNos.add(r.part_no);
                return true;
            });
            allRows = allRows.concat(sheetRows);
            statusTxtEl.textContent = 'Loaded ' + allRows.length + ' products so far\u2026';
        }

        _importRows = allRows;
        _renderImportPreview(allRows);
        statusEl.classList.add('hidden');
    } catch (err) {
        statusEl.classList.add('hidden');
        errEl.classList.remove('hidden');
        errEl.textContent = '\u2716 ' + err.message;
    } finally {
        btn.disabled = false;
    }
}

async function _pushImportToSupabase() {
    const rows = _collectImportRows();
    if (!rows.length) { alert('No valid rows to import.'); return; }
    const btn = document.getElementById('importPushBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Importing ' + rows.length + ' rows...';
    const resultEl = document.getElementById('importResult');
    resultEl.classList.add('hidden');

    try {
        const BATCH = 50;
        let done = 0, errors = [];
        for (let i = 0; i < rows.length; i += BATCH) {
            const batch = rows.slice(i, i + BATCH);
            const { error } = await _sb.from('products').upsert(batch, { onConflict: 'part_no' });
            if (error) errors.push(error.message);
            else done += batch.length;
            btn.innerHTML = '<i class="fas fa-database mr-2"></i>Pushed ' + done + '/' + rows.length + '...';
        }
        if (errors.length) {
            resultEl.className = 'mt-3 p-3 rounded-lg text-sm font-medium bg-red-50 border border-red-200 text-red-700';
            resultEl.textContent = '\u26a0\ufe0f ' + done + ' rows imported, but ' + errors.length + ' batch(es) had errors: ' + errors.join(' | ');
        } else {
            resultEl.className = 'mt-3 p-3 rounded-lg text-sm font-medium bg-green-50 border border-green-200 text-green-700';
            resultEl.textContent = '\u2705 ' + done + ' products imported successfully into Supabase!';
            _importRows = [];
            document.getElementById('importPreviewBody').innerHTML = '';
            document.getElementById('importRowCount').textContent = '0';
        }
        resultEl.classList.remove('hidden');
    } catch (err) {
        resultEl.className = 'mt-3 p-3 rounded-lg text-sm font-medium bg-red-50 border border-red-200 text-red-700';
        resultEl.textContent = 'Import failed: ' + err.message;
        resultEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-database mr-2"></i>Push to Supabase';
    }
}
