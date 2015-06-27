/*!
 * jCarrotCell
 * http://jcarrotcell.yujulia.com
 * 
 * Copyright 2011, 2015 
 * Released under the MIT license
 *
 */

(function($){

    // --- global constants

    var KEY_BACK = 37,
        KEY_FORWARD = 39,
        KEY_UP = 38,
        KEY_DOWN = 40,

        API_NAME = 'carrotapi',
        DEBOUNCE_RESIZE = 200,

        CLASS_CARROT = 'carrotcell',
        CLASS_CLIP = CLASS_CARROT + '__clip',
        CLASS_SLIDER = CLASS_CARROT + '__strip',
        CLASS_ITEM = CLASS_CARROT + '__item',
        
        CLASS_INVIS = CLASS_CARROT + "--invisible",
        CLASS_CLONE = CLASS_CARROT + "__clone",
        CLASS_ICON = CLASS_CARROT + '__icon',
        
        CLASS_NEXT_ICON = CLASS_ICON + '--next',
        CLASS_PREV_ICON = CLASS_ICON + '--prev',
        CLASS_ACCESS_TEXT = CLASS_CARROT + '__accessText',

        CLASS_BTN = CLASS_CARROT + '__btn',
        CLASS_NEXT = CLASS_BTN + '--next',
        CLASS_PREV = CLASS_BTN + '--prev';

    // --- debounce helper func

    var debounce = function(callback, ms){
        var timeout = null;

        return function(){
            var context = this, args = arguments;
            var stalled = function(){
                timeout = null;
                callback.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(stalled, ms);
        };
    };

    // --- see if two objects are roughly the same (shallow)

    var sameObject = function(obj1, obj2){
        if (Object.keys(obj1).length !== Object.keys(obj2).length){  return false; } // unequal length
        for (var key in obj1){
            if (key in obj2){
                if (obj1[key] !== obj2[key]) {  return false; } // value not euqal
            } else {
                return false; // missing key
            }
        }
        return true;
    };

    /** ---------------------------------------
        carrot methods
    */
    var carrot = function(){

        // --- carrot vars

        var scope = null,       // shorthand for settings.scope
            width = 0,          // container width
            height = 0,         // container height
            clipPane = null,    // clipping box

            slider = null,      // sliding panel
            sliderSize = 0,

            items = null,       // all items elements
            total = 0,          // items count
            one = null,         // 1 item

            prev = null,
            next = null,
            direction = 1,      // assume going NEXT
            atStart = true,     
            atEnd = false,

            moves = 0,          // how many times before we reach the end
            moved = 0,          // how many times we moved
            alreadyMoved = 0,         // how many items to be moved
            current = 0,        // current scroll
            showing = [],       // what items are actually on screen
            cloneShowing = 0,   // how many clones currently showing
            findFor = 1,

            cloneStart = [],
            cloneEnd = [],
            cloneSkip = 0,
            onCloneStart = false,
            onCloneEnd = false,

            animating = false,  // animation lock
            axis = "x",

            // --- these settings can be over written

            settings = {
                show: 1,                // show 1 frame at a time
                scroll: 1,              // scroll 1 frame at a time
                speed: 700,             // scroll speed         
                sideways: true,         // scroll sideways
                infinite: false,
                auto: false,
                tween: "easeOutExpo",

                prevClass : '',
                nextClass : '',
                prevIconClass : CLASS_PREV_ICON,
                nextIconClass : CLASS_NEXT_ICON,
                prevText : 'next',
                nextText : 'previous',
                controlOnHover : false,

                key: false,
                keyBack: '',
                keyForward: ''
            };

        // --- toggle the prev and next and start/end flags

        var setInMiddle = function(){
            if (atStart) {
                prev.prop("disabled", false);
                atStart = false;
            }
            if (atEnd) {
                next.prop("disabled", false);
                atEnd = false;
            }
        };

        var setAtStart = function(){
            setInMiddle();  // fix previous state
            atStart = true;
            prev.prop("disabled", true);
        };

        var setAtEnd = function(){
            setInMiddle();  // fix previous state
            atEnd = true;
            next.prop("disabled", true);
        };
    
        // --- determine where we are in the carousel

        var setState = function(){     
            console.log("current ", current, " moves ", moves, " moved ", moved);
            if (moved === 0) {
                setAtStart();
            } else if (moved === moves){
                setAtEnd();
            } else {
                setInMiddle();
            }
        };

        // --- update what is showing on the screen after a scroll happened

        var updateShowing = function(){
            cloneShowing = 0;           // reset
            onCloneStart = false;
            onCloneEnd = false;

            for (var k = 0; k < settings.show; k++){
                showing[k] = current + k;

                if (showing[k] < 0 ) { 
                    cloneShowing++; 
                    onCloneStart = true;
                    onCloneEnd = false;
                }

                if (showing[k] > total-1 ) { 
                    cloneShowing++; 
                    onCloneStart = false;
                    onCloneEnd = true;
                }
            }
        };

        // --- find out how many moves in infinite scroll

        var findInfiniteMoves = function(){
            var additional = cloneShowing;

            if (findFor == -1) {
                console.log("// previous ");
                additional = settings.show - cloneShowing;
            } else {
                console.log("// next ");
            }

            moves = Math.ceil( (total + additional) / settings.scroll) - 1 ;


            console.log("// moves ", moves, " ", showing, " adding ", additional, " dir ", findFor);
        };

        // --- replace slider at the start with end clone

        var replaceWithEnd = function(cloneOffset){
            animating = true;

            if (!cloneOffset) { cloneOffset = 0; }

            // cloneOffset += total + settings.show + current;
            cloneOffset += total + current + settings.show;
            // console.log("END REPLACE CLONE OFFSET ", cloneOffset, " current ", current);
            scrollSlider({ duration: 0, offset: cloneOffset * one.totalSize });
            
            current = total + current;
            // cloneSkip = total - current -1;
            cloneSkip = settings.show;
            alreadyMoved = settings.show + current;

            findInfiniteMoves();

            moved = moves;

            console.log("* REPLACED with END current ", current, " cloneskip ", cloneSkip, " moved ", moved, " showing ", showing);

            

            animating = false;
        };

        // --- replace slider at the end with the start clone (infinite reached end)

        var replaceWithStart = function(cloneOffset){
            animating = true;

            if (!cloneOffset) { cloneOffset = 0; }
            console.log("clone offset is ", cloneOffset);
            

            current = current - total; // negative pos of the starting clone

            if (Math.abs(current) >= total) { 
                console.log("ZZZ current is too big");
                current = 0;
                
            } // first "real" item no longer clone

            if (current == 0){
                console.log("XXX reset to start ");
                cloneSkip = settings.show;
            } else {
                cloneSkip = cloneOffset; 
            }

            scrollSlider({ duration: 0, offset: cloneSkip * one.totalSize });
            moved = 0;
            alreadyMoved = settings.show + current; // ALREADY SCROLLED is clone count subtract curernt clone

            updateShowing();

            console.log("X REPLACED with START current ", current, " cloneskip ", cloneSkip, " moved ", moved, "already ", alreadyMoved, " showing ", showing);

            findInfiniteMoves(cloneOffset);

            animating = false;
        };

        // --- scrolling is done

        var doneScrolling = function(){
            moved += direction;
            current = current + direction * settings.scroll;
            alreadyMoved += direction * settings.scroll; // update how far we scrolled

            if (settings.infinite) {

                console.log("DONE current is ", current, " moved ", moved, "/", moves, " cloneskip ", cloneSkip);

                if (moved < 0) {
                    findFor = -1;
                    console.log("-", moved, "/", moves, " moved < 0 on ", current);
                    replaceWithEnd();

                } else if (moved >= moves) {
                         
                    console.log("+", moved, "/", moves, " moved > moves on ", current);
                    findFor = 1;
                    replaceWithStart(cloneEnd.indexOf(current));
                    
                }    

                // we circled around to the start again...

                // if (current == 0){
                //     console.log("CURRENT is 0 RESET all the things");

                //     replaceWithStart(settings.show);

                //     onCloneStart = false;
                //     onCloneEnd = false;

                // } else if (current < 0) {
                //     onCloneStart = true;
                // } else {
                //     onCloneStart = false;
                // }


            } else {
                setState(); 
            }

            updateShowing();

            console.log("scrolling DONE showing is ", showing, " clone showing ", cloneShowing, " moved ", moved, "/", moves);

            animating = false; // lockdown ends now everything is processed
            console.log("==========");
        };

        // --- scroll the slider

        var scrollSlider = function(params){
            var scrollParams = {
                axis: axis, 
                container: clipPane,
                duration: settings.speed, 
                easing: settings.tween
            };
            $.extend(scrollParams, params); // update settings
            slider.velocity('scroll', scrollParams);
            // use jquery animate if no velocity
        };

        // --- scroll to some time 

        var scrollToItem = function(dir){

            direction = dir;

            console.log("SCROLL ", current, " alreadyscrolled ", alreadyMoved);

            // var moveDistance = direction * settings.scroll * one.totalSize + alreadyMoved * one.totalSize;
            var moveDistance = direction * settings.scroll * one.totalSize + alreadyMoved * one.totalSize;


            var params = {
                duration: settings.speed,
                offset: moveDistance,
                complete: doneScrolling
            };

            animating = true;
            scrollSlider(params);
        };

        // -- move to previous scroll

        var moveToPrev = function(e){
            if (e) { e.preventDefault(); }
            if (atStart || animating) { return false; }

            findFor = -1;

            if (onCloneStart){
                console.log("-------------------------------------");
                console.log("Changing direction while on Clone Start! Prev");
                
                replaceWithEnd();
            } else {
                
            }

             scrollToItem(-1);

        };

        // --- move to next scroll

        var moveToNext = function(e){
            if (e) { e.preventDefault(); }
            if (atEnd || animating) { return false; }

            findFor = 1;

            // if (settings.infinite && (current == total-1)){
            if (onCloneEnd){
                console.log("******************************************");
                console.log("Changing direction while on clone End! next");
                
                replaceWithStart(settings.show - settings.scroll); // FIX THIS CALC
            } else {
                
            } 
            scrollToItem(1);
            
        };

        // --- a key event we care about happened

        var handleKeyPress = function(keyCode){
            if (keyCode === settings.keyBack) { moveToPrev(); }
            if (keyCode === settings.keyForward) { moveToNext(); }
        };

        // --- create the previous and next buttons and attach events

        var setupPreNext = function(){
            var prevContent = $('<span/>', { 'class' : CLASS_ACCESS_TEXT, 'text': settings.prevText });
            var nextContent = $('<span/>', { 'class' : CLASS_ACCESS_TEXT, 'text': settings.nextText });
            var prevIcon = $('<span/>', { 'class' : settings.prevIconClass, 'aria-hidden': 'true' });
            var nextIcon = $('<span/>', { 'class' : settings.nextIconClass, 'aria-hidden': 'true' });
            prev = $('<button/>', { 'class': settings.prevClass });
            next = $('<button/>', { 'class': settings.nextClass });
            prev.append(prevIcon).append(prevContent);
            next.append(nextContent).append(nextIcon);

            if (atStart) { prev.prop("disabled", true); }
            
            prev.click(moveToPrev);
            next.click(moveToNext);

            var blurPrev = function(){ prev.blur(); };
            var blurNext = function(){ next.blur(); };
            var showControls = function(){
                next.removeClass(CLASS_INVIS); 
                prev.removeClass(CLASS_INVIS);
            };
            var hideControls = function(){
                next.addClass(CLASS_INVIS).blur(); 
                prev.addClass(CLASS_INVIS).blur();
            };

            if (settings.controlOnHover && !track.touch){
                hideControls();
                scope.hover(showControls, hideControls);
            } else {
                prev.mouseleave(blurPrev);
                next.mouseleave(blurNext);
            }

            scope.prepend(next).prepend(prev);
        };

        // if tabbing thorugh with keyboard scroll appropriately

        var setupFocusTab = function(){
            var gotFocus = function(e){
                var itemEnum = $(this).data("enum");
                if ($.isNumeric(itemEnum) && (itemEnum > 0) && (itemEnum !== current)){
                    scrollToItem(itemEnum, 1);
                } 
            };
            items.focus(gotFocus);
        };

        // -- create icon prev and next buttons

        var createControls = function(){
            setupPreNext();
            if (settings.key){
                track.subscribeKey(settings.name, settings.keyBack, settings.keyForward);
            }
            setupFocusTab();
        };

        // --- return attributes on some jquery element

        var getAttributes = function(jqElement){
            var attrs = {}; // 
            $.each(jqElement[0].attributes, function(id, attr){
                attrs[attr.nodeName] = attr.nodeValue;
            });
            return attrs;
        };

        // --- calculate the size and offset for one item (jq obj)

        var getItemSize = function(item){
            var calcOffset = 0;
            if (settings.sideways){
                calcOffset = parseInt(item.css("margin-left"), 10) + parseInt(item.css("margin-right"), 10);
            } else {
                calcOffset = parseInt(item.css("margin-top"), 10) + parseInt(item.css("margin-bottom"), 10);
            }
            if ($(item).css("box-sizing") === "content-box") {
                if (settings.sideways){
                    var b1 = parseInt(item.css("border-left-width"), 10),
                        b2 = parseInt(item.css("border-right-width"), 10);
                    calcOffset += b1 + b2;
                } else {
                    var b3 = parseInt(item.css("border-top-width"), 10),
                        b4 = parseInt(item.css("border-bottom-width"), 10);
                    calcOffset += b3 + b4;
                }
            } 
            return {
                w: item.outerWidth(true),
                h: item.outerHeight(true),
                offset: calcOffset
            };
        };

        // --- get individual content item sizes

        var getAllItemSizes = function(){
            items.each(function(i, item){
                item = $(item);
                item.data("enum", i);          
                if (i < 1){ one = getItemSize(item); }
                if (settings.sideways){
                    sliderSize += one.w;
                } else {
                    sliderSize += one.h;
                }
            });
        };

        // --- adjust the size of the items and the slider 

        var adjustItemSize = function(){    
            getAllItemSizes(); 
    
            var setItemSize = function(single, prop){
                one.totalSize = single;
                one.size = single - one.offset; // make room for margin/border
                items.css(prop, one.size + "px");
                var sliderItems = total;
                if (settings.infinite){
                    sliderItems += settings.show * 2; // account for clones
                }
                slider.css(prop, single * sliderItems + "px"); // set length of slider
            };

            if (settings.sideways) { 
                setItemSize(width/settings.show, "width");
            } else {
                setItemSize(height/settings.show, "height");
            }
            if (settings.infinite){
                var cloneMove = settings.show * one.totalSize;
                scrollSlider({ duration: 0, offset: settings.show * one.totalSize });
            }
        };

        // --- clone

        var clone = function(){
            var endSlice = items.slice(-settings.show).clone(),
                startSlice = items.slice(0, settings.show).clone();

            // index clone enum for easier lookup
            for (var i = 0; i < settings.show; i++){
                cloneStart.push(i);
                cloneEnd.push(total - settings.show + i);
            }
            cloneSkip = settings.show;

            endSlice.addClass(CLASS_CLONE).attr("tabindex", -1).removeData("enum");
            startSlice.addClass(CLASS_CLONE).attr("tabindex", -1).removeData("enum");
            items.filter(':first').before(endSlice);         
            items.filter(':last').after(startSlice);
            items = $("." + CLASS_ITEM + ":not(."+ CLASS_CLONE + ")", scope); // this includes cloned

            alreadyMoved = settings.show;
        };

        // --- set the size of the clipping pane 

        var setClipSize = function(){
            width = parseInt(Math.floor(scope.width()), 10);
            height = parseInt(Math.floor(scope.height()), 10);
            if (settings.sideways){
                clipPane.css("width", width + "px");
            } else {
                clipPane.css("height", height + "px");
            }
        };

        // --- make the html frame depending on if its a list or divs

        var makeFrame = function(){ 
            
            clipPane = $('<div/>', { 'class': CLASS_CLIP });
            setClipSize();
                
            var sliderType = '<div/>';
            var carrotType = scope.prop('tagName').toUpperCase();
            var isList = false;
            if (carrotType === "UL" || carrotType === "OL"){ 
                isList = true; 
                sliderType = '<'+ carrotType + '/>';
            }
            slider = $(sliderType, { 'class': CLASS_SLIDER });

            items.appendTo(slider);
            slider.appendTo(clipPane); 
            if (isList) {
                var dupeAttributes = getAttributes(scope);
                var newParent = $('<div/>', dupeAttributes);
                clipPane.appendTo(newParent);
                scope.replaceWith(newParent);
                scope = newParent;
            } else {
                scope.empty();
                clipPane.appendTo(scope);
            }

            items.addClass(CLASS_ITEM).attr("tabindex", 0);
            scope.addClass(CLASS_CARROT).data(CLASS_CARROT, settings.name);   

            adjustItemSize();   // make the items fit inside the clippane  
            if (settings.infinite){ clone(); }    
        };

        // --- find moves

        var findMoves = function(){

            if (settings.infinite){
                findInfiniteMoves();
            } else {
                moves = Math.ceil((total - (settings.show-settings.scroll)) / settings.scroll) - 1;
            }

            updateShowing();

            console.log("total ", total, " moves ", moves, "showing", showing);
        };

        // --- update the settings object 

        var fixSettings = function(){

            if (settings.show < settings.scroll){
                settings.scroll = settings.show;
                console.log("sorry, you cant scroll more items than whats actually showing.");
            }

            if (settings.auto) { settings.infinite = true;  }
            if (settings.sideways) { axis = "x"; } else { axis = "y"; }

            if (settings.key) {
                if (settings.sideways) {
                    settings.keyBack = settings.keyBack || KEY_BACK;
                    settings.keyForward = settings.keyForward || KEY_FORWARD;
                } else {
                    settings.keyBack = settings.keyBack || KEY_UP;
                    settings.keyForward = settings.keyForward || KEY_DOWN;
                }
            }

            settings.prevClass = CLASS_BTN + ' ' + CLASS_PREV + ' ' + settings.prevClass;
            settings.nextClass = CLASS_BTN + ' ' + CLASS_NEXT + ' ' + settings.nextClass;
            settings.prevIconClass = CLASS_ICON + ' ' + settings.prevIconClass;
            settings.nextIconClass = CLASS_ICON + ' ' + settings.nextIconClass;
   
            if (settings.infinite) { atStart = false; }
        };

        // --- resize happened, recalculate

        var resizeCarrot = function(){
            setClipSize();
            adjustItemSize();
            if (moved > 0){
                scrollSlider({ duration: 0, offset: moved * one.totalSize});
            } 
        };

        // --- setup the carrot

        setup = function(){
            items = scope.children(); 
            total = items.length;

            fixSettings();      // toggle on relevant settings if any
            makeFrame();        // make the markup
            
            if ((total > settings.show) && (total > 1)) {
                findMoves();        // find out how many times we can scroll
                createControls();   // make next prev
            } 
        };


        /** ---------------------------------------
            carrot public api
        */
        var API_Methods = {

            // --- initialize the carrot

            init : function(options){
                scope = options.scope;
                $.extend(settings, options); // update settings
                setup();
            },

            // --- update the carrot with new options

            update : function(options){

                // dont update if its the same options

                if (sameObject(options, JSON.parse(settings.userOptions))){
                    return false;
                }

                $.extend(settings, options);
                setup();

                // remake controls but dont remake the frame

            },

            // --- the window rezied

            resize : function(){ resizeCarrot(); },

            // --- track triggers this

            keyPressed : function(keyCode){ handleKeyPress(keyCode); },

            // --- return the name of this carrot

            getName : function(){ return settings.name; }
        };

        return API_Methods;
    };

    /** ---------------------------------------
        keep track of all the carrot cells
    */
    var track = {
        carrots : {},   // track all the carrotcells by name
        keys : {},      // key events subscribed to by carrots
        count : 0,      // count carrot cells made
        initialized: false,
        useKey: false,
        touch: false,
                
        // --- trigger some function on all carrots

        triggerCarrots : function(someFunc){
            for (var i in track.carrots) {
                if (typeof track.carrots[i][someFunc] === "function"){
                    track.carrots[i][someFunc]();
                }
            }
        },

        // --- carrots call this to subscribe keys

        subscribeKey : function(){

            if (!track.useKey){ 
                $(window).keyup(track.keyPressed);
                track.useKey = true;
            }
             
            var args = Array.prototype.slice.call(arguments);
            var carrotName = args.shift();

            args.forEach(function(subkey){
                if (subkey in track.keys){
                    track.keys[subkey].push(carrotName);
                } else {
                    track.keys[subkey] = [carrotName];
                }
            });
        },

        // --- a key has been pressed, tell the subbed carrots

        keyPressed : function(e){
            if (e.keyCode in track.keys) {
                track.keys[e.keyCode].forEach(function(subbedCarrot){
                    track.carrots[subbedCarrot].keyPressed(e.keyCode);
                });
            } 
        },
        
        // --- window reized, trigger resize on all carrotcells

        windowResized : debounce(function(){ track.triggerCarrots("resize"); }, DEBOUNCE_RESIZE),

        // --- initialize jcarousel object, note THIS is not track object

        makeCarrot : function(options) {  
            track.count++;
            if (!options) { options = {}; }     // passed in carrotcell options
            options.userOptions = JSON.stringify(options);      // save user passed options

            options.scope = $(this);            // save this element as the scope
            options.name = "carrot-" + track.count + "-" + options.scope.attr("id"); 
            var newCarrot = new carrot();
            track.carrots[options.name] = newCarrot; 
            newCarrot.init(options);

            return newCarrot; // return api
        },

        // --- init the tracking object

        init : function(){
            $(window).on('resize', track.windowResized);
            if (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch)){
                track.touch = true; // is this touch device?
            }
            track.initialize = true;
        }
    };
    
    /** ---------------------------------------
        add carrotCell as a jquery function
    */
    $.fn.carrotCell = function() {

        if (!track.initialize) { track.init(); } // first time carrotcelling

        var carrotName = $(this).data(CLASS_CARROT);
        if (carrotName){
            var carrotAPI = track.carrots[carrotName];
            if (carrotAPI) {
                carrotAPI.update.apply(this, arguments);
                return carrotAPI;
            } else {
                console.log("CARROTCELL ERROR: ", carrotName, " is not a registered carrotcell.");
                return false;
            }
        } else {
            var newCarrot = track.makeCarrot.apply(this, arguments);
            var newCarrotName = newCarrot.getName();
            track.carrots[newCarrotName] = newCarrot;
            return newCarrot;
        }      
    };
})(jQuery);
