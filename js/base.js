$(document).ready(function(){
	
	// should probably be calling the app init
	var setup = function(){
		
		$('#kittenheaven').carrotCell({step: 1, infinite: true, pad: false});
		//$('#kittenheaven').carrotCell({infinite: true, pad: true});
		$('#kittenhell').carrotCell({sideways: false});

	}
	
	// chrome can not calculate the width correctly because it is foolish
	var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
	if (is_chrome) {
		$(window).load(function(){ setup(); });
	} else {
		setup();
	}
});


