Template.registerHelper('minHeight', function() {
    return minHeight.get() + 'px';
});

Template.registerHelper('sectionHeight', function () {
    return (minHeight.get() - $('.content-header').height() - 150) + 'px';
});

Template.registerHelper('sectionWidth', function () {
    return ($(window).width() - 460) + 'px';
});

Template.registerHelper('notMobile', function() {
    return !mobile;
});