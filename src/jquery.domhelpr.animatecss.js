(function ($, window, document, $domHelpr) {
    
    if ($domHelpr) {
        $domHelpr.prototype.addAcceptableAction("animate");
    }

    $.extend($domHelpr.methods, {
        animate: function (animationName, element) {
            var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            $(element).addClass('animated ' + animationName).one(animationEnd, function() {
                $(this).removeClass('animated ' + animationName);
            });
        }
    });
    

})(jQuery, this, document, $.domHelpr);