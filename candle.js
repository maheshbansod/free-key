//@ts-check

class Candle extends RectObject {
    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    drawRect(ctx) {
        const knobspace = 5;
        const knobwidth = 15;

        ctx.beginPath();
        const rectLength = this.length - 2 * knobspace;
        ctx.rect(knobspace, 0, rectLength, this.WIDTH);
        const knobstartx = 0;
        const knobstarty = this.WIDTH/2 - knobwidth/2;
        ctx.rect(knobstartx, knobstarty, knobspace, knobwidth);
        ctx.rect(knobstartx + this.length - knobspace, knobstarty, knobspace, knobwidth);
        
        ctx.fill();
    }
}

/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {number} len
 * @param {Candle[]} candles
 * @param {Key} key
 */
function findPossibleCandleAt(x, y, len, candles, key) {
    const laneX = Math.floor(x / blockSize);
    const laneY = Math.floor(y / blockSize);

    x = laneX * blockSize;
    y = laneY * blockSize;

    const candle1 = new Candle(x, y, len, 'x');
    if (candle1.intersectsWith(key)
    || candle1.intersectsWithRect(width - blockSize, key.y, blockSize, blockSize)) {
        return;
    }
    if (!candles.some(candle => candle.intersectsWith(candle1))) {
        return candle1;
    }
}