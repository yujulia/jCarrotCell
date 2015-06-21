/*!
 * jCarrotCell
 * http://jcarrotcell.yujulia.com
 * 
 * Copyright 2011, 2015 
 * Released under the MIT license
 *
 */

(function($){

    // --- CONST

    var KEY_BACK = 37,
        KEY_FORWARD = 39,
        KEY_UP = 38,
        KEY_DOWN = 40,

        API_NAME = 'carrotapi',
        DEBOUNCE_RESIZE = 100,

        CLASS_CARROT = 'carrotcell',
        CLASS_CLIP = CLASS_CARROT + '__clip',
        CLASS_SLIDER = CLASS_CARROT + '__strip',
        CLASS_ITEM = CLASS_CARROT + '__item',
        CLASS_ACCESS_TEXT = CLASS_CARROT + '__accessText',
        CLASS_ICON = CLASS_CARROT + '__icon',
        CLASS_PREV_ICON = CLASS_ICON + '--iconPrev',
        CLASS_NEXT_ICON = CLASS_ICON + '--iconNext',
        CLASS_DISABLED = CLASS_CARROT + '--disabled',
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
            alreadyMoved = 0,   // how far have we moved
            animating = false,  // animation lock
            axis = "x",

            settings = {
                show: 1,        // show 1 frame at a time
                scroll: 1,      // scroll 1 frame at a time
                speed: 700,     // scroll speed         
                sideways: true, // scroll sideways

                prevClass : '',
                nextClass : '',
                prevText : 'next',
                nextText : 'previous',
                prevIconClass : CLASS_PREV_ICON,
                nextIconClass : CLASS_NEXT_ICON,
                controlOnHover : false,

                infinite: false,
                auto: false,

                key: false,
                keyBack: null,
                keyForward: null,

                touch: false    // touch device
            };

        // --- toggle the prev and next and start/end flags

        var setInMiddle = function(){
            if (atStart) {
                prev.removeClass(CLASS_DISABLED);
                atStart = false;
            }
            if (atEnd) {
                next.removeClass(CLASS_DISABLED);
                atEnd = false;
            }
        }

        var setAtStart = function(){
            setInMiddle();  // fix previous state
            atStart = true;
            prev.addClass(CLASS_DISABLED);
        };

        var setAtEnd = function(){
            setInMiddle();  // fix previous state
            atEnd = true;
            next.addClass(CLASS_DISABLED);
        }
    
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

        var doneScrolling = function(item, direction, moveDistance){
            current = item;
            alreadyMoved = moveDistance;
            moved += direction;
            animating = false;

            if (!settings.infinite){ setState(); }
        };

        // --- scroll to some time 

        var scrollToItem = function(item, direction){

            var moveDistance = direction * Math.abs(current - item) * (oneItem.size + oneItem.offset) + alreadyMoved;

            animating = true;

            slider.velocity('scroll', { 
                axis: axis, 
                duration: settings.speed, 
                offset: moveDistance, 
                container: clipPane, 
                complete: doneScrolling.bind(this, item, direction, moveDistance),
                easting: "easeOutExpo"
            } );
            // if no velocity use jquery animate
        }

        // -- move to previous scroll

        var moveToPrev = function(e){
            if (e) { e.preventDefault(); }
            if (atStart || animating) { return false; }
            
            var prevOne = current - settings.scroll;

            console.log("move to prev ", prevOne);
            scrollToItem(prevOne, -1);
        };

        // -- move to next scroll

        var moveToNext = function(e){
            if (e) { e.preventDefault(); }
            if (atEnd || animating) { return false; }
     
            var nextOne = current + settings.scroll;

            console.log("move to next ", nextOne);
            scrollToItem(nextOne, 1);
        };

        // -- create icon prev and next buttons

        var createControls = function(){

            var prevContent = $('<span/>', { 'class' : CLASS_ACCESS_TEXT, 'text': settings.prevText });
            var nextContent = $('<span/>', { 'class' : CLASS_ACCESS_TEXT, 'text': settings.nextText });
            var prevIcon = $('<span/>', { 'class' : CLASS_ICON + ' ' + settings.prevIconClass, 'aria-hidden': true });
            var nextIcon = $('<span/>', { 'class' : CLASS_ICON + ' ' + settings.nextIconClass, 'aria-hidden': true });

            prev = $('<button/>', { 'class': CLASS_PREV + ' ' + settings.prevClass });
            next = $('<button/>', { 'class': CLASS_NEXT + ' ' + settings.nextClass });
     
            prev.append(prevIcon);
            prev.append(prevContent);
            next.append(nextContent);
            next.append(nextIcon);

            if (atStart) {
                prev.addClass(CLASS_DISABLED);
            }
            
            prev.click(moveToPrev);
            next.click(moveToNext);

            // DONT do this for touch

            if (settings.controlOnHover && !settings.touch){
                next.hide(); 
                prev.hide();
                scope.hover(
                    function(){
                        next.fadeIn("fast"); prev.fadeIn("fast");
                    },
                    function(){
                        next.fadeOut("fast"); prev.fadeOut("fast");
                    }
                );
            }

            scope.append(prev).append(next);
        };

        // --- find moves

        var findMoves = function(){
            moves = Math.ceil(totalItems/settings.scroll) - (settings.show - settings.scroll) - 1;

            // these only matter for infinite scroll

            slots = settings.show * Math.ceil(totalItems/settings.show);
            emptySlots = slots - totalItems;

            console.log("moves ", moves, " slots ", slots,  "empty ", emptySlots);
        };

        // --- adjust the size of the items and the slider 

        var adjustItemSize = function(){    
            getAllItemSizes(); 
            var single = 0;

            var setItemSize = function(single, prop){
                oneItem.size = single - oneItem.offset; // make room for margin/border
                items.css(prop, oneItem.size + "px");
                slider.css(prop,  single * totalItems + "px"); // set length of slider
            }

            if (settings.sideways) { 
                setItemSize(width/settings.show, "width");
            } else {
                setItemSize(height/settings.show, "height");
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

        // --- get the content size of the container (if resized or on load)

        var getScopeSize = function(){
            width = scope.width();
            height = scope.height();
        };

        // --- set the size of the clipping pane 

        var setClipSize = function(){
            if (settings.sideways){
                clipPane.css("width", width + "px");
            } else {
                clipPane.css("height", height + "px");
            }
        };

        // --- resize happened, recalculate

        var resizeCarrot = function(){
            getScopeSize();
            setClipSize();
            adjustItemSize();
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

        // --- make the html frame depending on if its a list or divs

        var makeFrame = function(){ 

            getScopeSize();
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
            if (settings.infinite) { atStart = false; }
        };

        // --- 

        setup = function(){

            items = scope.children(); 
            totalItems = items.length;

            fixSettings();      // toggle on relevant settings if any
            makeFrame();        // make the markup
            adjustItemSize();   // make the items fit inside the clippane

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
                $.extend(settings, options);
                setup();
            },

            // --- the window rezied

            resize : function(){
                resizeCarrot();
            },

            // --- return the name of this carrot

            getName : function(){
                return settings.name;
            }
        };

        return API_Methods;
    };

    /** ---------------------------------------
        keep track of all the carrot cells
    */
    var track = {
        carrots : {}, // track all the carrotcells by name
        count : 0,
                
        // --- trigger some function on all carrots

        triggerCarrots : function(someFunc){
            for (var i in track.carrots) {
                if (typeof track.carrots[i][someFunc] === "function"){
                    track.carrots[i][someFunc]();
                }
            }
        },
        
        // --- window reized, trigger resize on all carrotcells

        windowResized : debounce(function(){
            track.triggerCarrots("resize");
        }, DEBOUNCE_RESIZE),
    

        // --- initialize jcarousel object, note THIS is not cell

        init : function(options) {  

            track.count++;
            if (!options) { options = {}; } // passed in carrotcell options
            options.scope = $(this); // save this element as the scope
            options.name = "carrot-" + track.count + "-" + options.scope.attr("id"); 
            if (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch)){
                options.touch = true; // is this touch device?
            }
            var newCarrot = new carrot();
            track.carrots[options.name] = newCarrot; 
            newCarrot.init(options);

            $(window).on('resize', track.windowResized);

            return newCarrot; // return api
        }
    };
    
    /** ---------------------------------------
        add carrotCell as a jquery function
    */
    $.fn.carrotCell = function() {

        if ($(this).hasClass(CLASS_CARROT)){

            // this carrotcell already exists, update instead of init

            var carrotName = $(this).data(CLASS_CARROT);
            var carrotAPI = track.carrots[carrotName];
            if (carrotAPI) {
                carrotAPI.update.apply(this, arguments);
                return carrotAPI;
            } else {
                console.log("this is not a carrot cell, please remove the " + CLASS_CARROT + " class");
                return false;
            }
        } else {

            // make a new carrotcell

            var newCarrot = track.init.apply(this, arguments);
            var newCarrotName = newCarrot.getName();
            track.carrots[newCarrotName] = newCarrot;
            return newCarrot;
        }      
    };
})(jQuery);
