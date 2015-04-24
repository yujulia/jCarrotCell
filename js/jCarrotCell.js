/** jCarrotCell
		Julia Yu
		11/17/2011
*/
(function($){
	
	var methods = {
		carrots : {},
		defaults : {},
		count : 0,
		
		makeCarrot : function(){
			var $this = null, // this carrot cell
			
				DEBUG_ON = true, // DEBUG shows console logs
			
				// populate default settings
				settings = {
					step: 0,
					key: false,
					sideways: true,
					infinite: false,
					auto: false,
					speed: 500,
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
					onReload : "carrotReload"
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
			
				// properties of this carrotCell
				slideWidth = 0,				
				haveBack = false,
				haveForward = true,
				
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
			
				api, view, slider, items, single, totalItems,
				frameSize, singleSize, viewSize,
				autoScroll, pause, play, stop, 
				visible, advanceBy, myPage, pages,
				prev, next, navi, nameList, pre, post,
				sliderSelect, sliderChildSelect, prevSelect, nextSelect,
				pauseSelect, playSelect, stopSelect, naviContainer, naviSelect,
				firstOfLastPage, extraOnLastPage, hasOpenSpot;		
			
			/** console.log wrapper for debugging
			*/
			var debug = function(debugString) {
				if (DEBUG_ON) { console.log(debugString); }
			};
			
			/** no animation scroll to reset to beginning or end
			*/
			var scrollToThis = function(scrollBy, pageValue) {
				if (settings.sideways) { 	
					view.scrollLeft(scrollBy); 
				} else {
					view.scrollTop(scrollBy);
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
						view.animate({ scrollLeft : '+=' + moveBy }, settings.speed, scrollToStart);			
					} else { 
						view.animate({ scrollTop : '+=' + moveBy }, settings.speed, scrollToStart);
					}
				} 				
				// scrolling backwards infinite loop
				else if (settings.infinite && (myPage == 0)) {
					settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, pages]);
					scrolling = true;
					var moveby = -1 * extraMoves * singleSize;		
					if (settings.sideways) { 										
						view.animate({ scrollLeft : '+=' + moveby }, settings.speed, scrollToEnd);			
					} else { 
						view.animate({ scrollTop : '+=' + moveby }, settings.speed, scrollToEnd);
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
			var gotoPage = function(page) {			
				if (arguments.length) {  myPage = page;  } else {  return false; }		
				
				var dir = myPage < currentPage ? -1 : 1, // what direction are we going
		            n = Math.abs(currentPage - myPage), // how many pages to scroll
					scrollTo = singleSize * dir * advanceBy * n; // how far in pixels
					
				settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, myPage]);
				scrolling = true;				
				if (settings.sideways) {
					view.filter(':not(:animated)').animate({ scrollLeft : '+=' + scrollTo }, settings.speed, scrollHandler);
				} else {
					view.filter(':not(:animated)').animate({ scrollTop : '+=' + scrollTo }, settings.speed, scrollHandler);
				}
			};

			/** determine if the previous and next buttons should be active based on the next page they will be linking to
			*/
			var determinePrevNext = function(nextPage) {			
				if (settings.infinite) { 
					haveBack = true;
					haveForward = true;					
				} else {
					if ((nextPage <= 1) || (currentPage == 1)) { haveBack = false; } else { haveBack = true; };			
					if (nextPage >= pages) { haveForward = false; } else { haveForward = true; };	
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
					view.filter(':not(:animated)').animate({ scrollLeft : '+=' + singleSize }, settings.speed, scrollByOneHandler);
				} else {
					view.filter(':not(:animated)').animate({ scrollTop : '+=' + singleSize }, settings.speed, scrollByOneHandler);
				}
			};

			/** move carousel back
			*/
			var moveBack = function() {
				if (!settings.infinite && prevDisabled) { return false; } // we are at the left most page or its circular
				var nextPage = currentPage - 1;
				gotoPage(nextPage);
			};

			/** move carousel forward
			*/
			var moveForward = function() {
				if (!settings.infinite && nextDisabled) { return false; } // we are at the right most page	
				var nextPage = currentPage + 1;
				
				// this only happens on insert and scrollOnInsert
				if (moveByOne && !settings.infinite) {
					moveByOne = false;
					if (hasOpenSpot == 0) {
						gotoPage(nextPage);
					} else {
						scrollByOne();
					}
				} else {			
					gotoPage(nextPage);
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
						if (pageNum == 0) { pageNum = pages; } // going backwards to last
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
				processEachNaviNode()			
				handleNaviAutoscroll();			
				handleNaviChanges();		
			};
			
			/** set up clickin on previous and next
				show the buttons as well as bind click handler
			*/
			var setupPrevNextAdvance = function(){
				prev.bind("click", function(e){
					e.preventDefault();
					moveBack();
				}).show();

				next.bind("click", function(e){
					e.preventDefault();
					moveForward();
				}).show();
			};
			
			/** if touchwipe is included add gesture support
			*/
			var setupTouchSupport = function(){
				if(jQuery().touchwipe) {					
					if (settings.sideways) {
						$($this).touchwipe({
						    wipeLeft: function() {  moveForward(); },
						    wipeRight: function() {  moveBack(); },
						    preventDefaultEvents: false
						});
					} else {
						$($this).touchwipe({
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
					view.bind({
						mouseenter : function() { pauseCarrotCell(); },
						mouseleave: function(){ playCarrotCell(); }
					});
				}
			}
			
			/** assign handlers
			*/
			var handleCarrotEvents = function(){	
				setupPrevNextAdvance();
				setupTouchSupport();
				setupPauseOnHover();
				if (settings.navi) { setupNavi(); }
				if (settings.key) { setupKeyAdvance(); }
				if (settings.auto) { setupAutoAdvance(); } 
			};
			
			/** fix the slider so it fits all the items perfectly
			*/
			var adjustSlideSize = function(){				
				var slideSize = singleSize * items.length; // find size of all items including cloned
				if (settings.sideways) { 
					slider.css("width",  slideSize + "px"); // set length of slider
				} else {
					slider.css("height",  slideSize + "px"); // set height of slider
				}
			};
			
			/** find how many pages there are
			*/
			var howManyPages = function(){						
				if ((visible !== advanceBy) && (!settings.auto)) {
					pages = Math.ceil((totalItems - (visible - advanceBy)) / advanceBy);				
				} else {
					pages = Math.ceil(totalItems / advanceBy);																
				}					
				if ((oldPages !== null) && (oldPages !== pages)) {
					settings.controlScope.trigger(settings.pagesChanged, [settings.name, PAGE_COUNT_CHANGED, pages, oldPages]);			
				}
				oldPages = pages; // save this value							
			};
			
			/** find out if we have any weird empty spots in a page
			*/
			var howManyExtraMoves = function(){						
				firstOfLastPage = (pages-1) * advanceBy + 1;
				extraMoves = totalItems - firstOfLastPage + 1;			
				if (extraMoves == 0) {
					extraMoves = visible; 
				}				
				extraOnLastPage = advanceBy - totalItems%advanceBy;
				if (extraOnLastPage == visible ) { extraOnLastPage = 0; } // no extras really							
				hasOpenSpot = extraOnLastPage; // the counter					
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
				adjustSlideSize();
			};
			
			/** move the clones added at the beginning out of sight
			*/
			var moveClonesOutOfSight = function(){
				if (settings.sideways) {
					view.scrollLeft(singleSize * visible);
				} else {
					view.scrollTop(singleSize * visible); 
				}
			};
			
			/** calculate the settings of the carrot
			*/
			var setupCarrot = function(){
				if (settings.auto) { settings.infinite = true;  }			
				if (settings.step) { advanceBy = settings.step; } else { advanceBy = visible; }
				if (settings.makeNavi) { settings.navi = true; }
				
				if (settings.key) {
					if (settings.sideways) {
						settings.keyBack = settings.keyBack || KEY_BACK;
						settings.keyForward = settings.keyForward || KEY_FORWARD;
					} else {
						settings.keyBack = settings.keyBack || KEY_UP;
						settings.keyForward = settings.keyForward || KEY_DOWN;
					}
				}

				howManyPages();
				howManyExtraMoves();

				if (settings.infinite) { padWithClones(); } 				
				adjustSlideSize();				
				view.css("overflow", "hidden"); // clip extra items	(not set in css for non js view)
				
				// reset view scroll back to original if reloading
				if (settings.sideways){				
					view.scrollLeft(0);
				} else {
					view.scrollTop(0);
				}				
				// move clones if infinite				
				if (settings.infinite) {
					moveClonesOutOfSight();	
				} else {
					prev.addClass(settings.disabledClassd);
				}		
				determinePrevNext(0); // hide previous
			};
			
			/** check if content is too short to scroll, add the off class to navigation items
			*/
			var IsThereEnoughToScroll = function(){
				if (totalItems <= visible) {
					prev.addClass(settings.disabledClass);
					next.addClass(settings.disabledClass);				
					if (settings.navi) { naviContainer.addClass(settings.disabledClass); }
					enoughToScroll = false;
				} else {
					if (settings.navi) { naviContainer.removeClass(settings.disabledClass); }
					enoughToScroll = true;
				}
			};
			
			/** find size of view port, need to have access to single to calculate visible
			*/
			var findViewSizeAndVisible = function(){				
				if (settings.sideways) {
					viewSize = $this.innerWidth();
				} else {
					viewSize = $this.innerHeight();
				}			

				visible = Math.floor(viewSize / singleSize); // visible is everything in frame unless a step is set
			}
			
			/** find each slide and make sure we have enough to scroll
				otherwise turn off the controls
			*/
			var findSlides = function(){
				items = slider.children(settings.sliderChildSelect); 
				totalItems = slider.children(settings.sliderChildSelect).filter(":not(." + settings.cloneClass + ")").length;
				single = items.filter(':first');	

				if (settings.sideways) {
					singleSize = single.outerWidth(true);
				} else {
					singleSize = single.outerHeight(true);
				}			
			};
			
			/** find and set scope of carrotcell controls
			*/
			var setControlScope = function(){
				if (settings.containsControl) {
					settings.controlScope = $this; // everything is self contained
				} else {
					if (settings.controlScope != "") {
						settings.controlScope = $(settings.controlScope); // use selector
					} else {
						settings.controlScope = $("body"); // default to document
					}	
				}
			};
			
			/** after control scope is set, find the controls
			*/
			var findControls = function(){
				prev = settings.controlScope.find(settings.prevSelect); 
				next = settings.controlScope.find(settings.nextSelect); 
				pause = settings.controlScope.find(settings.pauseSelect);
				play = settings.controlScope.find(settings.playSelect);
				stop = settings.controlScope.find(settings.stopSelect);
				naviContainer = settings.controlScope.find(settings.naviContainer);
				navi = naviContainer.find(settings.naviSelect);
			};

			/** find elements relevant to the carrot cell
			*/
			var findOutAboutCarrot = function(){
				view = $this.children(".carrotCellView:first");	
				slider = view.children(settings.sliderSelect);  							
				setControlScope();
				findControls();			
				findSlides();	
				findViewSizeAndVisible(); 			
				IsThereEnoughToScroll(); // check if we have enough to scroll				
				if (enoughToScroll) {
					setupCarrot();
					handleCarrotEvents();
				}	
			};
			
			/** something has changed about slides, update calculations
			*/
			var updateSlider = function(){
				findSlides();
				howManyPages();
				howManyExtraMoves();
				if (settings.infinite) { padWithClones(); } 
				adjustSlideSize();
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
			}
			
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

			return {
				init : function(opt) {
					$.extend(settings, opt); // options over ride settings
					$this = $(opt.scope);
					findOutAboutCarrot();
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
				},

				/** set api for internal access for whatever reason
				*/
				setAPI : function(newAPI) {  api = newAPI; }
			}
		},
		
		/** initialize jcarousel object
		*/
	    init : function( options ) { 	
			if ( options ) { $.extend(options, methods.defaults); }
			return this.each(function(){
				methods.count++;
				var opt = options || {};
				opt.scope = this;
				opt.name = $(opt.scope).attr("id") || ("defaultCarrot" + methods.count);
				
				methods.carrots[opt.name] = new methods.makeCarrot();
				methods.carrots[opt.name].init(opt);
				methods.carrots[opt.name].setAPI(methods.carrots[opt.name]);

				// set up the api data to access the object
				var data = $(this).data('carrotCell');
				if (!data) { $(this).data('carrotCell', methods.carrots[opt.name]); }				
			});
		}
	};
	
	/** invoke methods of this plugin  
		send it to the init if appropriate
	*/
	$.fn.carrotCell = function (method) {
		// Method calling logic
	    if ( methods[method] ) {
	      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } else if ( typeof method === 'object' || ! method ) {
	      return methods.init.apply( this, arguments );
	    } else {
	      $.error( 'Method ' +  method + ' does not exist on jCarrotCell' );
	    }
	};
})(jQuery);