Template.registerHelper('minHeight', function() {
    return minHeight.get() + 'px';
});

Template.registerHelper('sectionHeight', function () {
    return (minHeight.get() - $('.content-header').height() - 150) + 'px';
});

Template.registerHelper('sectionWidth', function () { //1346
    return ($(window).width() - 460) + 'px';
});

Template.registerHelper('tabPanelWidth', function () {
    return tabPanelWidth() + 'px';
});
tabPanelWidth = function () {
    return ($(window).width() - 460 - 47);
};

Template.registerHelper('tabPanelHeight', function () {
    return (minHeight.get() - $('.content-header').height() - 140) + 'px';
});

Template.registerHelper('tabContentHeight', function () {
    return (minHeight.get() - $('.content-header').height() - 295) + 'px';
});

Template.registerHelper('notMobile', function() {
    return !mobile;
});

Template.registerHelper('tabSelected', function(targetRoute) {
    return Router.current().route._path === targetRoute ? "active" : "";
});