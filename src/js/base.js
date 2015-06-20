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


// $('#jcc-home').carrotCell({
//     // observed: 2
//     // useMaxWidth: true
//     // infinite: true,
//     // useMaxWidth: true,
//     // minWidth : 300,
//     // resizeHeight: true,
//     // key: true,
//     // navi: true,
//     // makeNavi: true
// });

var t1 = $('#jcc-home').carrotCell({ something: "something"});
console.log(t1.getName());