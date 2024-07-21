// @ts-check

const gameCanvas = /** @type {HTMLCanvasElement} */(document.getElementById('game'));
const gameCtx = /** @type {CanvasRenderingContext2D} */(gameCanvas.getContext('2d'));

const rotateBtn = /** @type {HTMLButtonElement} */ (document.getElementById('rotate-btn'));
const deleteBtn = /** @type {HTMLButtonElement} */ (document.getElementById('delete-btn'));
const candleSizeInput = /** @type {HTMLInputElement} */ (document.getElementById('candle-size-input'));

// const mapSizeWidthInput = /** @type {HTMLInputElement} */(document.getElementById('map-size-w'));
// const mapSizeHeightInput = /** @type {HTMLInputElement} */(document.getElementById('map-size-h'));

const editToolsContainer = /** @type {HTMLDivElement} */ (document.getElementById('edit-tools-container'));
const commonToolsContainer = /** @type {HTMLDivElement} */ (document.getElementById('common-tools-container'));
const toolsWrapper = /** @type {HTMLDivElement} */ (document.getElementById('tools'));
const mainMenu = /** @type {HTMLDivElement} */ (document.getElementById("main-menu"));
const currentState = /** @type {HTMLSpanElement} */ (document.getElementById('current-state'));


class GameState {
    /** @type {GameMode} */
    #mode = 'edit';
    get mode() {
        return this.#mode;
    }
    set mode(mode) {
        currentState.innerText = mode;
        this.#mode = mode;
    }

    get isEditMode() {
        return this.#mode === 'edit';
    }
    get isPlayMode() {
        return this.#mode === 'play';
    }
}
/** @typedef {'play' | 'edit'} GameMode */

const gameState = new GameState();


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

toolsWrapper.style.width = `${width}px`;

const grid = {
    w: 6,
    h: 6,
};
const blockSize = canvasSize / grid.w;

let key = new Key(0, height/2 - 1);

/** @type {RectObject[]} */
let objects = [key];

const derivedClasses = {
    RectObject, Key, Candle
};

tryLoadFromUrl();

function tryLoadFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameData = urlParams.get('g');
    if (gameData) {
        try {
            console.log('loading')
            console.log(gameData);
            loadGame(decodeURIComponent(gameData));
        } catch(e) {
            console.error('Attempted to load game from URL but failed.');
            console.error(e);
        }
    }
}

/** @typedef {{objs: MinifiedRect[]}} SerializedGameState */

/**
 * 
 * @param {string} b64 
 */
function loadGame(b64) {
    /**
     * @type {SerializedGameState}
     */
    const data = JSON.parse(atob(b64));

    const loadedObjects = [];

    for (const obj of data.objs) {
        const object = RectObject.fromMinified(obj, derivedClasses);
        loadedObjects.push(object);
    }

    const newKey = loadedObjects.find(object => object instanceof Key);
    if (newKey) {
        key = newKey;
    } else {
        loadedObjects.push(key);
    }
    objects = loadedObjects;
}

const candles = () => {
    return objects.filter(obj => obj instanceof Candle);
}

// mapSizeWidthInput.value = String(grid.w);
// mapSizeHeightInput.value = String(grid.h);

// mapSizeHeightInput.addEventListener('change', (e) => {
//     grid.h = Number(mapSizeHeightInput.value);
// })
// mapSizeWidthInput.addEventListener('change', e => {
//     grid.w = Number(mapSizeWidthInput.value);
// })

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
    if (selectedObject instanceof Candle) {
        const index = objects.findIndex(candle => candle === selectedObject);
        if (index >= 0) {
            objects.splice(index, 1);
            unselect();
        }
    }
}

/**
 * 
 * @param {{x: number, y: number}} position
 * @param {{type: RectType, value: number}|null} resetType
 */
