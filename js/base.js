$(document).ready(function(){
	
	// should probably be calling the app init
	var setup = function(){		
		var k1 = $('#kitten1').carrotCell();
		
		var h = $('#kittenhell').carrotCell({
			sideways: false,
			delay: 3000,
			key: true,
			navi: true,
			step:1
			// auto: true
		});
		
		// var apih = $(h).data('carrotCell');
		// var api = $(t).data('carrotCell');
		// var item = '<li><span>10</span><img src="images/dog01.png" /></li>';
		// api.insert(item, 4);
		// item = '<li><span>11</span><img src="images/dog02.png" /></li>';
		// api.insert(item);
		// item = '<li><span>12</span><img src="images/dog03.png" /></li>';
		// api.insert(item);

	}
	
	// chrome can not calculate the width correctly because it is foolish
	var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
	if (is_chrome) {
		$(window).load(function(){ setup(); });
	} else {
		setup();
	}
});


