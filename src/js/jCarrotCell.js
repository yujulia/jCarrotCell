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

		API_NAME = 'carrotAPI',
		CLASS_CARROT = 'carrotCell',
		CLASS_CLIP = 'carrotcellClip',
		CLASS_SLIDER = 'carrotcellStrip',
		CLASS_ITEM = 'carrotcellItem';

	/** ---------------------------------------
		carrot methods
	*/
	var carrot = function(){

		// --- carrot vars

		var scope = null,		// shorthand for settings.scope
			width = 0,			// container width
			height = 0,			// container height
			clipPane = null,	// clipping box
			slider = null,		// sliding panel
			items = null,		// all frames
			totalItems = 0,		// how many frames
			itemSizes = [],		// size of individual items

			settings = {
				observed: 1,	// show 1 frame at a time
				speed: 700,		// scroll speed			
				sideways: true,	// scroll sideways
				axis: "x",
				infinite: false,
				auto: false,
				key: false,
				keyBack: null,
				keyForward: null,
				touch: false	// touch device
			};

		// --- adjust the size of the items and the slider 

		var adjustItemSize = function(){		
			if (settings.sideways) { 
				singleSize = width/settings.observed;
				items.css("width", singleSize + "px");
				slider.css("width",  singleSize * totalItems + "px"); // set length of slider
			} else {
				singleSize = height/settings.observed;
				items.css("height", singleSize + "px");
				slider.css("height",  singleSize * totalItems + "px"); // set height of slider
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

		// --- get individual content item sizes

		var getItemSizes = function(){
			items.each(function(i, item){
				itemSizes.push({
					cell: item,
					w: $(item).outerWidth(),
					h: $(item).outerHeight()
				});

			});
		};

		// --- make the html frame depending on if its a list or divs

		var makeFrame = function(){	

			getScopeSize();
			clipPane = $('<div/>', { 'class': CLASS_CLIP }).css("overflow", "hidden");
			setClipSize();
			items = scope.children(); 
			totalItems = items.length;

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

			items.addClass(CLASS_ITEM).css("display", "block").css("float", "left");
			scope.addClass(CLASS_CARROT).data(CLASS_CARROT, settings.name);
			getItemSizes();			
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

			fixSettings();	// toggle on relevant settings if any
			makeFrame(); 	// make the markup
			adjustItemSize();	// make the items fit inside the clippane

			// makePrevNext();		// create controls
			
			
			// findMoves();
			// if (moves === 0) { return false; } // got nothing to do

			// // handle infinite etc
			// // disable prev

			// determinePrevNext(0);
	
			// prev.addClass(settings.disabledClass);
			// prev.click(moveBack).show();
			// next.click(moveForward).show();
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
