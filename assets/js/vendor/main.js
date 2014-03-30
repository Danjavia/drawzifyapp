jQuery( document ).on( 'ready', ev );

// Called on "ready" event 
function ev( event ) {

	// Main view instance
	var View = Gillie.Handler.extend({

	        initialize: function() {

	        	History.Adapter.bind( window, 'statechange', this.buildBreadcrumb );
	        	this.foundation; // Adding foundation to the project


				i = 0; // Valor dinumeracion div inicial
				sessionStorage.pin = 0;
				drawZone = document.getElementById( 'draw-zone' ); 
				// this.drawZone.onmousedown = drawBox;

				
            	this.contextMenu();
            	this.shortcuts;
            	this.themeActions;
            	// this.sortLayer();

				/**
				 * Shortcuts
				 */
				
				Mousetrap.bind( [ 'ctrl+n' ], this.newTheme );
				Mousetrap.bind( [ 'del' ], this.removeBox );
				Mousetrap.bind( [ 'esc' ], this.closeModal );
				Mousetrap.bind( [ 'ctrl+c' ], this.copyBox );
				Mousetrap.bind( [ 'ctrl+x' ], this.cutBox );
				Mousetrap.bind( [ 'ctrl+v' ], this.pasteBox );
				Mousetrap.bind( [ 'ctrl+alt+c' ], this.setDrawer );
				Mousetrap.bind( [ 'ctrl+1' ], this.zoomPlus );

				/* Long polling */
				// Long Polling (Recommened Technique - Creates An Open Connection To Server ∴ Fast)
				// (function poll(){
				//     $.ajax({ url: "/", success: function(data){
				//         //Update your dashboard gauge
				//         salesGauge.setValue(data.value);
				//     }, dataType: "json", complete: poll, timeout: 30000 });
				// })();
				// 
				// var imgData = "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=";
				// var zip = new JSZip();
				// zip.file("Hello.txt", "Hello World\n");
				// var img = zip.folder("images");
				// img.file("smile.gif", imgData, {base64: true});
				// var content = zip.generate();
				// location.href="data:application/zip;base64,"+content;
      
	        }

	    ,   events: {
	            	// 'mousedown #draw-zone': 'drawBox'
	            	'click .draw-container': 'newBox'	
	            ,	'click .begin': 'newDraw'	
	            ,	'click .draw-image': 'newImage'	
	            ,	'click .draw-film': 'newVideo'	
	            ,	'click .draw-youtube': 'newExternalVideo'	
	            ,	'click .draw-text': 'newText'	
	            ,	'click .newDraw': 'newDrawModal'	
	            ,	'click .close-reveal-modal': 'closeModal'
	            ,	'change .zoom input': 'zoom'
	            ,	'click .icon-signout': 'setToImg'
	        }

	        /**
	         * [sortLayer sort de layer into the draw]
	         * @return {[type]} [description]
	         */
	    ,	sortLayer: function () {
				// init the tree
			    jQuery( '.tree' ).aciTree({
				        ajax: {
				            url: 'json/checkbox-radio-button.json'
				        }
				    ,   sortable: true
			    });
	    	}

	        /**
			 * [drawBox Divs Creator Function]
			 * @param  { obj } event [Use de click to begin to draw a box container]
			 * @return { avoid }      this function doesn't return 
			 */
	    ,   drawBox: function( event ) {

	    		// Set the colopicker

            	jQuery( '.color-set' ).ColorPicker({ 
            			color: '#0000ff'
            		,	flat: true

            		,	onShow: function ( colpkr ) {
							jQuery( '.color-set' ).fadeIn( 500 );
							return false;
						}
					,	onHide: function ( colpkr ) {
							jQuery( '.color-set' ).fadeOut( 500 );
							return false;
						}
					,	onChange: function ( hsb, hex, rgb ) {
							jQuery( '.selected' ).css( 'backgroundColor', '#' + hex );
						}
        		});

	    		realPosition = jQuery( '#draw-zone' ).offset();
				yc = realPosition.top;
				xc = realPosition.left;

		        if ( event.which == 1 ) {
					if ( sessionStorage.pin == 0 ) { 
						var x = event.pageX - xc;
						var y = event.pageY - yc;
						switch ( sessionStorage.boxType ) {
							case 'img':
								var div = document.createElement( 'img' );
								div.src = 'http://fc05.deviantart.net/fs6/i/2005/100/1/0/Master_Universe_by_ANTIFAN_REAL.jpg';
							break;
							case 'iframe':
								var div = document.createElement( 'div' );
								jQuery( div ).addClass( 'embedded-video' );
							break;
							case 'video':
								var div = document.createElement( 'video' );
							break;
							default:
								var div = document.createElement( 'div' );
							break
						}
						jQuery( div ).addClass( 'box pulsar-zone-' + i );
						jQuery( div ).attr( 'boxname', '.pulsar-zone-' + i );
						jQuery( div ).attr( 'id', 'pulsar-zone-' + i );
						jQuery( div ).attr( 'boxnumber', i );
						i++;
						div.style.position = 'absolute';
						div.style.zIndex = 3;
						div.style.left = x + 'px';
						div.style.top = y + 'px';
						div.style.backgroundColor = 'rgba(0, 125, 230, .85)';
						div.style.overflow = 'hidden';
						drawZone.appendChild( div );
						drawZone.onmousemove = function ( event ) {
							div.style.width = ( event.pageX - xc - x ) + 'px';
							div.style.height = ( event.pageY - yc - y ) + 'px';
						}
						drawZone.onmouseup = function() {
							sessionStorage.pin = 1;
							drawZone.onmousemove = false;
						}
					}else{
						// sessionStorage.pin = 0;
						drawZone.onmousemove = false;
						drawZone.onclick = false;
					}
				}

				/**
				 * Attach the content to the action trigger. Use for context menu
				 */
				
				jQuery( '.box' ).bind( 'mousemove', function () {
					sessionStorage.selector = jQuery( this ).attr( 'boxname' );
				});

				jQuery( '.box' ).bind( 'click', function () {
					// pin = 1;
					jQuery( '.box:not(' + sessionStorage.selector + ')').removeClass('selected');
					jQuery( this ).addClass('selected');

					jQuery.pep.toggleAll( true );
					var el = jQuery( '.selected' );
					el.css({
						cursor: 'move'
					});
					el.pep({
						droppable:   '.box',
					  	// drag: function(ev, obj){
					  	// }
					});

					// view the tool
					jQuery( '.colors .sub-tools' ).show();
				});

				sessionStorage.theme = jQuery( '.draw-zone' ).html();
				
				Mousetrap.bind( [ 'enter' ], function() {
					// pin = 0;
					jQuery( '.box' ).removeClass('selected').css({ cursor: 'default' });
					jQuery.pep.toggleAll( false );
					jQuery( '.colors .sub-tools' ).hide();
				});

				jQuery( '.selected' ).dblclick( function () {
					jQuery( '.box' ).removeClass('selected').css({ cursor: 'default' });
					jQuery.pep.toggleAll( false );
					jQuery( '.colors .sub-tools' ).hide();
				});
	        }

	        /**
	         * Stop to draw boxes
	         */
	    , 	noDrawBox: function() {
	    		console.log( 'noDrawBox' );
	    		drawZone.onclick = false;
	    		drawZone.onmousedown = false;
	    	}

	        /**
	         * New Draw
	         */
	    , 	newDraw: function( e ) {

	    		e.preventDefault();
	    		// Variables
	    		var drawName = jQuery( 'input[name="theme_name"]' ).val()
	    		,	drawWidth = jQuery( 'input[name="theme_width"]' ).val()
	    		,	drawHeight = jQuery( 'input[name="theme_height"]' ).val()
	    		,	drawZone = jQuery( '.draw-zone' )
	    		,	newDrawAlert = '.new-draw-alert'
	    		,	winWidth = jQuery( window ).width()
	    		,	winHeight = jQuery( window ).height();

	    		if( ! drawName || ! drawWidth || ! drawHeight  ) {

	    			jQuery( newDrawAlert )
	    				.removeClass( 'info' )
	    				.addClass( 'warning' )
	    				.html( 'Pls, complete all the fields.' );

	    			jQuery( '.notifications input[required]' ).each( function() {

	    				if( jQuery( this ).val() == '' ) {
	    					jQuery( this ).addClass( 'danger' );
	    				}

	    				else if( jQuery( this ).val() != '' ) {
	    					jQuery( this ).removeClass( 'danger' );
	    				}
	    			});
	    			return;
	    		}
	    		else if( drawName && drawWidth && drawHeight ) {

	    			jQuery( '.notifications input[required]' ).removeClass( 'danger' )

	    		}


	    		if( jQuery( newDrawAlert ).hasClass( 'warning' ) ) {

	    			jQuery( newDrawAlert )
	    				.addClass( 'info' )
	    				.removeClass( 'warning' )
	    				.html( ' Your draw will be centered on your website. ' );

	    		}

	    		this.closeModal();

	    		jQuery( '#loading' ).show();

	    		// Set the draw-zone
	    		setTimeout( function() {
	    			jQuery( '#loading' ).hide();

	    			jQuery( '.main-panel' ).height( winHeight );

		    		drawZone.css({
		    				height: drawHeight
		    			// ,	marginLeft: - ( drawWidth / 2 + 75 )
		    			,	marginLeft: - ( drawWidth / 2 )
		    			,	marginTop: - ( drawHeight / 2 )
		    			,	width: drawWidth
		    			,	zoom: '100%'
		    		}).show();

		    		// if( drawWidth > ( winWidth - 250 ) || drawHeight > ( winHeight - 50 ) ) {
		    		// 	drawZone.css({ 
		    		// 		zoom: '66%'
		    		// 	});
		    		// }

		    		jQuery( '.zoom input' ).val( Math.ceil( drawZone.css( 'zoom' ) * 100 ) );

		    		// Stablish name for draw

		    		sessionStorage.drawname = drawName;

		    		// History.pushState( {}, null, '/draw/' + drawName ); // window.location.origin before '/'

	    		},1500);
	    		
	    	}

	        /**
	         * Set drawer
	         */
	    , 	setDrawer: function() {
	    		jQuery( '.notifications' ).foundation('reveal', 'open');
	    	}

	        /**
	         * New Box
	         */
	    , 	newBox: function() {
				sessionStorage.pin = 0;
				sessionStorage.boxType = 'box';
				drawZone.onmousedown = this.drawBox;
			}

	        /**
	         * New Image
	         */
	    , 	newImage: function() {
				sessionStorage.boxType = 'img';
				drawZone.onclick = this.drawBox;
			}

	        /**
	         * New Video
	         */
	    , 	newVideo: function() {
				sessionStorage.boxType = 'video';
				drawZone.onclick = this.drawBox;
			}

	        /**
	         * New Video from Youtube
	         */
	    , 	newExternalVideo: function() {
				sessionStorage.boxType = 'iframe';
				drawZone.onclick = this.drawBox;
			}

	        /**
	         * New text from font
	         */
	    , 	newText: function() {
				sessionStorage.boxType = 'span';
				drawZone.onclick = this.drawBox;
			}
	
			/**
			 * Use for give border radius to the element
			 */
		,	radius: function ( e ) {
				e.preventDefault();
				this.noDrawBox;
				var el = jQuery( sessionStorage.selector );
				el.css({
					borderRadius : '50%'
				});
			}

			/**
			 * Use for remove an specific element from the drawer-zone
			 */
		,	removeBox: function ( e ) {
				// e.preventDefault();
				this.noDrawBox;
				var el = jQuery( '.selected' );
				el.remove();
			}

			/**
			 * Use for move an specific element from the drawer-zone
			 */
		,	moveBox: function ( e ) {
				e.preventDefault();
				// this.noDrawBox;
				jQuery.pep.toggleAll( true );
				var el = jQuery( '.selected' );
				el.css({
					cursor: 'move'
				});
				el.pep({
					droppable:   '.box',
				  	// drag: function(ev, obj){
				  	// }
				});
			}

			/**
			 * Use for move an specific element from the drawer-zone
			 */
		,	cloneBox: function ( e ) {
				e.preventDefault();
				this.noDrawBox;
				var el = jQuery( '.selected' )
				,	valNumber = parseInt( el.attr( 'boxnumber' ) )
				,	nextVal = parseInt( el.attr( 'boxnumber' ) ) + 1;

				el.clone().attr( { 'boxname': '.pulsar-zone-' + nextVal, 'boxnumber': nextVal } )
					.addClass( 'pulsar-zone-' + nextVal )
					.removeClass( 'pulsar-zone-' + valNumber )
					.appendTo( '.draw-zone' );

				this.moveBox;
			}

		,	contextMenu: function() {
				/**
				 * Context menu
				 */

				context.init({
						fadeSpeed: 50
					,	filter: function ( $obj ){}
					,	above: 'auto'
					,	preventDoubleContext: true
					,	compress: false
				});

				context.attach('.selected', [
						{ header: 'Box Options' }

					,	{
								text: 'Options'
							,	subMenu: [
										{ header: 'Actions'}

									,	{
												text: 'Move'
											,	action: this.moveBox
										}	

									,	{
												text: 'Clone'
											,	action: this.cloneBox
										}

									,	{
												text: 'Remove'
											,	action: this.removeBox
										}	

									,	{
												text: 'Send to back'
											,	action: this.goBack
										}	

									,	{
												text: 'Bring to front'
											,	action: this.goFront
										}	
								]
						}

					,	{
								text: 'Set As'
							,	subMenu: 	[
										{ header: 'Set this box as' }

									,	{
												text: 'Image'
											,	action: this.setToImg
										}

									,	{
												text: 'Slider'
											,	action: this.setToSlide
										}	

									,	{
												text: 'Native Html5 video'
											,	action: this.setToVideo
										}

									,	{
												text: 'embedded-video'
											,	action: this.setToEmbed
										}	

								]
						}	
				]);
			}

			/**
			 * SetToImg
			 * This function prepares the box to been specific type
			 */
		,	setToImg: function () {

				var src = 'http://placehold.it/'
				,	img = '<img src="' + src + jQuery( '.selected' ).width() + 'x' + jQuery( '.selected' ).height() + '" class="img-embed" alt="" />'

				jQuery( '.selected' ).append( img );

				// Create image from draw zone object
				html2canvas(  document.getElementById( "draw-zone" ), {
				    onrendered: function( canvas ) {
				    	canvas.getContext("2d");
				    	// draw to canvas...
						canvas.toBlob( function ( blob ) {
						    // saveAs( blob, sessionStorage.drawname + ".png" );
						});
				    }
				}); // Don't delete
			}

			/**
			 * SetToSlide
			 * This function prepares the box to been specific type
			 */
		,	setToSlide: function ( e ) {

				e.preventDefault();

				var src = 'http://placehold.it/'
				,	id = jQuery( '.selected' ).attr( 'id' )
				,	img = '<img src="' + src + jQuery( '.selected' ).width() + 'x' + jQuery( '.selected' ).height() + '" class="img-embed" alt="" />'
				,	iview = jQuery( '<div id="iview-' + id + '"/>' )
				,	sld1 = jQuery( '<div data-iview:thumbnail="apps/pulsar/public/img/fnd1.jpg" data-iview:image="apps/pulsar/public/img/fnd1.jpg"/>' )
				,	caption1 = '<div class="iview-caption" data-x="0" data-y="0" data-width="400" data-height="300" data-transition="wipeRight" data-speed="700"> Content </div>'
				,	sld2 = jQuery( '<div data-iview:thumbnail="apps/pulsar/public/img/fnd2.jpg" data-iview:image="apps/pulsar/public/img/fnd2.jpg"/>' )
				,	caption2 = '<div class="iview-caption" data-x="70" data-y="70" data-transition="expandLeft">Caption Description</div>';

				// Set the slider size
				iview.width( jQuery( '.selected' ).width() );
				iview.height( jQuery( '.selected' ).height() );

				// Set the slider slides
				sld1.append( caption1 );
				sld2.append( caption2 );

				// Append to iview
				iview.append( sld1 ).append( sld2 );

				// Append to selected div
				jQuery( '.selected' ).append( iview );

				jQuery( '#' + id ).find( '#iview-' + id ).iView();	

				// var blob = new Blob( [ sessionStorage.theme ], { type: "text/html;charset=utf-8" } );

				// Set the savers
				// saveAs( blob, "index.html" );
			}

			/**
			 * SetToVideo
			 * This function prepares the box to been specific type
			 */
		,	setToVideo: function () {
				console.log( 'se hizoc' );
			}

			/**
			 * SetToEmbed
			 * This function prepares the box to been specific type
			 */
		,	setToEmbed: function () {
				console.log( 'se hizod' );
			}

			/**
			 * [copyBox Copy the selected element to the clipboard]
			 */
		,	copyBox: function () {

				var box = sessionStorage.selector;

				if ( jQuery( box ).hasClass( 'disabled' ) ) 
					jQuery( box ).removeClass( 'disabled' );

				sessionStorage.clipboard = box;
			}

			/**
			 * [copyBox Cut the selected element and put in to the clipboard]
			 */
		,	cutBox: function() {

				var box = sessionStorage.selector;

				jQuery( box ).addClass( 'disabled' );

				sessionStorage.clipboard = box;
			}

			/**
			 * Attach the content of clipboard to the selected box
			 */
		,	pasteBox: function() {

				var pasteVal = sessionStorage.clipboard
				,	pasteIn = sessionStorage.selector;

				jQuery( pasteVal ).appendTo( pasteIn );

				jQuery( pasteVal ).css( {
						left: 0
					,	top: 0
				} );

				if ( jQuery( pasteVal ).hasClass( 'disabled' ) ) 
					jQuery( pasteVal ).removeClass( 'disabled' );

			}

			/**
			 * New Draw Modal
			 */
		,	newDrawModal: function() {

				jQuery( '.notifications' ).foundation('reveal', 'open');

			}

			/**
			 * Close modals
			 */
		,	closeModal: function() {

				jQuery( '.pulsar-modal' ).foundation( 'reveal', 'close' );

			}

			/**
			 * Actions menu
			 */

		,	goFront: function () {
				jQuery( '.selected' ).css({
					zIndex: parseInt( jQuery( '.selected' ).css( 'z-index' ) ) + 1
				});
			}

		,	goBack: function () {
				jQuery( '.selected' ).css({
					zIndex: parseInt( jQuery( '.selected' ).css( 'z-index' ) ) - 1
				});
			}

			/**
			 * zoom plus
			 */
		,	zoomPlus: function() {
				jQuery( '.zoom input' ).val( 100 );
				jQuery( '.draw-zone' ).css({
			    		zoom: 100 + '%'
			    });
			}

		, 	zoom: function( e ) {
				e.preventDefault();
				jQuery( '.zoom input' ).on( 'change', function () {
				    jQuery( '.draw-zone' ).css({
				    		zoom: jQuery( this ).val() + '%'
				    });
				});
			}

			/**
			 * Realtime
			 */
			
		,	sendMessage: function () {
			  	counter++;

			  	// Creates a xRTML message
			 	var xrtmlMessage = xRTML.MessageManager.create({
			 	    trigger: 'newMessage',
			 	    action: 'insert',
			 	    data: {
			 	        count: counter
			 	    }
			 	});

			  	// Sends the message
				xRTML.ConnectionManager.sendMessage({
				  	connections: ['myConn'],
				  	channel: 'my_channel',
				  	content: xrtmlMessage
				});
			}

	});

	// Create instance
	var myView = new View();

}
