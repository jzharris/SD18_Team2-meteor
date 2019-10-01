import { ReactiveVar } from 'meteor/reactive-var';

minHeight = new ReactiveVar();
Template.mainLayout.onCreated(function () {
    //Allow JS urls
    Blaze._allowJavascriptUrls();

    // For reactive rendering of window -- slows down the app!
    $(window).resize(function () {
        minHeight.set($(window).height() - $('.main-footer').outerHeight());
    });
});