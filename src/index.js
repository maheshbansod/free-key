// @ts-check

import { Candle } from "./candle";
import { Key } from "./key";
import { RectObject } from "./rect-object";
import { copyTextToClipboard } from "./utils";
import { gameConsts } from "./consts";
/** @import {MinifiedRect, RectType} from "./rect-object" */

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

let isGameLoaded = false;


class GameState {
    /** @type {GameMode} */
    #mode = 'edit';
    get mode() {
        return this.#mode;
    }
    set mode(mode) {
        currentState.innerText = mode + 'ing';
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
gameConsts.blockSize = canvasSize / grid.w;

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
    isGameLoaded = true;
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
    candleSizeInput.value = String(Math.floor(selectedObject.length / gameConsts.blockSize));
}

function rotateSelectedObject() {
    if (selectedObject) {
        selectedObject.type = selectedObject.type === 'x' ? 'y' : 'x';
    }
}

function changeCandleSize() {
    if (selectedObject) {
        // candle selected
        selectedObject.length = (Number(candleSizeInput.value) || 1) * gameConsts.blockSize;
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
 * @param {number} x 
 * @param {number} y 
 * @param {number} len
 * @param {Candle[]} candles
 * @param {Key} key
 */
function findPossibleCandleAt(x, y, len, candles, key) {
    const laneX = Math.floor(x / gameConsts.blockSize);
    const laneY = Math.floor(y / gameConsts.blockSize);

    x = laneX * gameConsts.blockSize;
    y = laneY * gameConsts.blockSize;

    const candle1 = new Candle(x, y, len, 'x');
    if (candle1.intersectsWith(key)
    || candle1.intersectsWithRect(width - gameConsts.blockSize, key.y, gameConsts.blockSize, gameConsts.blockSize)) {
        return;
    }
    if (!candles.some(candle => candle.intersectsWith(candle1))) {
        return candle1;
    }
}

/**
 * 
 * @param {{x: number, y: number}} position
 * @param {{type: RectType, value: number}|null} resetType
 */
function getGridPosition(position, resetType=null) {
    const {x, y} = position;
    const normalize = (x) => Math.floor(x/gameConsts.blockSize) * gameConsts.blockSize;
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
            const newCandle = findPossibleCandleAt(x, y, gameConsts.blockSize, candles(), key);
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
        if (selectedObject && mouseState.dragStartSelectedState) {
            if (gameState.isEditMode) {
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
            } else {
                // play mode
                const {x, y} = getGridPosition({
                    x: selectedObject.x + gameConsts.blockSize / 2,
                    y: selectedObject.y + gameConsts.blockSize / 2
                });
                selectedObject.x = x;
                selectedObject.y = y;
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
                    if (selectedObject.x < 0 || selectedObject.y < 0 
                        || selectedObject.x + selectedObject.rectWidth > width
                        || selectedObject.y + selectedObject.rectHeight > height
                        || selectedObject.doesLegalMoveIntersect(oldSelectedObjectVals, objects.filter(obj => obj !== selectedObject))) {
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
                        if (obj.intersectsWithRect(width - gameConsts.blockSize, key.y, gameConsts.blockSize, gameConsts.blockSize)) {
                            return true;
                        }
                    }
                    return obj.intersectsWith(previewPreviewObject);
                }) && !previewPreviewObject.intersectsWithRect(width - gameConsts.blockSize, key.y, gameConsts.blockSize, gameConsts.blockSize)) {
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

    gameCanvas.addEventListener('pointerdown', onMouseDown); 
    gameCanvas.addEventListener('pointerup', onMouseUp);
    gameCanvas.addEventListener('pointermove', onMouseMove);
}

function draw() {
    gameCtx.fillStyle = 'black';
    gameCtx.fillRect(0, 0, width, height);

    // draw grid
    gameCtx.strokeStyle = 'lightgrey';
    for (let i = 1; i < grid.w ; i ++) {
        const x = i * gameConsts.blockSize;
        const y1 = 0;
        const y2 = height;
        gameCtx.beginPath();
        gameCtx.moveTo(x, y1);
        gameCtx.lineTo(x, y2);
        gameCtx.stroke();
    }
    for (let i = 1; i < grid.h ; i ++) {
        const y = i * gameConsts.blockSize;
        const x1 = 0;
        const x2 = height;
        gameCtx.beginPath();
        gameCtx.moveTo(x1, y);
        gameCtx.lineTo(x2, y);
        gameCtx.stroke();
    }

    if (previewObject && mouseState.isDown) {
        gameCtx.fillStyle = 'lightgreen';
        previewObject.draw(gameCtx);
    }
    // draw all objects
    objects.forEach(obj => {
        if (obj.type === 'x') {
            gameCtx.fillStyle = 'limegreen';
            gameCtx.strokeStyle = 'limegreen';
        } else {
            gameCtx.strokeStyle = 'red';
            gameCtx.fillStyle = 'red';
        }
        obj.draw(gameCtx);
    });

    if (gameState.isEditMode && selectedObject) {
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
    gameCtx.textBaseline = 'middle';
    const textSize = gameCtx.measureText(text);
    gameCtx.fillText("WIN", width - (gameConsts.blockSize + textSize.width) / 2, key.y + (fontSize + gameConsts.blockSize) / 2);
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

function serializeGame() {

    const minified = objects.map(obj => obj.minified());

    /**
     * @type {SerializedGameState}
     */
    const serializable = {
        objs: minified
    };
    
    const gameData = JSON.stringify(serializable);

    const queryParam = encodeURIComponent(btoa(gameData));

    return queryParam;
}

function playCurrentMap() {
    const queryParam = serializeGame();
    const url = new URL(window.location.href);
    url.searchParams.set("g", queryParam);
    history.pushState(null, '', url);

    startPlayMode();
}

const games = [
    "eyJvYmpzIjpbeyJjIjoiS2V5IiwieCI6MCwieSI6MiwibCI6MiwidCI6IngifSx7ImMiOiJDYW5kbGUiLCJ4IjowLCJ5IjowLCJsIjoyLCJ0IjoieSJ9LHsiYyI6IkNhbmRsZSIsIngiOjEsInkiOjAsImwiOjIsInQiOiJ4In0seyJjIjoiQ2FuZGxlIiwieCI6MiwieSI6MSwibCI6MiwidCI6InkifSx7ImMiOiJDYW5kbGUiLCJ4IjozLCJ5IjoxLCJsIjoyLCJ0IjoieCJ9LHsiYyI6IkNhbmRsZSIsIngiOjQsInkiOjAsImwiOjIsInQiOiJ4In0seyJjIjoiQ2FuZGxlIiwieCI6MSwieSI6MywibCI6MywidCI6InkifSx7ImMiOiJDYW5kbGUiLCJ4IjozLCJ5IjoyLCJsIjozLCJ0IjoieSJ9LHsiYyI6IkNhbmRsZSIsIngiOjIsInkiOjUsImwiOjIsInQiOiJ4In0seyJjIjoiQ2FuZGxlIiwieCI6NCwieSI6MywibCI6MiwidCI6IngifSx7ImMiOiJDYW5kbGUiLCJ4Ijo0LCJ5Ijo0LCJsIjoyLCJ0IjoieSJ9LHsiYyI6IkNhbmRsZSIsIngiOjUsInkiOjEsImwiOjIsInQiOiJ5In1dfQ%253D%253D",
"eyJvYmpzIjpbeyJjIjoiS2V5IiwieCI6MiwieSI6MiwibCI6MiwidCI6IngifSx7ImMiOiJDYW5kbGUiLCJ4IjoxLCJ5IjowLCJsIjozLCJ0IjoieSJ9LHsiYyI6IkNhbmRsZSIsIngiOjAsInkiOjEsImwiOjIsInQiOiJ5In0seyJjIjoiQ2FuZGxlIiwieCI6MywieSI6MCwibCI6MiwidCI6InkifSx7ImMiOiJDYW5kbGUiLCJ4Ijo0LCJ5IjowLCJsIjoyLCJ0IjoieCJ9LHsiYyI6IkNhbmRsZSIsIngiOjQsInkiOjEsImwiOjMsInQiOiJ5In0seyJjIjoiQ2FuZGxlIiwieCI6MywieSI6NCwibCI6MiwidCI6IngifSx7ImMiOiJDYW5kbGUiLCJ4Ijo1LCJ5Ijo0LCJsIjoyLCJ0IjoieSJ9LHsiYyI6IkNhbmRsZSIsIngiOjIsInkiOjMsImwiOjIsInQiOiJ5In0seyJjIjoiQ2FuZGxlIiwieCI6MCwieSI6MywibCI6MiwidCI6IngifSx7ImMiOiJDYW5kbGUiLCJ4IjowLCJ5Ijo0LCJsIjoyLCJ0IjoieSJ9LHsiYyI6IkNhbmRsZSIsIngiOjEsInkiOjUsImwiOjIsInQiOiJ4In1dfQ%253D%253D",
]

function playTodaysGame() {
    if (!isGameLoaded) {
        const queryParam = decodeURIComponent(games[1]);

        
        const url = new URL(window.location.href);
        url.searchParams.set("g", queryParam);
        history.pushState(null, '', url);

        tryLoadFromUrl();
    }
    playCurrentMap();
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
function clearReset() {
    if (gameState.isEditMode) {
        // clear
        key = new Key(0,height/2 - 2);
        objects = [key];
    } else {
        // reset
        tryLoadFromUrl();
        unselect();
    }
}

function copyGameLink() {
    const queryParam = serializeGame();

    
    const url = new URL(window.location.href);
    url.searchParams.set("g", queryParam);
    console.log("Copied game to clipboard: ",url.href);
    copyTextToClipboard(url.href);
}

const aboutTheGame = `
<h5>Description</h5>
This puzzle game's main objective is to get the key out of a maze 
by moving around the walls where the key and walls can only move in specific directions.

<h5>Credits</h5>
It's created with pure JS by <a href="https://github.com/maheshbansod">Light</a> a.k.a. <a href="https://maheshbansod.com">Mahesh Bansod</a>.<br/>
Source code for this is probably available on github. <br />
`

/**
 * 
 * @param {Record<string, unknown>} obj 
 */
function exposeToWindow(obj) {
    Object.keys(obj).forEach(key => window[key] = obj[key]);
}

exposeToWindow({
    aboutTheGame,
    copyGameLink,
    playTodaysGame,
    rotateSelectedObject,
    changeCandleSize,
    deleteSelectedObject,
    switchToEditor,
    clearReset,
    togglePlayEdit
})