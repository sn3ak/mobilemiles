/**
 * @copyright: Copyright 2011 randomland.net.
 * @license:   Apache 2.0; see `license.txt`
 * @author:    zourtney@randomland.net
 * 
 * Application driver class.
 *
 * TODO: merge everything into a single namespace.
 */


/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };
})();


/****************************************************************************
 * Generic page
 ****************************************************************************/
var Page = Class.extend({
  init : function(app, id) {
  	var self = this;
		
    this.app = app;
    this.id = id;
    this.$page = $('#' + id);
    
    this.$page.live('pageshow', function() {
      self.onPageShow();
    });
  },
  
  getContent : function() {
  	return $('#' + this.id + ' div[data-role="content"]');
  },
  
  showTmpl : function(tmplName, data) {
  	var $c = this.getContent();
  	var tmplId = '#tmpl-' + this.id;
  	
  	if (tmplName !== undefined && tmplName != null && tmplName.length) {
  		tmplId += '-' + tmplName;
  	}
  	
  	$(tmplId)
  		.tmpl(data)
  		.appendTo($c.empty())
  	;
  	
  	$c.trigger('create');
  },
  
  showUnauthorized : function(data) {
  	this.showTmpl('unauthorized', data);
  },
  
  showError : function() {
  	this.showTmpl('error');
  },
  
  setSubtitle : function(value) {
    $('.subtitle').text(value);
  }
});


/****************************************************************************
 * Generic page with a list-holding container
 *
 * BUG: sometimes list rendering will fail. To reliably reproduce:
 *   1. start at #view
 *   2. ("no document") -> go to doc list, select document
 *   3. fails with `parentPage[0] undefined'
 *
 * Known issue on jQuery Forum:
 *   http://forum.jquery.com/topic/parentpage-0-is-undefined
 *
 * MobileMiles issue #21:
 *   https://github.com/zourtney/mobilemiles/issues/21
 ****************************************************************************/
var PageWithContainer = Page.extend({
  init : function(app, id) {
    this._super(app, id);
    this.needsRefresh = true;
  },
  
  getContainerContent : function() {
  	return $('#' + this.id + '-container');
  },
  
  showContainerTmpl : function(tmplName, data) {
  	var $c = this.getContainerContent();
  	var tmplId = '#tmpl-' + this.id + '-' + tmplName;
  	
  	$(tmplId)
  		.tmpl(data)
  		.appendTo($c.empty())
  	;
  	
  	$c.trigger('create');
  },
  
  showLoading : function() {
    this.showContainerTmpl('loading');
  },
  
  showList : function(data) {
    this.showContainerTmpl('show', data);
  },
  
  onPageShow : function() {
    if (this.needsRefresh) {
      this.populate();
      this.needsRefresh = false;
    }
  }
});


/****************************************************************************
 * Home
 ****************************************************************************/
var HomePage = Page.extend({
  init : function(app) {
    this._super(app, 'home');
  },
  
  showAuthorized : function() {
    this.showTmpl();
  },
  
  onPageShow : function() {
    var self = this;
    self.setSubtitle('');
    
    $.ajax({
      url: MobileMilesConst.SCRIPT_URL + 'ajax_login.php',
      dataType: 'json',
      success: function(data) {
        switch (data.response) {
          case 'login_unauthorized':
            self.showUnauthorized(data);
            break;
          case 'login_succeeded':
            self.showAuthorized();
            break;
          default:
            console.log('what is ' + data.response + '?');
            self.showError();
            break;
        }
      },
      error: function(xhr, status, error) {
        console.log('error ' + error + ', ' + status);
        self.showError();
      }
    });
  }
});


/****************************************************************************
 * Settings
 ****************************************************************************/
var SettingsPage = Page.extend({
  init : function(app) {
    this._super(app, 'settings');
  },
  
  showUnauthorized : function(data) {
    this.showTmpl('request', data);
  },

  showAuthorized : function() {
    this.showTmpl('success');
  },
  
  onPageShow : function() {
    var self = this;
    self.setSubtitle('');
    
    $.ajax({
      url: MobileMilesConst.SCRIPT_URL + 'ajax_login.php',
      dataType: 'json',
      data: {
        next: MobileMilesConst.BASE_URL + '#' + self.id
      },
      success: function(data) {
        switch (data.response) {
          case 'login_unauthorized':
            self.showUnauthorized(data);
            break;
          case 'login_succeeded':
            self.showAuthorized();
            break;
          default:
            console.log('what is ' + data.response + '?');
            self.showError();
            break;
        }
      },
      error: function(xhr, status, error) {
        console.log('error: ' + error + ', ' + status);
        self.showError();
      }
    });
  }
});


/******************************************************************************
 * Log out
 ******************************************************************************/