function getGridPosition(position, resetType=null) {
    const {x, y} = position;
    const normalize = (x) => Math.floor(x/blockSize) * blockSize;
    if (!resetType) {
        return {
            x: normalize(x),
            y: normalize(y)
        }
    }
    return {
        ...position,
        [resetType.type]: normalize(resetType.value),
    };
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
        const touchedObject = objects.find(obj => obj.isAt(x, y));
        if (touchedObject) {
            selectObject(touchedObject);
            
            mouseState.dragStartSelectedState = {
                offsetWithSelected: {x: x - touchedObject.x, y: y - touchedObject.y},
                position: {x, y}
            }
            
            return;
        } else if (!selectedObject) {
            if (!gameState.isEditMode) {
                return;
            }
            // make new candle
            const newCandle = findPossibleCandleAt(x, y, blockSize, candles(), key);
            if (!newCandle) {
                throw new Error('no place to make a candle');
            }
            objects.push(newCandle);
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
        if (!gameState.isEditMode) {
            return;
        }
        if (selectedObject && mouseState.dragStartSelectedState) {
            if (!previewObject) {
                // revert
                const {x, y} = getGridPosition({
                    x: mouseState.dragStartSelectedState.position.x,
                    y: mouseState.dragStartSelectedState.position.y
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
                
                const typeToKeepFixed = gameState.isEditMode ? undefined : selectedObject.type === 'x' ? 'y' : 'x';
                const {x: spx, y: spy} = getGridPosition(mouseState.position, !typeToKeepFixed ? null : {type: typeToKeepFixed, value: selectedObject[typeToKeepFixed]});
                const oldSelectedObjectVals = {
                    x: selectedObject.x,
                    y: selectedObject.y,
                };

                if (typeToKeepFixed !== 'x') {
                    selectedObject.x = x - mouseState.dragStartSelectedState.offsetWithSelected.x;
                }
                if (typeToKeepFixed !== 'y') {
                    selectedObject.y = y - mouseState.dragStartSelectedState.offsetWithSelected.y;
                }
                if (gameState.isPlayMode) {
                    if (selectedObject.doesLegalMoveIntersect(oldSelectedObjectVals, objects.filter(obj => obj !== selectedObject))) {
                        selectedObject.x = oldSelectedObjectVals.x;
                        selectedObject.y = oldSelectedObjectVals.y;
                    }
                }
                if (!gameState.isEditMode) {
                    return;
                }

                const previewPreviewObject = new Candle(spx, spy, selectedObject.length, selectedObject.type);
                if (!objects.filter(obj => obj !== selectedObject).some(obj => {
                    if (selectedObject instanceof Key) {
                        if (obj.intersectsWithRect(width - blockSize, key.y, blockSize, blockSize)) {
                            return true;
                        }
                    }
                    return obj.intersectsWith(previewPreviewObject);
                }) && !previewPreviewObject.intersectsWithRect(width - blockSize, key.y, blockSize, blockSize)) {
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
    // draw all objects
    gameCtx.fillStyle = 'black';
    objects.forEach(obj => {
        if (obj === selectedObject) {
            return;
        }
        obj.draw(gameCtx);
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

    key.draw(gameCtx);

    // exit gate
    gameCtx.fillStyle = 'black';
    const fontSize = 30;
    gameCtx.beginPath();
    const text = "WIN";
    gameCtx.font = `${fontSize}px Arial`;
    const textSize = gameCtx.measureText(text);
    gameCtx.fillText("WIN", width - (blockSize + textSize.width) / 2, key.y + (textSize.emHeightAscent + blockSize) / 2);
    gameCtx.fill();

    requestAnimationFrame(draw);
}

registerEditEventHandlers();

requestAnimationFrame(draw);

function closeMenu() {
    mainMenu.classList.add('hidden');
    commonToolsContainer.classList.remove('hidden');
}

function switchToEditor() {
    gameState.mode = 'edit';
    const url = new URL(window.location.href);
    url.searchParams.delete("g");
    history.pushState(null, '', url);

    editToolsContainer.classList.remove('hidden');
    if (!mainMenu.classList.contains('hidden')) {
        closeMenu();
    }
    selectedObject = null;
}

function playCurrentMap() {
    const minified = objects.map(obj => obj.minified());

    /**
     * @type {SerializedGameState}
     */
    const serializable = {
        objs: minified
    };
    
    const gameData = JSON.stringify(serializable);

    const queryParam = encodeURIComponent(btoa(gameData));
    const url = new URL(window.location.href);
    url.searchParams.set("g", queryParam);
    history.pushState(null, '', url);

    startPlayMode();
}

function startPlayMode() {
    gameState.mode = 'play';
    if (!mainMenu.classList.contains('hidden')) {
        closeMenu();
    }
    editToolsContainer.classList.add('hidden');
    selectedObject = null;
}

function togglePlayEdit() {
    if (gameState.isEditMode) {
        playCurrentMap();
    } else {
        switchToEditor();
    }
}