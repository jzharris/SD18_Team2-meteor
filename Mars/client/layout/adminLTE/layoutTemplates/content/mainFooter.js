Template.mainFooter.onRendered(function() {
    Meteor.setTimeout(function() {
        //Set the min-height of the content and sidebar based on the
        minHeight.set($(window).height() - $('.main-footer').outerHeight());
    }, 1);
});