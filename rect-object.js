//@ts-check

/**
 * @typedef {'x'|'y'} RectType
 * 
 * @typedef {{
 * c: string,// constructor name
 * x: number,
 * y: number,
 * l: number,
 * t: RectType, // type
 * e?: Record<string, any>, // extra
 * }} MinifiedRect
 */

class RectObject {

    WIDTH = blockSize;
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} length 
     * @param {RectType} type
     */
    constructor(x, y, length, type) {
        this.x = x;
        this.y = y;
        this.length = length;
        this.type = type;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    isAt(x, y) {
        if (this.type === 'x') {
            return this.x < x && x < this.x + this.length
                && this.y < y && y < this.y + this.WIDTH;
        } else {
            return this.x < x && x < this.x + this.WIDTH
                && this.y < y && y < this.y + this.length;
        }
    }

    /**
     * 
     * @param {RectObject} rect 
     */
    intersectsWith(rect) {

        return this.intersectsWithRect(rect.x, rect.y, rect.rectWidth, rect.rectHeight);
    }

    /**
     * 
     * @param {RectObject} rect 
     * @param {{x: number, y: number}[]} corners 
     * @returns 
     */
    intersectsWithCorners(rect, corners) {
        if (corners.some(corner => rect.isAt(corner.x, corner.y))) {
            return true;
        }

        return false;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     */
    intersectsWithRect(x, y, w, h) {
        const p = 10;
        const right = x + w ;
        const bottom = y + h;
        const mRight = this.x + this.rectWidth;
        const mBottom = this.y + this.rectHeight;
        return this.x < right && mRight > x && this.y < bottom && mBottom > y;
    }

    /**
     * 
     * @param {{x: number, y: number}} movedFrom 
     * @param {RectObject[]} objects
     */
    doesLegalMoveIntersect(movedFrom, objects) {
        const p = 20;
        const x = Math.min(movedFrom.x, this.x) + p;
        const y = Math.min(movedFrom.y, this.y) + p;
        const w = Math.abs(this.x - movedFrom.x) + this.rectWidth - p;
        const h = Math.abs(this.y - movedFrom.y) + this.rectHeight - p;

        return objects.some(obj => obj.intersectsWithRect(x, y, w, h));
    }

    get rectWidth() {
        if (this.type === 'x') {
            return this.length;
        } else {
            return this.WIDTH;
        }
    }

    get rectHeight() {
        if (this.type === 'x') {
            return this.WIDTH;
        } else {
            return this.length;
        }
    }

    /**
     * Divides everything by width
     */
    minified() {
        const d = this.WIDTH;

        const x = this.x / d;
        const y = this.y / d;
        const length = this.length / d;

        /**
         * @type {MinifiedRect}
         */
        const minified = {
            c: this.constructor.name,
            x,
            y,
            l: length,
            t: this.type
        }

        const keysAlreadyTaken = [ "WIDTH", "x", "y", "length", "type" ];
        const extraKeys = Object.keys(this).filter(k => !keysAlreadyTaken.includes(k));
        if (extraKeys.length > 0) {
            const extraKeys = {   
            };
            extraKeys.forEach(k => extraKeys[k] = this[k]);
            minified.e = extraKeys;
        }

        return minified;
    }

    /**
     * 
     * @param {MinifiedRect} minified 
     * @param {(Record<string, typeof RectObject>)} derivedClasses
     */
    static fromMinified(minified, derivedClasses) {
        const d = blockSize;

        const cons = derivedClasses[minified.c];
        /** @type {RectObject} */
        const instance = new cons(minified.x, minified.y, minified.l, minified.t);
        instance.x = minified.x * d;
        instance.y = minified.y * d;
        instance.length = minified.l * d;
        instance.type = minified.t;
        if (minified.e) {
            const extraKeys = minified.e;
            const keys = Object.keys(extraKeys);
            keys.forEach(key => instance[key] = extraKeys[key])
        }
        return instance;
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    drawRect(ctx) {
        throw new Error('override this implementation');
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + (this.type === 'x' ? 0 : this.WIDTH), this.y);
        const angle = this.type === 'x' ? 0 : Math.PI / 2;
        ctx.rotate(angle);
        this.drawRect(ctx);
        ctx.restore();
    }
}