Template.mainSidebar.helpers({
    tabSelected(targetRoute) {
        return Router.current().route._path == targetRoute ? "active" : "";
    }
});