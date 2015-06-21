/*! 
    jCarrotCell documentation and demo page
**/
$ = require('jquery');

/** console.log wrapper for debugging
*/
var debug = function(debugString) {
    console.log(debugString); 
};

window.debug = debug;

require('./vendor/rainbow-custom.min.js');
require('./vendor/velocity.min.js');
require('./jCarrotCell.js');

var t1 = $('#jcc-home').carrotCell({ 
    prevClass : "prev",
    nextClass : "next",
    prevIconClass : 'cc-left',
    nextIconClass: 'cc-right',
    show: 1,
    scroll: 1
});

console.log(t1.getName());