//@ts-check

import { RectObject } from "./rect-object";

export class Candle extends RectObject {
    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    drawRect(ctx) {
        const knobspace = 15;
        const knobwidth = 15;

        const padding = 10;

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.rect(1, 1, this.length - 2, this.WIDTH - 2);
        ctx.stroke();
        const oldFilter = ctx.filter;
        ctx.filter = 'brightness(70%) opacity(0.5)';
        ctx.beginPath();
        ctx.rect(1, 1, this.length - 2, this.WIDTH - 2);
        ctx.fill();
        ctx.filter = oldFilter;
        ctx.beginPath();
        const rectLength = this.length - 2 * knobspace;
        ctx.roundRect(knobspace, padding, rectLength, this.WIDTH - padding * 2, 10);
        const knobstartx = 0;
        const knobstarty = this.WIDTH/2 - knobwidth/2;
        ctx.rect(knobstartx, knobstarty, knobspace, knobwidth);
        ctx.rect(knobstartx + this.length - knobspace, knobstarty, knobspace, knobwidth);
        ctx.fill();
    }
}