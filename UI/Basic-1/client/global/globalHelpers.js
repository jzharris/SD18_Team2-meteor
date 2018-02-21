Template.registerHelper('minHeight', function() {
    return minHeight.get() + 'px';
});

Template.registerHelper('minSection', function () {
    return (minHeight.get() - $('.content-header').height() - 150) + 'px';
});

Template.registerHelper('notMobile', function() {
    return !mobile;
});