var LogOutPage = Page.extend({
  init : function(app) {
    this._super(app, 'logout');
  },
  
  onPageShow : function() {
    var self = this;
    self.setSubtitle('');
    
    $.ajax({
      url: MobileMilesConst.SCRIPT_URL + 'ajax_login.php?action=logout',
      dataType: 'json',
      success: function(data) {
        switch (data.response) {
          case 'logout_success':
            self.app.list.needsRefresh = true;
            self.app.view.needsRefresh = true;
            
            $.mobile.changePage('#settings');
            break;
          default:
            console.log('what is ' + data.response + '?');
            self.showError();
            break;
        }
      },
      error: function(xhr, status, error) {
        console.log('error: ' + error + ', ' + status);
        self.showError();
      }
    });
  }
});

/****************************************************************************
 * List
 ****************************************************************************/
var ListPage = PageWithContainer.extend({
  init : function(app) {
    this._super(app, 'list');
  
    var self = this;
    $('#ul-list-refresh').live('click', function() {
      self.populate();
      self.app.view.needsRefresh = true;
    });
    
    $('.view-link').live('click', function() {
      var id = $(this).data('id');
      if (id !== undefined && id.length > 0) {
        self.app.doc = id;
        self.app.docTitle = $(this).data('doc-title');
        self.app.view.needsRefresh = true;
      }
    });
  },
  
  populate : function() {
    // Make AJAX call
    var self = this;
    self.setSubtitle('');
    
    $.ajax({
      url: MobileMilesConst.SCRIPT_URL + 'ajax_doclist.php',
      dataType: 'json',
      data: {
        callee: MobileMilesConst.BASE_URL + '#' + self.id
      },
      beforeSend: function() {
        self.showLoading();
      }, // end of 'beforeSend'
      success: function(data) {
        switch (data.response) {
          case 'login_unauthorized':
            self.showUnauthorized(data);
            break;
          case 'doclist_success':
            self.showList({
              docs: data.doclist
            });
            break;
          default:
            console.log('what is ' + data.response + '?');
            self.showError();
            break;
        }
      }, // end of 'success'
      error: function(xhr, status, error) {
        console.log('error: ' + error + ', ' + status);
        self.showError();
      } // end of 'error'
    });
  }
});


/****************************************************************************
 * View
 ****************************************************************************/
var ViewPage = PageWithContainer.extend({
  init : function(app) {
    this._super(app, 'view');
    this.entries = [];
    
    var self = this;
    $('#entrylist li').live('click', function(e) {
      var i = $(this).index() - 1;
      
      if (! isNaN(i) && i > -1 && i < self.entries.length) {
        self.curEntry = self.entries[i];
      }
      else {
        e.preventDefault();
      }
    });
    
    //TODO: touch interface is not perfect...it will fire even if you try to
    // scroll past. But it's better than not working at all!
    $('#entrylist-loadmore').live('click touchend', function() {
      self.populateWithMore();
    });
  },
  
  showNoDoc : function() {
    this.setSubtitle('No document');
    this.showTmpl('no-doc');
  },
  
  showLoadMore : function() {
    $('#tmpl-view-loadmore')
      .tmpl()
      .appendTo($('#entrylist-loadmore').empty())
    ;
    
    $('#entrylist').listview('refresh');
  },
  
  showLoadMoreInProgress : function() {
    $('#tmpl-view-loadmore-in-progress')
      .tmpl()
      .appendTo($('#entrylist-loadmore').empty())
    ;
    
    $('#entrylist').listview('refresh');
  },
  
  showListAndAppend : function(data) {
    $('#tmpl-view-item')
      .tmpl(data)
      .insertBefore(this.getContainerContent().find('li:last'))
    ;
    
    $('#entrylist').listview('refresh');
  },
  
  populateRange : function(offset, num, callbacks) {
    var self = this;
    $.ajax({
      url: MobileMilesConst.SCRIPT_URL + 'ajax_entrylist.php',
      dataType: 'json',
      data: {
        callee: MobileMilesConst.BASE_URL + '#' + self.id,
        id: self.app.doc,
        offset: offset,
        num: num
      },
      beforeSend: callbacks.beforeSend,
      error: callbacks.error,
      success: callbacks.success,
      complete: callbacks.complete
    });
  },
  
  populate : function() {
    var self = this;
    self.setSubtitle(self.app.docTitle);
    
    self.populateRange(0, 5, {
      beforeSend: function() {
        self.showLoading();
      }, // end of 'beforeSend'
      success: function(data) {
        switch (data.response) {
          case 'login_unauthorized':
            self.showUnauthorized(data);
            break;
          case 'entrylist_no_doc':
            self.showNoDoc();
            break;
          case 'entrylist_success':
            self.entries = data.entrylist;
            
            self.showList({
              entries: self.entries
            });
            break;
          default:
            console.log('what is ' + data.response + '?');
            self.showError();
            break;
        }
      }, // end of 'success'
      error: function(xhr, status, error) {
        console.log('error: ' + status + ', ' + error);
        self.showError();
      } // end of 'error'
    });
  },
  
  populateWithMore : function(num) {
    // Load 10 more, by default
    //TODO: define this magic number elsewhere
    if (num === undefined) {
      num = 10;
    }
    
    var self = this;
    self.populateRange(self.entries.length, num, {
      beforeSend: function() {
        self.showLoadMoreInProgress();
      },
      success: function(data) {
        switch (data.response) {
          case 'login_unauthorized':
            self.showUnauthorized(data);
            break;
          case 'entrylist_success':
            self.entries = self.entries.concat(data.entrylist);
            self.showListAndAppend(data.entrylist);
            break;
          default:
            console.log('what is ' + data.response + '?');
            self.showError();
            break;
        }
      },
      error: function(xhr, status, error) {
        console.log('error: ' + status + ', ' + error);
        self.showError();
      },
      complete: function() {
      	self.showLoadMore();
      }
    });
  }
});


