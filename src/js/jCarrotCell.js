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

        DATA_ENUM = CLASS_CARROT + '__enum',

        CLASS_VERTICAL = CLASS_CARROT + '--vertical',

        CLASS_CLIP = CLASS_CARROT + '__clip',
        CLASS_SLIDER = CLASS_CARROT + '__strip',
        CLASS_ITEM = CLASS_CARROT + '__item',
        
        CLASS_INVIS = CLASS_CARROT + "--invisible",
        CLASS_CLONE = CLASS_CARROT + "__clone",

        CLASS_ICON = CLASS_CARROT + '__icon',
        CLASS_NEXT_ICON = CLASS_ICON + '--next',
        CLASS_PREV_ICON = CLASS_ICON + '--prev',
        CLASS_PAUSE_ICON = CLASS_ICON + '--pause',
        CLASS_PLAY_ICON = CLASS_ICON + '--play',
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

            clones = null,      // clones for infinite scroll
            items = null,       // all items elements
            total = 0,          // items count
            one = null,         // 1 item

            prev = null,
            next = null,
            pause = null,
            play = null,

            moves = 0,          // how many clicks before we reach the end
            moved = 0,          // how many clicks we moved
            alreadyMoved = 0,   // how many items already moved past
            current = 0,        // current item scrolled to
            showing = [],       // what items are visible
            cloneShowing = 0,   // how many clones currently showing

            atStart = true,     // no more in prev
            atEnd = false,      // no more in next

            direction = 1,      // direction we scrolling

            cloneEnd = [],          // save the clones at the end for lookup
            cloneSkip = 0,          // how many items to skip when sliding infinitely
            onCloneStart = false,   // are we on a starting clone (negative number)

            useVelocity = false,    // use velocity to animate?
            animating = false,      // animation lock
            axis = "x",

            // --- these settings can be over written

            settings = {
                show: 1,                // show 1 frame at a time
                scroll: 1,              // scroll 1 frame at a time
                duration: 500,          // scroll animation duration         
                sideways: true,         // scroll sideways
                easing: "swing",        // slide easing method
   
                force : true,           // force item size to be width/show
                infinite : false,       // infinite scroll
                auto : false,           // auto loop if circular
                stopOnHover : true,     // stop auto advance on hover
                controlOnHover : false, // show controls on hover only

                pauseClass: '',
                pauseIconClass : CLASS_PAUSE_ICON,
                pauseText : 'pause carousel scroll',
                playClass : '',
                playIconClass : CLASS_PLAY_ICON,
                playText : 'resume carousel scroll',
                prevClass : '',
                prevIconClass : CLASS_PREV_ICON,
                prevText : 'next carousel slide',
                nextClass : '',
                nextIconClass : CLASS_NEXT_ICON,
                nextText : 'previous carousel slide',

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
            if (moved === 0) {
                setAtStart();
            } else if (moved === moves){
                setAtEnd();
            } else {
                setInMiddle();
            }
        };

        // --- update record on what is actually shown on screen

        var updateShowing = function(){
            cloneShowing = 0;          
            onCloneStart = false;       

            for (var k = 0; k < settings.show; k++){
                showing[k] = current + k;

                if (showing[k] < 0 ) { 
                    cloneShowing++;         
                    onCloneStart = true;
                }

                if (showing[k] > total-1 ) { 
                    cloneShowing++; 
                }
            }

            console.log("[ showing updated ] ", showing, ' clones showing ', cloneShowing, ' on clone start? ', onCloneStart);
        };

        // --- scroll the actual slider

        var scrollSlider = function(newParams){
            var params = {
                axis: axis, 
                container: clipPane,
                duration: settings.speed, 
                easing: settings.easing
            };

            $.extend(params, newParams); // update settings

            if (useVelocity) {
                slider.velocity('scroll', params);
            } else {
                var scrollProp = { scrollTop: params.offset };
                if (settings.sideways) { scrollProp ={ scrollLeft: params.offset }; } 
                clipPane.animate( scrollProp, params.duration, params.easing, params.complete );
            }
        };

        // --- replace slider at the start with end clone

        var replaceWithEnd = function(){
            animating = true;

            cloneSkip = settings.show;
            current = total + current;          // find current in end clone
            alreadyMoved = cloneSkip + current; 
            scrollSlider({ duration: 0, offset: (current + cloneSkip) * one.totalSize });
            updateShowing(); 
            findInfiniteMoves();
            moved = moves;  // we just found the new moves
            animating = false;

            console.log("* REPLACED with END current ", current, " cloneskip ", cloneSkip, " moved ", moved, " showing ", showing);
        };

        // --- replace slider at the end with the start clone (infinite reached end)

        var replaceWithStart = function(cloneOffset){
            animating = true;

            if (!cloneOffset) { cloneOffset = 0; }
            current = current - total; // find current in starting clone

            if (current === 0){
                cloneSkip = settings.show;
            } else {
                cloneSkip = cloneOffset; 
            }

            scrollSlider({ duration: 0, offset: cloneSkip * one.totalSize });
            moved = 0;
            alreadyMoved = settings.show + current; // ALREADY SCROLLED is clone count subtract curernt clone
            updateShowing();
            findInfiniteMoves(cloneOffset);
            animating = false;

            console.log("X REPLACED w/START skip ", cloneSkip, " moved ", moved, "already ", alreadyMoved, " current ", current);
        };

        // --- scrolling animation complete from scrollToItem

        var doneScrolling = function(){
            moved += direction; // update moves + or -
            current = current + direction * settings.scroll; // update new current
            alreadyMoved += direction * settings.scroll; // update how far we scrolled

            if (settings.infinite) {
                if (moved < 0) {
                    direction = -1;
                    console.log("+PREV ", moved, "/", moves, " moved < 0 on ", current);
                    replaceWithEnd();
                } else if (moved >= moves) { 
                    console.log("+NEXT ", moved, "/", moves, " moved > moves on ", current);
                    direction = 1;
                    replaceWithStart(cloneEnd.indexOf(current));
                } else {
                    updateShowing(); 
                }

            } else {
                updateShowing(); 
                setState(); // non infinite, check if we disable prev or next
            }

            console.log("scrolling DONE ", " moved ", moved, "/", moves);

            animating = false; // lockdown ends now everything is processed
            console.log("===========================", showing);
        };

        // --- calculate the scroll

        var scrollToItem = function(){
            animating = true;

            var params = {
                offset: direction * settings.scroll * one.totalSize + alreadyMoved * one.totalSize,
                complete: doneScrolling
            };

            console.log("SCROLL distance", params.offset);
            console.log("SCROLL ", current, " by ", direction * settings.scroll, " already moved ", alreadyMoved);
            scrollSlider(params);
        };

        // -- move to previous scroll

        var moveToPrev = function(e){
            if (e) { e.preventDefault(); }
            if (atStart || animating) { return false; }

            direction = -1;

            if (onCloneStart){
                console.log("------------------------------------- DIR CHANGE PREV current ", current);
                replaceWithEnd(); // cant go prev as we are on a clone, replace
            } 

            scrollToItem();
        };

        // --- move to next scroll

        var moveToNext = function(e){
            if (e) { e.preventDefault(); }
            if (atEnd || animating) { return false; }

            direction = 1;
            scrollToItem();
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
                var itemEnum = $(this).data(DATA_ENUM);
                if ($.isNumeric(itemEnum) && (itemEnum > 0) && (itemEnum !== current)){
                    scrollToItem(itemEnum, 1);
                } 
            };
            items.focus(gotFocus);
        };

        // -- create icon prev and next buttons

        var createControls = function(){
            setupPreNext();
            setupFocusTab();

            if (settings.key){
                track.subscribeKey(settings.name, settings.keyBack, settings.keyForward);
            }

            if (settings.auto) {
                // set up pause and play
            }
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
                var m1 = parseInt(item.css("margin-left"), 10),
                    m2 = parseInt(item.css("margin-right"), 10);

                calcOffset = m1 + m2;
            } else {
                var m3 = parseInt(item.css("margin-top"), 10),
                    m4 = parseInt(item.css("margin-bottom"), 10);

                calcOffset = (m3 > m4) ? m3 : m4; // take largest margin bc of margin-collapse
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
                    console.log("border offset ", b3, b4);
                }
            } 
            console.log("h ", item.outerHeight(true), "offset ", calcOffset);

            return {
                w: item.outerWidth(true),
                h: item.outerHeight(true),
                offset: calcOffset
            };
        };

        // --- get individual content item sizes

        var getAllItemSizes = function(){
            one = getItemSize($(items[0])); // the size of one item
            items.each(function(i, item){ $(item).data(DATA_ENUM, i); }); // add data to item

            if (settings.sideways){
                sliderSize = one.w * total;
            } else {
                sliderSize = one.h * total;
            }
        };

        // --- adjust the size of the items and the slider 

        var adjustItemSize = function(){    
            getAllItemSizes(); 
    
            // --- set the size of items based on passed in size

            var setItemSize = function(single, prop){
                var sliderItems = total;
                one.totalSize = single;
                one.size = single - one.offset; // make room for margin/border

                items.css(prop, one.size + "px");

                if (settings.infinite){
                    clones.css(prop, one.size + "px");
                    sliderItems += settings.show * 2; // make room for clones
                }

                slider.css(prop, one.totalSize * sliderItems + "px"); // set length of slider
            };

            if (settings.sideways) { 
                setItemSize(width/settings.show, "width");
            } else {
                setItemSize(height/settings.show, "height");
            }

            if (settings.infinite){
                scrollSlider({ duration: 0, offset: settings.show * one.totalSize }); // move clones
            }
        };

        // --- make clones for infinite scroll

        var clone = function(){
            var endSlice = items.slice(-settings.show).clone(),
                startSlice = items.slice(0, settings.show).clone();
            endSlice.addClass(CLASS_CLONE).attr("tabindex", -1).removeData(DATA_ENUM);
            startSlice.addClass(CLASS_CLONE).attr("tabindex", -1).removeData(DATA_ENUM);

            items.filter(':first').before(endSlice);         
            items.filter(':last').after(startSlice);

            items = $("." + CLASS_ITEM + ":not(."+ CLASS_CLONE + ")", scope); 
            clones = $("." + CLASS_CLONE, scope);

            cloneSkip = settings.show;
            alreadyMoved = cloneSkip;

            for (var i = 0; i < settings.show; i++){
                cloneEnd.push(total - settings.show + i); // lookup end clones later
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

            items.addClass(CLASS_ITEM).attr("tabindex", 0);
            scope.addClass(CLASS_CARROT).data(CLASS_CARROT, settings.name);   

            if (!settings.sideways) {
                scope.addClass(CLASS_VERTICAL);
            }

            if (settings.infinite){ clone(); }  // pad with clones

            adjustItemSize();   // make the items fit inside the clippane  
        };

        // --- find out how many moves in infinite scroll

        var findInfiniteMoves = function(){
            var additional = cloneShowing;
            if (direction == -1) { additional = settings.show - cloneShowing; } 
            moves = Math.ceil( (total + additional) / settings.scroll) - 1 ;

            console.log("// moves ", moves, " adding ", additional, " direction ", direction);
        };

        // --- find moves

        var findMoves = function(){
            if (settings.infinite){
                findInfiniteMoves();
            } else {
                moves = Math.ceil((total - (settings.show-settings.scroll)) / settings.scroll) - 1;
            }
            updateShowing();
        };

        // --- update the settings object 

        var fixSettings = function(){

            if (settings.show < settings.scroll){
                settings.scroll = settings.show;
                console.log("sorry, you cant scroll more items than whats actually showing.");
            }

            useVelocity = $(scope).velocity == undefined ? false : true;

            if (!useVelocity && ($.easing[settings.easing] === undefined)) {
                console.log(settings.easing, " is not supported, please include a jquery easing plugin or velocity");
                settings.easing = "swing";
            }

            if (settings.sideways) { axis = "x"; } else { axis = "y"; }

            if (settings.auto) { settings.infinite = true;  }

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
                if (settings.infinite){

                } else {
                    scrollSlider({ duration: 0, offset: moved * one.totalSize});
                }
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

                $.extend(settings, options);

               // setup();
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
