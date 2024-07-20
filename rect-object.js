//@ts-check

/**
 * @typedef {'x'|'y'} RectType
 */

class RectObject {

    WIDTH = 50;
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
        const corners = [
            {x: this.x, y: this.y},
            {
                x: this.x + this.rectWidth,
                y: this.y
            },
            {
                x: this.x + this.rectWidth,
                y: this.y + this.rectHeight
            },
            {
                x: this.x,
                y: this.y + this.rectHeight,
            }
        ];

        if (corners.some(corner => rect.isAt(corner.x, corner.y))) {
            return true;
        }
        return false;
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