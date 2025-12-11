// Ferretería Web App - Main JavaScript
class FerreteriaApp {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('ferreteria_cart')) || [];
        this.products = [];
        this.categories = this.getCategories();
        this.init();
    }

    getCategories() {
        return [
            'todos',
            'herramientas',
            'electricos', 
            'fontaneria',
            'pinturas',
            'construccion',
            'seguridad',
            'tornilleria',
            'jardin',
            'iluminacion',
            'madera',
            'plasticos'
        ];
    }

    async init() {
        await this.loadProductsFromSheet();
        this.updateCartUI();
        this.generateCategoryFilters();
        this.generateFeaturedCarousel();
        this.initParticles();
        this.initAnimations();
        this.bindEvents();
    }

    async loadProductsFromSheet() {
        try {
            console.log('🔄 Cargando productos desde Google Sheet...');
            
            const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyvOEchC2dkVDMYN6pAP2jL1eUUk8cudNUjbWG62IlSVtCAj8FuBDfgK5rgX3O9oP_ivQ/exec';
            
            const response = await fetch(WEBAPP_URL);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.products && Array.isArray(data.products)) {
                // 🔥 CORRECCIÓN: Mapeo correcto de productos con nuevos campos
                this.products = data.products.map(product => {
                    // Manejar diferentes formatos de datos
                    const processedProduct = {
                        id: product.id || product.ID_Producto || '',
                        name: product.name || product.Nombre || '',
                        category: product.category || product.Categoría_Principal || '',
                        allCategories: product.allCategories || 
                                      (product.Todas_Categorías ? 
                                       (typeof product.Todas_Categorías === 'string' ? 
                                        product.Todas_Categorías.split(',').map(cat => cat.trim()) : 
                                        product.Todas_Categorías) : 
                                       [product.Categoría_Principal]),
                        featured: product.featured || product.Destacado === 'SI',
                        price: Number(product.price || product.Precio) || 0,
                        stock: Number(product.stock || product.Stock) || 0,
                        image: product.image || product['Imagen URL'] || 'resources/placeholder.jpg',
                        description: product.description || product.Descripción || '',
                        code: product.code || product.Código || '',
                        active: product.active !== undefined ? product.active : 
                               (product.Activo === 'SI' || product.Activo === true || product.Activo === '')
                    };

                    // Asegurar que allCategories sea un array
                    if (!Array.isArray(processedProduct.allCategories)) {
                        processedProduct.allCategories = [processedProduct.category];
                    }

                    return processedProduct;
                }).filter(product => product.active); // 🔥 FILTRAR SOLO PRODUCTOS ACTIVOS

                console.log(`✅ ${this.products.length} productos cargados desde Sheet`);
                
                // Generar la cuadrícula de productos después de cargarlos
                this.generateProductsGrid();
            } else {
                console.error('❌ Formato de respuesta inválido:', data);
                this.products = this.getDefaultProducts();
                this.generateProductsGrid();
            }
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            // Fallback a productos por defecto
            this.products = this.getDefaultProducts();
            console.log('🔄 Usando productos por defecto');
            this.generateProductsGrid();
        }
    }

    getDefaultProducts() {
        return [
            {
                id: 'hammer-001',
                name: 'Martillo de Carpintero',
                category: 'herramientas',
                allCategories: ['herramientas', 'construccion'],
                featured: true,
                price: 899.99,
                stock: 25,
                image: 'resources/hammer.jpg',
                description: 'Martillo profesional con cabeza de acero forjado y mango ergonómico',
                code: 'MRT-001',
                active: true
            },
            {
                id: 'screwdriver-002',
                name: 'Juego de Destornilladores',
                category: 'herramientas',
                allCategories: ['herramientas', 'electricos'],
                featured: true,
                price: 1299.99,
                stock: 18,
                image: 'resources/screwdriver.jpg',
                description: 'Set de 6 destornilladores de precisión con puntas intercambiables',
                code: 'DST-002',
                active: true
            },
            {
                id: 'drill-003',
                name: 'Taladro Eléctrico 12V',
                category: 'electricos',
                allCategories: ['electricos', 'herramientas'],
                featured: true,
                price: 3499.99,
                stock: 12,
                image: 'resources/drill.jpg',
                description: 'Taladro inalámbrico con batería de litio y 2 velocidades',
                code: 'TLD-003',
                active: true
            }
        ];
    }

    generateCategoryFilters() {
        const filtersContainer = document.querySelector('.flex.flex-wrap.gap-3');
        if (!filtersContainer) return;

        filtersContainer.innerHTML = this.categories.map(category => {
            const isActive = category === 'todos';
            return `
                <button class="category-filter ${isActive ? 'active' : ''}" 
                        data-category="${category}">
                    ${this.formatCategoryName(category)}
                </button>
            `;
        }).join('');
    }

    formatCategoryName(category) {
        const names = {
            'todos': 'Todos',
            'herramientas': 'Herramientas',
            'electricos': 'Eléctricos',
            'fontaneria': 'Fontanería',
            'pinturas': 'Pinturas',
            'construccion': 'Construcción',
            'seguridad': 'Seguridad',
            'tornilleria': 'Tornillería',
            'jardin': 'Jardín',
            'iluminacion': 'Iluminación',
            'madera': 'Madera',
            'plasticos': 'Plásticos'
        };
        return names[category] || category;
    }

    getFeaturedProducts() {
        return this.products.filter(product => product.featured && product.stock > 0 && product.active);
    }

    generateProductsGrid() {
        const productsGrid = document.querySelector('.product-grid');
        if (!productsGrid) return;

        console.log('🔄 Generando cuadrícula de productos...');

        productsGrid.innerHTML = this.products.map(product => {
            if (!product.active) return '';
            
            const stockClass = product.stock > 20 ? 'stock-high' : 
                             product.stock > 10 ? 'stock-medium' : 'stock-low';
            const stockText = product.stock > 20 ? 'Disponible' : 
                            product.stock > 10 ? 'Poco stock' : 'Agotado';
            
            const imageUrl = product.image || 'resources/placeholder.jpg';
            const featuredBadge = product.featured ? '<div class="featured-badge">⭐ Destacado</div>' : '';

            return `
                <div class="product-card p-6 relative" data-category="${product.category}" data-all-categories="${product.allCategories ? product.allCategories.join(',') : product.category}">
                    ${featuredBadge}
                    <img src="${imageUrl}" alt="${product.name}" class="product-image mb-4" 
                         onerror="this.src='resources/placeholder.jpg'">
                    <div class="mb-2">
                        <span class="stock-indicator ${stockClass}">${stockText}</span>
                    </div>
                    <h3 class="product-name font-bold text-lg mb-2 text-gray-800 font-inter">${product.name}</h3>
                    <p class="product-description text-gray-600 text-sm mb-3">${product.description}</p>
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs text-gray-500">Código: ${product.code}</span>
                        <span class="text-xs text-gray-500">Stock: ${product.stock}</span>
                    </div>
                    <div class="price-tag mb-4">$${product.price.toFixed(2)}</div>
                    <button 
                        class="btn-primary w-full" 
                        onclick="addToCart('${product.id}')"
                        ${product.stock === 0 ? 'disabled' : ''}
                    >
                        ${product.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
                    </button>
                </div>
            `;
        }).join('');

        this.initProductAnimations();
    }

    generateFeaturedCarousel() {
        const featuredProducts = this.getFeaturedProducts();
        const carouselContainer = document.getElementById('featured-carousel');
        
        if (!carouselContainer) return;

        const splideTrack = carouselContainer.querySelector('.splide__track');
        const splideList = carouselContainer.querySelector('.splide__list');
        
        if (!splideTrack || !splideList) return;

        if (featuredProducts.length === 0) {
            carouselContainer.style.display = 'none';
            return;
        }

        splideList.innerHTML = featuredProducts.map(product => {
            const imageUrl = product.image || 'resources/placeholder.jpg';
            
            return `
                <li class="splide__slide">
                    <div class="bg-white rounded-lg p-6 text-center">
                        <img src="${imageUrl}" alt="${product.name}" 
                             class="w-full h-48 object-cover rounded-lg mb-4"
                             onerror="this.src='resources/placeholder.jpg'">
                        <h3 class="font-bold text-lg mb-2">${product.name}</h3>
                        <p class="text-orange-primary font-bold text-xl mb-4">$${product.price.toFixed(2)}</p>
                        <button class="btn-primary" onclick="addToCart('${product.id}')"
                                ${product.stock === 0 ? 'disabled' : ''}>
                            ${product.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
                        </button>
                    </div>
                </li>
            `;
        }).join('');

        // Reinicializar el carousel si hay productos destacados
        if (featuredProducts.length > 0 && typeof Splide !== 'undefined') {
            try {
                new Splide('#featured-carousel', {
                    type: 'loop',
                    perPage: Math.min(3, featuredProducts.length),
                    perMove: 1,
                    gap: '2rem',
                    autoplay: true,
                    interval: 3000,
                    breakpoints: {
                        768: {
                            perPage: 1,
                        },
                        1024: {
                            perPage: 2,
                        }
                    }
                }).mount();
            } catch (error) {
                console.error('Error inicializando carousel:', error);
            }
        }
    }

    initProductAnimations() {
        if (typeof anime !== 'undefined') {
            anime({
                targets: '.product-card',
                translateY: [50, 0],
                opacity: [0, 1],
                delay: anime.stagger(100),
                duration: 800,
                easing: 'easeOutExpo'
            });
        }
    }

    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showToast('Producto no encontrado', 'error');
            return false;
        }

        // Verificar stock
        if (product.stock < quantity) {
            this.showToast(`Stock insuficiente. Solo quedan ${product.stock} unidades`, 'error');
            return false;
        }

        const existingItem = this.cart.find(item => item.productId === productId);
        
        if (existingItem) {
            // Verificar que no exceda el stock total
            if (existingItem.quantity + quantity > product.stock) {
                this.showToast(`No puedes agregar más. Stock máximo: ${product.stock}`, 'error');
                return false;
            }
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                productId: productId,
                quantity: quantity,
                price: product.price
            });
        }

        this.saveCart();
        this.updateCartUI();
        this.showToast(`${product.name} agregado al carrito`, 'success');
        this.animateAddToCart();
        return true;
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.productId !== productId);
        this.saveCart();
        this.updateCartUI();
    }

    updateQuantity(productId, quantity) {
        const product = this.products.find(p => p.id === productId);
        const item = this.cart.find(item => item.productId === productId);
        
        if (item && product) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else if (quantity > product.stock) {
                this.showToast(`No puedes agregar más. Stock máximo: ${product.stock}`, 'error');
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartUI();
            }
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => {
            const product = this.products.find(p => p.id === item.productId);
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    }

    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    saveCart() {
        localStorage.setItem('ferreteria_cart', JSON.stringify(this.cart));
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        
        if (cartCount) {
            const count = this.getCartItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'block' : 'none';
        }
        
        if (cartTotal) {
            cartTotal.textContent = `$${this.getCartTotal().toFixed(2)}`;
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    animateAddToCart() {
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.classList.add('bounce');
            setTimeout(() => {
                cartIcon.classList.remove('bounce');
            }, 600);
        }
    }

    initParticles() {
        if (typeof p5 !== 'undefined' && document.getElementById('particles-canvas')) {
            new p5((p) => {
                let particles = [];
                
                p.setup = () => {
                    const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
                    canvas.parent('particles-canvas');
                    
                    for (let i = 0; i < 50; i++) {
                        particles.push({
                            x: p.random(p.width),
                            y: p.random(p.height),
                            vx: p.random(-1, 1),
                            vy: p.random(-1, 1),
                            size: p.random(2, 6),
                            opacity: p.random(0.1, 0.3)
                        });
                    }
                };
                
                p.draw = () => {
                    p.clear();
                    
                    particles.forEach(particle => {
                        p.fill(255, 107, 53, particle.opacity * 255);
                        p.noStroke();
                        p.circle(particle.x, particle.y, particle.size);
                        
                        particle.x += particle.vx;
                        particle.y += particle.vy;
                        
                        if (particle.x < 0 || particle.x > p.width) particle.vx *= -1;
                        if (particle.y < 0 || particle.y > p.height) particle.vy *= -1;
                    });
                };
                
                p.windowResized = () => {
                    p.resizeCanvas(window.innerWidth, window.innerHeight);
                };
            });
        }
    }

    initAnimations() {
        // Las animaciones de productos ahora se manejan en generateProductsGrid
    }

    bindEvents() {
        // Búsqueda en tiempo real
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }

        // Filtros por categoría
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-filter')) {
                const category = e.target.dataset.category;
                
                // Remover active de todos los botones
                document.querySelectorAll('.category-filter').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Agregar active al botón clickeado
                e.target.classList.add('active');
                
                this.filterByCategory(category);
            }
        });

        // Cerrar toasts
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('toast-close')) {
                const toast = e.target.closest('.toast');
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }
        });
    }

    filterProducts(searchTerm) {
        const products = document.querySelectorAll('.product-card');
        const term = searchTerm.toLowerCase();
        
        products.forEach(product => {
            const name = product.querySelector('.product-name').textContent.toLowerCase();
            const description = product.querySelector('.product-description').textContent.toLowerCase();
            
            if (name.includes(term) || description.includes(term)) {
                product.style.display = 'block';
                product.classList.remove('hidden');
            } else {
                product.style.display = 'none';
                product.classList.add('hidden');
            }
        });
    }

    filterByCategory(category) {
        const products = document.querySelectorAll('.product-card');
        
        products.forEach(product => {
            if (category === 'todos') {
                product.style.display = 'block';
                product.classList.remove('hidden');
            } else {
                // 🔥 CORRECCIÓN: Manejar tanto allCategories como category individual
                const productCategories = product.dataset.allCategories ? 
                    product.dataset.allCategories.split(',') : 
                    [product.dataset.category];
                    
                if (productCategories.includes(category)) {
                    product.style.display = 'block';
                    product.classList.remove('hidden');
                } else {
                    product.style.display = 'none';
                    product.classList.add('hidden');
                }
            }
        });
    }

    // WhatsApp integration
    sendWhatsAppOrder(orderData) {
        const phoneNumber = '2645776592';
        const message = this.formatOrderMessage(orderData);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
    }

    formatOrderMessage(orderData) {
        let message = `🛒 *Nuevo Pedido de Ferretería*\n\n`;
        message += `📋 *Orden:* ${orderData.orderId}\n`;
        message += `👤 *Cliente:* ${orderData.customer.name}\n`;
        message += `📱 *Teléfono:* ${orderData.customer.phone}\n`;
        message += `📍 *Dirección:* ${orderData.customer.address.street}, ${orderData.customer.address.neighborhood}\n`;
        message += `🕐 *Horario:* ${orderData.deliveryTime}\n\n`;
        
        message += `📦 *Productos:*\n`;
        orderData.items.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (product) {
                message += `• ${product.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}\n`;
            } else {
                message += `• Producto no encontrado x${item.quantity}\n`;
            }
        });
        
        message += `\n💰 *Total:* $${orderData.total.toFixed(2)}\n`;
        message += `📅 *Fecha:* ${new Date().toLocaleDateString()}`;
        
        return message;
    }

    // Función para recargar productos (útil para actualizar stock)
    async refreshProducts() {
        await this.loadProductsFromSheet();
        this.updateCartUI();
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.ferreteriaApp = new FerreteriaApp();
});

// Funciones globales para los botones
function addToCart(productId) {
    window.ferreteriaApp.addToCart(productId);
}

function removeFromCart(productId) {
    window.ferreteriaApp.removeFromCart(productId);
}

function updateQuantity(productId, quantity) {
    window.ferreteriaApp.updateQuantity(productId, parseInt(quantity));
}

// Función global para recargar productos
function refreshProducts() {
    if (window.ferreteriaApp) {
        window.ferreteriaApp.refreshProducts();
    }
}


