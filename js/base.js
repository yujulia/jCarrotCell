$(document).ready(function(){
	
	// should probably be calling the app init
	var setup = function(){		
		var t = $('#kittenheaven').carrotCell({
			infinite: false, 
			pad: false,
			speed: 1000,
			delay: 3000,
			auto: true // if auto is true so is infinite
		});
		
		var api = $(t).data('carrotCell');
		api.move();
	
		
		var h = $('#kittenhell').carrotCell({
			sideways: false,
			delay: 3000
		});
		
		var apih = $(h).data('carrotCell');
		apih.move();
	}
	
	// chrome can not calculate the width correctly because it is foolish
	var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
	if (is_chrome) {
		$(window).load(function(){ setup(); });
	} else {
		setup();
	}
});


