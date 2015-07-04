/*! 
    jCarrotCell documentation and demo page
**/
$ = require('jquery');

require('./vendor/rainbow-custom.min.js');
// require('./vendor/velocity.min.js');
require('./vendor/jquery.easing.1.3.js');
require('./jCarrotCell.js');

// var t1 = $('#jcc-home').carrotCell({ 
//     // prevClass : "prev",
//     // nextClass : "next",
//     // prevIconClass : 'cc-left',
//     // nextIconClass: 'cc-right',
//     infinite: true,
//     show: 3,
//     scroll: 2,
//     key: true
//     // controlOnHover: true
// });


var demo1 = $('#demo--1').carrotCell({ 
    // auto: true,
    // infinite: true,  
    useDots: true,
    easing: 'easeOutExpo',
    duration: 1000,
    show: 4,
    scroll: 1,
    // pauseOnHover: true,
    // controlOnHover: true,
    // dotsOnHover: true,
    breakpoints : [
        { pixels: 320, settings: { scroll: 1, show: 1, usePausePlay: false }},
        { pixels: 480, settings: { scroll: 2, show: 2 }},
        { pixels: 1010, settings: { scroll: 1, show: 3 }},
        { pixels: 900, settings: { scroll: 2, show: 2 }}
    ],
    key: true
});

var demo2 = $('#demo--2').carrotCell({ 
    // infinite: true,
    // usePrevNext: false,
    sideways: false,
    easing: 'easeOutExpo',
    show: 2,
    scroll: 1,
    key: true
});

var demo2 = $('#demo--3').carrotCell({ 
    // infinite: true,
    // usePrevNext: false,
    sideways: false,
    easing: 'easeOutExpo',
    show: 1,
    scroll: 1,
    key: true
});