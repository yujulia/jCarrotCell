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
        CLASS_NEXT = CLASS_CARROT + '--next',
        CLASS_PREV = CLASS_CARROT + '--prev';

    // --- debounce 

    var debounce = function(callback, ms){
        var timeout = null;

        return function(){
            var context = this, args = arguments;
            var stalled = function(){
                timeout = null;
                callback.apply(context, args);
            }
            clearTimeout(timeout);
            timeout = setTimeout(stalled, ms);
        }
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
            slots = 0,          // how many slots total (including empties)
            emptySlots = 0,     // how many slots empty

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

                axis: 'x',
                infinite: false,
                auto: false,
                key: false,
                keyBack: null,
                keyForward: null,

                touch: false    // touch device
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
            
            scope.append(prev).append(next);
        };

        // --- find moves

        var findMoves = function(){
            moves = Math.ceil(totalItems/settings.scroll);
            slots = settings.scroll * moves;
            emptySlots = slots - totalItems;
            console.log("moves ", moves, " slots ", slots,  " emoty ", emptySlots);
        };

        // --- adjust the size of the items and the slider 

        var adjustItemSize = function(){    
            getAllItemSizes(); 
            var single = 0;

            if (settings.sideways) { 
                single = width/settings.show;
                items.css("width", single - oneItem.offset + "px");
                slider.css("width",  single * totalItems + "px"); // set length of slider
            } else {
                single = height/settings.show;
                items.css("height", single - oneItem.offset + "px");
                slider.css("height",  single * totalItems + "px"); // set height of slider
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
                    calcOffset += parseInt($(item).css("border-left-width"), 10) + parseInt($(item).css("border-right-width"), 10);
                } else {
                    calcOffset += parseInt($(item).css("border-top-width"), 10) + parseInt($(item).css("border-bottom-width"), 10);
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
            if (!settings.sideways) { scrollAxis = "y"; }
            if (settings.key) {
                if (settings.sideways) {
                    settings.keyBack = settings.keyBack || KEY_BACK;
                    settings.keyForward = settings.keyForward || KEY_FORWARD;
                } else {
                    settings.keyBack = settings.keyBack || KEY_UP;
                    settings.keyForward = settings.keyForward || KEY_DOWN;
                }
            }
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
