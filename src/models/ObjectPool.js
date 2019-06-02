import Queue from "./Queue";

class ObjectPool {
    constructor(maxItems) {
        this._queue = new Queue();
        this._maxItems = maxItems;
    }

    getItem() {
        // TODO: Add warning in base queue implementation
        if (this._queue.isEmpty()) {
            console.warn('Trying to pop from an empty queue');
        } else {
            return this._queue.pop();
        }
    }

    addItem(item) {
        if (this._queue.count() < this._maxItems) {
            this._queue.push(item);
        } else {
            console.warn('Max items reached in queue - skip adding');
        }
    }
}

export default ObjectPool;