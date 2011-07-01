(function($){
	$.fn.carrotCell = function (options) {
		
		/** defaults of the carousel
		*/
		var defaults = {  
		   	next: ".next",
			prev: ".prev",
			step: 1,
			dir: "vertical",
			circular: false,
			auto: false
		};  
		
		var $this = this;
		
		/** find each instance of carrotCell 
		*/
		return this.each(function(){
			if ( options ) { 
				$.extend( defaults, options );
			}
			
			options.scope = this;
			options.name = $(options.scope).attr("id") || "defaultCarrot";
			console.log("new carrot " + options.name);

			// set up 
			$(options.scope).css("overflow", "hidden");
			var slider = $(options.scope).find('> ol').css("width", "9999em"),
				items = slider.find('> li'),
				single = items.filter(':first'),
				singleWidth = single.outerWidth(true),
				singleHeight = single.outerHeight(),
				allWidth = $(options.scope).innerWidth(),
				visible = Math.floor(allWidth / singleWidth);

			$("#debug").html(singleWidth + " " + singleHeight + " " + single.css("width"));
		});
	};
})(jQuery);


