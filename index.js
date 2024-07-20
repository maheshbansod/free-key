// @ts-check

const gameCanvas = /** @type {HTMLCanvasElement} */(document.getElementById('game'));
const gameCtx = /** @type {CanvasRenderingContext2D} */(gameCanvas.getContext('2d'));

const rotateBtn = /** @type {HTMLButtonElement} */ (document.getElementById('rotate-btn'));
const deleteBtn = /** @type {HTMLButtonElement} */ (document.getElementById('delete-btn'));
const candleSizeInput = /** @type {HTMLInputElement} */ (document.getElementById('candle-size-input'));

const onSelectionEnabledElements = [rotateBtn, candleSizeInput, deleteBtn];

// const {width, height} = document.documentElement.getBoundingClientRect();
const width = window.innerWidth;
const height = window.innerHeight;

/** @type {RectObject|null} */
let selectedObject = null;

console.log(`Setting canvas size ${width}, ${height}`);

gameCanvas.width = width;
gameCanvas.height = height;

const BLOCK_SIZE = 100;

/** @type {Candle[]} */
const candles = [];

const key = new Key(width/2, height/2, BLOCK_SIZE * 2, 'x');

function unselect() {
    selectedObject = null;
    onSelectionEnabledElements.forEach(elem => {
        elem.classList.add('hidden');
    });
}

/**
 * 
 * @param {RectObject} object 
 */
function selectObject(object) {
    selectedObject = object;
    onSelectionEnabledElements.forEach(elem => {
        elem.classList.remove('hidden');
    });
    candleSizeInput.value = String(selectedObject.length);
}

function rotateSelectedObject() {
    if (selectedObject) {
        selectedObject.type = selectedObject.type === 'x' ? 'y' : 'x';
    }
}

function changeCandleSize() {
    if (selectedObject) {
        // candle selected
        selectedObject.length = Number(candleSizeInput.value || BLOCK_SIZE);
    }
}

function deleteSelectedObject() {
    if (selectedObject) {
        const index = candles.findIndex(candle => candle === selectedObject);
        if (index >= 0) {
            candles.splice(index, 1);
            unselect();
        }
    }
}

function registerEditEventHandlers() {
    /**
     * @type {{
     *  isDown: boolean;
     *  lastOffsetWithSelected: {x: number, y: number}|null
     * }}
     */
    const mouseState = {
        isDown: false,
        lastOffsetWithSelected: null
    };
    /**
     * 
     * @param {MouseEvent} e 
     */
    const onMouseDown = (e) => {
        const {offsetX: x, offsetY: y} = e;
        mouseState.isDown = true;
        const touchedCandle = candles.find(candle => candle.isAt(x, y));
        if (touchedCandle) {
            selectObject(touchedCandle);
            
            mouseState.lastOffsetWithSelected = {x: x - touchedCandle.x, y: y - touchedCandle.y};
            
            return;
        } else if (!selectedObject) {
            // make new candle
            const newCandle = findPossibleCandleAt(x, y, candles, BLOCK_SIZE);
            if (!newCandle) {
                throw new Error('no place to make a candle');
            }
            candles.push(newCandle);
        }
        unselect();
    }

    /**
     * 
     * @param {MouseEvent} e 
     */
    const onMouseUp = (e) => {
        mouseState.isDown = false;
    }

    /**
     * 
     * @param {MouseEvent} e 
     */
    const onMouseMove = (e) => {
        const {offsetX: x, offsetY: y} = e;
        if (mouseState.isDown) {
            // drag

            if (selectedObject && mouseState.lastOffsetWithSelected) {
                selectedObject.x = x - mouseState.lastOffsetWithSelected.x;
                selectedObject.y = y - mouseState.lastOffsetWithSelected.y;
            }
        }
    }

    gameCanvas.addEventListener('mousedown', onMouseDown); 
    gameCanvas.addEventListener('mouseup', onMouseUp);
    gameCanvas.addEventListener('mousemove', onMouseMove);
}

function draw() {
    gameCtx.fillStyle = 'white';
    gameCtx.fillRect(0, 0, width, height);
    // draw candles
    gameCtx.fillStyle = 'black';
    candles.forEach(candle => {
        if (candle === selectedObject) {
            return;
        }
        candle.draw(gameCtx);
    });
    if (selectedObject) {
        gameCtx.fillStyle = 'blue';
        selectedObject.draw(gameCtx);
    }


    requestAnimationFrame(draw);
}

registerEditEventHandlers();

requestAnimationFrame(draw);