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
    // stopOnHover: true,
    // controlOnHover: true,
    // dotsOnHover: true,
    breakpoints : [
        { pixels: 600, settings: { scroll: 2, show: 2 }},
        { pixels: 1020, settings: { scroll: 3, show: 3 }},
        { pixels: 1010, settings: { useDots: false }}
    ],
    key: true
});

// var demo2 = $('#demo--2').carrotCell({ 
//     controlOnHover: true,
//     useDots: true,
//     infinite: true,
//     sideways: false,
//     easing: 'easeOutExpo',
//     show: 2,
//     scroll: 1,
//     key: true
// });