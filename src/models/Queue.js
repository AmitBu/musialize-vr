class Queue {
    constructor() {
        this._items = [];
    }

    push(item) {
        this._items.push(item);
    }

    pop() {
        return this._items.shift();
    }

    isEmpty() {
        return this._items.length === 0;
    }

    count() {
        return this._items.length;
    }
}

export default Queue;