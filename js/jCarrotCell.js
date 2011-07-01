(function($){
	
	var defaults = {  
	   	next: ".next",
		prev: ".prev",
		step: 1,
		dir: "vertical",
		circular: false,
		auto: false
	};
	
	var methods = {
	    init : function( options ) { 		
			// add options to over ride defaults, if any
			if ( options ) { 
				$.extend( defaults, options );
			}

			// for each instance of this type of carousel
			return this.each(function(){
				
				options.scope = this;
				options.name = $(options.scope).attr("id") || "defaultCarrot";
				console.log("new carrot " + options.name);
				
				var $this = $(this),
					data = $this.data('carrotCell');
					
				if (!data) {
					$(this).data('carrotCell', {
						target : $this,
						tip : "hello"
					});
				}
				
				console.log($this.data('carrotCell'));

				// set up 
				$(options.scope).css("overflow", "hidden");
				var slider = $(options.scope).find('> ol').css("width", "9999em"),
					items = slider.find('> li'),
					single = items.filter(':first'),
					singleWidth = single.outerWidth(true),
					singleHeight = single.outerHeight(true),
					allWidth = $(options.scope).innerWidth(),
					visible = Math.floor(allWidth / singleWidth);

				$("#debug").html(singleWidth + " " + singleHeight + " " + single.css("width"));
				
				$(".prev", this).bind('click.carrotCell', function(){ methods.prev(options); });
				$(".next", this).bind('click.carrotCell', function(){ methods.next(options); });
				
				$(".prev", this).bind('click.carrotCell', methods.test);
			});

		},
		
		test : function(){
			console.log(this);

		},
		
	    prev : function(options) {   
			
			console.log("previous " + options.name);
		},
		
	    next : function(options) { 
			console.log("next " + options.name);
		},
		
	    update : function( content ) { 
		
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


