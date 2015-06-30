/*! 
    jCarrotCell documentation and demo page
**/
$ = require('jquery');

require('./vendor/rainbow-custom.min.js');
require('./vendor/velocity.min.js');
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
    // infinite: true,
    useDots : true,
    easing: 'easeOutExpo',
    duration: 1000,
    show: 2,
    scroll: 2,
    // controlOnHover: true,
    key: true
});

// var demo2 = $('#demo--2').carrotCell({ 
//     infinite: true,
//     sideways: false,
//     easing: 'easeOutExpo',
//     show: 2,
//     scroll: 1,
//     key: true
// });