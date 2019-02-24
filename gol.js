/**
 * Author: Steven Joseph
 * Repo: https://github.com/AlmostInteractive/gol-js
 * Contact: https://github.com/AlmostInteractive/gol-js/issues
 * Reason: Someone asked me nicely.
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', init, false);


    // ----- Global constants and vars --------------------
    const WIDTH = 25;
    const HEIGHT = 25;
    const UPDATE_TIME = 100;
    const BUFFERS = 2; // must be at least 2

    // cell states
    const DEAD = 0;
    const ALIVE = 1;

    // draw colors
    const COLORS = {
        BACKGROUND: '#ffffff',
        BORDER: '#e0e0e0',
        ALIVE: '#58f087'
    };

    const _canvas = {
        element: null,
        context: null,
        width: null,
        height: null,
        cellSize: null
    };
    const _worlds = [];
    let _curDrawWorld = 0;
    let _isRunning = false;
    let _interval;


    // ----- UI Functions --------------------

    function start() {
        if (_isRunning)
            return;

        _isRunning = true;
        step(); // do one immediately
        _interval = setInterval(step, UPDATE_TIME);
    }

    function stop() {
        if (!_isRunning)
            return;

        clearInterval(_interval);
        _interval = null;
        _isRunning = false;
    }

    function step() {
        // draw the next buffered world
        draw();
        // update the next world during the interval downtime
        update();
    }

    function populateRandom() {
        emptyWorld(_worlds[_curDrawWorld]);
        for (let i = 0; i < WIDTH * HEIGHT * 0.3; i++) {
            _worlds[_curDrawWorld][Math.floor(Math.random() * HEIGHT)][Math.floor(Math.random() * WIDTH)] = ALIVE;
        }

        step();
    }

    function populateGliders() {
        emptyWorld(_worlds[_curDrawWorld]);

        const numGliders = Math.min(3, Math.floor(WIDTH / 5));
        const bucketSize = Math.floor(WIDTH / numGliders);

        for(let i = 0; i < numGliders; i++) {
            const x = Math.floor(Math.random() * (bucketSize - 6)) + i * bucketSize;
            const y = Math.floor(Math.random() * (WIDTH / 2));

            createGlider(x, y);
        }

        step();
    }


    // ----- Private Functions --------------------

    function init() {
        // setup canvas members
        _canvas.element = document.getElementById('canvas');
        _canvas.context = _canvas.element.getContext('2d');
        _canvas.width = _canvas.element.width;
        _canvas.height = _canvas.element.height;
        _canvas.cellSize = Math.floor(Math.min((_canvas.width - (WIDTH + 1)) / WIDTH, (_canvas.height - (HEIGHT + 1)) / HEIGHT));

        // setup UI buttons
        let btnStep = document.getElementById('step');
        let btnRun = document.getElementById('run');
        let btnStop = document.getElementById('stop');
        let btnRandom = document.getElementById('random');
        let btnGliders = document.getElementById('glider');

        btnStop.disabled = true;

        btnStep.onclick = (e) => {
            e.preventDefault();
            step();
        };

        btnRun.onclick = (e) => {
            e.preventDefault();
            btnRun.disabled = true;
            btnStop.disabled = false;
            btnStep.disabled = true;
            btnRandom.disabled = true;
            btnGliders.disabled = true;
            start();
        };

        btnStop.onclick = (e) => {
            e.preventDefault();
            btnRun.disabled = false;
            btnStop.disabled = true;
            btnStep.disabled = false;
            btnRandom.disabled = false;
            btnGliders.disabled = false;
            stop();
        };

        btnRandom.onclick = (e) => {
            e.preventDefault();
            populateRandom();
        };

        btnGliders.onclick = (e) => {
            e.preventDefault();
            populateGliders();
        };

        // create empty worlds
        for (let i = 0; i < BUFFERS; i++) {
            _worlds[i] = [];
            emptyWorld(_worlds[i]);
        }

        // initialize the board to a set/random pattern
        populateRandom();

        step();
    }

    function draw() {
        // clear board
        _canvas.context.fillStyle = COLORS.BACKGROUND;
        _canvas.context.fillRect(0, 0, _canvas.width, _canvas.height);

        // draw cells
        _canvas.context.fillStyle = COLORS.ALIVE;
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                if (_worlds[_curDrawWorld][y][x] === ALIVE)
                    _canvas.context.fillRect((1 + _canvas.cellSize) * x, (1 + _canvas.cellSize) * y, _canvas.cellSize, _canvas.cellSize);
            }
        }

        // draw grid
        _canvas.context.strokeStyle = COLORS.BORDER;
        _canvas.context.beginPath();
        for (let y = 0; y <= HEIGHT; y++) {
            _canvas.context.moveTo(0, (1 + _canvas.cellSize) * y);
            _canvas.context.lineTo((1 + _canvas.cellSize) * WIDTH, (1 + _canvas.cellSize) * y);
        }
        for (let x = 0; x <= WIDTH; x++) {
            _canvas.context.moveTo((1 + _canvas.cellSize) * x, 0);
            _canvas.context.lineTo((1 + _canvas.cellSize) * x, (1 + _canvas.cellSize) * HEIGHT);
        }
        _canvas.context.stroke();
    }

    function update() {
        const curWorld = _worlds[_curDrawWorld];
        const nextWorld = _worlds[(_curDrawWorld + 1) % BUFFERS];

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const n = getNeighbourCount(y, x);
                if (curWorld[y][x] === ALIVE) {
                    nextWorld[y][x] = (n === 2 || n === 3) ? ALIVE : DEAD;
                } else {
                    nextWorld[y][x] = (n === 3) ? ALIVE : DEAD;
                }
            }
        }

        _curDrawWorld = (_curDrawWorld + 1) % BUFFERS;
    }

    function getNeighbourCount(y, x) {
        let count = 0;
        for (let i = y - 1; i <= y + 1; i++) {
            if (i < 0 || i >= HEIGHT)
                continue;

            for (let j = x - 1; j <= x + 1; j++) {
                if (j < 0 || j >= WIDTH)
                    continue;
                if (i === y && j === x)
                    continue;
                if (_worlds[_curDrawWorld][i][j] === ALIVE)
                    count++;
            }
        }
        return count;
    }

    function emptyWorld(world) {
        for (let y = 0; y < HEIGHT; y++) {
            world[y] = [];
            for (let x = 0; x < WIDTH; x++) {
                world[y][x] = DEAD;
            }
        }
    }

    function createGlider(x, y) {
        _worlds[_curDrawWorld][y][x+1] = ALIVE;
        _worlds[_curDrawWorld][y+1][x+2] = ALIVE;
        _worlds[_curDrawWorld][y+2][x] = ALIVE;
        _worlds[_curDrawWorld][y+2][x+1] = ALIVE;
        _worlds[_curDrawWorld][y+2][x+2] = ALIVE;
    }

})();