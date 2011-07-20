(function($){
	
	var methods = {
		carrots : [],
		
		defaults : {  
		   	next: ".next",
			prev: ".prev",
			step: 1,
			sideways: true,
			infinite: false,
			auto: false
		},
		
	    init : function( options ) { 		
			// add options to over ride defaults, if any
			if ( options ) { 
				$.extend( methods.defaults, options );
			} else {
				options = methods.defaults;
			}

			// for each instance of this type of carousel
			return this.each(function(){
				options.scope = this;
				options.name = $(options.scope).attr("id") || "defaultCarrot";
			
				var thisCarrot = new methods.makeCarrot();
				thisCarrot.init(options);
				methods.carrots.push(thisCarrot);
			});
		},
		
		/* make a carrot, make it celery
		*/
		makeCarrot : function() {
			var $this = null,
				options = {},
				slideWidth = 0,
				rightMost = false,
				leftMost = true,
				currentPage = 1,
				view, slider, items, single, 
				singleWidth, singleHeight, viewWidth, viewHeight, viewSize,
				visible, pages, slideBy, prev, next;
			
			/** scroll the carousel
			*/
			var gotoPage = function(page) {
				var dir = page < currentPage ? -1 : 1,
	                n = Math.abs(currentPage - page),
	                left = singleWidth * dir * visible * n;

	            view.filter(':not(:animated)').animate({
	                scrollLeft : '+=' + left
	            }, 500, function () {
	                if (page == 0) {
	                    view.scrollLeft(singleWidth * visible * pages);
	                    page = pages;
	                } else if (page > pages) {
	                    view.scrollLeft(singleWidth * visible);
	                    // reset back to start position
	                    page = 1;
	                } 

	                currentPage = page;
	            });                
			};
			
			/** move carousel back
			*/
			var moveBack = function() {
				if (!options.infinite && (currentPage == 1)) {
					return false; // we are at the left most page
				}
				gotoPage(currentPage - 1);
			};
			
			/** move carousel forward
			*/
			var moveForward = function() {
				if (!options.infinite && (currentPage >= pages)) {
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
				
				singleWidth = single.outerWidth(true);
				singleHeight = single.outerHeight(true);
				
				if (sideways) {
					viewSize = $this.innerWidth();
				} else {
					viewSize = $this.innerHeight();
				}

				visible = Math.floor(viewWidth / singleWidth);
				pages = Math.ceil(items.length / visible);
				slideBy = singleWidth * visible;
				
				if (options.infinite) {
					// clone a visible amount on the begin and end
					items.filter(':first').before(items.slice(-visible).clone().addClass('cloned'));
					items.filter(':last').after(items.slice(0, visible).clone().addClass('cloned'));
					items = slider.find('> li'); // reselect new li
				}
				
				slideWidth = singleWidth * items.length; // find real length
				slider.css("width",  slideWidth + "px"); // set length of slider
				view.css("overflow", "hidden"); // clip extra items	
				$this.css("height", singleHeight); // set height of external wrap
				
				if (options.infinite) {
					// move clone items out of site
					view.scrollLeft(singleWidth * visible); // move cloned items out of sight
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
			}
			
			return {
				init : function(opt) {
					//console.log("make carrot init " + opt.name);
					options = opt;
					$this = $(options.scope);
					var data = $this.data('carrotCell');
					if (!data) {
						$(this).data('carrotCell', {
							target : $this,
							options: opt
						});
					}
					setupCarrot();
				}
			}
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


