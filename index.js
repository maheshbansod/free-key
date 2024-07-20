// @ts-check

const gameCanvas = /** @type {HTMLCanvasElement} */(document.getElementById('game'));
const gameCtx = /** @type {CanvasRenderingContext2D} */(gameCanvas.getContext('2d'));

const rotateBtn = /** @type {HTMLButtonElement} */ (document.getElementById('rotate-btn'));
const deleteBtn = /** @type {HTMLButtonElement} */ (document.getElementById('delete-btn'));
const candleSizeInput = /** @type {HTMLInputElement} */ (document.getElementById('candle-size-input'));

const mapSizeWidthInput = /** @type {HTMLInputElement} */(document.getElementById('map-size-w'));
const mapSizeHeightInput = /** @type {HTMLInputElement} */(document.getElementById('map-size-h'));

const onSelectionEnabledElements = [rotateBtn, candleSizeInput, deleteBtn];

function getCanvasSize() {
    const { width, height} = gameCanvas.getBoundingClientRect();
    return Math.min(width, height);
}
// const {width, height} = document.documentElement.getBoundingClientRect();
const canvasSize = getCanvasSize();
const width = canvasSize;
const height = canvasSize;

/** @type {RectObject|null} */
let selectedObject = null;
/** @type {RectObject|null} */
let previewObject = null;

console.log(`Setting canvas size ${width}, ${height}`);

gameCanvas.width = width;
gameCanvas.height = height;

gameCanvas.style.width = `${width}px`;
gameCanvas.style.height = `${height}px`;

const grid = {
    w: 6,
    h: 6,
};
const blockSize = canvasSize / grid.w;

/** @type {Candle[]} */
const candles = [];

const key = new Key(width/2, height/2, blockSize * 2, 'x');

mapSizeWidthInput.value = String(grid.w);
mapSizeHeightInput.value = String(grid.h);

mapSizeHeightInput.addEventListener('change', (e) => {
    grid.h = Number(mapSizeHeightInput.value);
})
mapSizeWidthInput.addEventListener('change', e => {
    grid.w = Number(mapSizeWidthInput.value);
})

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
    candleSizeInput.value = String(Math.floor(selectedObject.length / blockSize));
}

function rotateSelectedObject() {
    if (selectedObject) {
        selectedObject.type = selectedObject.type === 'x' ? 'y' : 'x';
    }
}

function changeCandleSize() {
    if (selectedObject) {
        // candle selected
        selectedObject.length = (Number(candleSizeInput.value) || 1) * blockSize;
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

/**
 * 
 * @param {{x: number, y: number}} position
 */
function getGridPosition({x, y}) {
    return {
        x: Math.floor(x/blockSize) * blockSize,
        y: Math.floor(y/blockSize) * blockSize
    }
}
/**
 * @type {{
 *  isDown: boolean;
 *  position: {x: number, y: number};
 *  dragStartSelectedState: {
 *      position: {x: number, y: number},
 *      offsetWithSelected: {x: number, y: number}
 *  }|null
 * }}
 */
const mouseState = {
    isDown: false,
    position: {x: 0, y: 0},
    dragStartSelectedState: null
};

function registerEditEventHandlers() {
    /**
     * 
     * @param {MouseEvent} e 
     */
    const onMouseDown = (e) => {
        const {offsetX: x, offsetY: y} = e;
        mouseState.position.x = x;
        mouseState.position.y = y;
        mouseState.isDown = true;
        const touchedCandle = candles.find(candle => candle.isAt(x, y));
        if (touchedCandle) {
            selectObject(touchedCandle);
            
            mouseState.dragStartSelectedState = {
                offsetWithSelected: {x: x - touchedCandle.x, y: y - touchedCandle.y},
                position: {x, y}
            }
            
            return;
        } else if (!selectedObject) {
            // make new candle
            const newCandle = findPossibleCandleAt(x, y, candles, blockSize);
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
        const {offsetX: x, offsetY: y} = e;
        mouseState.position.x = x;
        mouseState.position.y = y;
        if (selectedObject && mouseState.dragStartSelectedState) {
            const myCandle = selectedObject;
            if (!previewObject) {
                // revert
                const {x, y} = getGridPosition({
                    x: mouseState.dragStartSelectedState.position.x - mouseState.dragStartSelectedState.offsetWithSelected.x,
                    y: mouseState.dragStartSelectedState.position.y - mouseState.dragStartSelectedState.offsetWithSelected.y
                });
                selectedObject.x = x;
                selectedObject.y = y;
            } else {
                selectedObject.x = previewObject.x;
                selectedObject.y = previewObject.y;
                selectedObject = previewObject = null;
            }
        }
    }

    /**
     * 
     * @param {MouseEvent} e 
     */
    const onMouseMove = (e) => {
        const {offsetX: x, offsetY: y} = e;
        mouseState.position.x = x;
        mouseState.position.y = y;
        if (mouseState.isDown) {
            // drag

            if (selectedObject && mouseState.dragStartSelectedState) {
                selectedObject.x = x - mouseState.dragStartSelectedState.offsetWithSelected.x;
                selectedObject.y = y - mouseState.dragStartSelectedState.offsetWithSelected.y;

                const {x: spx, y: spy} = getGridPosition(mouseState.position);
                const previewPreviewObject = new Candle(spx, spy, selectedObject.length, selectedObject.type);
                if (!candles.filter(candle => candle !== selectedObject).some(candle => {
                    return candle.intersectsWith(previewPreviewObject);
                })) {
                    if (!previewObject) {
                        previewObject = previewPreviewObject;
                    }
                    previewObject.x = spx;
                    previewObject.y = spy;
                } else {
                    previewObject = null;
                }
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

    if (previewObject && mouseState.isDown) {
        gameCtx.fillStyle = 'lightgreen';
        previewObject.draw(gameCtx);
    }
    // draw candles
    gameCtx.fillStyle = 'black';
    candles.forEach(candle => {
        if (candle === selectedObject) {
            return;
        }
        candle.draw(gameCtx);
    });

    // draw grid
    gameCtx.strokeStyle = 'lightgrey';
    for (let i = 1; i < grid.w ; i ++) {
        const x = i * blockSize;
        const y1 = 0;
        const y2 = height;
        gameCtx.beginPath();
        gameCtx.moveTo(x, y1);
        gameCtx.lineTo(x, y2);
        gameCtx.stroke();
    }
    for (let i = 1; i < grid.h ; i ++) {
        const y = i * blockSize;
        const x1 = 0;
        const x2 = height;
        gameCtx.beginPath();
        gameCtx.moveTo(x1, y);
        gameCtx.lineTo(x2, y);
        gameCtx.stroke();
    }

    if (selectedObject) {
        gameCtx.fillStyle = 'blue';
        selectedObject.draw(gameCtx);
    }

    requestAnimationFrame(draw);
}

registerEditEventHandlers();

requestAnimationFrame(draw);