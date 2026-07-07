const WISHLIST_STORAGE_KEY = 'omegatek_wishlist';

export class WishlistStore {
    constructor(storage = window.localStorage) {
        this.storage = storage;
        this.ids = this.#read();
    }

    #read() {
        try {
            return JSON.parse(this.storage.getItem(WISHLIST_STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    #save() {
        this.storage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(this.ids));
    }

    getAll() {
        return [...this.ids];
    }

    has(productId) {
        return this.ids.includes(productId);
    }

    count() {
        return this.ids.length;
    }

    toggle(productId) {
        if (this.has(productId)) {
            this.ids = this.ids.filter((id) => id !== productId);
            this.#save();
            return false;
        }

        this.ids.push(productId);
        this.#save();
        return true;
    }
}
