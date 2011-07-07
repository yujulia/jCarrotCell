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
				options = {};
				
			
			var setupCarrot = function(){
			
				var slider = $this.find('> ol'),
					items = slider.find('> li'),
					single = items.filter(':first'),
					singleWidth = single.outerWidth(true),
					singleHeight = single.outerHeight(true),
					allWidth = $this.innerWidth(),
					visible = Math.floor(allWidth / singleWidth),
					currentPage = 1,
					pages = Math.ceil(items.length / visible),
					slideBy = singleWidth * visible;
					
				var slideWidth = 0;
				var rightMost = false;
				var leftMost = true;
				
				if (options.circular) {
					slideWidth = singleWidth * items.length + visible * 2 * singleWidth;
				} else {
					slideWidth = singleWidth * items.length;
				}

				$this.css("overflow", "hidden"); // clip extra items
				slider.css("width",  slideWidth + "px"); // set length of slider
					
				// clone a visible amount on the begin and end
				 // items.filter(':first').before(items.slice(-visible).clone().addClass('cloned'));
				 // 			items.filter(':last').after(items.slice(0, visible).clone().addClass('cloned'));
				 // 			items = slider.find('> li'); // reselect

				$this.css("height", singleHeight+"px"); // set container height according to element
				
				var currentPos = 0;
				//var currentPos = -1 * slideBy;
				//slider.css("left", currentPos +"px"); // hide cloned first items
				
				$this.find(".prev").bind("click", function(){
					if (currentPos == 0) {
						leftMost = true;
						return false;
					}
					leftMost = false;
					currentPos = currentPos + slideBy;
					
					slider.animate({
					    left: currentPos
					  }, 500, function() {
					    // Animation complete.
					  });
					
					slider.css("left", currentPos  +"px");
					//console.log("prev " + currentPos);
				});
				
				$this.find(".next").bind("click", function(){
					var limit = Math.abs(currentPos - slideBy);
					if (limit > slideWidth) {
						rightMost = true;
						return false;
					}
					rightMost = false;
					currentPos = currentPos - slideBy;
					slider.animate({
					    left: currentPos
					  }, 500, function() {
					    // Animation complete.
					  });
					//console.log("next " + currentPos);
				});
			}
			
			return {
				init : function(opt) {
					console.log("make carrot init " + opt.name);
					options = opt;

					$this = $(opt.scope);
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
		}, 
		
	    prev : function(options) {   
			console.log("previous " + options.name);
		},
		
	    next : function(options) { 
			console.log("next " + options.name);
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


