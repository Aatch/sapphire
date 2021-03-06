(function($) {

	/**
	 * Allows icon definition via HTML5 data attrs for easier handling in PHP.
	 *
	 * Adds an alternative appearance so we can toggle back and forth between them
	 * and register event handlers to add custom styling and behaviour. Example use
	 * is in the CMS with the saving buttons - depending on the page's state one of
	 * them will either say "Save draft" or "Saved", and will have different colour.
	 */
	$.widget('ssui.button', $.ui.button, {
		options: {
			alternate: {
				icon: null,
				text: null
			},
			showingAlternate: false
		},

		/**
		 * Switch between the alternate appearances.
		 */
		toggleAlternate: function() {
			if (this._trigger('ontogglealternate')===false) return;

			// Only switch to alternate if it has been enabled through options. 
			if (!this.options.alternate.icon && !this.options.alternate.text) return;

			this.options.showingAlternate = !this.options.showingAlternate;
			this.refresh();
		},

		/**
		 * Adjust the appearance to fit with the current settings.
		 */
		_refreshAlternate: function() {
			this._trigger('beforerefreshalternate');

			// Only switch to alternate if it has been enabled through options. 
			if (!this.options.alternate.icon && !this.options.alternate.text) return;

			if (this.options.showingAlternate) {
				this.element.find('.ui-button-icon-primary').hide();
				this.element.find('.ui-button-text').hide();
				this.element.find('.ui-button-icon-alternate').show();
				this.element.find('.ui-button-text-alternate').show();
			}
			else {
				this.element.find('.ui-button-icon-primary').show();
				this.element.find('.ui-button-text').show();
				this.element.find('.ui-button-icon-alternate').hide();
				this.element.find('.ui-button-text-alternate').hide();
			}

			this._trigger('afterrefreshalternate');
		},

		/**
		 * Construct button - pulls in options from data attributes.
		 * Injects new elements for alternate appearance (if requested via options).
		 */
		_resetButton: function() {
			var iconPrimary = this.element.data('icon-primary'),
				iconSecondary = this.element.data('icon-secondary');

			if (!iconPrimary) iconPrimary = this.element.data('icon');

			// TODO Move prefix out of this method, without requriing it for every icon definition in a data attr
			if(iconPrimary) this.options.icons.primary = 'btn-icon-' + iconPrimary;
			if(iconSecondary) this.options.icons.secondary = 'btn-icon-' + iconSecondary;

			$.ui.button.prototype._resetButton.call(this);

			// Pull options from data attributes. Overriden by explicit options given on widget creation.
			if (!this.options.alternate.text) {
				this.options.alternate.text = this.element.data('text-alternate');
			}
			if (!this.options.alternate.icon) {
				this.options.alternate.icon = this.element.data('icon-alternate');
			}
			if (!this.options.showingAlternate) {
				this.options.showingAlternate = this.element.hasClass('ss-ui-alternate');
			}

			// Create missing elements.
			if (this.options.alternate.text) {
				this.buttonElement.append(
					"<span class='ui-button-text-alternate ui-button-text'>" + this.options.alternate.text + "</span>"
				);
			}
			if (this.options.alternate.icon) {
				this.buttonElement.append(
					"<span class='ui-button-icon-alternate ui-button-icon-primary ui-icon btn-icon-" 
					+ this.options.alternate.icon + "'></span>"
				);
			}

			this._refreshAlternate();
		},

		refresh: function() {
			$.ui.button.prototype.refresh.call(this);

			this._refreshAlternate();
		},

		destroy: function() {
			this.element.find('.ui-button-text-alternate').remove();
			this.element.find('.ui-button-icon-alternate').remove();

			$.ui.button.prototype.destroy.call( this );
		}
	});

	/**
	 * Extends jQueryUI dialog with iframe abilities (and related resizing logic),
	 * and sets some CMS-wide defaults.
	 */
	$.widget("ssui.ssdialog", $.ui.dialog, {
		options: {
			// Custom properties
			iframeUrl: '',
			reloadOnOpen: true,
			dialogExtraClass: '',

			// Defaults
			width: '80%',
			height: 500,
			position: 'center',
			modal: true,
			bgiframe: true,
			autoOpen: false
		},
		_create: function() {
			$.ui.dialog.prototype._create.call(this);

			var self = this;

			// Create iframe
			var iframe = $('<iframe marginWidth="0" marginHeight="0" frameBorder="0" scrolling="auto"></iframe>');
			iframe.bind('load', function(e) {
				if($(this).attr('src') == 'about:blank') return;
				
				$(this).show();
				self._resizeIframe();
				self.uiDialog.removeClass('loading');
			}).hide();
			
			if(this.options.dialogExtraClass) this.uiDialog.addClass(this.options.dialogExtraClass);
			this.element.append(iframe);

			// Let the iframe handle its scrolling
			this.element.css('overflow', 'hidden');
		},
		open: function() {
			$.ui.dialog.prototype.open.call(this);
			
			var self = this, iframe = this.element.children('iframe');

			// Load iframe
			if(!iframe.attr('src') || this.options.reloadOnOpen) {
				iframe.hide();
				iframe.attr('src', this.options.iframeUrl);
				this.uiDialog.addClass('loading');
			}

			// Resize events
			this.uiDialog.bind('resize.ssdialog', function() {self._resizeIframe();});
			$(window).bind('resize.ssdialog', function() {self._resizeIframe();});
		},
		close: function() {
			$.ui.dialog.prototype.close.call(this);

			this.uiDialog.unbind('resize.ssdialog');
			$(window).unbind('resize.ssdialog');
		},
		_resizeIframe: function() {
			var el = this.element, iframe = el.children('iframe');

			iframe.attr('width', 
				el.innerWidth() 
				- parseFloat(el.css('paddingLeft'))
				- parseFloat(el.css('paddingRight'))
			);
			iframe.attr('height', 
				el.innerHeight()
				- parseFloat(el.css('paddingTop')) 
				- parseFloat(el.css('paddingBottom'))
			);
		}
	});
	
	$.widget("ssui.titlebar", {
		_create: function() {
			this.originalTitle = this.element.attr('title');

			var self = this;
			var options = this.options;

			var title = options.title || this.originalTitle || '&nbsp;';
			var titleId = $.ui.dialog.getTitleId(this.element);

			this.element.parent().addClass('ui-dialog');

			var uiDialogTitlebar = this.element.
				addClass(
					'ui-dialog-titlebar ' +
					'ui-widget-header ' +
					'ui-corner-all ' +
					'ui-helper-clearfix'
				);

				// By default, the

				if(options.closeButton) {
					var uiDialogTitlebarClose = $('<a href="#"/>')
						.addClass(
							'ui-dialog-titlebar-close ' +
							'ui-corner-all'
						)
						.attr('role', 'button')
						.hover(
							function() {
								uiDialogTitlebarClose.addClass('ui-state-hover');
							},
							function() {
								uiDialogTitlebarClose.removeClass('ui-state-hover');
							}
						)
						.focus(function() {
							uiDialogTitlebarClose.addClass('ui-state-focus');
						})
						.blur(function() {
							uiDialogTitlebarClose.removeClass('ui-state-focus');
						})
						.mousedown(function(ev) {
							ev.stopPropagation();
						})
						.appendTo(uiDialogTitlebar);

					var uiDialogTitlebarCloseText = (this.uiDialogTitlebarCloseText = $('<span/>'))
						.addClass(
							'ui-icon ' +
							'ui-icon-closethick'
						)
						.text(options.closeText)
						.appendTo(uiDialogTitlebarClose);
				}

				var uiDialogTitle = $('<span/>')
					.addClass('ui-dialog-title')
					.attr('id', titleId)
					.html(title)
					.prependTo(uiDialogTitlebar);

				uiDialogTitlebar.find("*").add(uiDialogTitlebar).disableSelection();
		},

		destroy: function() {
			this.element
				.unbind('.dialog')
				.removeData('dialog')
				.removeClass('ui-dialog-content ui-widget-content')
				.hide().appendTo('body');

			(this.originalTitle && this.element.attr('title', this.originalTitle));
		}
	});
	
	$.extend($.ssui.titlebar, {
		version: "0.0.1",
		options: {
			title: '',
			closeButton: false,
			closeText: 'close'
		},

		uuid: 0,

		getTitleId: function($el) {
			return 'ui-dialog-title-' + ($el.attr('id') || ++this.uuid);
		}
	});
}(jQuery));
