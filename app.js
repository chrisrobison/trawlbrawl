(function() {
    const app = {
        init: function() {
            app.state.loaded = true;
            app.buildboard();
            app.genboard();

            $("#board").addEventListener("mousedown", function(e) {
                //$("#board").addEventListener("mousemove", app.drag);
                app.handleMouseDown(e);
                app.state.lastClick = {
                    x: e.layerX,
                    y: e.layerY
                };
                /*
                app.state.dragging = {
                     el: e.target,
                     startX: e.layerX,
                     startY: e.layerY
                 };
                */
            });

            $("#board").addEventListener("mouseup", function(e) {
                app.state.dragging = '';
                $("#board").removeEventListener("mousemove", app.drag);
                app.handleMouseUp(e);
            });
        },
        state: {
            loaded: false,
            selected: '',
            queue: [],
            particles: [],
            clearItems: [],
            explosions: [],
            inventory: [
                {
                    bobber: 0,
                    fish: 0,
                    hook: 0,
                    net: 0,
                    pole: 0,
                    trap: 0,
                    worm: 0
                },
                {
                    bobber: 0,
                    fish: 0,
                    hook: 0,
                    net: 0,
                    pole: 0,
                    trap: 0,
                    worm: 0
                }
            ],
            currentPlayer: 0,
            score: 0
        },
        config: {
            goal: 100,
            rows: 9,
            cols: 9,
            cellWidth: 65,
            cellHeight: 65,
            items: ["bobber", "fish", "hook", "net", "pole", "trap", "worm"],
            attacks: [{
                id: "catch",
                name: "Fish Catch",
                required: {
                    trap: 5,
                    bobber: 4,
                    hook: 7
                },
                icon: 'img/fish+.png'
            }, {
                id: "attack",
                name: "Attack",
                required: {
                    bobber: 7,
                    hook: 5,
                    net: 6
                },
                icon: 'img/catfish.png'
            }, {
                id: "snatch",
                name: "Snatch",
                required: {
                    trap: 9,
                    net: 12,
                    pole: 10
                },
                icon: 'img/burglefish.png'
            }, {
                id: "net",
                name: "Fishing Net ",
                required: {
                    bobber: 12,
                    pole: 10,
                    worm: 8
                },
                icon: 'img/fishingnet.png'
            }],
            inventoryMax: 15
        },
        drag: function(e) {
            let obj = app.state.dragging;
            obj.el.style.transform = "translate(" + Math.abs(obj.startX - e.layerX) + "px, " + Math.abs(obj.startY - e.layerY) + "px)";
        },
        handleMouseUp: function(e) {
            let el = e.target;
            if (app.state.selected && (app.state.selected === el.id)) {
                if ((Math.abs(app.state.lastClick.x - e.layerX) > 3) ||
                    (Math.abs(app.state.lastClick.y - e.layerY) > 3)) {
                    app.state.selected = "";
                    el.classList.remove("selected");

                    return false;
                }
            } else if (app.state.selected && (app.state.selected !== el.id)) {
                let [my, mx] = app.rowcol(el.id);
                let [sy, sx] = app.rowcol(app.state.selected);

                if ((((sx - mx) >= -1) && ((sx - mx <= 1))) &&
                    (((sy - my) >= -1) && ((sy - my <= 1)))) {

                    app.swapSpots({
                        x: sx,
                        y: sy,
                        id: `r${sy}c${sx}`
                    }, {
                        x: mx,
                        y: my,
                        id: `r${my}c${mx}`
                    });
                    //setTimeout(function() { app.checkMatches(); }, 500);
                    setTimeout(function() {
                        if (!app.checkMatches().length) {
                            console.log("No matches.  swapping back");
                            app.swapSpots({
                                x: mx,
                                y: my,
                                id: `r${my}c${mx}`
                            }, {
                                x: sx,
                                y: sy,
                                id: `r${sy}c${sx}`
                            });
                        } else {
                            console.log("Found matches. leaving alone");
                        }
                    }, 300);
                } else {
                    let sel = $(".selected");
                    if (sel) sel.classList.remove("selected");

                    app.state.selected = el.id;
                    el.classList.add('selected');
                }
            }
        },
        handleMouseDown: function(e) {
            let el = e.target;

            if (!app.state.selected) {
                app.state.selected = el.id;
                el.classList.add("selected");
                return false;
            } else if (app.state.selected && (app.state.selected === el.id)) {
                if ((Math.abs(app.state.lastClick.x - e.layerX) > 3) ||
                    (Math.abs(app.state.lastClick.y - e.layerY) > 3)) {
                    app.state.selected = "";
                    el.classList.remove("selected");

                    return false;
                }
            }
        },
        swapSpots: function(p1, p2) {
            console.log("Swapping from [" + p1.x + ',' + p1.y + "] to [" + p2.x + ',' + p2.y + "]");
            let tmp = app.state.board[p1.y][p1.x];
            app.state.board[p1.y][p1.x] = app.state.board[p2.y][p2.x];
            app.state.board[p2.y][p2.x] = tmp;

            let el1 = $("#item_r" + p1.y + "c" + p1.x);
            let el2 = $("#item_r" + p2.y + "c" + p2.x);

            el1.style.top = (app.config.cellHeight * p2.y) + 'px';
            el1.style.left = (app.config.cellWidth * p2.x) + 'px';

            el2.style.top = (app.config.cellHeight * p1.y) + 'px';
            el2.style.left = (app.config.cellWidth * p1.x) + 'px';

            let tmpid = el1.id;
            el1.id = el2.id;
            el2.id = tmpid;
        },
        rowcol: function(str) {
            return str.split(/\D*/).splice(1, 2);
        },
        buildboard: function() {
            let out = "";
            app.state.board = [];

            out += "<div id='score'><img src='img/anifish.gif' class='anifish'>";
            out += "<div id='fishProgress'></div>";
            out += "<span id='fishcount'>0/0</span>";
            out += "</div>";

            out += "<div id='inventory'>";
            app.config.items.forEach(function(item) {
                if (item !== 'fish') {
                    out += "<div class='inventory blank_" + item + "'><div id ='inv_img_" + item + "' class='invItem " + item + "'></div><span id='inv_" + item + "'>0</span></div>";
                }
            });
            out += "</div>";

            for (let i = 0; i < app.config.attacks.length; i++) {
                let attack = app.config.attacks[i];

                out += "<div class='attack'><img src='" + attack.icon + "' class='attackIcon'><h2>" + attack.name + "</h2>";
                for (const [key, val] of Object.entries(attack.required)) {
                    out += "<div class='attackReq " + key + "' id='" + attack.id + "_" + key + "'><span class='attackVal'>" + val + "</span></div>";
                }
                out += "</div>";
            }

            $("nav").innerHTML = out;

            out = "";
            for (let row = 0; row < app.config.rows; row++) {
                app.state.board[row] = [];
                out += "<div class='row'>";
                for (let col = 0; col < app.config.cols; col++) {
                    let id = `r${row}c${col}`;

                    out += `<div id='box_${id}' class='box'><span id='${id}' class='cell'></span></div>`;

                }
                out += "</div>";
            }

            $("#board").innerHTML = out;

            out = "";
            
            out += "<div id='opponent'><img src='img/anifish.gif' class='evilfish'>";
            out += "<div id='opponentProgress'></div>";
            out += "<span id='opponentScore'>0/0</span>";
            out += "</div>";
            
            $("aside").innerHTML = out;

        },
        updateScoreboard: function(player=0) {
            $("#opponentScore").innerHTMNL = app.state.inventory[player^1].fish + ' / ' + app.config.goal;
            $("#fishcount").innerHTML = app.state.inventory[player].fish + ' / ' + app.config.goal;
            $("#fishProgress").style.width = Math.floor((app.state.inventory[player].fish / app.config.goal) * 100) + '%';

            app.config.items.forEach((item) => {
                if (item !== 'fish') {
                    let val = (app.state.inventory[player][item] >= 15) ? "max" : app.state.inventory[player][item];

                    $(`#inv_${item}`).innerHTML = val;
                    let percent = app.state.inventory[player][item] / 15;
                    $("#inv_img_" + item).style.paddingTop = 65 - (65 * percent) + "px";
                }
            });

            app.config.items.forEach(function(item) {
                for (let i = 0; i < app.config.attacks.length; i++) {
                    let attack = app.config.attacks[i];

                    for (const [key, val] of Object.entries(attack.required)) {
                        let newval = val - app.state.inventory[player][key];
                        let pid = attack.id + '_' + key;
                        if (newval <= 0) {
                            $(`#${attack.id}_${key} .attackVal`).classList.add('complete');
                            newval = '√';
                        }

                        //console.log("updating " + pid + " with " + newval + " (was " + val + ")");

                        $(`#${attack.id}_${key} .attackVal`).innerHTML = newval;
                    }
                }
            });
        },
        genboard: function() {
            let out = "", last = "", item = "";
            app.state.board = [];
            for (let row = 0; row < app.config.rows; row++) {
                app.state.board[row] = [];

                for (let col = 0; col < app.config.cols; col++) {
                    let itemIdx = -1;
                    while (itemIdx < 0) {
                        itemIdx = Math.floor(Math.random() * app.config.items.length);
                        item = app.config.items[itemIdx];

                        if ((col > 0) && (app.state.board[row][col - 1] == item)) {
                            itemIdx = -1;
                        }
                        if ((row > 0) && (app.state.board[row - 1][col] == item)) {
                            itemIdx = -1;
                        }
                    }
                    let id = `r${row}c${col}`;
                    app.state.board[row][col] = item;
                    
                    last = item;
                    let el = app.mkitem(row, col, item);

                    $("#board").appendChild(el);
                }
            }
            console.dir(app.state.board);
        },
        mkitem: function(row = 0, col = 0, item = '') {
            let el = document.createElement('div');
            el.id = `item_r${row}c${col}`;
            el.className = 'item ' + item;
            //            el.draggable = "true";

            el.style.top = row * app.config.cellHeight + 'px';
            el.style.left = col * app.config.cellWidth + 'px';

            return el;
        },
        autoMove: function() {
            let moves = app.findMoves();
            const coord = {};
console.dir(moves);
            if (moves.length) {
                let move = moves[app.rand(0, moves.length)];
                coord.from = move.from.split(/\D/);
                coord.from.shift();

                coord.to = move.to.split(/\D/);
                coord.to.shift();

                app.swapSpots({x: coord.from[1], y: coord.from[0]}, {x: coord.to[1], y: coord.to[0]});

                setTimeout(function() { app.checkMatches(0, app.state.currentPlayer, false); app.state.currentPlayer ^= 1; }, 500);
            }
        },
        findMoves: function() {
           // check each row looking for patterns of either XX-X/X-XX or X-X and check rows before/after for matching item
            let moves = [];

            for (let r=0; r<app.config.rows; r++) {
                for (let c=0; c< app.config.cols; c++) {
                    let cell = app.state.board[r][c];
                    if ((app.state.board[r][c + 1] == cell) && (app.state.board[r][c+3] == cell)) {
                        moves.push({ from: `r${r}c${c+3}`, to: `r${r}c${c+2}` });
                    } else if ((c < app.config.cols - 4) && (app.state.board[r][c + 2] == cell) && (app.state.board[r][c+3] == cell)) {
                        moves.push({ from: `r${r}c${c}`, to: `r${r}c${c+1}` });
                    } else if ((c < app.config.cols - 3) && (r < app.config.rows - 2) && (app.state.board[r][c + 2] == cell) && (app.state.board[r+1][c+1] == cell)) {
                        moves.push({ from: `r${r+1}c${c+1}`, to: `r${r}c${c+1}` });
                    } else if ((r > 0) && (app.state.board[r][c + 2] == cell) && (app.state.board[r-1][c+1] == cell)) {
                        moves.push({ from: `r${r-1}c${c+1}`, to: `r${r}c${c+1}` });
                    } else if ((r > 0) && (app.state.board[r][c + 1] == cell) && (app.state.board[r-1][c+2] == cell)) {
                        moves.push({ from: `r${r-1}c${c+2}`, to: `r${r}c${c+2}` });
                    } else if ((r < app.config.rows - 2) && (app.state.board[r][c + 1] == cell) && (app.state.board[r+1][c+2] == cell)) {
                        moves.push({ from: `r${r+1}c${c+2}`, to: `r${r}c${c+2}` });
                    }
                }
            }
            
            for (let c=0; c<app.config.cols; c++) {
                for (let r=0; r< app.config.rows; r++) {
                    let cell = app.state.board[r][c];
                    if ((r < app.config.rows - 4) && (app.state.board[r + 1][c] == cell) && (app.state.board[r + 3][c] == cell)) {
                        moves.push({ from: `r${r+3}c${c}`, to: `r${r+2}c${c}` });
                    } else if ((r < app.config.rows - 4) && (app.state.board[r + 2][c] == cell) && (app.state.board[r + 3][c] == cell)) {
                        moves.push({ from: `r${r}c${c}`, to: `r${r+1}c${c}` });
                    } else if ((r < app.config.rows - 3) && (c < app.config.cols - 2) && (app.state.board[r + 2][c] == cell) && (app.state.board[r+1][c+1] == cell)) {
                        moves.push({ from: `r${r+1}c${c+1}`, to: `r${r+1}c${c}` });
                    } else if ((r < app.config.rows - 3) && (c > 0) && (app.state.board[r + 2][c] == cell) && (app.state.board[r+1][c-1] == cell)) {
                        moves.push({ from: `r${r+1}c${c-1}`, to: `r${r+1}c${c}` });
                    } else if ((r < app.config.rows - 3) && (c > 0) && (app.state.board[r + 2][c - 1] == cell) && (app.state.board[r+1][c] == cell)) {
                        moves.push({ from: `r${r+2}c${c-1}`, to: `r${r+2}c${c}` });
                    } else if ((r < app.config.rows - 3) && (c < app.config.cols -2) && (app.state.board[r + 1][c] == cell) && (app.state.board[r+2][c+1] == cell)) {
                        moves.push({ from: `r${r-1}c${c+2}`, to: `r${r+2}c${c}` });
                    } else if ((r < app.config.rows - 2) && (app.state.board[r][c + 1] == cell) && (app.state.board[r+1][c+2] == cell)) {
                        moves.push({ from: `r${r+1}c${c+2}`, to: `r${r}c${c+2}` });
                    }
                }
            }
            console.dir(moves);
            return moves;
        },
        checkMatches: function(cnt, player=0, noscore=false) {
            let matches = {};
            cnt = cnt ? cnt : 0;
            cnt++;

            matches = app.checkCols();
            matches = matches.concat(app.checkRows());

            if (matches.length) {
                app.clearCells(matches, player, noscore);
                let selel = $$(".selected");
                
                if (selel.length) selel.forEach(function(el) {
                    el.classList.remove('selected');
                });
                app.state.selected = "";
                
                setTimeout(function() {
                    app.checkMatches(cnt, player, noscore);
                }, 500);
                
                app.updateScoreboard(player);
            }
            return matches;
        },
        checkCols: function(player=0) {
            let cur = '';
            let cnt = 0;
            let clr = [];
            let matches = [];
            for (let c = 0; c < app.config.cols; c++) {
                cnt = 0;
                clr = [];
                cur = '';
                for (let r = 0; r < app.config.rows; r++) {
                    cnt++;
                    clr.push({
                        row: r,
                        col: c,
                        val: cur
                    });
                    if (app.state.board[r][c] != cur) {
                        if (cnt > 2) {
                            console.log("Got column of " + cnt + " " + cur);
                            clr.pop();
//                            app.clearCells(clr, player);
                            matches.push(clr);
                        }
                        cur = app.state.board[r][c];
                        cnt = 0;
                        clr = [];
                        clr.push({
                            row: r,
                            col: c,
                            val: cur
                        });
                    }
                }
                if (clr.length > 2) {
                    console.log("Got column of " + clr.length + " " + cur);
                    //                    app.clearCells(clr);
                    matches.push(clr);
                }
            }
            return matches;
        },
        checkRows: function(player=0) {
            let cur = '';
            let cnt = 0;
            let clr = [];
            let matches = [];
            for (let r = 0; r < app.config.rows; r++) {
                cnt = 0;
                clr = [];
                cur = '';
                for (let c = 0; c < app.config.cols; c++) {
                    cnt++;
                    clr.push({
                        row: r,
                        col: c,
                        val: cur
                    });
                    if (app.state.board[r][c] != cur) {
                        if (cnt > 2) {
                            console.log("Got row of " + cnt + " " + cur);
                            clr.pop();
  //                          app.clearCells(clr, player);
                            matches.push(clr);
                        }
                        cur = app.state.board[r][c];
                        cnt = 0;
                        clr = [];
                        clr.push({
                            row: r,
                            col: c,
                            val: cur
                        });
                    }
                }
                if (clr.length > 2) {
                    console.log("Got column of " + clr.length + " " + cur);
                    //                    app.clearCells(clr);
                    matches.push(clr);
                }

            }
            return matches;
        },
        clearCells: function(matches, player=0, noscore=false) {
            console.log("clearing cells");
            console.dir(matches);


            for (let i = 0; i < matches.length; i++) {
                let cells = matches[i];
                for (let j = 0; j < cells.length; j++) {
                    let cell = cells[j];
                    let item = app.state.board[cell.row][cell.col];

                    if (!noscore) {
                        app.state.inventory[player][item]++;
                        if ((item !== 'fish') && app.state.inventory[player][item] > 15) {
                            app.state.inventory[player][item] = 15;
                        }
                    }

                    app.state.board[cell.row][cell.col] = "";

                    let el = $(`#item_r${cell.row}c${cell.col}`);
                    //                let el2 = el.cloneNode(true);
                    //                $("#board").appendChild(el2);

                    if (el) {
                        setTimeout(function() {
                            el.classList.add('explode');
                            if (cell.val) {
                                app.state.clearItems.push({
                                    el: el,
                                    classname: cell.val
                                });
                                //el.classList.remove(cell.val);
                                //el.classList.add('blank');
                            }
                        }, j * 10);
                    }
                }
            }
            setTimeout(function() {
                app.dropCells();
            }, 10);
        },
        dropCells: function() {
            for (let c = 0; c < app.config.cols; c++) {
                for (let r = app.config.rows - 1; r >= 0; r--) {
                    if (app.state.board[r][c] == "") {
                        app.shiftDown(c);
                    }
                }
            }
        },
        moveItem: function(el, x, y, delay = 10) {
            setTimeout(function() {
                if (x) {
                    el.style.left = x;
                }
                if (y) {
                    el.style.top = y;
                }
            }, delay);
        },
        runqueue: function() {
            if (app.state.queue.length) {
                let obj = app.state.queue.shift();

                if (obj) {
                    setTimeout(function() {
                        obj.el.style.top = obj.y;
                        obj.el.style.left = obj.x;
                        obj.el.id = obj.id;

                        app.runqueue();
                    }, obj.delay);
                }
            }
        },
        shiftDown: function(col) {
            let cnt = 0;
            for (let r = 0; r < app.config.rows; r++) {
                if (app.state.board[r][col] == "") {
                    cnt++;
                    $("#item_r" + r + "c" + col).parentElement.removeChild($("#item_r" + r + "c" + col));
                    for (let r2 = r; r2 > 0; r2--) {
                        app.state.board[r2][col] = app.state.board[r2 - 1][col];
                        let obj = {
                            el: $("#item_r" + (r2 - 1) + "c" + col),
                            x: (col * app.config.cellWidth) + "px",
                            y: (r2 * app.config.cellHeight) + "px",
                            newid: "#item_r" + r2 + "c" + col,
                            delay: 100
                        };
                        let el = $("#item_r" + (r2 - 1) + "c" + col);
                        el.classList.remove("blank");
                        app.moveItem(el, obj.x, obj.y, 10);
                        $("#item_r" + (r2 - 1) + "c" + col).id = "item_r" + r2 + "c" + col;
                    }
                    app.state.board[0][col] = app.config.items[Math.floor(Math.random() * app.config.items.length)];
                    let el = app.mkitem(0, col, app.state.board[0][col]);
                    el.style.top = '-' + app.config.cellHeight + 'px';
                    $("#board").appendChild(el);
                    setTimeout(function() {
                        $("#item_r0c" + col).style.top = '0px';
                    }, cnt * 100);
                }
            }
            if (cnt && cnt < 10) {
                setTimeout(function() {
                    app.shiftDown(col);
                }, cnt * 500);
            }
        },
        dumpBoard: function() {
            let out = '';
            for (let r = 0; r < app.config.rows; r++) {

                for (let c = 0; c < app.config.cols; c++) {
                    out += app.config.items.indexOf(app.state.board[r][c]).toString();
                }
                out += "\n";
            }
            console.log(out);
        },
        rand: function(min, max) {
            return Math.floor(Math.random() * Math.abs(min - max)) + min;
        },

    };
    window.app = app;
    app.init();
})();
