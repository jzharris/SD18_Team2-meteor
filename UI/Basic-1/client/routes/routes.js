//////////////////////////////////////////////////////////////////////////////
//Configure:

Router.configure({
    // loadingTemplate: 'loading'
});

//////////////////////////////////////////////////////////////////////////////
//Routes:

Router.route('/', {
    controller: 'AppController',
    onBeforeAction: function () {
        this.redirect("/map");
        this.next();
    }
});

Router.route('/map', {
    controller: "AppController",
    action: function () {
        this.render('mapContent');
    }
});

Router.route('/notifications', {
    controller: "AppController",
    action: function () {
        this.render('notificationsContent');
    }
});

//////////////////////////////////////////////////////////////////////////////
//Controllers:

AppController = RouteController.extend({
    layoutTemplate: 'mainLayout'
});

LoginController = RouteController.extend({
    layoutTemplate: 'loginLayout'
});