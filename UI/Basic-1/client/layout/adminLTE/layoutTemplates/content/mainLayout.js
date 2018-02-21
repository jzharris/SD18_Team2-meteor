import { ReactiveVar } from 'meteor/reactive-var';

Template.mainLayout.onCreated(function () {
    //Allow JS urls
    Blaze._allowJavascriptUrls();

    //Set the min-height of the content and sidebar based on the
    minHeight = new ReactiveVar($(window).height() - $('.main-footer').outerHeight());
    $(window).resize(function () {
        minHeight.set($(window).height() - $('.main-footer').outerHeight());
    });
});