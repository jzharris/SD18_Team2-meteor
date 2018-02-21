//////////////////////////////////////////////////////////////////////////////
//topNavbar: child to mainHeader Template
Template.topNavbar.helpers({
    tabSelected(targetRoute) {
        return Router.current().route._path == targetRoute ? "box-shadow: inset #ecf0f5 0 -4px 0 0;" : "";
    }
});