(function($){
	
	var methods = {
		carrots : {},
		defaults : {},
		count : 0,
		
		makeCarrot : function(){
			var $this = null,
				settings = {
					next: ".next",
					prev: ".prev",
					step: 0,
					sideways: true,
					infinite: false,
					auto: false,
					speed: 500,
					off: "disabled",
					auto: false, 
					delay: 5000 // ms
				},
				slideWidth = 0,
				haveBack = false,
				haveForward = true,
				currentPage = 1,
				paused = false,
				view, slider, items, single, totalItems, extras,
				frameSize, singleSize, viewSize,
				autoScroll, pause, play, stop, 
				visible, advanceBy, pages, slideBy, prev, next;
				
			/** helper for concat string
			*/
			var repeat = function(str, num) {
				return new Array( num + 1 ).join( str );
			}

			/** scroll the carousel
			*/
			var gotoPage = function(page) {
				var dir = page < currentPage ? -1 : 1,
		            n = Math.abs(currentPage - page),
					scrollTo = singleSize * dir * advanceBy * n;
				// after the animation scrolls, set the pages appropriately
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
				};
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
				autoScroll = this.setInterval(function(){
					if (!paused) {
						moveForward();
					}
				}, settings.delay);
			};
			
			/** auto advance the rotator
			*/
			var setupAutoAdvance = function(){
				play.hide();
				pause.bind("click", function(e){
					e.preventDefault();
					paused = true;
					pause.hide();
					play.show();
				});
				play.bind("click", function(e){
					e.preventDefault();
					
					if (paused) {
						paused = false;
					} else {
						goScroll();
					}
					play.hide();
					pause.show();
				});
				stop.bind("click", function(e){
					e.preventDefault();
					window.clearInterval(autoScroll);
					play.show();
					pause.hide();
				});
				goScroll();
			}

			/** find elements
			*/
			var setupCarrot = function(){
				view = $this.find(".carrotCellView");
				slider = view.find('> ol'); // OR ul if !options.ordered
				items = slider.find('> li'); // OR whatever child element in options
				single = items.filter(':first');
				prev = $this.find(".prev"); // OR selector specified in options
				next = $this.find(".next"); // OR selector specified in options
				pause = $this.find(".pause");
				play = $this.find(".play");
				stop = $this.find(".stop");
				totalItems = items.length;
				
				if (settings.auto) {
					settings.infinite = true; // if auto infinite hast o be true
				}

				if (settings.sideways) {
					viewSize = $this.innerWidth();
					singleSize = single.outerWidth(true);
				} else {
					viewSize = $this.innerHeight();
					singleSize = single.outerHeight(true);
				}
				
				// visible is everything in frame unless a step is set
				visible = Math.floor(viewSize / singleSize);
				
				if (settings.step) {
					advanceBy = settings.step;
				} else {
					advanceBy = visible;
				}
				
				pages = Math.ceil(totalItems / advanceBy);
				slideBy = singleSize * advanceBy;
				
				if ((totalItems % visible) != 0) {
					extras = visible * Math.ceil(totalItems / visible) - totalItems;
				} else {
					extras = 0;
				}
				
				if (settings.infinite) {
					// add empty elements
					if (settings.pad) {
						var hasExtra = totalItems % visible
						if (hasExtra != 0) {
							slider.append(repeat('<li class="empty" />', visible - (totalItems % visible)));
							items = slider.find('> li');
						}
					}
					// clone a visible amount on the begin and end
					items.filter(':first').before(items.slice(-visible).clone().addClass('cloned'));
					items.filter(':last').after(items.slice(0, visible).clone().addClass('cloned'));
					items = slider.find('> li'); // reselect new li
				} else {
					prev.addClass(settings.off);
				}
				var slideSize = singleSize * items.length; // find size of all items including cloned

				// set length of slider
				if (settings.sideways) { 
					slider.css("width",  slideSize + "px"); 
				} else {
					slider.css("height",  slideSize + "px"); 
				}
				
				view.css("overflow", "hidden"); // clip extra items	

				// move clone items out of site
				if (settings.infinite) {
					if (settings.sideways) {
						view.scrollLeft(singleSize * visible); 
					} else {
						view.scrollTop(singleSize * visible); 
					}
				}
				
				// previous
				prev.bind("click", function(e){
					e.preventDefault();
					moveBack();
				}).show();

				// next
				next.bind("click", function(e){
					e.preventDefault();
					moveForward();
				}).show();
				
				// auto				
				if (settings.auto) {
					setupAutoAdvance();
				}
			};

			return {
				init : function(opt) {
					$.extend(settings, opt); // options over ride settings
					$this = $(opt.scope);
					setupCarrot();
				},
				move : function() {
					console.log(settings.name + " move");
					moveForward();
				}
			}
		},
		
		/** initialize jcarousel object
		*/
	    init : function( options ) { 	
			if ( options ) { 
				 $.extend(options, methods.defaults);
			}
			return this.each(function(){
				methods.count++;
				var opt = options || {};
				opt.scope = this;
				opt.name = $(opt.scope).attr("id") || ("defaultCarrot"+methods.count);
				methods.carrots[opt.name] = new methods.makeCarrot();
				methods.carrots[opt.name].init(opt);
				
				// set up the data to access the object
				var data = $(this).data('carrotCell');
				if (!data) {
					$(this).data('carrotCell', methods.carrots[opt.name]);
				}
				
			});
		}
	};
	
	/** plugin function
	*/
	$.fn.carrotCell = function (method) {
		// Method calling logic
	    if ( methods[method] ) {
	      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } else if ( typeof method === 'object' || ! method ) {
	      return methods.init.apply( this, arguments );
	    } else {
	      $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
	    }
	};
})(jQuery);