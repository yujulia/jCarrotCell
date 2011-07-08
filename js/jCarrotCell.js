(function($){
	
	var methods = {
		carrots : [],
		
		defaults : {  
		   	next: ".next",
			prev: ".prev",
			step: 1,
			dir: "vertical",
			circular: false,
			auto: false
		},
		
	    init : function( options ) { 		
			// add options to over ride defaults, if any
			if ( options ) { 
				$.extend( methods.defaults, options );
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
				currentPos = 0,
				currentPage = 1,
				view, slider, items, single, 
				singleWidth, singleHeight, viewWidth,
				visible, pages, slideBy, prev, next;
				
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
			
				
			var setupCarrot = function(){
				view = $this.find(".carrotCellView");
				slider = view.find('> ol'); // OR ul if !options.ordered
				items = slider.find('> li'); // OR whatever child element in options
				single = items.filter(':first');
				singleWidth = single.outerWidth(true);
				singleHeight = single.outerHeight(true);
				viewWidth = $this.innerWidth();
				visible = Math.floor(viewWidth / singleWidth);
				pages = Math.ceil(items.length / visible);
				slideBy = singleWidth * visible;
				prev = $this.find(".prev"); // OR selector specified in options
				next = $this.find(".next"); // OR selector specified in options
					
				if (options.infinite) {
					// clone a visible amount on the begin and end
					items.filter(':first').before(items.slice(-visible).clone().addClass('cloned'));
					items.filter(':last').after(items.slice(0, visible).clone().addClass('cloned'));
					items = slider.find('> li'); // reselect
				}
					
				slideWidth = singleWidth * items.length; // find real length
				slider.css("width",  slideWidth + "px"); // set length of slider
				view.css("overflow", "hidden"); // clip extra items	
				
				if (options.infinite) {
					view.scrollLeft(singleWidth * visible);
				}
				
				// previous
				prev.bind("click", function(e){
					e.preventDefault();
					gotoPage(currentPage - 1); 
				}).show();
				
				// next
				next.bind("click", function(e){
					e.preventDefault();
					gotoPage(currentPage + 1); 
				}).show();
			}
			
			return {
				init : function(opt) {
					console.log("make carrot init " + opt.name);
					options = opt;
					
					// set up the data
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


