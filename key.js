
class Key extends RectObject {

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        super(x, y, 2 * blockSize, 'x');
    }

    copy() {
        return new Key(this.x, this.y);
    }
    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    drawRect(ctx) {
        const keyWidth = blockSize / 10;
        const keyArcR = blockSize / 3;
        const center = blockSize / 2;
        const previousLineWidth = ctx.lineWidth;
        ctx.lineWidth = keyWidth;
        ctx.lineCap = 'round';
        ;
        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(center, center, keyArcR, 0, Math.PI * 2);
        ctx.moveTo(center + keyArcR, center );
        ctx.lineTo(blockSize * 2, center);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = 'yellow';
        const keyRidges = 3;
        const ridgesHeight = blockSize / 4;
        ctx.moveTo(blockSize * 2, center);
        ctx.lineTo(blockSize * 2, center);
        for (let i = 0; i< keyRidges; i ++) {
            const x = blockSize * 2 - ridgesHeight * i;
            ctx.lineTo(x - ridgesHeight, center - ridgesHeight);
            ctx.lineTo(x - ridgesHeight, center);
        }
        ctx.lineTo(blockSize * 2 - ridgesHeight * (keyRidges), center);
        ctx.fill();

        ctx.lineWidth = previousLineWidth;
    }
}