/****************************************************************************
 * View Details
 ****************************************************************************/
var ViewDetailsPage = Page.extend({
  init : function(app) {
    this._super(app, 'details');
  },
  
  showNoDoc : function() {
  	this.setSubtitle('No document');
    this.showTmpl('no-doc');
  },
  
  showDetails : function(data) {
    this.setSubtitle(this.app.docTitle);
    this.showTmpl('', data);
  },
  
  onPageShow : function() {
    if (this.app.view.curEntry != null && this.app.view.curEntry !== undefined) {
      this.showDetails(this.app.view.curEntry);
    }
    else {
      this.showNoDoc();
    }
  }
});


/****************************************************************************
 * Add New
 ****************************************************************************/
var AddNewPage = Page.extend({
  init : function(app) {
    this._super(app, 'new');
    
    var self = this;
    
    // Update price estimate when number of gallons is changed
    $('.updateprice').live('change', function() {
      self.updatePrice();
    });
    
    // Click listener for form 'Submit' button. The default way jQuery mobile
    // deals with forms is to AJAX redirect to the current page...we don't
    // want that. We'll just handle the operation ourself, sending the data
    // via AJAX.
    $('.submit').live('click', function() {
      self.submit();
      return false;
    });
  },
  
  showNoDoc : function() {
    this.setSubtitle('No document');
    this.showTmpl('no-doc');
  },
  
  showSuccess : function(data) {
  	this.showTmpl('success', data);
    
    // Scroll to top of page
    this.scrollToField();
  },
  
  showFieldPreloaders : function() {
    $('.preloadable').addClass('ajax-textbox');
  },
  
  removeFieldPreloaders : function() {
    $('.preloadable').removeClass('ajax-textbox');
  },
  
  setFieldFocus : function($field) {
    // Default to the mileage box
    if ($field === undefined || $field == null || $field.length < 1) {
      $field = $('#mileage');
    }
    
    //TODO: fix!
    // BUG: this should work in iOS, but it does not.
    // SEE: http://jsfiddle.net/DLV2F/2/
    //var $mileage = $('#mileage');
    //var len = $mileage.val().length;
    //$mileage
    //  .focus()
    //  .selectRange(len, len)
    //;
    $field.focus();
  },
  
  scrollToField : function($field) {
    var pos = 0;
    if ($field !== undefined && $field != null) {
      var $p = $field.parents('[data-role="fieldcontain"]');
      if ($p.length) {
        pos = $p.offset().top;
        
        //TODO: make sure this is working properly
        this.setFieldFocus($p);
      }
    }
    
    $('html, body').animate({scrollTop: pos}, 100);
  },
  
  updatePrice : function() {
    var estCost = $('#pricepergallon').val() * $('#gallons').val();
    
    if (! isNaN(estCost)) {
      $('#pumpprice').val(getMoney(estCost));
    }
  },
  
  /**
   * Renders the form elements using jQuery Mobile styles. Ugh.
   */
  renderForm : function() {
    this.showTmpl('form');
  },
  
  /**
   * Fills the form with the values passed in. The `errors` object contains
   * the IDs of invalid fields; they will be highlighted.
   */
  fillForm : function(data) {
    // Start by setting the current time
    $('#datetime').val(getCurrentTimeString());
    
    // Make sure we were given field data...
    if (data === undefined || data.values === undefined) {
      return;
    }
    
    // Loop through all given fields (overwriting datetime, if needed)
    var $firstInvalid = null;
    
    for (var e in data.values) {
      var $e = $('#' + e);
      
      // Re-fill all values (in case PHP script cleaned them)
      $e.val(data.values[e]);
      
      // Mark all invalid items
      if (data.errors !== undefined && data.errors.hasOwnProperty(e)) {
        //console.log('error on ' + e + ': ' + data.values[e] + ' is invalid.');
        $e.parent().addClass('invalid');
        
        if ($firstInvalid == null) {
          $firstInvalid = $e;
        }
      }
      else {
        $e.parent().removeClass('invalid');
      }
    }
    
    // Set 'grade' dropdown item
		$('#grade option:selected').removeAttr('selected');
		$('#grade option[value="' + data.values['grade'] + '"]').attr('selected', 'selected');
		$('#grade').trigger('change');
		
    return $firstInvalid;
  },
  
  /**
   * Enable or disable form
   */
  enableForm : function(val) {
    if (val === undefined || val == true) {
      $('#frmNew input, textarea, select').removeAttr('disabled');
      $('#frmNew label').removeClass('disabled');
      $('#submit')
        .button('enable')
        .parent().find('.ui-btn-text').text('Submit')
      ;
    }
    else {
      $('#frmNew input, textarea, select').attr('disabled', 'disabled');
      $('#frmNew label').addClass('disabled');
      $('#submit')
        .button('disable')
        .parent().find('.ui-btn-text').text('Submitting...')
      ;
    }
  },
  
  getFormData : function() {
  	// Serialize form data
    var formData = $('#frmNew').serializeArray();
        
    // Add the ID field (document key)
    formData.push({name: 'doc', value: mobileMiles.doc});
    
    return formData;
  },
  
  submit : function() {
    var self = this;
    var formData = self.getFormData();
    
    $.ajax({
      url: MobileMilesConst.SCRIPT_URL + 'ajax_new.php',
      dataType: 'json',
      data: formData,
      cache: false,
      beforeSend: function() {
        // Disable the form
        self.enableForm(false);
      },
      success: function(data) {
        switch (data.response) {
          case 'new_validation_error':
            var $firstInvalid = self.fillForm({
              values: data.values,
              errors: data.errors
            });
            
            self.scrollToField($firstInvalid);
            break;
          case 'new_success':
            // Display the stats screen
            self.showSuccess(data.stats);
            
            // Make sure the entry list refreshes if/when they go #view.
            self.app.view.needsRefresh = true;
            break;
          default:
            console.log('what is ' + data.response + '?');
            self.showError();
            break;
        }
      },
      error: function(xhr, status, error) {
        console.log('error: ' + status + ', ' + error);
        self.showError();
      },
      complete: function() {
        // Re-enable the form
        self.enableForm();
      }
    });
  },
  
  onPageShow : function() {
    var self = this;
    
    if (! this.app.isDocValid()) {
      self.showNoDoc();
      return;
    }
    
    // Set document title
    self.setSubtitle(self.app.docTitle);
    
    // Display the form
    self.renderForm();
    
    // Get default values for some of the fields
    $.ajax({
      url: MobileMilesConst.SCRIPT_URL + 'ajax_new.php',
      dataType: 'json',
      data: {
        doc: this.app.doc,
        action: 'defaults'
      },
      cache: false,
      beforeSend: function() {
        self.fillForm();
        self.showFieldPreloaders();
      },
      success: function(data) {
        switch (data.response) {
          case 'new_defaults':
            self.fillForm({
              values: data.values
            });
            break;
          default:
            console.log('what is ' + data.response + '?');
            self.showError();
            break;
        }
      },
      error: function(xhr, status, error) {
        console.log('error: ' + status + ', ' + error);
        self.showError();
      },
      complete: function() {
        self.setFieldFocus();
        self.removeFieldPreloaders();
      }
    });
  },
});


/******************************************************************************
 * MobileMilesApp
 ******************************************************************************/
function MobileMilesApp() {
  // Initialize 'doc' through GET params (if existing)
  if ($_GET.hasOwnProperty('doc') && $_GET['doc'].length > 0) {
    this.doc = $_GET['doc'];
  }
  
  // Returns whether or a document has been set
  this.isDocValid = function() {
    return (this.doc !== undefined && this.doc.length > 0);
  };
  
  var self = this;
  this.init = function() {
    self.home = new HomePage(self);
    self.settings = new SettingsPage(self);
    self.logout = new LogOutPage(self);
    self.list = new ListPage(self);
    self.view = new ViewPage(self);
    self.viewDetails = new ViewDetailsPage(self);
    self.addNew = new AddNewPage(self);
  };
  
  
}; // end of MobileMilesApp

/*****************************************************************************
 * MobileMilesApp instance
 *****************************************************************************/
// Global instance of our application
var mobileMiles = new MobileMilesApp();

$(document).ready(function() {
  // Create manager instances for each page now that the DOM is ready.
  mobileMiles.init();
});