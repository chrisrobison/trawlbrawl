(function() {
    const app = {
        init: function() {
            app.state.loaded = true;
            app.buildboard();
            app.genboard();
            $("#board").addEventListener("click", function(e) {
                console.dir(e);
                console.log("Skipping click");
                //app.handleClick(e);
            });
            $("#board").addEventListener("mousedown", function(e) {
                console.dir(e);
                console.log("handling mousedown");
                //$("#board").addEventListener("mousemove", app.drag);
                app.handleClick(e);
                app.state.lastClick = {
                    x: e.layerX,
                    y: e.layerY
                };
                /*     app.state.dragging = {
                         el: e.target,
                         startX: e.layerX,
                         startY: e.layerY
                     };
                     */
            });
            $("#board").addEventListener("mouseup", function(e) {
                console.dir(e);
                console.log("handling mouseup");
                app.state.dragging = '';
                $("#board").removeEventListener("mousemove", app.drag);
                app.handleClick(e);
            });
        },
        state: {
            loaded: false,
            selected: '',
            queue: [],
            particles: [],
            clearItems: [],
            explosions: [],
            inventory: {
                bobber:0,
                fish:0,
                hook:0,
                net:0,
                pole:0,
                trap:0,
                worm:0
            }
        },
        config: {
            rows: 9,
            cols: 9,
            cellwidth: 65,
            cellheight: 65,
            items: ["bobber", "fish", "hook", "net", "pole", "trap", "worm"],
            attacks: [
                {
                    id: "catch",
                    name: "Fish Catch",
                    required: {
                        trap: 5,
                        bobber: 4,
                        hook: 7
                    },
                    icon: 'img/fish+.png'
                },
                {
                    id: "attack",
                    name: "Attack",
                    required: {
                        bobber: 7,
                        hook: 5,
                        net: 6
                    },
                    icon: 'img/catfish.png'
                },

                 {
                     id: "snatch",
                    name: "Snatch",
                    required: {
                        trap: 9,
                        net: 12,
                        pole: 10
                    },
                    icon: 'img/burglefish.png'
                },
                {
                    id: "net",
                    name: "Fishing Net ",
                    required: {
                        bobber: 12,
                        pole: 10,
                        worm: 8
                    },
                    icon: 'img/fishingnet.png'
                },

                
            ]
        },
        drag: function(e) {
            let obj = app.state.dragging;
            obj.el.style.transform = "translate(" + Math.abs(obj.startX - e.layerX) + "px, " + Math.abs(obj.startY - e.layerY) + "px)";
        },
        handleClick: function(e) {
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
                        app.swapSpots({
                            x: mx,
                            y: my,
                            id: `r${my}c${mx}`
                        }, {
                            x: sx,
                            y: sy,
                            id: `r${sy}c${sx}`
                        });
                    }}, 400);
                } else {
                    let sel = $(".selected");
                    if (sel) sel.classList.remove("selected");

                    app.state.selected = el.id;
                    el.classList.add('selected');
                }
            }
        },
        swapSpots: function(p1, p2) {
            let tmp = app.state.board[p1.y][p1.x];
            app.state.board[p1.y][p1.x] = app.state.board[p2.y][p2.x];
            app.state.board[p2.y][p2.x] = tmp;

            let el1 = $("#item_r" + p1.y + "c" + p1.x);
            let el2 = $("#item_r" + p2.y + "c" + p2.x);

            el1.style.top = (app.config.cellheight * p2.y) + 'px';
            el1.style.left = (app.config.cellwidth * p2.x) + 'px';

            el2.style.top = (app.config.cellheight * p1.y) + 'px';
            el2.style.left = (app.config.cellwidth * p1.x) + 'px';

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
            for (let row = 0; row < app.config.rows; row++) {
                app.state.board[row] = [];
                out += "<div class='row'>";
                for (let col = 0; col < app.config.cols; col++) {
                    let id = `r${row}c${col}`;

                    out += `<div id='box_${id}' class='box'><span id='${id}' class='cell'></span></div>`;

                }
                out += "</div>";
            }

            for (let i=0; i<app.config.attacks.length; i++) {
                let attack = app.config.attacks[i];
                
                out += "<div class='attack'><img src='" + attack.icon + "' class='attackIcon'><h2>" +attack.name+"</h2>";
                for (const [key, val] of Object.entries(attack.required)) {
                    out += "<span class='attackReq " + key + "' id='"+ attack.id + "_" + key + "'><span class='attackVal'>" + val + "</span></span>";
                }
                out += "</div>";
            }
            $("#board").innerHTML = out;
        },
        updateInventory: function() {
            app.config.items.forEach(function(item) {
                for (let i=0; i<app.config.attacks.length; i++) {
                    let attack = app.config.attacks[i];
                    
                    for (const [key, val] of Object.entries(attack.required)) {
                        let newval = val - app.state.inventory[key];
                        let pid = attack.id + '_' + key;
                        if (newval <= 0) {
                            $(`#${attack.id}_${key} .attackVal`).classList.add('complete');
                            newval = '√';
                        }

                        console.log("updating " + pid + " with " + newval + " (was " + val + ")");

                        $(`#${attack.id}_${key} .attackVal`).innerHTML = newval;
                    }
                }
            });
        },
        genboard: function() {
            let out = "";
            app.state.board = [];
            for (let row = 0; row < app.config.rows; row++) {
                app.state.board[row] = [];

                for (let col = 0; col < app.config.cols; col++) {
                    let item = app.config.items[Math.floor(Math.random() * app.config.items.length)];
                    let id = `r${row}c${col}`;
                    app.state.board[row][col] = item;

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

            el.style.top = row * app.config.cellheight + 'px';
            el.style.left = col * app.config.cellwidth + 'px';

            return el;
        },
        checkMatches: function(cnt) {
            let matches = {};
            cnt = cnt ? cnt : 0;
            cnt++;

            matches = app.checkCols();
            matches = matches.concat(app.checkRows());

            console.log(`checking matches[${cnt}]...`);
            if (matches.length) {
                app.clearCells(matches);
                let selel = $$(".selected");
                if (selel.length) selel.forEach(function(el) {
                    el.classList.remove('selected');
                });
                app.state.selected = "";
                setTimeout(function() {
                    app.checkMatches(cnt);
                }, 500);
                console.log("matched");
                console.dir(matches);
                app.updateInventory();
            }
            return matches;
        },
        checkCols: function() {
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
                            app.clearCells(clr);
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
        checkRows: function() {
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
                            app.clearCells(clr);
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
        clearCells: function(matches) {
            console.log("clearing cells");
            console.dir(matches);


            for (let i = 0; i < matches.length; i++) {
                let cells = matches[i];
                for (let j = 0; j < cells.length; j++) {
                    let cell = cells[j];
                    app.state.inventory[app.state.board[cell.row][cell.col]]++;
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
                            x: (col * app.config.cellwidth) + "px",
                            y: (r2 * app.config.cellheight) + "px",
                            newid: "#item_r" + r2 + "c" + col,
                            delay: 100
                        };
                        console.dir(obj);
                        let el = $("#item_r" + (r2 - 1) + "c" + col);
                        el.classList.remove("blank");
                        app.moveItem(el, obj.x, obj.y, 10);
                        $("#item_r" + (r2 - 1) + "c" + col).id = "item_r" + r2 + "c" + col;
                    }
                    app.state.board[0][col] = app.config.items[Math.floor(Math.random() * app.config.items.length)];
                    let el = app.mkitem(0, col, app.state.board[0][col]);
                    el.style.top = '-' + app.config.cellheight + 'px';
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
