(function($){
	
	var methods = {
		carrots : {},
		
		defaults : {  
		   	test : true
		},
		
		count : 0,
		
		makeCarrot : function(){
			var $this = null,
				settings = {
					next: ".next",
					prev: ".prev",
					step: 1,
					sideways: true,
					infinite: false,
					auto: false
				},
				slideWidth = 0,
				rightMost = false,
				leftMost = true,
				currentPage = 1,
				view, slider, items, single, 
				frameSize, singleSize, viewSize,
				visible, pages, slideBy, prev, next;

			/** scroll the carousel
			*/
			var gotoPage = function(page) {
				var dir = page < currentPage ? -1 : 1,
		            n = Math.abs(currentPage - page),
		            scrollTo = singleSize * dir * visible * n;

				// after the animation scrolls, set the pages appropriately
				var scrollHandler = function(){
					if (page == 0) {
						if (settings.sideways) {
							slider.scrollLeft(singleSize * visible * pages);
						} else {
							slider.scrollTop(singleSize * visible * pages);
						}
						page = pages;
					} else if (page > pages) {
						if (settings.sideways) {
							slider.scrollLeft(singleSize * visible);
						} else {
							slider.scrollTop(singleSize * visible);
						}
						page = 1; // reset back to start position
					}         						                
					currentPage = page;
				};

				// set up the animation

				if (settings.sideways) {
					console.log("scroll sideways");
					view.filter(':not(:animated)').animate({
							scrollLeft : '+=' + scrollTo
					}, 500, scrollHandler);
				} else {
					console.log("scroll top");
					view.filter(':not(:animated)').animate({
							scrollTop : '+=' + scrollTo
					}, 500, scrollHandler);
				}

			};

			/** move carousel back
			*/
			var moveBack = function() {
				console.log("backward " + settings.name + " " + settings.sideways);
				if (!settings.infinite && (currentPage == 1)) {
					return false; // we are at the left most page
				}
				gotoPage(currentPage - 1);
			};

			/** move carousel forward
			*/
			var moveForward = function() {
				console.log("forward " + settings.name + " " + settings.sideways);
				if (!settings.infinite && (currentPage >= pages)) {
					return false; // we are at the right most page
				}
				gotoPage(currentPage + 1);
			};

			/** find elements
			*/
			var setupCarrot = function(){

				
				view = $this.find(".carrotCellView");
				slider = view.find('> ol'); // OR ul if !options.ordered
				items = slider.find('> li'); // OR whatever child element in options
				single = items.filter(':first');
				prev = $this.find(".prev"); // OR selector specified in options
				next = $this.find(".next"); // OR selector specified in options

				if (settings.sideways) {
					viewSize = $this.innerWidth();
					singleSize = single.outerWidth(true);
				} else {
					viewSize = $this.innerHeight();
					singleSize = single.outerHeight(true);
				}

				visible = Math.floor(viewSize / singleSize);
				pages = Math.ceil(items.length / visible);
				slideBy = singleSize * visible;

				if (settings.infinite) {
					// clone a visible amount on the begin and end
					items.filter(':first').before(items.slice(-visible).clone().addClass('cloned'));
					items.filter(':last').after(items.slice(0, visible).clone().addClass('cloned'));
					items = slider.find('> li'); // reselect new li
				}

				var slideSize = singleSize * items.length; // find size of all items

				// set length of slider
				if (settings.sideways) { 
					slider.css("width",  slideSize + "px"); 
				} else {
					slider.css("height",  slideSize + "px"); 
				}
				view.css("overflow", "hidden"); // clip extra items	

				if (settings.infinite) {
					// move clone items out of site
					slider.scrollLeft(singleSize * visible); // move cloned items out of sight
				}
				
				// previous
				prev.bind("click", function(e){
					e.preventDefault();
					console.log(settings.name);
					moveBack();
				}).show();

				// next
				next.bind("click", function(e){
					e.preventDefault();
					console.log(settings.name);
					moveForward();
				}).show();
			};

			return {
				init : function(opt) {
					$.extend(settings, opt);
					$this = $(opt.scope);
					setupCarrot();
				}
			}
		},
		
		/** initialize jcarousel object
		*/
	    init : function( options ) { 	
			
			if ( options ) { 
				 $.extend(options, methods.defaults);
			}
	
			// for each instance of this type of carousel
			return this.each(function(){
				methods.count++;
				
				var opt = options || {};
				opt.scope = this;
				opt.name = $(opt.scope).attr("id") || ("defaultCarrot"+methods.count);
				methods.carrots[opt.name] = new methods.makeCarrot();
				methods.carrots[opt.name].init(opt);
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