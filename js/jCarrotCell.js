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
					disabledClass: "disabled",
					currentClass: "current",
					cloneClass: "clone",
					sliderSelect : "ol",
					sliderChildSelect : "li",
					prevSelect : ".prev",
					nextSelect : ".next",
					pauseSelect :  ".pause",
					playSelect : ".play",
					stopSelect : ".stop",
					naviContainer : ".navi",
					naviSelect : "> *",
					naviClass : "naviItem",
					scrollStart : "carrotScrollStart",
					scrollEnd : "carrotScrollEnd",
					atStart : "carrotAtStart",
					atEnd : "carrotAtEnd",
					onPlay : "carrotPlay",
					onPause : "carrotPause",
					onStop : "carrotStop"
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
				visibleDifference = 0,
				extraMoves = 0,
				enoughToScroll = false,
			
				api, view, slider, items, single, totalItems,
				frameSize, singleSize, viewSize,
				autoScroll, pause, play, stop, 
				visible, advanceBy, myPage, pages, realPages,
				prev, next, navi,
				sliderSelect, sliderChildSelect, prevSelect, nextSelect,
				pauseSelect, playSelect, stopSelect, naviContainer, naviSelect;
				
			
			/** scroll back to the very beginning
			*/
			var scrollToStart = function(){
				view.scrollLeft(singleSize * visible); // move back to beginning
				myPage = 1;
				currentPage = 1;
				scrolling = false;
				settings.controlScope.trigger(settings.scrollEnd, [settings.name, SCROLL_END, myPage]);
			};
			
			/** scroll to the very end 
			*/
			var scrollToEnd = function(){
				var scrollBy = 	singleSize * advanceBy * (pages-1) + singleSize;
				view.scrollLeft(scrollBy);	
				myPage = pages;
				currentPage = pages;
				scrolling = false;			
				settings.controlScope.trigger(settings.scrollEnd, [settings.name, SCROLL_END, myPage]);
			};
			
			/** this is called when go to page finishes scrolling
			*/
			var scrollHandler = function(){
				var scrollThis = 0;

				// some additional forward scrolling needs to happen
				if (myPage > pages) {
					settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, 0]);
					// console.log("scroll handler > pages scroll start");
					scrolling = true;
					
					var moveBy = visible - extraMoves;				
					if (settings.sideways) { 										
						view.animate({ scrollLeft : '+=' + moveBy * singleSize }, settings.speed, scrollToStart);			
					} else { 
						view.animate({ scrollTop : '+=' + moveBy * singleSize }, settings.speed, scrollToStart);
					}
				} 
				
				// some additional backward scrolling needs to happen
				else if (myPage == 0) {
					settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, pages-1]);
					// console.log("scroll handler 0 pages scroll start");
					scrolling = true;
		
					if (settings.sideways) { 										
						view.animate({ scrollLeft : '+=' + -1 * extraMoves * singleSize }, settings.speed, scrollToEnd);			
					} else { 
						view.animate({ scrollTop : '+=' + -1 * extraMoves * singleSize }, settings.speed, scrollToEnd);
					}					
				}
				
				// we are done with our scrolling, no additional things need doing
				else {			
					currentPage = myPage; // my page is set in gotoPage previously
					scrolling = false;
					settings.controlScope.trigger(settings.scrollEnd, [settings.name, SCROLL_END, myPage-1]);
				}

			};
				
			/** scroll the carousel by advancing to the next page
			*/
			var gotoPage = function(page) {			
				if (arguments.length) { 							
					myPage = page; 
				} else { 
					myPage = currentPage; // should this be currentPage+1 ???
				}				
				
				// should do bounds check for non infinite
				
				var dir = myPage < currentPage ? -1 : 1, // what direction are we going
		            n = Math.abs(currentPage - myPage), // how many pages to scroll
					scrollTo = singleSize * dir * advanceBy * n; // how far in pixels
					
				// console.log("my direction is " + dir + " my page is " + myPage + " scrolling to " + scrollTo);		
				// broadcast event that carousel is moving as we start the animation
				settings.controlScope.trigger(settings.scrollStart, [settings.name, SCROLL_START, myPage-1]);
				// console.log("scroll handler normal scroll start");
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
				if (settings.infinite) { return false; } // do nothing if its infinite								
				if (nextPage <= 1) { haveBack = false; } else { haveBack = true; };
				if (nextPage >= pages) { haveForward = false; } else { haveForward = true; };								
				if (haveBack) { 
					prev.removeClass(settings.disabledClass); 
				} else { 
					prev.addClass(settings.disabledClass); 
					settings.controlScope.trigger(settings.atStart, [settings.name, AT_START]);
				}
				if (haveForward) { 
					next.removeClass(settings.disabledClass); 
				} else { 
					next.addClass(settings.disabledClass); 
					settings.controlScope.trigger(settings.atEnd, [settings.name, AT_END]);
				}
			};

			/** move carousel back
			*/
			var moveBack = function() {
				if (!settings.infinite && (currentPage == 1)) { return false; } // we are at the left most page or its circular
				var nextPage = currentPage - 1;
				gotoPage(nextPage);
				determinePrevNext(nextPage);
			};

			/** move carousel forward
			*/
			var moveForward = function() {
				if (!settings.infinite && (currentPage >= pages)) { return false; } // we are at the right most page				
				var nextPage = currentPage + 1;
				gotoPage(nextPage);
				determinePrevNext(nextPage);
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
			
			/** auto create navi 
			*/
			var creatNavi = function(){
				$(naviContainer).empty(); // clear the navi container
				var itemNames = {};
				for (var j = 1; j <= pages; j++) { itemNames[j] = j; }

				var nameList = $(naviContainer).data("navi");
				
				if ((nameList !== null) && (nameList !== undefined) && (nameList.length !== 0) ) {					
					$(nameList).each(function(n){
						itemNames[n+1] = nameList[n]; // add the names into item names if they exist
					});								
				} 
				
				var pre = '<div class="' + settings.naviClass +'">'; // default is div
				var post = '</div>';
				if ($(naviContainer).is("ul") || $(naviContainer).is("ol")) {
					pre = '<li class="' + settings.naviClass +'">';
					post = '</li>';				
				} 
				for (var i = 1; i <= pages; i++) {
					$(naviContainer).append(pre + itemNames[i] + post);
				}			
				navi = $(naviContainer).find("> *"); // find all the things we just added
			};
			
			/** subscribe to scrolling and make sure it is our thing that's moving
			*/
			var handleNaviAutoscroll = function() {
				settings.controlScope.bind(settings.scrollStart, function(e, movingThing, eventName, pageNum) {		
						
					if ((movingThing == settings.name) && (eventName == SCROLL_START)) {					
						$(navi).removeClass(settings.currentClass);

						// console.log("navi passed in page num is " + pageNum);
						if (pageNum > pages) { pageNum = 1; } // rewind to beginning
						if (pageNum == pages) { pageNum = 0; } // rewind opposit
						// console.log("navi auto advancing to " + pageNum);
						
						var thisNavi = $(navi)[parseInt(pageNum)];
						$(thisNavi).addClass(settings.currentClass);
					}
					
				});
			};
			
			/** set up navigation, only works on pages
			*/
			var setupNavi = function() {			
				if (settings.makeNavi) { creatNavi(); }				
				$(navi).first().addClass(settings.currentClass);
				navi.each(function(iNav){
					var thisNavi = this; // an item of this nav
					var navIndex = iNav + 1;
					$(thisNavi).bind("click", function(){
						if (playing && settings.stopOnClick) {  stopCarrotCell(); }
						if (scrolling) { return false; } // no queue ups on rapid clicking
						
						$(this).siblings().removeClass(settings.currentClass);
						$(this).addClass(settings.currentClass);
						if ((navIndex <= pages) && (navIndex > 0)) {
							gotoPage(navIndex);
							determinePrevNext(navIndex);
						}
					});
				});					
				handleNaviAutoscroll();					
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
						    wipeRight: function() {  moveBack(); }
						});
					} else {
						$($this).touchwipe({
						    wipeDown: function() {  moveForward(); },
						    wipeUp: function() {  moveBack(); }
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
				// console.log(pages + " pages");									
			};
			
			/** find out if we have any weird empty spots in a page
			*/
			var howManyExtraMoves = function(){	
				if (advanceBy == visible) {
					extraMoves = 0; // no worries
				} else {
					var lastPageStartingNum = (pages-1) * advanceBy + 1;
					// console.log("first item of last page set is " + lastPageStartingNum);
					
					extraMoves = totalItems - lastPageStartingNum + 1;			
					if (extraMoves == 0) {
						extraMoves = visible; 
					}
				}
				
			};
			
			/** clone a slider worth of clones at beginning and end
			*/
			var padWithClones = function(){
				items.filter(':first').before(items.slice(-visible).clone().addClass(settings.cloneClass));
				items.filter(':last').after(items.slice(0, visible).clone().addClass(settings.cloneClass));
				items = slider.children(settings.sliderChildSelect); // reselect everything including clones
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

				if (settings.infinite) {		
					padWithClones();						
				} 				
				adjustSlideSize();				
				view.css("overflow", "hidden"); // clip extra items	(not set in css for non js view)				
				if (settings.infinite) {
					moveClonesOutOfSight();	
				} else {
					prev.addClass(settings.disabledClassd);
				}
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
				totalItems = items.length;
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
				if (visible > settings.step) { visibleDifference = visible - settings.step; } 
				
				IsThereEnoughToScroll(); // check if we have enough to scroll				
				if (enoughToScroll) {
					setupCarrot();
					handleCarrotEvents();
				}	
			};

			return {
				/** initialize this carrot instance
				*/
				init : function(opt) {
					$.extend(settings, opt); // options over ride settings
					$this = $(opt.scope);
					findOutAboutCarrot();
					// call done callback pass it the api
					if ((typeof settings.carrotDone) == "function") { settings.carrotDone(this); }
				},
				
				/** find out this carrot instance's name
				*/
				whichCarrot : function(){ return settings.name; },
				
				/** find out how many pages this carrot has
				*/
				getPageCount : function(){ return pages; },
				
				/** move to the page passed in if its a number in range
				*/
				moveToPage : function(movePage) {
					movePage = parseInt(movePage);
					if (isNaN(movePage)) {  return false; }		
					if (movePage < 1) { movePage = 1; }
					if (movePage > pages) { movePage = pages; }
					gotoPage(movePage); // move
				},
				
				/** move forward by one
				*/
				advance : function() { moveForward(); },
				
				/** move backward by one
				*/
				rewind : function() { moveBack(); },

				/** stop auto
				*/
				stop : function() { stopCarrotCell() },
				
				/** resume auto play
				*/
				play : function() { playCarrotCell() },
				
				/** pause auto play
				*/
				pause : function() { pauseCarrotCell() },
				
				/** remove all carrot items
				*/
				empty : function() { $(items).remove(); },
				
				/** remove an item from the carousel (by index)
					index starts at 1, if no index, remove last
				*/
				remove : function(index) {
					index = parseInt(index);
					if (isNaN(index)) { index = items.length; } // nothing passed, default to last
					if ((index > items.length ) ||  (index < 1 )) {  return false; } // out of range position to remove do nothing
					
					$(items[index-1]).remove();
					findSlides();
					howManyPages();
					adjustSlideSize();
				},
				
				/** add a new item to the carousel (at index or at end)
				*/
				insert : function(newItem, index) {
					if (!newItem) { return false; }
					index = parseInt(index);
					if (isNaN(index)) { index = items.length; } // if no index add at end 		
					if (index < 1 ) { index = 1; } // range reset if for some reason its negative...					
					if (index > items.length ) { index = items.length; } // rang check
					
					// if auto
					if (settings.infinite || settings.auto) {
						
					} else {
						// a normal insert
						if (index == items.length) {
							slider.append(newItem); // append at end
						} else if (index == 1){
							$(settings.sliderChildSelect + ':first', slider).before(newItem); // append at start
						} else {
							$(settings.sliderChildSelect, slider).eq(index-1).before(newItem); // insert at index
						}					
						findSlides();
						setupCarrot();
					//	determinePrevNext(); // ??? basically this needs to reset next
					}
						
					return index; // return the position we inserted at
				},

				/** load an entire new set of slides
				*/
				reloadWith : function(newItems) {
					if (!items) { return false; }		
					$(items).remove(); 
					slider.append(newItems); // append at end
					findSlides();
					howManyPages();
					adjustSlideSize();
					gotoPage(1); // rewind to beginning on load
					currentPage = 1;
					determinePrevNext();
				},
				
				/** set api for internal access for whatever reason
				*/
				setAPI : function(newAPI) { api = newAPI; }
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
				opt.name = $(opt.scope).attr("id") || ("defaultCarrot"+methods.count);
				
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