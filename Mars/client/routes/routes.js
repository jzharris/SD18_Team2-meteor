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
        this.redirect("/experiments");
        this.next();
    }
});

Router.route('/experiments', {
    controller: "AppController",
    action: function () {
        this.render('experimentContent');
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