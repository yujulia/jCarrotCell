/*!
 * jCarrotCell
 * http://jcarrotcell.yujulia.com
 * 
 * Copyright 2011, 2015 
 * Released under the MIT license
 *
 */

(function($){

	/** ---------------------------------------
		carrot methods
	*/
	var carrot = function(){

		// --- CONST

		var KEY_BACK = 37,
			KEY_FORWARD = 39,
			KEY_UP = 38,
			KEY_DOWN = 40,
			CLASS_CARROT = 'carrotCell',
			CLASS_CLIP = 'carrotcellClip',
			CLASS_SLIDER = 'carrotcellStrip',
			CLASS_ITEM = 'carrotcellItem';

		// --- carrot vars

		var cell = null,		// shorthand for settings.scope
			width = 0,			// container width
			height = 0,			// container height
			clipPane = null,	// clipping box
			slider = null,		// sliding panel
			items = null,		// all frames
			totalItems = 0,		// how many frames
			single = null,		// just one frame for measuring

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

		// --- make the html frame depending on if its a list or divs

		var makeCarrot = function(){	

			width = cell.innerWidth();
			height = cell.innerHeight();

			// set up the clipping panel

			clipPane = $('<div/>', { 'class': CLASS_CLIP }).css("overflow", "hidden");
			if (settings.sideways){
				clipPane.css("width", width + "px");
			} else {
				clipPane.css("height", height + "px");
			}

			// set up the sliding strip

			var sliderType = '<div/>';
			var carrotType = cell.prop('tagName').toUpperCase();
			var isList = false;

			// is it a list? set the strip type to be divs or lists

			if (carrotType === "UL" || carrotType === "OL"){ 
				isList = true; 
				sliderType = '<'+ carrotType + '/>';
			}

			// make a slider and add children to it

			slider = $(sliderType, { 'class': CLASS_SLIDER });
			items = cell.children(); 
			items.appendTo(slider);
			items.addClass(CLASS_ITEM).css("display", "block").css("float", "left");
			totalItems = items.length;
			single = items.filter(':first'); // measure one or measure each?
			slider.appendTo(clipPane); 

			if (isList) {
				// make a new div as the container for this list
				var dupeAttributes = getAttributes(cell);
				var newParent = $('<div/>', dupeAttributes);
				clipPane.appendTo(newParent);
				cell.replaceWith(newParent);
				cell = newParent;
			} else {
				// since its already a div just add stuff into it
				cell.empty();
				clipPane.appendTo(cell);
			}

			cell.addClass(CLASS_CARROT);
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
			makeCarrot(); 	// make the markup
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


		// --- the public api

		var API_Methods = {
			init : function(options){
				cell = options.scope;
				$.extend(settings, options); // update settings
				setup();
			}
		};

		return API_Methods;
	};

	/** ---------------------------------------
		cells contain carrots
	*/
	var cell = {
		carrots : {}, // track all the carrotcells by name
		count : 0,
		
		makeCarrot : function(){
			var $thisCarrot = null, // this carrot cell
			
				// populate default settings
				settings = {
					observed: 1,	// how many items visible at once
					speed: 700,
					sideways: true,

					step: 0,
					key: false,
					infinite: false,
					auto: false,
					navi: false,
					makeNavi: false,
					delay: 5000,
					containsControl : true,
					controlScope : "",
					stopOnClick : false,
					pauseOnHover : false,
					
					// classNames
					disabledClass: "disabled",
					currentClass: "current",
					cloneClass: "clone",
					naviClass : "naviItem",
					
					// selectors
					sliderSelect : "ol",
					sliderChildSelect : "li",					
					prevSelect : ".prev",
					nextSelect : ".next",
					pauseSelect :  ".pause",
					playSelect : ".play",
					stopSelect : ".stop",
					naviContainer : ".navi",
					naviSelect : "> *",
					
					// events
					scrollStart : "carrotScrollStart",
					scrollEnd : "carrotScrollEnd",
					atStart : "carrotAtStart",
					atEnd : "carrotAtEnd",
					onPlay : "carrotPlay",
					onPause : "carrotPause",
					onStop : "carrotStop",
					pagesChanged : "carrotPageCountChanged",
					onRemove : "carrotRemove",
					onEmpty : "carrotEmpty",
					onInsert : "carrotInsert",
					onReload : "carrotReload",

					// new sizing
					resizeHeight : false,
					maxWidth : 0, // grab these
					maxHeight: 0, // grabe these
					minWidth : 0,
					minHeight : 0

				},
				
				// CONST				
				KEY_BACK = 37,
				KEY_FORWARD = 39,
				KEY_UP = 38,
				KEY_DOWN = 40,	

				SCROLL_END = "scrollEnd",
				SCROLL_START = "scrollStart",
				AT_START = "atStart",
				AT_END = "atEnd",
				ON_PLAY = "onPlay",
				ON_PAUSE = "onPause",
				ON_STOP = "onStop",
				ON_REMOVE = "remove",
				ON_EMPTY = "empty",
				ON_INSERT = "insert",
				ON_RELOAD = "reload",
				PAGE_COUNT_CHANGED = "pageCountChanged",

				// NEW 

				carrotWidth = 0, 	// how wide this container is
				carrotHeight = 0,	// how tall the container is
				cellRatio = 1, 		// the ratio of height x width

				onItem = 1, 		// currently, how many moves have we made
				moveToItem = 1,		// the item we are going to
				movePixels = 0,		// how much pixels to move this time
				pixelsMoved = 0,	// how much did we move
				moves = 0,			// how many times we can press next
				prevMoves = 0,		// flag if number of moves changed
				slots = 0,			// how much room total do we have by pressing moves
				emptySlots = 0,		// how much leftover slots in a move
				scrollAxis = "x",	// scroll on which axis
				ANIMATE_LOCK = false,	// animation lock

			
				// properties of this carrotCell
				isTouchDevice = false,
				slideWidth = 0,				
				haveBack = false,
				haveForward = true,
				cloned = false,
				
				currentPage = 1,
				currentItem = 1,
				playing = false,
				paused = false,
				stopped = false,
				scrolling = false,
				extraMoves = 0,
				enoughToScroll = false,
				prevDisabled = true,
				nextDisabled = true,
				moveByOne = false,
				scrollCallBack = null,
				oldPages = null,
				itemNames = {},

				clipPane, slider, items, single, totalItems,
				frameSize, singleSize, viewSize,
				autoScroll, pause, play, stop, 
				visible, advanceBy, myPage, pages,
				prev, next, navi, nameList, pre, post,
				sliderSelect, sliderChildSelect, prevSelect, nextSelect,
				pauseSelect, playSelect, stopSelect, naviContainer, naviSelect,
				firstOfLastPage, extraOnLastPage, hasOpenSpot;		
			
			// ---------------------------------------------------------- helper functions


			/** get all attributes of some element
			*/
			var getAttributes = function(someElement){

				var attrs = {};

				var buildAttrList = function(id, attr){
					attrs[attr.nodeName] = attr.nodeValue;
				};
				$.each(someElement[0].attributes, buildAttrList);


				return attrs;
			};

			/** stop barrage of some events
			*/
			var waitForFinalEvent = (function(){
				var timers = {};
				return function (callback, ms, uniqueId) {
				    if (!uniqueId) { uniqueId = "default"; }
				    if (timers[uniqueId]) { clearTimeout (timers[uniqueId]); }
				    timers[uniqueId] = setTimeout(callback, ms);
				};
			})();

			// ---------------------------------------------------------- carrotcell functions

			/** the window resize happened
			*/
			var windowResized = function(){
				waitForFinalEvent(handleResize, 200, "carrotWindowResize");
			};

			var makeItMaxWidth = function(){
				var newWidth = carrotWidth;

				// set any max or mins for width
				if (settings.maxWidth && (newWidth > settings.maxWidth)) {
					newWidth = settings.maxWidth;
				}
				if (settings.minWidth && (newWidth < settings.minWidth)) {
					newWidth = settings.minWidth;
				}

				var newHeight = newWidth/cellRatio;
				if (settings.maxHeight && (newHeight > settings.maxHeight)) {
					newHeight = settings.maxHeight;
				}
				if (settings.minHeight && (newHeight < settings.minHeight)) {
					newHeight = settings.minHeight;
				}

				// $($thisCarrot).css("width", newWidth+"px");
				$(clipPane).css("width", newWidth+"px");
				$(items).css("width", newWidth+"px");

				// adjust the height as well if we are resizing height
				if (settings.resizeHeight){
					$(items).css("height", newHeight+"px");
					$(clipPane).css("height", newHeight+"px");
				}
			};

			/** find out the current container size and update properties
			*/
			var resizeCarrot = function(){

				carrotWidth = $thisCarrot.innerWidth();
				makeItMaxWidth();

				// update the new sizes
				if (settings.sideways) {
					singleSize = single.outerWidth();
				} else {
					singleSize = single.outerHeight();
				}	
				adjustItemSize();
			};

			/** the resize handler
			*/
			var handleResize = function(){
				resizeCarrot();
				// reset the current scroll if we are in the middle if something
				var saveCurrent = currentPage;
				if ((saveCurrent > 1) || settings.infinite){
					scrollToStart();
					gotoPage(saveCurrent, "no"); // ideally no animate
				}
			};

			/** on orientationc hange we need to set the content to 0 to not mess up
				landscape -> portrait transition where the content stretches window width
			*/
			var windowOrientationChanged = function(){
				$($thisCarrot).css("width", "0"); 
				handleResize();
			};
			
			/** no animation scroll to reset to beginning or end
			*/
			var scrollToThis = function(scrollBy, pageValue) {
				if (settings.sideways) { 	
					clipPane.scrollLeft(scrollBy); 
				} else {
					clipPane.scrollTop(scrollBy);
				}				
				myPage = pageValue;
				currentPage = pageValue;
				scrolling = false;
				settings.controlScope.trigger(settings.scrollEnd, [settings.name, SCROLL_END, pageValue]);
			};				
			
			/** scroll back to the very beginning 
			*/
			var scrollToStart = function(){
				var scrollBy = 0;
				if (settings.infinite) {
					scrollBy = singleSize * visible; // bypass first set of clones
				}				
				scrollToThis(scrollBy, 1);
			};
			
			/** scroll to the very end  
			*/
			var scrollToEnd = function(){
				var scrollBy = singleSize * items.length;
				if (settings.infinite) {
					scrollBy = singleSize * (items.length - visible*2); // stop before the clones if infinite
				}				
				scrollToThis(scrollBy, pages);
			};
			
			/** this is called when go to page finishes scrolling
			*/
			var scrollHandler = function(){
				var scrollThis = 0;
				// scrolling forward infinite loop
				if (settings.infinite && (myPage > pages)) {	
					settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, 1]);
					scrolling = true;					
					var moveBy = (visible - extraMoves) * singleSize;	// scroll extras that are not yet 1 page full					
					if (settings.sideways) { 										
						clipPane.animate({ scrollLeft : '+=' + moveBy }, settings.speed, scrollToStart);			
					} else { 
						clipPane.animate({ scrollTop : '+=' + moveBy }, settings.speed, scrollToStart);
					}
				} 				
				// scrolling backwards infinite loop
				else if (settings.infinite && (myPage === 0)) {
					settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, pages]);
					scrolling = true;
					var moveby = -1 * extraMoves * singleSize;		
					if (settings.sideways) { 										
						clipPane.animate({ scrollLeft : '+=' + moveby }, settings.speed, scrollToEnd);			
					} else { 
						clipPane.animate({ scrollTop : '+=' + moveby }, settings.speed, scrollToEnd);
					}									
				}				
				// default scrolling
				else {	
					currentPage = myPage;
					settings.controlScope.trigger(settings.scrollEnd, [settings.name, SCROLL_END, myPage]);
					scrolling = false;				
					determinePrevNext(myPage);				
					// call any callbacks then reset the callback
					if (typeof scrollCallBack == "function" ) {
						scrollCallBack();
					}
					scrollCallBack = null;
				}
			};
				
			/** scroll the carousel by advancing to the next page
			*/
			var gotoPage = function(page, fast) {		
		
				if (arguments.length) {  myPage = page;  } else {  return false; }		
				
				var dir = myPage < currentPage ? -1 : 1, // what direction are we going
		            n = Math.abs(currentPage - myPage), // how many pages to scroll
					scrollTo = singleSize * dir * advanceBy * n; // how far in pixels
					
				settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, myPage]);
				scrolling = true;				

				if (settings.sideways) {
					if (fast){
						clipPane.filter(':not(:animated)').animate({ scrollLeft : '+=' + scrollTo }, 0, scrollHandler);
					} else {
						clipPane.filter(':not(:animated)').animate({ scrollLeft : '+=' + scrollTo }, settings.speed, scrollHandler);
					}
				} else {
					if (fast) {
						clipPane.filter(':not(:animated)').animate({ scrollTop : '+=' + scrollTo }, 0, scrollHandler);
					} else {
						clipPane.filter(':not(:animated)').animate({ scrollTop : '+=' + scrollTo }, settings.speed, scrollHandler);
					}
				}
			};


			/** called when scroll by one is done
			*/
			var scrollByOneHandler = function() {
				settings.controlScope.trigger(settings.scrollEnd, [settings.name, SCROLL_END, pages]);
				scrolling = false;
				determinePrevNext(pages); // fake move
			};
			
			/** scroll forward by one only on insert
			*/
			var scrollByOne = function() {		
				settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, pages]);
				scrolling = true;
				if (settings.sideways) {

					clipPane.filter(':not(:animated)').animate({ scrollLeft : '+=' + singleSize }, settings.speed, scrollByOneHandler);
				
				} else {
					clipPane.filter(':not(:animated)').animate({ scrollTop : '+=' + singleSize }, settings.speed, scrollByOneHandler);
				}
			};


			
			/** set up the interval
			*/
			var startAutoAdvance = function(){
				window.clearInterval(autoScroll);
				autoScroll = this.setInterval(function(){ if (!paused) { moveForward(); } }, settings.delay);
			};
			
			/** pause the auto play
			*/
			var pauseCarrotCell = function() {
				if (paused) { return false; }
				paused = true;
				playing = false;
				stopped = false;
				pause.addClass(settings.disabledClass);
				play.removeClass(settings.disabledClass);
				stop.removeClass(settings.disabledClass);
				settings.controlScope.trigger(settings.onPause, [settings.name, ON_PAUSE]);
			};
			
			/** resume the auto play
			*/
			var playCarrotCell = function() {
				if (playing) { return false; }
				paused = false;
				stopped = false;
				playing = true;
				play.addClass(settings.disabledClass);
				stop.removeClass(settings.disabledClass);
				pause.removeClass(settings.disabledClass);
				startAutoAdvance();
				settings.controlScope.trigger(settings.onPlay, [settings.name, ON_PLAY]);
			};
			
			/** resume the auto play
			*/
			var stopCarrotCell = function() {
				if (stopped) { return false; }
				paused = false;
				stopped = true;
				playing = false;
				stop.addClass(settings.disabledClass);
				play.removeClass(settings.disabledClass);
				pause.removeClass(settings.disabledClass);
				window.clearInterval(autoScroll);
				settings.controlScope.trigger(settings.onStop, [settings.name, ON_STOP]);
			};
			
			/** set up the controls if any, then auto scroll
			*/
			var setupAutoAdvance = function(){
				pause.bind("click", function(e){
					e.preventDefault();
					pauseCarrotCell();
				}).show();
				play.bind("click", function(e){
					e.preventDefault();
					playCarrotCell();
				}).show();
				stop.bind("click", function(e){
					e.preventDefault();
					stopCarrotCell();
				}).show();
				playCarrotCell();
			};

			/** up down for vertical, left right for horizonal arrow key movement
			*/
			var setupKeyAdvance = function() {
				$(document).keyup(function(e){
					if (scrolling) { return false; }					
			    	if (e.keyCode == settings.keyBack) { moveBack(); } // left / up
					if (e.keyCode == settings.keyForward) { moveForward(); } // right / down
				});
			};
			
			/** if the total number of pages changed, adjust the navi accordingly
			*/
			var handleNaviChanges = function() {
				settings.controlScope.bind(settings.pagesChanged, function(e, carrotName, eventName, newPageNumber, oldPageNumber ) {		
					var newIndex, newNaviNode;
					var diff = newPageNumber - oldPageNumber;
					var more = true; // more pages or less pages?
					if (diff < 0) { more = false; }				
					diff = Math.abs(diff);
					
					if (more) {
						if (settings.makeNavi) {
							// consult the existing names and create a new navi item
							for (var i = 1; i <= more; i++) {
								newIndex = oldPageNumber + i;						
								if (itemNames[newIndex]) {
									$(naviContainer).append(pre + itemNames[newIndex] + post);
								} else {
									$(naviContainer).append(pre + newIndex + post);
								}							
								newNaviNode = $("> *", naviContainer).last();								
								navi = $(naviContainer).find("> *"); // find all the things we just added					
								addNaviClick(newNaviNode, newIndex); // add a click action to the navi					
							}						
							
							// scroll to inserted
							if (settings.scrollToInserted) {
								$(navi).removeClass(settings.currentClass);
								$(newNaviNode).addClass(settings.currentClass);
							}				
						}
					} else {
						// removing instead of inserting caueses page count to decrease
						navi.slice(-1*diff).remove(); // remove last items
						navi = $(naviContainer).find("> *");
					}				
				});
			};
			
			/** subscribe to scroll start event and highlight the appropriate navi item
			*/
			var handleNaviAutoscroll = function() {
				settings.controlScope.bind(settings.scrollStart, function(e, movingThing, eventName, pageNum) {							
					if ((movingThing == settings.name) && (eventName == SCROLL_START)) {			
						$(navi).removeClass(settings.currentClass);			
						if (pageNum > pages) { pageNum = 1; } // going around to first
						if (pageNum === 0) { pageNum = pages; } // going backwards to last
						var thisNavi = $(navi)[parseInt(pageNum)-1];
						$(thisNavi).addClass(settings.currentClass);
					}
				});
			};
			
			/** some user change has happened to the navi, look over it again
			*/
			var updateExistingNavi = function() {
				navi = naviContainer.find(settings.naviSelect);
				processEachNaviNode();
			};
								
			/** auto create navi based on existing parent element
			*/
			var creatNavi = function(){
				$(naviContainer).empty(); // clear the navi container			
				for (var j = 1; j <= pages; j++) { itemNames[j] = j; } // set navi names into auto integers
			 	nameList = $(naviContainer).data("navi"); // get name list data if any				
				if ((nameList !== null) && (nameList !== undefined) && (nameList.length !== 0) ) {					
					$(nameList).each(function(n){
						itemNames[n+1] = nameList[n]; // add the names into item names if they exist
					});								
				} 				
				pre = '<div class="' + settings.naviClass +'">'; // default is div
				post = '</div>';			
				if ($(naviContainer).is("ul") || $(naviContainer).is("ol")) {
					pre = '<li class="' + settings.naviClass +'">';
					post = '</li>';				
				} 
				
				for (var i = 1; i <= pages; i++) {
					$(naviContainer).append(pre + itemNames[i] + post);
				}			
				
				navi = $(naviContainer).find("> *"); // update with all the things we just added
			};
			
			/** make passed in items clickable as navi items
			*/
			var addNaviClick = function(thisNavi, navIndex) {
				$(thisNavi).unbind().bind("click", function(){
					if (playing && settings.stopOnClick) {  stopCarrotCell(); }
					if (scrolling) { return false; } // no queue ups on rapid clicking

					navi.removeClass(settings.currentClass);
					$(this).addClass(settings.currentClass);
					if ((navIndex <= pages) && (navIndex > 0)) {
						gotoPage(navIndex);
						determinePrevNext(navIndex);
					}
				});
			};
			
			/** add events to each navi item
			*/
			var processEachNaviNode = function(){
				navi.each(function(iNav){					
					var thisNavi = this; // an item of this nav
					var navIndex = iNav + 1;				
					addNaviClick(thisNavi, navIndex);
				});
			};		
			
			/** set up navigation, only works on pages
			*/
			var setupNavi = function() {			
				if (settings.makeNavi) { creatNavi(); }				
				$(navi).first().addClass(settings.currentClass);			
				processEachNaviNode();			
				handleNaviAutoscroll();			
				handleNaviChanges();		
			};
			
			
			
			/** if touchwipe is included add gesture support
			*/
			var setupTouchSupport = function(){
				if(jQuery().touchwipe) {				
					if (settings.sideways) {
						$($thisCarrot).touchwipe({
						    wipeLeft: function() {  moveForward(); },
						    wipeRight: function() {  moveBack(); },
						    preventDefaultEvents: false
						});
					} else {
						$($thisCarrot).touchwipe({
						    wipeDown: function() {  moveForward(); },
						    wipeUp: function() {  moveBack(); },
						    preventDefaultEvents: false
						});
					}			
				}
			};
			
			/** if pause on hover is set, do that
			*/
			var setupPauseOnHover = function(){
				if (settings.pauseOnHover && settings.auto) {	
					clipPane.bind({
						mouseenter : function() { pauseCarrotCell(); },
						mouseleave: function(){ playCarrotCell(); }
					});
				}
			};
			

			/** clone a slider worth of clones at beginning and end
			*/
			var padWithClones = function(){
				items.filter(':first').before(items.slice(-visible).clone().addClass(settings.cloneClass));			
				items.filter(':last').after(items.slice(0, visible).clone().addClass(settings.cloneClass));
				items = slider.children(settings.sliderChildSelect); // reselect everything including clones
			};
			
			/** re clone the beginning and ending clones may have changed
			*/
			var reClone = function(){
				items.filter("." + settings.cloneClass).remove(); // remove old clones
				findSlides();
				padWithClones();
				adjustItemSize();
			};
			
			/** move the clones added at the beginning out of sight
			*/
			var moveClonesOutOfSight = function(){
				if (settings.sideways) {
					clipPane.scrollLeft(singleSize * visible);
				} else {
					clipPane.scrollTop(singleSize * visible); 
				}
			};


			
			/** something has changed about slides, update calculations
			*/
			var updateSlider = function(){
				findSlides();
				howManyPages();
				howManyExtraMoves();

				if (settings.infinite) { padWithClones(); } 
				adjustItemSize();
				if (settings.infinite) { moveClonesOutOfSight(); }
			};
			
			/** find out which page in the set contains the item
			*/
			var whichPageContains = function(itemIndex){
				var inPage = 0;							
				for (var i = 0; i < pages; i++) {
				    var thisMax = i * advanceBy + advanceBy;
					var thisMin = i * advanceBy + 1;						
					if ((itemIndex <= thisMax) && (itemIndex >= thisMin)) {
						inPage = i;
					}
				}
				inPage++; // starting from 1 instead of 0 fix				
				if (itemIndex > totalItems) { inPage = pages; }				
				return inPage;
			};
			
			/** given some item index, check to see that it is in range
				return a number that is in range if its not
			*/
			var itemRangeFix = function(itemIndex) {
				itemIndex = parseInt(itemIndex); // make sure its an integer
				if (isNaN(itemIndex)) { 
					itemIndex = items.length + 1; // got nothing, add to end
				} else {
					if (itemIndex < 1 ) { 
						itemIndex = 1; 
					} else if (itemIndex > items.length ) {
						itemIndex = items.length + 1; // too big, make it the end
					}
				} 
				return itemIndex;
			};
			
			/** remove all the items
			*/
			var emptyItems = function(){
				$(items).remove(); 
				updateSlider(); // reset the slider info				
				IsThereEnoughToScroll();
				settings.controlScope.trigger(settings.onEmpty, [settings.name, ON_EMPTY]);				
			};
			
			/** remove item at index
			*/
			var removeItem = function(index) {			
				var adjustedIndex = index;				
				if (settings.infinite || settings.auto) {
					adjustedIndex = visible + index;					
					if (adjustedIndex > (totalItems + visible)) {
						adjustedIndex = totalItems + visible;
					} else if (index < visible)  {
						adjustedIndex = visible;
					} 
				} else {
					if (index > totalItems) {
						adjustedIndex = totalItems;
					}
				}				
				$(items[adjustedIndex-1]).remove();
				if (settings.infinite || settings.auto) { reClone(); }
				if (hasOpenSpot < visible ) { hasOpenSpot++; } else { hasOpenSpot = 0; }				
				updateSlider(); // reset the slider info				
				IsThereEnoughToScroll();					
				settings.controlScope.trigger(settings.onRemove, [settings.name, ON_REMOVE, pages]);
			};
			
			/** insert item at index
			*/
			var insertItem = function(newItem, index){
				var adjustedIndex = index;			
				if (settings.infinite || settings.auto) {
					if (index > items.length) {
						adjustedIndex = totalItems + visible; 
					} else {
						adjustedIndex = index-1 + visible;				
					}					
					$(settings.sliderChildSelect, slider).eq(adjustedIndex).before(newItem); // insert at index
					reClone();					
				} else {
					if (index > items.length) {
						slider.append(newItem); // insert at end
					} else {
						$(settings.sliderChildSelect, slider).eq(index-1).before(newItem); // insert at index
					}
				}
		
				if (hasOpenSpot > 0) { hasOpenSpot--; } else { hasOpenSpot = visible-1; } // less open slots now we inserted
				updateSlider(); // reset the slider info			
			};		
			
			/** after item is inserted, determine if we need to scroll to the end via pages or move by one item
			*/
			var afterInsert = function(index) {
				if (settings.scrollToInserted) {											
						var whichPage = whichPageContains(index);							
						if ((whichPage == pages) && !settings.infinite) {
							if (currentPage !== pages) {
								scrollCallBack = scrollByOne;
								gotoPage(pages); // go to the last page then scroll by 1
							} else {
								scrollByOne(); // we are on the last page already
							}
						} else {
							gotoPage(whichPage);
						}					
				} else {					
					if ((currentPage == pages) && !settings.inifnite) {
						moveByOne = true;											
						determinePrevNext(pages); // if its at the end, we can move 1 more
					} else {
						determinePrevNext(currentPage);
					}						
				}
				settings.controlScope.trigger(settings.onInsert, [settings.name, ON_INSERT, pages]);
			};
			
			/** reload the slide show with a complete new set of items and call any autoplays
			*/
			var reloadItems = function(newItems) {			
				if (settings.auto) { stopCarrotCell(); }	
				emptyItems();
				slider.append(newItems);			
				updateSlider(); // reset the slider info	
				setupNavi();
				gotoPage(1);		
				determinePrevNext(1);
				if (!settings.infinite) { IsThereEnoughToScroll(); }		
				if (settings.auto) { playCarrotCell(); }		
				settings.controlScope.trigger(settings.onReload, [settings.name, ON_RELOAD, pages]);
			};


			//-------------------------------------------------------- CHECK

			var scrollHandler = function(){
				ANIMATE_LOCK = false;
				onItem = moveToItem;
				settings.controlScope.trigger(settings.scrollEnd, [settings.name, SCROLL_END, onItem]);
				determinePrevNext(myPage);				
				pixelsMoved = movePixels; // store how much we moved by


				// var scrollThis = 0;
				// // scrolling forward infinite loop
				// if (settings.infinite && (myPage > pages)) {	
				// 	settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, 1]);
				// 	scrolling = true;					
				// 	var moveBy = (visible - extraMoves) * singleSize;	// scroll extras that are not yet 1 page full					
				// 	if (settings.sideways) { 										
				// 		clipPane.animate({ scrollLeft : '+=' + moveBy }, settings.speed, scrollToStart);			
				// 	} else { 
				// 		clipPane.animate({ scrollTop : '+=' + moveBy }, settings.speed, scrollToStart);
				// 	}
				// } 				
				// // scrolling backwards infinite loop
				// else if (settings.infinite && (myPage === 0)) {
				// 	settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, pages]);
				// 	scrolling = true;
				// 	var moveby = -1 * extraMoves * singleSize;		
				// 	if (settings.sideways) { 										
				// 		clipPane.animate({ scrollLeft : '+=' + moveby }, settings.speed, scrollToEnd);			
				// 	} else { 
				// 		clipPane.animate({ scrollTop : '+=' + moveby }, settings.speed, scrollToEnd);
				// 	}									
				// }				
				// // default scrolling
				// else {	
				
				// 	determinePrevNext(myPage);				
				// 	// call any callbacks then reset the callback
				// 	if (typeof scrollCallBack == "function" ) {
				// 		scrollCallBack();
				// 	}
				// 	scrollCallBack = null;
				// }


			};

			/** scroll the carousel by advancing to the next page
			*/
			var moveTo = function(tempMoveTo, fast) {		
		
				if (tempMoveTo) { moveToItem = parseInt(tempMoveTo, 10); } else { return false; }

				debug("on item " + onItem + " moveToItem " + moveToItem);

				var direction = moveToItem < onItem ? -1 : 1; // are we going to advance or retreat?
				var itemsToMove = Math.abs(onItem - moveToItem);
				movePixels = singleSize * direction * itemsToMove + pixelsMoved;

				

				debug("direction is " + direction + " size is " + singleSize +" pixel is " + movePixels + " move by items " + itemsToMove);

				ANIMATE_LOCK = true;
				settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, onItem]);
				slider.velocity('scroll', { 
					axis: scrollAxis, 
					duration: settings.speed, 
					offset: movePixels, 
					container: clipPane, 
					complete: scrollHandler,
					easting: "easeOutExpo"
				} );
					
			

				// if (settings.sideways) {
				// 	if (fast){
				// 		clipPane.filter(':not(:animated)').animate({ scrollLeft : '+=' + scrollTo }, 0, scrollHandler);
				// 	} else {
				// 		clipPane.filter(':not(:animated)').animate({ scrollLeft : '+=' + scrollTo }, settings.speed, scrollHandler);
				// 	}
				// } else {
				// 	if (fast) {
				// 		clipPane.filter(':not(:animated)').animate({ scrollTop : '+=' + scrollTo }, 0, scrollHandler);
				// 	} else {
				// 		clipPane.filter(':not(:animated)').animate({ scrollTop : '+=' + scrollTo }, settings.speed, scrollHandler);
				// 	}
				// }
			};


			/** show previous
			*/
			var moveBack = function(e) {
				if (e) { e.preventDefault(); }
				if ((!settings.infinite && nextDisabled) || ANIMATE_LOCK) { return false; } // we are at the left most page or its circular
				
				moveTo(onItem - settings.observed);
			};

			/** show next
			*/
			var moveForward = function(e) {
				if (e) { e.preventDefault(); }
				if ((!settings.infinite && nextDisabled) || ANIMATE_LOCK) { return false; } // we are at the right most page	
				moveTo(settings.observed + onItem);

				// var nextPage = currentPage + 1;
				// debug("move forward " + nextPage);
				// moveTo(nextPage);

				
				// this only happens on insert and scrollOnInsert
				// if (moveByOne && !settings.infinite) {
				// 	moveByOne = false;
				// 	if (hasOpenSpot === 0) {
				// 		gotoPage(nextPage);
				// 	} else {
				// 		scrollByOne();
				// 	}
				// } else {			
				// 	gotoPage(nextPage);
				// }				
			};

			/** determine if the previous and next buttons should be active based on the next page they will be linking to
			*/
			var determinePrevNext = function(nextPage) {	

				if (settings.infinite) { 
					haveBack = true;
					haveForward = true;					
				} else {

					if ((nextPage <= 1) || (currentPage === 1)) { haveBack = false; } else { haveBack = true; }			
					if (nextPage >= pages) { haveForward = false; } else { haveForward = true; }
					if (moveByOne) { haveForward = true; }
				}
				
				// enable and disable							
				if (haveBack) { 
					prev.removeClass(settings.disabledClass); 
					prevDisabled = false;
				} else { 
					prevDisabled = true;
					prev.addClass(settings.disabledClass); 
					settings.controlScope.trigger(settings.atStart, [settings.name, AT_START]);
				}
				
				if (haveForward) { 
					next.removeClass(settings.disabledClass); 
					nextDisabled = false;
				} else { 
					next.addClass(settings.disabledClass); 
					settings.controlScope.trigger(settings.atEnd, [settings.name, AT_END]);
					nextDisabled = true;
				}						
			};
			

			/** find how many moves we have
			*/
			var findMoves = function(){			
				if (totalItems <= settings.observed) {
					return false; // nothing to move
				} else {
					moves = Math.ceil(totalItems / settings.observed);
				}
				
				slots = settings.observed * moves;
				emptySlots = slots - totalItems;

				debug("find moves: moves " + moves + " slots " + slots + " empty " + emptySlots);

				if (prevMoves !== moves) {
					settings.controlScope.trigger(settings.pagesChanged, [settings.name, PAGE_COUNT_CHANGED, moves, prevMoves]);			
				}
				prevMoves = moves; // save current moves						
			};

			/** adjust the size of the slider and the slides based on how
				many we are showing
			*/
			var adjustItemSize = function(){		
				if (settings.sideways) { 
					singleSize = carrotWidth/settings.observed;
					items.css("width", singleSize + "px");
					slider.css("width",  singleSize * totalItems + "px"); // set length of slider
				} else {
					singleSize = carrotHeight/settings.observed;
					items.css("height", singleSize + "px");
					slider.css("height",  singleSize * totalItems + "px"); // set height of slider
				}
			};

			/** create previous and next buttons
			*/
			var makePrevNext = function(){
				// if no selectors passed in...
				// can pass in other elements, or this following creation text

				prev = $('<button/>', { 'class': 'prev', 'text' : 'Previous' }).hide();
				next = $('<button/>', { 'class': 'next', 'text' : 'Next' }).hide();

				// we can also pass in a scope here to append to
				$thisCarrot.append(prev).append(next);
			};

			/** create the markup for carrotcell 
				add a clipping pane around the content provided
			*/
			var makeCarrotFrame = function(){	
				carrotWidth = $thisCarrot.innerWidth();
				carrotHeight = $thisCarrot.innerHeight();
				clipPane = $('<div/>', { 'class': 'carrotcellClip' }).css("overflow", "hidden");

				if (settings.sideways){
					clipPane.css("width", carrotWidth+"px");
				} else {
					clipPane.css("height", carrotWidth+"px");
				}

				var sliderType = '<div/>';
				var carrotType = $thisCarrot.prop('tagName').toUpperCase();
				var isList = false;

				// is it a list? set the strip type to be what they prefer
				if (carrotType === "UL" || carrotType === "OL"){ 
					isList = true; 
					sliderType = '<'+ carrotType + '/>';
				}

				slider = $(sliderType, { 'class': 'carrotcellStrip' });

				// ok now add the content as list items to our strip
				// var appendSlide = function(){
				// 	$(this).addClass("carrotcellItem").appendTo(slider);
				// };
				// $thisCarrot.children().each(appendSlide);

				items = $thisCarrot.children();
				items.appendTo(slider);

				items.addClass("carrotcellItem").css("display", "block").css("float", "left");
				totalItems = items.length;
				single = items.filter(':first');

				slider.appendTo(clipPane); // add slider to clip pane

				if (isList) {
					var dupeAttributes = getAttributes($thisCarrot);
					var newParent = $('<div/>', dupeAttributes);
					clipPane.appendTo(newParent);
					$thisCarrot.replaceWith(newParent);
					$thisCarrot = newParent;
				}  else {
					$thisCarrot.empty();
					clipPane.appendTo($thisCarrot);
				}

				$thisCarrot.addClass("carrotCell");
			};

			/** change internal settings based on external settings
			*/
			var updateSettings = function(){
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
				if (!settings.controlScope) {
					settings.controlScope = $thisCarrot;
				}
				if (!settings.sideways) {
					scrollAxis = "y";
				}
			};

			/** start building the carrot cell
			*/
			var buildCarrot = function(){

				// is this a touch device?
				if (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch)){
					isTouchDevice = true;
				}

				updateSettings();	// toggle on relevant settings if any
				makeCarrotFrame();	// make the carrotcell markup framework
				makePrevNext();		// create controls
				adjustItemSize();	// make the items fit inside the clippane
				
				findMoves();
				if (moves === 0) { return false; } // got nothing to do

				// handle infinite etc
				// disable prev

				determinePrevNext(0);
		
				prev.addClass(settings.disabledClass);
				prev.click(moveBack).show();
				next.click(moveForward).show();
		
				// setupTouchSupport();
				// setupPauseOnHover();
				// if (settings.navi) { setupNavi(); }
				// if (settings.key) { setupKeyAdvance(); }
				// if (settings.auto) { setupAutoAdvance(); } 
			
			

				// clipPane.scrollLeft(0); // do i need this??
				// clipPane.scrollTop(0);
				
				// if (isTouchDevice) {
				// 	$(window).on('orientationchange', windowOrientationChanged);
				// } else {
				// 	$(window).on('resize', windowResized);
				// }
						
				// IsThereEnoughToScroll(); // check if we have enough to scroll	
				// if (enoughToScroll) {
				// 	setupCarrot();
				// 	handleCarrotEvents();
				// } else {
				// 	debug("can not scroll content, too large or not enough");
				// }
			};

			return {
				init : function(opt) {
					$.extend(settings, opt); // options over ride settings
					$thisCarrot = $(opt.scope);
					buildCarrot();
					if ((typeof settings.carrotDone) == "function") { settings.carrotDone(this); } // callback 
				},

				getName : function(){ return settings.name; },
				
				getPageCount : function(){ return pages; },

				getTotalItems : function() { return totalItems; },

				getSettings : function() { return settings; },

				getOpenSpot : function() { return hasOpenSpot; },

				forward : function() { moveForward(); },

				backward : function() { moveBack(); },

				stop : function() { stopCarrotCell(); },
				
				play : function() { playCarrotCell(); },

				pause : function() { pauseCarrotCell(); },

				updateNavi : function() { updateExistingNavi(); },
				
				moveToPage : function(movePage) {
					movePage = itemRangeFix(movePage);
					if (movePage > pages) { movePage = pages; }
					gotoPage(movePage); // move
				},

				reloadWith : function(newItems) {
					if (!items) { return false; }		
					reloadItems(newItems);
					return pages;
				},
				
				empty : function() {  emptyItems(); },
				
				remove : function(index) {
					index = itemRangeFix(index); 	// fix the range on the index	
					removeItem(index);
					return totalItems;
				},
				
				insert : function(newItem, index) {
					if (!newItem) { return false; } // nothing to insert
					index = itemRangeFix(index); 	// fix the range on the index				
					insertItem(newItem, index);
					afterInsert(index);				
					return totalItems; 				// inserted successfully
				}
			};
		},
		
		/** initialize jcarousel object
		*/
	    init : function(options) { 	

			cell.count++;
			if (!options) { options = {}; } // passed in carrotcell options
			options.scope = $(this); // save this element as the scope
			options.name = "carrot-" + cell.count + "-" + options.scope.attr("id"); 

			if (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch)){
				options.touch = true; // is this touch device?
			}

			// cell.carrots[options.name] = new cell.makeCarrot(); 

			cell.carrots[options.name] = new carrot(); 
			cell.carrots[options.name].init(options);

			options.scope.data('carrotCell', cell.carrots[options.name]); // save carrot as data

			return cell.carrots[options.name]; // return api
		}
	};
	
	/** ---------------------------------------
		add a method to jquery
	*/
	$.fn.carrotCell = function() {

		if ($(this).hasClass("carrotCell")){
			console.log("this already has a carrot cell");
			var data = $(this).data('carrotCell');
			// data.applynewseetings
			// reapply
		} else {
			return cell.init.apply(this, arguments);
		}	   
	};
})(jQuery);