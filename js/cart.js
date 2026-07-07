const CART_STORAGE_KEY = 'omegatek_cart';

export class CartStore {
    constructor(storage = window.localStorage) {
        this.storage = storage;
        this.items = this.#read();
    }

    #read() {
        try {
            return JSON.parse(this.storage.getItem(CART_STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    #save() {
        this.storage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    }

    getItems() {
        return [...this.items];
    }

    getCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    add(product) {
        const existingItem = this.items.find((item) => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        this.#save();
        return this.getItems();
    }

    remove(productId) {
        this.items = this.items.filter((item) => item.id !== productId);
        this.#save();
        return this.getItems();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find((entry) => entry.id === productId);
        if (!item) {
            return this.getItems();
        }

        if (quantity <= 0) {
            return this.remove(productId);
        }

        item.quantity = quantity;
        this.#save();
        return this.getItems();
    }

    clear() {
        this.items = [];
        this.#save();
    }
}
