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
        CLASS_ACCESS_TEXT = CLASS_CARROT + '__accessText',

        CLASS_ICON = CLASS_CARROT + '__icon',
        CLASS_PREV_ICON = CLASS_ICON + '--iconPrev',
        CLASS_NEXT_ICON = CLASS_ICON + '--iconNext',
        CLASS_INVIS = CLASS_CARROT + "--invisible",
        CLASS_NEXT = CLASS_CARROT + '--next',
        CLASS_PREV = CLASS_CARROT + '--prev';

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
            items = null,       // all frames
            totalItems = 0,     // how many frames
            itemSizes = [],     // size of individual items
            oneItem = null,     // shorthand for just one item
            prev = null,
            next = null,
            moves = 0,          // how many times before we reach the end
            moved = 0,          // how many times we moved
            slots = 0,          // how many slots total (including empties)
            emptySlots = 0,     // how many slots empty
            atStart = true,     
            atEnd = false,
            current = 0,        // current item scrolled to
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

        // --- scrolling is done

        var doneScrolling = function(item, direction){
            current = item;
            moved += direction;
            animating = false;

            if (!settings.infinite){ setState(); }
        };

        // --- scroll to some time 

        var scrollToItem = function(item, direction){

            var moveDistance = (direction * Math.abs(current - item) * oneItem.totalSize) + (moved * oneItem.totalSize);

            animating = true;

            slider.velocity('scroll', { 
                axis: axis, 
                duration: settings.speed, 
                offset: moveDistance, 
                container: clipPane, 
                complete: doneScrolling.bind(this, item, direction),
                easing: settings.tween
            } );

            // if no velocity use jquery animate
        };

        // -- move to previous scroll

        var moveToPrev = function(e){
            if (e) { e.preventDefault(); }
            if (atStart || animating) { return false; }
            
            scrollToItem(current - settings.scroll, -1);
        };

        // --- move to next scroll

        var moveToNext = function(e){
            if (e) { e.preventDefault(); }
            if (atEnd || animating) { return false; }
    
            scrollToItem(current + settings.scroll, 1);
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

            scope.append(prev).append(next);
        };

        // -- create icon prev and next buttons

        var createControls = function(){
            setupPreNext();
            if (settings.key){
                track.subscribeKey(settings.name, settings.keyBack, settings.keyForward);
            }
        };

        // --- find moves

        var findMoves = function(){
            moves = Math.ceil(totalItems/settings.scroll) - (settings.show - settings.scroll) - 1;
            slots = settings.show * Math.ceil(totalItems/settings.show);
            emptySlots = slots - totalItems;

            console.log("moves ", moves, " slots ", slots,  "empty ", emptySlots);
        };

        // --- return attributes on some jquery element

        var getAttributes = function(jqElement){
            var attrs = {}; // 
            $.each(jqElement[0].attributes, function(id, attr){
                attrs[attr.nodeName] = attr.nodeValue;
            });
            return attrs;
        };

        // --- calculate the size and offset for one item

        var getItemSize = function(item){

            var calcOffset = 0;

            if (settings.sideways){
                calcOffset = parseInt($(item).css("margin-left"), 10) + parseInt($(item).css("margin-right"), 10);
            } else {
                calcOffset = parseInt($(item).css("margin-top"), 10) + parseInt($(item).css("margin-bottom"), 10);
            }

            if ($(item).css("box-sizing") === "content-box") {
                if (settings.sideways){
                    var b1 = parseInt($(item).css("border-left-width"), 10),
                        b2 = parseInt($(item).css("border-right-width"), 10);
                    calcOffset += b1 + b2;
                } else {
                    var b3 = parseInt($(item).css("border-top-width"), 10),
                        b4 = parseInt($(item).css("border-bottom-width"), 10);
                    calcOffset += b3 + b4;
                }
            } 

            return {
                w: $(item).outerWidth(true),
                h: $(item).outerHeight(true),
                offset: calcOffset
            };

        };

        // --- get individual content item sizes

        var getAllItemSizes = function(){
            itemSizes = []; // clear previous
            items.each(function(i, item){
                var data = getItemSize(item);
                itemSizes.push(data);

                // concat all sizes into slider size as well

                if (settings.sideways){
                    sliderSize += data.w;
                } else {
                    sliderSize += data.h;
                }
            });
            oneItem = itemSizes[0]; // reference item
        };

        // --- adjust the size of the items and the slider 

        var adjustItemSize = function(){    
            getAllItemSizes(); 
            var single = 0;

            // this will need to change if each item size is different...

            var setItemSize = function(single, prop){
                oneItem.size = single - oneItem.offset; // make room for margin/border

                console.log("one item ", oneItem.size, " single ", single, " offset ", oneItem.offset);

                oneItem.totalSize = oneItem.size + oneItem.offset;
                items.css(prop, oneItem.size + "px");
                slider.css(prop,  single * totalItems + oneItem.offset + "px"); // set length of slider
            };

            if (settings.sideways) { 
                setItemSize(width/settings.show, "width");
            } else {
                setItemSize(height/settings.show, "height");
            }

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

            items.addClass(CLASS_ITEM);
            scope.addClass(CLASS_CARROT).data(CLASS_CARROT, settings.name);   

            adjustItemSize();   // make the items fit inside the clippane  

        };

        // --- update the settings object 

        var fixSettings = function(){
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

            settings.prevClass = CLASS_PREV + ' ' + settings.prevClass;
            settings.nextClass = CLASS_NEXT + ' ' + settings.nextClass;
            settings.prevIconClass = CLASS_ICON + ' ' + settings.prevIconClass;
            settings.nextIconClass = CLASS_ICON + ' ' + settings.nextIconClass;
   

            if (settings.infinite) { atStart = false; }
        };

        // --- resize happened, recalculate

        var resizeCarrot = function(){
            setClipSize();
            adjustItemSize();

            if (moved > 0){
                slider.velocity('scroll', { 
                    axis: axis, 
                    duration: 0, 
                    offset: moved * oneItem.totalSize, 
                    container: clipPane
                } );
            } 
        };

        // --- 

        setup = function(){

            items = scope.children(); 
            totalItems = items.length;

            fixSettings();      // toggle on relevant settings if any
            makeFrame();        // make the markup
            
            // add further functionality if we have something to scroll

            if ((totalItems > settings.show) && (totalItems > 1)) {
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

            // this carrotcell already exists, update instead of init
            console.log("this exists");
            var carrotAPI = track.carrots[carrotName];
            if (carrotAPI) {
                carrotAPI.update.apply(this, arguments);
                return carrotAPI;
            } else {
                console.log("CARROTCELL ERROR: ", carrotName, " is not a registered carrotcell.");
                return false;
            }
        } else {

            // make a new carrotcell
            console.log("making new");

            var newCarrot = track.makeCarrot.apply(this, arguments);
            var newCarrotName = newCarrot.getName();
            track.carrots[newCarrotName] = newCarrot;
            return newCarrot;
        }      
    };
})(jQuery);
