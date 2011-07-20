$(document).ready(function(){
	
	// should probably be calling the app init
	var setup = function(){
		// only handles 1 of some carousel
		//$('#kittenheaven').carrotCell();
		$('#kittenheaven').carrotCell({ infinite: true });
		$('#kittenhell').carrotCell({ infinite: true, sideways: false });
	}
	
	// chrome can not calculate the width correctly because it is foolish
	var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
	if (is_chrome) {
		$(window).load(function(){ setup(); });
	} else {
		setup();
	}
});


