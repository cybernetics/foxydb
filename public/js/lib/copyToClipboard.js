define([
    'jquery'
], function(
    $
){
    var copyToClipboard = function(s) {
        if (window.clipboardData && clipboardData.setData) {
            clipboardData.setData('text', s);
        } else {
            var flashcopier = 'flashcopier';

            if(!document.getElementById(flashcopier)) {
                var divholder = document.createElement('div');

                divholder.id = flashcopier;
                document.body.appendChild(divholder);
            }

            document.getElementById(flashcopier).innerHTML = '';
            var divinfo = '<embed src="_clipboard.swf" FlashVars="clipboard='+encodeURIComponent(s)+'" width="0" height="0" type="application/x-shockwave-flash"></embed>';

            document.getElementById(flashcopier).innerHTML = divinfo;
        }
    }

    return copyToClipboard;
});