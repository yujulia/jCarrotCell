$ = require('jquery');
$.touchwipe = require('./vendor/touchwipe.min.js');
$.jCarrotCell = require('./jCarrotCell.js');


$('.carrotCell').carrotCell({
    infinite: true,
    useMaxWidth: true,
    minWidth : 300,
    resizeHeight: true
});