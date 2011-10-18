(function($){
	
	var methods = {
		carrots : {},
		defaults : {},
		count : 0,
		
		makeCarrot : function(){
			var $this = null,
			
				// populate default settings
				settings = {
					step: 0,
					key: false,
					sideways: true,
					infinite: false,
					auto: false,
					speed: 1000,
					navi: false,
					delay: 5000,
					off: "disabled",
					unseen: "invisible",
					current: "current",
					
					sliderSelect : "ol",
					sliderChildSelect : "li",
					
					prevSelect : ".prev",
					nextSelect : ".next",
					pauseSelect :  ".pause",
					playSelect : ".play",
					stopSelect : ".stop",
					naviSelect : ".navi > *",
					
					containsControl : true,
					controlScope : ""
				},
				
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
				view, slider, items, single, totalItems, extras,
				frameSize, singleSize, viewSize,
				autoScroll, pause, play, stop, 
				visible, advanceBy, pages, slideBy, prev, next, navi,
				sliderSelect, sliderChildSelect, prevSelect, nextSelect,
				pauseSelect, playSelect, stopSelect, naviSelect;
				
			/** scroll the carousel
			*/
			var gotoPage = function(page) {
				var dir = page < currentPage ? -1 : 1,
		            n = Math.abs(currentPage - page),
					scrollTo = singleSize * dir * advanceBy * n;
				// after the animation scrolls, set the pages appropriately
				
				// if there is an navi on auto advance the navi
				if (settings.navi && settings.auto) {
					var thisNavi = page;
					if (page > pages) { thisNavi = 1; } // rewind
					thisNavi--;
					navi.removeClass(settings.current);
					$(navi[thisNavi]).addClass(settings.current);
				}
				
				var thisPage = currentPage;
				if (dir < 0) {
					thisPage--;
				} else {
					thisPage++;
				}
				currentItem = advanceBy * thisPage + dir;

				var scrollHandler = function(){
					var scrollThis = 0;
					if (page == 0) {
						scrollThis = singleSize * advanceBy * pages + extras * singleSize;
						// weird hack
						if (visible == advanceBy ) {
							scrollThis = singleSize * advanceBy * pages - extras * singleSize;
						}			
						if (settings.sideways) {					
							view.scrollLeft(scrollThis);	
						} else {
							view.scrollTop(scrollThis);
						}
						page = pages;
					} else if (page > pages) {
						scrollThis = singleSize * visible;
						if (settings.sideways) {
							view.scrollLeft(scrollThis);
						} else {
							view.scrollTop(scrollThis);
						}
						page = 1; // reset back to start position
					}         						                
					currentPage = page;
					scrolling = false;
				};
				
				scrolling = true;
				
				// set up the animation
				if (settings.sideways) {
					view.filter(':not(:animated)').animate({
							scrollLeft : '+=' + scrollTo
					}, settings.speed, scrollHandler);
				} else {
					view.filter(':not(:animated)').animate({
							scrollTop : '+=' + scrollTo
					}, settings.speed, scrollHandler);
				}
			};
			
			/** determine the prev and next
			*/
			var moveNext = function(nextPage) {
				if (settings.infinite) {
					return false; // do nothing if its infinite
				}
				if (nextPage <= 1) {
					haveBack = false;
				} else {
					haveBack = true;
				};
				if (nextPage >= pages) {
					haveForward = false;
				} else {
					haveForward = true;
				};
				if (haveBack) {
					prev.removeClass(settings.off);
				} else {
					prev.addClass(settings.off);
				}
				if (haveForward) {
					next.removeClass(settings.off);
				} else {
					next.addClass(settings.off);
				}
			};

			/** move carousel back
			*/
			var moveBack = function() {
				if (!settings.infinite && (currentPage == 1)) {
					return false; // we are at the left most page
				}
				gotoPage(currentPage - 1);
				var nextPage = currentPage - 1;
				moveNext(nextPage);
			};

			/** move carousel forward
			*/
			var moveForward = function() {
				if (!settings.infinite && (currentPage >= pages)) {
					return false; // we are at the right most page
				}
				gotoPage(currentPage + 1);
				var nextPage = currentPage + 1;
				moveNext(nextPage);
			};
			
			/** set up the interval
			*/
			var goScroll = function(){
				window.clearInterval(autoScroll);
				autoScroll = this.setInterval(function(){ if (!paused) { moveForward(); } }, settings.delay);
			};
			
			/** pause the auto play
			*/
			var pauseCell = function() {
				paused = true;
				playing = false;
				stopped = false;
				pause.addClass(settings.unseen);
				play.removeClass(settings.unseen);
				stop.removeClass(settings.unseen);
			};
			
			/** resume the auto play
			*/
			var playCell = function() {
				paused = false;
				stopped = false;
				playing = true;
				play.addClass(settings.unseen);
				stop.removeClass(settings.unseen);
				pause.removeClass(settings.unseen);
				goScroll();
			};
			
			/** resume the auto play
			*/
			var stopCell = function() {
				paused = false;
				stopped = true;
				playing = false;
				stop.addClass(settings.unseen);
				play.removeClass(settings.unseen);
				pause.removeClass(settings.unseen);
				window.clearInterval(autoScroll);
			};
			
			/** set up the controls if any, then auto scroll
			*/
			var setupAutoAdvance = function(){
				pause.bind("click", function(e){
					e.preventDefault();
					pauseCell();
				});
				play.bind("click", function(e){
					e.preventDefault();
					playCell();
				});
				stop.bind("click", function(e){
					e.preventDefault();
					stopCell();
				});
				playCell();
			};

			/** up down for vertical, left right for horizonal
			*/
			var setupKeyAdvance = function() {
				$(document).keydown(function(e){
					if (scrolling) { return false; }
					if (settings.sideways) { 
				    	if (e.keyCode == 37) { moveBack(); } // left
						if (e.keyCode == 39) { moveForward(); } // right
					} else {
						if (e.keyCode == 38) {  moveBack(); } // up
						if (e.keyCode == 40) {  moveForward(); } // down
					}
					return false;
				});
			};
			
			/** set up navigation, only works on pages
			*/
			var setupNavi = function() {
				$(navi).first().addClass(settings.current);
				navi.each(function(iNav){
					var thisNavi = this;
					var navIndex = iNav + 1;
					$(thisNavi).bind("click", function(){
						$(this).siblings().removeClass(settings.current);
						$(this).addClass(settings.current);
						
						if (scrolling) { return false; }
						if (navIndex <= pages) {
							gotoPage(navIndex);
							moveNext(navIndex);
						}
					});
				});
			};
			
			/** assign handlers
			*/
			var assignCarrot = function(){
				prev.bind("click", function(e){
					e.preventDefault();
					moveBack();
				}).show();

				next.bind("click", function(e){
					e.preventDefault();
					moveForward();
				}).show();
				
				if (settings.navi) { setupNavi(); }
				if (settings.key) { setupKeyAdvance(); }
				if (settings.auto) { setupAutoAdvance(); } 
			};
			
			var adjustSlideSize = function(){
				var slideSize = singleSize * items.length; // find size of all items including cloned
				// set length of slider
				if (settings.sideways) { 
					slider.css("width",  slideSize + "px"); 
				} else {
					slider.css("height",  slideSize + "px"); 
				}
			};
			
			var findPages = function(){
				pages = Math.ceil(totalItems / advanceBy);
				if ((totalItems % visible) != 0) {
					extras = visible * Math.ceil(totalItems / visible) - totalItems;
				} else {
					extras = 0;
				}
			};
			
			/** check if content is too short
			*/
			var testSize = function(){
				// not  enough content to scroll
				if (totalItems <= visible) {
					prev.addClass(settings.off);
					next.addClass(settings.off);
				}	
			};

			var findViewsize = function(){
				if (settings.sideways) {
					viewSize = $this.innerWidth();
					singleSize = single.outerWidth(true);
				} else {
					viewSize = $this.innerHeight();
					singleSize = single.outerHeight(true);
				}

				// visible is everything in frame unless a step is set
				visible = Math.floor(viewSize / singleSize);
			}
			
			/** calculate the settings of the carrot
			*/
			var processCarrot = function(){
				if (settings.auto) { settings.infinite = true;  } // if auto infinite hast o be true
				findViewsize();
				if (settings.step) {
					advanceBy = settings.step;
				} else {
					advanceBy = visible;
				}
				findPages();
				slideBy = singleSize * advanceBy;
				if (settings.infinite) {
					// clone a visible amount on the begin and end
					items.filter(':first').before(items.slice(-visible).clone().addClass('cloned'));
					items.filter(':last').after(items.slice(0, visible).clone().addClass('cloned'));
					items = slider.find('> ' + settings.sliderChildSelect); // reselect new li
				} else {
					prev.addClass(settings.off);
				}
				adjustSlideSize();
				view.css("overflow", "hidden"); // clip extra items	
				// move clone items out of sight
				if (settings.infinite) {
					if (settings.sideways) {
						view.scrollLeft(singleSize * visible); 
					} else {
						view.scrollTop(singleSize * visible); 
					}
				}
			};
			
			/** find child elements of slider
			*/
			var findItems = function(){
				items = slider.find('> ' + settings.sliderChildSelect); 
				totalItems = items.length;
				single = items.filter(':first');
				testSize();
			};

			/** find elements
			*/
			var findCarrot = function(){
				view = $this.find(".carrotCellView");
				slider = view.find('> ' + settings.sliderSelect + ":first"); 
				findItems();
				
				if (settings.containsControl) {
					settings.controlScope = $this; // everything is self contained
				} else {
					if (settings.controlScope != "") {
						settings.controlScope = $(settings.controlScope); // use selector
					} else {
						settings.controlScope = $("body"); // default to document
					}	
				}
				
				prev = settings.controlScope.find(settings.prevSelect); 
				next = settings.controlScope.find(settings.nextSelect); 
				pause = settings.controlScope.find(settings.pauseSelect);
				play = settings.controlScope.find(settings.playSelect);
				stop = settings.controlScope.find(settings.stopSelect);
				navi = settings.controlScope.find(settings.naviSelect);
				
				processCarrot();
				assignCarrot();
				testSize();
			};

			return {
				/** initialize this carrot instance
				*/
				init : function(opt) {
					$.extend(settings, opt); // options over ride settings
					$this = $(opt.scope);
					findCarrot();
			
					// call done callback pass it the api
					if ((typeof settings.carrotDone) == "function") {
						settings.carrotDone(this);
					}
				},
				
				/** find out which carrot
				*/
				whichCarrot : function(){
					console.log("hi this is carrotCell " + settings.name);
				},
				
				/** move to the page passed in if its a number
				*/
				move : function(movePage) {
					movePage = parseInt(movePage);
					if (isNaN(movePage)) { return false; }
					if (!movePage) { movePage = currentPage + 1; } // move 1 forward by default
					if (settings.infinite) {
						if (movePage < 1) { movePage = pages; } // circular check
						if (movePage > pages) { movePage = 1; } // circular check
					} else {
						if (movePage < 1) { movePage = 1; } // range check
						if (movePage > pages) { movePage = pages; } // range check
					}
					gotoPage(movePage); // move
				},

				advance : function() { moveForward(); },
				
				rewind : function() { moveBack(); },

				stop : function() { stopCell() },
				
				play : function() { playCell() },
				
				pause : function() { pauseCell() },
				
				empty : function() { $(items).remove(); },
				
				/** remove an item from the carousel (by index)
					index starts at 1, if no index, remove last
				*/
				remove : function(index) {
					index = parseInt(index);
					if (isNaN(index)) { index = items.length; }
					if (index < 1 ) { index = 1; } // range check
					if (index > items.length ) { index = items.length; } // range check
					$(items[index-1]).remove();
					findItems();
					findPages();
					adjustSlideSize();
				},
				
				/** add a new item to the carousel (at index or at end)
				*/
				insert : function(newItem, index) {
					if (!newItem) { return false; }
					index = parseInt(index);
					if (isNaN(index)) { index = items.length; }
					if (index < 1 ) { index = 1; } // range check
					if (index > items.length ) { index = items.length; } // rang check
					
					// calculate size on append?
					if (index == items.length) {
						slider.append(newItem); // append at end
					} else if (index <= 1){
						$(settings.sliderChildSelect + ':first', slider).before(newItem); // append at start
					} else {
						$(settings.sliderChildSelect, slider).eq(index-1).before(newItem); // insert at index
					}
					
					findItems();
					findPages();
					adjustSlideSize();
				},

				/** add a bunch of new item to the carousel
				*/
				load : function(newItems) {
					if (!items) { return false; }		
					$(items).remove(); 
					slider.append(newItems); // append at end
					findItems();
					findPages();
					adjustSlideSize();
				}
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
				
				// set up the api data to access the object
				var data = $(this).data('carrotCell');
				if (!data) {
					$(this).data('carrotCell', methods.carrots[opt.name]);
				}
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