define([
  'jquery',
  'routers/base'
], function($, BaseRouter) {
  var _super = BaseRouter.prototype;

  return BaseRouter.extend({
    routes: {
      'desktoponly': 'desktopOnly'
    },

    desktopOnly: function() {
      // Sample desktop-only route
    }
  });
});