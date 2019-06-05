import ObjectPool from "./ObjectPool";

const SPHERE_ELEMENT = 'a-sphere';

class SpherePool extends ObjectPool {
    constructor(maxItems, parentSelector) {
        super(maxItems);

        this._parentSelector = parentSelector;
        this._parentElement = document.querySelector(parentSelector);
        this._initialize();
    }

    _createSphere(id) {
        const sphere = document.createElement(SPHERE_ELEMENT);
        sphere.id = id;
        return sphere;
    }

    /**
     * Initializes sphere objects in pool
     * Adds sphere items to DOM
     */
    _initialize() {
        console.log('Initialize pool', this._maxItems)
        for (let i = 0; i < this._maxItems; i++) {
            const sphere = this._createSphere('sphere_' + i);
            // Add new sphere to pool
            this.addItem(sphere);
            // Add the same sphere to DOM
            this._parentElement.appendChild(sphere);
        }
    }

    addItem(item) {
        // TODO: hiding every added item - check alternative solution
        item.object3D.position.set(-100,-100, -100);
        super.addItem(item);
    }
}

export default SpherePool;