$(document).ready(function(){
	
	// should probably be calling the app init
	var setup = function(){
		// only handles 1 of some carousel
		$('#kittenheaven').carrotCell();
		$('#kittenhell').carrotCell({sideways: false});
		// $('#kittenheaven').carrotCell({ infinite: true });
		// $('#kittenhell').carrotCell({ infinite: true, sideways: false });
		
		
		// var mytest = new test({name : "test 1", scope : $("#kittenheaven")});
		// var mytest2 = new test({name : "test 2", scope : $("#kittenhell")});

	}
	
	// chrome can not calculate the width correctly because it is foolish
	var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
	if (is_chrome) {
		$(window).load(function(){ setup(); });
	} else {
		setup();
	}
});


