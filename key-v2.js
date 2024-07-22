// @ts-check

import { gameConsts } from "./consts";
import { RectObject } from "./rect-object";

export class Key extends RectObject {

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        super(x, y, 2 * gameConsts.blockSize, 'x');
    }

    copy() {
        return new Key(this.x, this.y);
    }
    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    drawRect(ctx) {
        const keyWidth = gameConsts.blockSize / 10;
        const keyArcR = gameConsts.blockSize / 3;
        const center = gameConsts.blockSize / 2;
        const previousLineWidth = ctx.lineWidth;
        ctx.lineWidth = keyWidth;
        ctx.lineCap = 'round';
        ;
        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(center, center, keyArcR, 0, Math.PI * 2);
        ctx.moveTo(center + keyArcR, center );
        ctx.lineTo(gameConsts.blockSize * 2, center);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = 'yellow';
        const keyRidges = 3;
        const ridgesHeight = gameConsts.blockSize / 4;
        ctx.moveTo(gameConsts.blockSize * 2, center);
        ctx.lineTo(gameConsts.blockSize * 2, center);
        for (let i = 0; i< keyRidges; i ++) {
            const x = gameConsts.blockSize * 2 - ridgesHeight * i;
            ctx.lineTo(x - ridgesHeight, center - ridgesHeight);
            ctx.lineTo(x - ridgesHeight, center);
        }
        ctx.lineTo(gameConsts.blockSize * 2 - ridgesHeight * (keyRidges), center);
        ctx.fill();

        ctx.lineWidth = previousLineWidth;
    }
}