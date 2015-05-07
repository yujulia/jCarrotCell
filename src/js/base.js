/*! 
    jCarrotCell documentation and demo page
**/
$ = require('jquery');
$.jCarrotCell = require('./jCarrotCell.js');
require('./vendor/rainbow-custom.min.js');


$('#jcc-home').carrotCell({
    infinite: true,
    useMaxWidth: true,
    minWidth : 300,
    resizeHeight: true
});