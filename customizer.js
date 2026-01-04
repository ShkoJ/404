// ================================
// 2D MERCHANDISE CUSTOMIZER
// Multi-View Canvas-based Design
// FIXED: Mobile touch detection & image scaling
// ================================

class MerchandiseCustomizer {
    constructor() {
        this.canvas = document.getElementById('customizer-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Product state
        this.currentProduct = 'tshirt';
        this.currentView = 'front';
        this.baseColor = '#FFFFFF';

        // Product images
        this.productImages = {
            tshirt: {
                front: null,
                back: null
            },
            cap: {
                front: null,
                left: null,
                right: null
            }
        };

        // Customization layers - stored per view
        this.designs = {
            tshirt: {
                front: [],
                back: []
            },
            cap: {
                front: [],
                left: [],
                right: []
            }
        };

        this.selectedLayer = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastTouchDistance = 0;

        this.init();
    }

    init() {
        // Load product images
        this.loadProductImage('tshirt', 'front', 'T-shirt.jpg');
        this.loadProductImage('tshirt', 'back', 'T-shirt-back.jpg');
        this.loadProductImage('cap', 'front', 'cap-front.jpg');
        this.loadProductImage('cap', 'left', 'cap-left.jpg');
        this.loadProductImage('cap', 'right', 'cap-right.jpg');

        // Set up event listeners
        this.setupProductSelector();
        this.setupViewSelector();
        this.setupTextTool();
        this.setupImageUpload();
        this.setupCanvas();
        this.setupButtons();
        this.setupModal();

        // Initial render
        this.render();
    }

    loadProductImage(product, view, src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.productImages[product][view] = img;
            if (product === this.currentProduct && view === this.currentView) {
                this.render();
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load ${src}, using fallback`);
            const fallback = document.createElement('canvas');
            fallback.width = 600;
            fallback.height = 600;
            const fallbackCtx = fallback.getContext('2d');
            fallbackCtx.fillStyle = '#f0f0f0';
            fallbackCtx.fillRect(0, 0, 600, 600);
            fallbackCtx.fillStyle = '#666';
            fallbackCtx.font = '24px Inter';
            fallbackCtx.textAlign = 'center';
            fallbackCtx.fillText(`${product} - ${view}`, 300, 300);
            this.productImages[product][view] = fallback;
            if (product === this.currentProduct && view === this.currentView) {
                this.render();
            }
        };
        img.src = src;
    }

    setupProductSelector() {
        const options = document.querySelectorAll('.product-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                options.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.currentProduct = option.dataset.product;
                this.currentView = 'front';
                this.selectedLayer = null;
                this.updateViewTabs();
                this.render();
            });
        });
    }

    setupViewSelector() {
        this.updateViewTabs();
        const viewTabsContainer = document.getElementById('view-tabs');
        viewTabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.view-tab');
            if (tab) {
                this.switchView(tab.dataset.view);
            }
        });
    }

    updateViewTabs() {
        const tabsContainer = document.getElementById('view-tabs');

        if (this.currentProduct === 'tshirt') {
            tabsContainer.innerHTML = `
        <button class="view-tab active" data-view="front">
          <i class="ph ph-user"></i>
          Front
        </button>
        <button class="view-tab" data-view="back">
          <i class="ph ph-user"></i>
          Back
        </button>
      `;
        } else {
            tabsContainer.innerHTML = `
        <button class="view-tab active" data-view="front">
          <i class="ph ph-eye"></i>
          Front
        </button>
        <button class="view-tab" data-view="left">
          <i class="ph ph-arrow-left"></i>
          Left
        </button>
        <button class="view-tab" data-view="right">
          <i class="ph ph-arrow-right"></i>
          Right
        </button>
      `;
        }
    }

    switchView(view) {
        this.currentView = view;
        this.selectedLayer = null;

        const tabs = document.querySelectorAll('.view-tab');
        tabs.forEach(tab => {
            if (tab.dataset.view === view) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        this.render();
    }

    getCurrentLayers() {
        return this.designs[this.currentProduct][this.currentView];
    }

    setupTextTool() {
        const addTextBtn = document.getElementById('add-text-btn');
        const textInput = document.getElementById('custom-text-input');

        addTextBtn.addEventListener('click', () => {
            const text = textInput.value.trim();
            if (text) {
                this.addTextLayer(text);
                textInput.value = '';
            }
        });

        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTextBtn.click();
            }
        });
    }

    setupImageUpload() {
        const uploadBtn = document.getElementById('upload-image-btn');
        const fileInput = document.getElementById('image-upload-input');

        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.addImageLayer(event.target.result);
                };
                reader.readAsDataURL(file);
                fileInput.value = '';
            }
        });
    }

    setupCanvas() {
        this.canvas.addEventListener('mousedown', this.handlePointerDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handlePointerMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handlePointerUp.bind(this));

        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handlePointerUp.bind(this));

        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    }

    setupButtons() {
        document.getElementById('clear-btn').addEventListener('click', () => {
            if (confirm('Clear all customizations on this view?')) {
                this.getCurrentLayers().length = 0;
                this.selectedLayer = null;
                this.render();
            }
        });

        document.getElementById('summary-btn').addEventListener('click', () => {
            this.showDesignSummary();
        });
    }

    setupModal() {
        const closeBtn = document.getElementById('close-modal-btn');
        const modal = document.getElementById('summary-modal');

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('active');
            }
        });
    }

    addTextLayer(text) {
        const layer = {
            type: 'text',
            content: text,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            fontSize: 48,
            color: '#000000'
        };
        this.getCurrentLayers().push(layer);
        this.selectedLayer = layer;
        this.render();
    }

    addImageLayer(src) {
        const img = new Image();
        img.onload = () => {
            const layer = {
                type: 'image',
                image: img,
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                width: 150,
                height: 150,
                scale: 1
            };
            this.getCurrentLayers().push(layer);
            this.selectedLayer = layer;
            this.render();
        };
        img.src = src;
    }

    render() {
        const ctx = this.ctx;
        const canvas = this.canvas;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = this.baseColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const productImg = this.productImages[this.currentProduct][this.currentView];
        if (productImg) {
            // Use Math.max to fill the canvas (removes white space on sides)
            const scale = Math.max(
                canvas.width / productImg.width,
                canvas.height / productImg.height
            );
            const w = productImg.width * scale;
            const h = productImg.height * scale;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;

            ctx.drawImage(productImg, x, y, w, h);
        }

        const layers = this.getCurrentLayers();
        layers.forEach(layer => {
            if (layer.type === 'text') {
                this.drawTextLayer(layer);
            } else if (layer.type === 'image') {
                this.drawImageLayer(layer);
            }

            if (layer === this.selectedLayer) {
                this.drawSelectionHandles(layer);
            }
        });
    }

    drawTextLayer(layer) {
        const ctx = this.ctx;
        ctx.save();
        ctx.font = `bold ${layer.fontSize}px Inter`;
        ctx.fillStyle = layer.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.content, layer.x, layer.y);
        ctx.restore();
    }

    drawImageLayer(layer) {
        const ctx = this.ctx;
        const w = layer.width * layer.scale;
        const h = layer.height * layer.scale;
        ctx.drawImage(layer.image, layer.x - w / 2, layer.y - h / 2, w, h);
    }

    drawSelectionHandles(layer) {
        const ctx = this.ctx;
        const bounds = this.getLayerBounds(layer);

        ctx.strokeStyle = '#2C1810';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.setLineDash([]);

        const handleSize = 16;
        const corners = [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x, y: bounds.y + bounds.height },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height }
        ];

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#2C1810';
        ctx.lineWidth = 3;
        corners.forEach(corner => {
            ctx.beginPath();
            ctx.arc(corner.x, corner.y, handleSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }

    getLayerBounds(layer) {
        if (layer.type === 'text') {
            this.ctx.font = `bold ${layer.fontSize}px Inter`;
            const metrics = this.ctx.measureText(layer.content);
            const width = metrics.width;
            const height = layer.fontSize * 1.2; // Add some padding
            return {
                x: layer.x - width / 2,
                y: layer.y - height / 2,
                width: width,
                height: height
            };
        } else if (layer.type === 'image') {
            const w = layer.width * layer.scale;
            const h = layer.height * layer.scale;
            return {
                x: layer.x - w / 2,
                y: layer.y - h / 2,
                width: w,
                height: h
            };
        }
    }

    // CRITICAL FIX: Proper coordinate scaling for mobile
    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        // The canvas internal size (600x600) may differ from displayed CSS size
        // We need to scale the touch/click coordinates properly
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    handlePointerDown(e) {
        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        const x = coords.x;
        const y = coords.y;

        const layers = this.getCurrentLayers();
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            const bounds = this.getLayerBounds(layer);

            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                this.selectedLayer = layer;
                this.isDragging = true;
                this.dragStart = { x, y };
                this.render();
                return;
            }
        }

        this.selectedLayer = null;
        this.render();
    }

    handlePointerMove(e) {
        if (!this.isDragging || !this.selectedLayer) return;

        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        const x = coords.x;
        const y = coords.y;

        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;

        this.selectedLayer.x += dx;
        this.selectedLayer.y += dy;

        this.dragStart = { x, y };
        this.render();
    }

    handlePointerUp(e) {
        this.isDragging = false;
    }

    handleTouchStart(e) {
        e.preventDefault();

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handlePointerDown({ clientX: touch.clientX, clientY: touch.clientY });
        } else if (e.touches.length === 2 && this.selectedLayer) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            this.lastTouchDistance = distance;
        }
    }

    handleTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 1 && this.isDragging) {
            const touch = e.touches[0];
            this.handlePointerMove({ clientX: touch.clientX, clientY: touch.clientY });
        } else if (e.touches.length === 2 && this.selectedLayer) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            if (this.lastTouchDistance > 0) {
                const scaleDelta = distance / this.lastTouchDistance;

                if (this.selectedLayer.type === 'text') {
                    this.selectedLayer.fontSize *= scaleDelta;
                    this.selectedLayer.fontSize = Math.max(12, Math.min(120, this.selectedLayer.fontSize));
                } else if (this.selectedLayer.type === 'image') {
                    this.selectedLayer.scale *= scaleDelta;
                    this.selectedLayer.scale = Math.max(0.2, Math.min(3, this.selectedLayer.scale));
                }

                this.render();
            }

            this.lastTouchDistance = distance;
        }
    }

    handleDoubleClick(e) {
        if (this.selectedLayer) {
            if (confirm('Remove this element?')) {
                const layers = this.getCurrentLayers();
                const index = layers.indexOf(this.selectedLayer);
                if (index > -1) {
                    layers.splice(index, 1);
                }
                this.selectedLayer = null;
                this.render();
            }
        }
    }

    showDesignSummary() {
        const modal = document.getElementById('summary-modal');
        const content = document.getElementById('summary-content');

        const productName = this.currentProduct === 'tshirt' ? 'T-Shirt' : 'Cap';

        let html = `
      <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
        <h4 style="margin-bottom: 12px; color: #2C1810; font-size: 1rem;">Product Details</h4>
        <p style="margin: 8px 0;"><strong>Product:</strong> ${productName}</p>
      </div>
    `;

        const views = this.currentProduct === 'tshirt' ? ['front', 'back'] : ['front', 'left', 'right'];
        const designedViews = views.filter(view => this.designs[this.currentProduct][view].length > 0);

        if (designedViews.length > 0) {
            html += `<div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
        <h4 style="margin-bottom: 16px; color: #2C1810; font-size: 1rem;">Design Previews</h4>`;

            designedViews.forEach(view => {
                const preview = this.generateViewPreview(view);
                html += `
          <div style="margin-bottom: 16px;">
            <p style="font-weight: 600; margin-bottom: 8px; color: #5D4037;">${view.toUpperCase()}</p>
            <img src="${preview}" alt="${view} view" style="width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          </div>
        `;
            });

            html += `</div>`;
        }

        html += `
      <div style="display: flex; gap: 12px; margin-top: 20px;">
        <button class="btn btn-primary" style="flex: 1;" onclick="customizer.downloadAllDesigns()">
          <i class="ph ph-download"></i>
          Download All
        </button>
      </div>
    `;

        content.innerHTML = html;
        modal.classList.add('active');
    }

    generateViewPreview(view) {
        const originalView = this.currentView;
        this.currentView = view;
        this.selectedLayer = null;
        this.render();
        const dataURL = this.canvas.toDataURL('image/png');
        this.currentView = originalView;
        this.render();
        return dataURL;
    }

    downloadAllDesigns() {
        const views = this.currentProduct === 'tshirt' ? ['front', 'back'] : ['front', 'left', 'right'];
        const designedViews = views.filter(view => this.designs[this.currentProduct][view].length > 0);

        designedViews.forEach((view, index) => {
            setTimeout(() => {
                const preview = this.generateViewPreview(view);
                const link = document.createElement('a');
                link.download = `404-cafe-${this.currentProduct}-${view}.png`;
                link.href = preview;
                link.click();
            }, index * 200); // Slight delay between downloads
        });
    }
}

// Initialize
let customizer;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        customizer = new MerchandiseCustomizer();
    });
} else {
    customizer = new MerchandiseCustomizer();
}
