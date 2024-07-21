
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
        const keyWidth = 8;
        const keyArcR = blockSize / 2;
        const previousLineWidth = ctx.lineWidth;
        ctx.lineWidth = keyWidth;
        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(keyArcR, keyArcR, keyArcR, 0, Math.PI * 2);
        ctx.moveTo(2 * keyArcR, keyArcR);
        ctx.lineTo(blockSize * 2, keyArcR);
        ctx.stroke();
        ctx.lineWidth = previousLineWidth;
    }
}