/**
*
*
* Utility helper
*
*/
( function( $, window, document, undefined ) {

	var UtilityHelper = function( a ) {

        //Array which will hold the sources of the images uploaded as additional
        this.smtImagesArray = [];

        //Array storing the source of the attachment, it is supposed to be just one
        // however we'll keep this as an array in the case we handle more than one attachment
        this.smtAttachmentsArray = [];

        //Array storing the tags of the current post, it is supposed to be as many tags as you need
        // that's why we'll keep this as an array in the case we handle more than one attachment
        this.smtDataTags = [];

        // Array storing last selected featured image
        this.smtFeaturedImage = '';

        // Store the value of the tags
        this.activeCategory = 'cat-graphic';

        // Store the list id for suggestion
        this.suggestList = 0;

        // Array of IDs for the bundle items
        this.premiumBundleItems = [];

        // we'll merge the categories data objects with the default object which holds the values that all the objects
        // share: Featured image, attachment, Additional Images

        /**
        * Hanle global notification close
        */
        this.handleGlobalNotificationClose();

        // Prototype month names
        this.protoMonthsNames();

        // Use jQuery noconflict
        $.noConflict();

        // Mustache templates cache
        this.mustacheCache = {};

	};

	UtilityHelper.prototype = {


            // Initializes some functions

            initialize: function() {

                this.toggleModal();
                this.timeAgo();
            }

    		/**
            * Helps in the process of making a ajax requests
            *
            * @param { object } Options for configuring the ajax request
            * @param { object } data object to be sent
            */
    	,	ajax: function( options, data ) {

                var result
                ,   defaults = {
                        type: 'post'
                    ,   url: window.aUrl
                    ,   data: data
                    ,   async: false
                    ,   success: function( data ) {
                                result = data;
                        }

                    ,   error: function ( XMLHttpRequest, textStatus, errorThrown ) {
                                console.log( "error :" + XMLHttpRequest.responseText );
                        }
                    }

                // Merge defaults and options
                options = $.extend( {}, defaults, options );

                // Do the ajax request
                $.ajax( options );

                // Return the response object
                return result;

            }

            /**
            * Sends an AJAX request to the database
            * in the specified `url` passing it `data` and
            * after that, triggers `event`
            *
            *   sync( 'wordpress_action', 'eventToTrigger', this, { arg1: 'value' } );
            *
            * @param { string } WordPress action name
            * @param { string } Event to trigger
            * @param { instance } instance
            * @return { obj } additional arguments
            */
        ,   sync: function( action, event, context, plusArgs ) {

                event || ( event = '' )
                var data = $.extend( {}, context.attributes, plusArgs, { action: action  } );

                for ( k in data ) {
                    if ( k == 'action' ) continue;
                    data[ k ] = JSON.stringify( data[ k ] );
                }

                options = {
                        async: true
                    ,   url: window.aUrl
                    ,   dataType: 'json'
                    ,   success: function( data ) {

                            if ( typeof context.attributes == 'object' ) {
                                return context.trigger( event, context.attributes, data );
                            }

                            return context.trigger( event, context.attributes, data );
                        }
                };

                return this.ajax( options, data );

            }


            /**
             * Little wrapper on $.post.
             *
             * @return { void }
             */
        ,   post: function( action, data, callback ) {

                var data = $.extend( {}, { action: action }, data );

                this.ajax(
                    {       async: true
                        ,   success: callback
                        ,   dataType: 'json'
                }, data );

            }



            /**
            * Shows a global notification whith a message and a icon of success or failure
            *
            * @param { string text } ( Message to be displayed )
            * @param { string link } ( Link not currently used )
            * @param { string type } ( Success or failure )
            */
        ,   showGlobalNotification: function( text, link, type, callback, timeout ) {

                var gNotification = '.global-notifications'
                ,   message = '.message'
                ,   messageType = '.type'
                ,   icon = '.global-notification-icon'
                ,   timeOut = timeout;


                // Set the message
                $( gNotification ).find( message ).text( text );


                // Clean the icon and global notification
                $( gNotification ).find( icon ).removeClass( 'icon-ok icon-remove icon-spinner' );
                $( gNotification ).removeClass( 'failure loading' );

                // Set icon
                if ( type === 'success' ) {
                   // $( gNotification ).find( icon ).addClass( 'icon-ok' );
                }
                else if ( type === 'failure' ) {
                    // $( gNotification ).find( icon ).addClass( 'icon-remove' );
                    $( gNotification ).addClass( 'failure' );
                }
                else if ( type === 'loading' ) {
                    $( gNotification ).find( icon ).addClass( 'icon-spinner' );
                    $( gNotification ).addClass( 'loading' );
                }

                // Center the global notification to the middle of the screen
                var windowWidth = $( window ).width()
                ,   windowHalf = windowWidth / 2
                ,   notificationHalf = $( gNotification ).width() / 2
                ,   notificationLeft = windowHalf - notificationHalf;

                $( gNotification ).css( 'left', notificationLeft + 'px' );

                $( gNotification ).show();

                // Hide global notifications after 10 secs
                if( timeOut != 0 ) {
                    setTimeout( function() {

                        $( gNotification ).fadeOut( function() {
                            $( gNotification ).find( message ).text( '' )
                        });

                        if ( callback !== null ) {
                            callback.call();
                        }

                    }, timeOut );
                }


            }

            /**
            * Show a global notification.
            *
            * @param { str } Notification text.
            * @param { str } type of notification.
            * @param { int } Duration
            */
        ,   alert: function( text, type, callback, timeout ) {

                ( timeout ) ? timeout : 5000;

                var fn = callback || null;

                if ( typeof type == 'undefined' ) type = 'success';
                return this.showGlobalNotification( text, '', type, fn, timeout );

            }

            /**
             * Close the global notification
             *
             * @param { fn } Callback
             * @return { void }
             */
        ,   closeAlert: function( fn ) {

                var gNotification = '.global-notifications';

                $( gNotification ).hide();
                if ( typeof fn == 'function' )  {
                    fn();
                }

            }


            /**
            * Shows a global notification whith a message and a icon of success or failure
            *
            * @param { string text } ( Message to be displayed )
            * @param { string link } ( Link not currently used )
            * @param { string type } ( Success or failure )
            * text, link, type, callback, timeout, top, left
            */
        ,   showGlobalNotificationUpdated: function( args ) {

                var gNotification = '.global-notifications'
                ,   message = '.message'
                ,   messageType = '.type'
                ,   success = '.icon-ok'
                ,   failure = '.icon-bell'
                ,   loading = '.icon-refresh'
                ,   timeOut = args.timeout || 10000
                ,   top = args.top || ""
                ,   left = args.left || "";

                // Set the message
                $( gNotification ).find( message ).html( args.text )


                // Set icon
                if ( args.type === 'success' )
                     $( gNotification ).find( success ).css( 'display', 'inline-block' )

                else if ( args.type === 'failure' )
                      $( gNotification ).find( failure ).css( 'display', 'inline-block' )

                else if ( args.type === 'loading' )
                      $( gNotification ).find( loading ).css( 'display', 'inline-block' )


                $( gNotification )
                    .addClass( "centered" )
                    .css({ "top": top, "margin-left": left })
                    .show();

                // Hide global notifications after 10 secs
                setTimeout( function() {

                    $( gNotification ).fadeOut( function() {
                        $( gNotification ).find( message ).text( '' );
                        $( gNotification ).find( success + ', ' + failure ).hide();
                        $( gNotification ).css({ "top": "", "margin-left": "" })
                            .removeClass( "centered" );
                    })

                    if ( args.callback != null ) {
                        args.callback.call();
                    }

                }, 10000 )


            }


            // Create the thumbnail for the uploaded images
        ,   createImageThumb: function( imgPath, id ) {

                if ( imgPath == null ) {
                    imgPath = '';
                }

                var thumbsContainer = $( '#bp-smt-img-dragger' )
                ,   bpImageTemplate = "<div class='bp-smt-uploads-image-item item-number-" + id + "'>" +
                                        "<img src='" + imgPath +  "'>" +
                                        "<div class='bp-smt-uploads-image-loader'>" +
                                            "<div class='bp-smt-uploads-image-progress'></div>" +
                                        "</div>" +
                                     "</div>"
                ,   preview = $( bpImageTemplate )

                ,   previewImage = $( 'img', preview )

                // Define image width and height
                previewImage.width = 80
                previewImage.height = 70

                // Append the preview to the dropbox-> bpImagesDragger
                preview.appendTo( thumbsContainer );

                return preview;
            }

            /**
            * Checks whether the response happens to be an error
            * based on the status
            *
            * @param { object } ajax response object
            * @return { bool }
            */
        ,   isAjaxError: function( data ) {

                if ( data.status == 200 ) {
                    return false;
                }
                else {
                    return true;
                }

            }

        ,   refreshPage: function() {

                location.reload( true )
            }

        ,   popover: function( el, elClass ,content, title ) {

                var popoverBox = '<div class="popover top popover-bppl ' + elClass + '"></div>'
                ,   popover = '.popover-bppl'
                ,   arrow = '<div class="arrow"></div>'
                ,   setTitle = '<h3 class="popover-title">' + title + '</h3>'
                ,   setContent = '<div class="popover-content">' + content + '</div>';

                // Popover
                $( el ).append( popoverBox );

                // Popover markup constructor
                $( popover )
                    .html( arrow + setTitle + setContent );

                $( popover ).show();
            }

            /**
            * Converts a cammelcased string to underscore one
            */
        ,   cammelCaseToUnderscore: function( string ) {

                return string.replace( /([A-Z])/g, function( $1 ) {

                    return "_" + $1 . toLowerCase();
                });
            }

            /**
            * Converts a cammelcased string to a spaced one.
            * `sampleStringHere` => `sample string here`
            */
        ,   cammelCaseToSpace: function( string ) {

                return string.replace( /([A-Z])/g, function( $1 ) {
                    return " " + $1 . toLowerCase();
                });
            }

            /**
            * Converts a cammelcased string to dashed one one
            * `sampleString`, `sample-string`
            */
        ,   cammelCaseToHyphen: function( string ) {

                return string.replace( /([A-Z])/g, function( $1 ) {

                    return "-" + $1 . toLowerCase();
                });
            }

            /**
            * Converts a dashed string `sample-string` to a
            * cammelcased one ``
            */
        ,   hyphenToCamelCase: function( string ) {

                return string.replace( /([-][a-z])/g, function( $1 ) {

                    return $1[ 1 ] . toUpperCase();
                });
            }

            /**
            * Converts hiphens to underscores
            */
        ,   hyphenToUnderscore: function( string ) {
                return string.replace( /([-])/g, function( $1 ) {

                    return "_";

                });
            }


            /**
            * Parses the content of a file and adds the nofollow rel to
            * all the links in the content
            */
        ,   parseAddNoFollow: function( string ) {

                return string.replace( /<a[^>]/g, function( $1 ) {

                    return '<a rel="nofollow" ';
                });
            }

            /**
            * Replaces spaces for hyphens
            * @param { string }
            */
        ,   spacesToHyphen: function( string ) {

                return string.replace( / /g, function( $1 ) {

                    return '_';
                });

            }

            /**
            * Replaces hyphes with spaces
            * @param { string }
            */
        ,   hyphenToSpace: function( string ) {

                 return string.replace( /([-])/g, function( $1 ) {

                    return " ";

                });
            }

            /**
            * Validate an string with te correct email format and
            * return false if it doesn't match
            */
        ,   validateEmailFormat: function( string ) {

                return this.isEmail( string );
            }

            /**
            * Check whether an string is a correct email
            * @param { str } String to test
            * @return { bool }
            */
        ,   isEmail: function( string ) {

                var emailExpression = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

                return emailExpression.test( string );
            }

            /**
            * Given an array of required fields, this function
            * checks whether the second argument have them
            */
        ,   validateEmptyFields: function( required, objectData, errors ) {


                $.each( required, function( key, value ) {

                    if ( objectData[ value ] == null || objectData[ value ] == "" ) {

                        errors.push( value );

                    }

                });

                return errors;

            }


            /**
            * Extract an object from form fields
            */
        ,   formToObject: function( formSelector, dropEmpty, convertCases ) {

                var object = {}
                ,   _this = this;

                if( convertCases == null || typeof convertCases == 'undefined' ) {
                    convertCases = true;
                }

                $( formSelector + ' :input' ).each(function() {

                    var idInput = $( this ).attr( 'id' )
                    ,   typeInput = $( this ).attr( 'type' )
                    ,   nameAttr = idInput;

                    // Convert the id to javascript variable format
                    if( convertCases && typeof idInput != 'undefined' ){
                        nameAttr = _this.hyphenToCamelCase( nameAttr );
                    }

                    // Validate the type of the element
                    switch ( typeInput ) {

                        case 'text':
                            object[ nameAttr ] = $( this ).val();
                            break;

                        case 'password':
                            object[ nameAttr ] = $( this ).val();
                            break;

                        case 'checkbox':
                            object[ nameAttr ] = $( this ).is( ':checked' );
                            break;

                        case 'radio':
                            nameAttr = $( this ).attr( 'name' );
                            nameAttr = _this.hyphenToCamelCase( nameAttr );
                            if( $( this ).is( ':checked' ) )
                                object[ nameAttr ] = $( this ).val();
                            break;
                    }

                });

                // get the text areas
                $( formSelector + ' textarea' ).each( function(){

                    var nameAttr = $( this ).data( 'name' );

                    if( convertCases ) {
                       nameAttr = _this.hyphenToCamelCase( nameAttr );
                    }

                    object[ nameAttr ] = $( this ).val();

                });


                // Drop empty attributes
                if( dropEmpty ) {

                    $.each( object, function( key, value ) {

                        if( object[ key ] == '' ) {

                            delete object[ key ];
                        }
                    });
                }


                return object;

            }


            /**
            * Removes the mce-data-href from a string
            */
        ,   removeMceHrefAttr: function( string ) {

                return string.replace( /data-mce-href="([^"]*)/g, function( $1 ) {

                    return '';

                });

            }

            /**
            * Turns an element fixed, receives four parameters and places the element
            * passed fixed at the specified topPosition.
            *
            * <code>
            *
            *       // Turn an element fixed at 390 pixels.
            *       utilities.turnFixed( 118, 100, 390, '.selector' );
            *
            * </code>
            *
            * @param { int } Position in which to leave the element when fixed
            * @param { int } left position in which to leave the element when fixed
            * @param { int } scrollTop size in which the element gets fixes
            * @param { string } element selector
            */
        ,   turnFixed: function( topPos, leftPos, fixedAt, selector ) {

                var scrollTop;

                // Bind to scroll event
                $( window ).scroll( function() {

                    scrollTop = $( window ).scrollTop();

                    if ( scrollTop >= fixedAt ) {
                        $( selector ).css({
                                'position': 'fixed'
                            ,   'top': topPos
                        });
                    }

                    else {
                        $( selector ).css({
                                'position': ''
                            ,   'top': ''
                        });
                    }

                });

            }


            /**
            * Trigger a fn when scrollTop is lower than triggerAt
            * otherwise, trigger fn2.
            *
            * @param { int } Where to trigger the first function
            * @param { fn } Function to execute when scrolltop
            *               is greather or equal than the passed.
            * @param { fn } Function to trigger when scrolltop
            *               is lower than the passed.
            * @return { void }
            */
        ,   scrollTopCallback: function( triggerAt, fn, fn2 ) {

                var scrollTop;

                // Bind to scroll event
                $( window ).scroll( function() {

                    scrollTop = $( window ).scrollTop();
                    if ( scrollTop >= triggerAt ) { fn(); }
                    else { fn2(); }

                });

            }

            /**
            * Maps form inputs generated when using serializeArray();
            * pusshes them to an array in a key( name ) value( value ) structure
            *
            * @param { array } serializeArray() generated array
            * @return { array } mapped array
            *
            */
        ,   mapFormInputs: function( data, type, dropEmpty ) {

                var formData = type || []
                ,   _this = this;

                $.each( data, function( key, val ) {

                    replaced = _this.hyphenToUnderscore( val.name );

                    if ( dropEmpty ) {

                        if ( val.value != "" ) {
                            formData[ replaced ] = val.value;
                        }

                        new Image()
                    }

                    else {
                        formData[ replaced ] = val.value;
                    }

                });

                return formData;

            }

            /**
            * Handle global notification closing
            */
        ,   handleGlobalNotificationClose: function() {

                var wrapper = '.global-notifications'
                ,   message = '.message'
                ,   success = '.icon-ok'
                ,   failure = '.icon-bell'
                ,   closeBtn = '.global-notifications-close';



                $( document ).mouseup( function( e ) {

                    if ( $( wrapper ).has( e.target ).length === 0 ) {
                        $( wrapper ).hide();
                        $( wrapper ).find( message ).text( '' );
                        $( wrapper ).find( success + ', ' + failure ).hide();
                        $( wrapper ).css({ "top": "", "margin-left": "" })
                            .removeClass( "centered" );

                    }

                });

                // CLose Button
                $( closeBtn ).click( function( e ) {

                    $( wrapper ).hide();
                        $( wrapper ).find( message ).text( '' );
                        $( wrapper ).find( success + ', ' + failure ).hide();
                        $( wrapper ).css({ "top": "", "margin-left": "" })
                            .removeClass( "centered" );


                });


            }

            /**
            * Hides an element when it is clicked outiside
            * @param { string } string for the jQuery selector like: ".my-class"
            * @return { null }
            */
        ,   closeOnClickOut: function( selector, callback ) {

                $( document ).mouseup( function( e ) {

                    if ( ! $( selector ).is( ":visible" ) ) {
                        return;
                    }

                    if ( $( selector ).has( e.target ).length === 0 ) {

                        $( selector ).hide();
                        if ( callback != null ) {
                            callback.call();
                        }

                    }

                });

            }

            /**
            * Checks whether the passed element has the passed role
            *
            * @param { }
            * @param { }
            * @return {  }
            */
        ,   isRole: function( element, role ) {

                var elemRole = $( element ).data( "role" );

                if ( elemRole == role ) {
                    return true;
                }

                return false;

            }

            /**
            * Inputs match
            * Refactor!
            */
        ,   inputsMatch: function( main, confirm, feedback ) {

                var _this = this;

                $( main ).on( 'keyup', function( e ) {

                    if ( $( confirm ).val() === $( main ).val() && $( main ).val() != '' ) {
                        $( feedback ).text( 'match' ).removeClass('error').addClass( 'success' );
                        _this.formErrors = false;
                    }

                    else {
                        $( feedback ).text( 'not match' ).removeClass('success').addClass( 'error' );
                        _this.formErrors = true;
                    }

                });

                $( confirm ).on( 'keyup', function( e ) {


                    if ( $( main ).val() != '' ) {

                        if ( $( main ).val() === $( confirm ).val() ) {
                            $( feedback ).text( 'match' ).removeClass('error').addClass( 'success' );
                            _this.formErrors = false;
                        }
                        else {
                            $( feedback ).text( 'not match' ).removeClass('success').addClass( 'error' );
                            _this.formErrors = true;
                        }

                    }

                });


            }

            /**
            * Converts an object to a JSON string
            *
            * @param { object }
            * @return { string }
            */
        ,   jsonStringify: function( object ) {

                var string;

                if ( JSON.stringify )  {
                    string = JSON.stringify( object );
                }

                else if ( JSON.encode ) {
                    string = JSON.encode( object );
                }

                return string;

            }


            /*
            * Sanitizes the editor content so that it can be
            * better compared with the original
            *
            * @param { string } content to sanitize
            * @return { string } sanitized content
            */
        ,   sanitizeForkContent: function( string ) {

                return string.replace( /[&]nbsp[;]/gi, function( $1 ) {

                    return " ";

                });

            }

        ,   isTagAddedYet: function( collection, item ) {

                if ( collection.length > 0 ) {

                    if( $.inArray( item, collection ) != -1 ) {

                        this.showGlobalNotification( 'This tag was added previously','', 'failure', null, 3000 );
                        return true;
                    }
                }

                return false;

            }

            /**
            * Resets form inputs
            */
        // ,   resetForm: function( form ) {

        //         $( form ).find( "input:text, input:password, input:file, select, textarea" ).val( "" );
        //         $( form ).find( "input:radio, input:checkbox" )
        //             .removeAttr( "checked" ).removeAttr( "selected" );

        //             // function resetForm( $form ) {
        //             //     $form.find('input:text, input:password, input:file, select, textarea').val('');
        //             //     $form.find('input:radio, input:checkbox')
        //             //         .removeAttr('checked').removeAttr('selected');
        //             // }
        //     }

                /**
                * Clears the inputs of a form
                * @param { object } Selector object for the form
                */
            ,   clearForm: function( form ) {

                    $( form ).find( 'input[type="text"]' ).each( function() {
                        $( this ).val( '' );
                    });

                    $( form ).find( 'input[type="password"]' ).each( function() {
                        $( this ).val( '' );
                    });

                    $( form ).find( 'textarea' ).each( function() {
                        $( this ).val( '' );
                    });
                }

                /**
                * Gets the form data
                * @param { obj || str } form object or selector
                * @return { obj } mapped form
                */
            ,   getFormData: function( form, dropEmpty ) {

                    var data, off, name
                    ,   _this = this;

                    if ( dropEmpty == null ) {
                        dropEmpty = true;
                    }

                    data = $( form ).serializeArray();
                    data = this.mapFormInputs( data, {}, dropEmpty );

                    $.each( data, function( key, value ) {
                        if ( value == "on" ) {
                            data[ key ] = true;
                        }
                    });

                    // Check for empty values
                    $( form ).find( "input[type=checkbox]" ).each( function() {
                        if ( ! $( this ).is( ":checked" ) ) {

                            name = $( this ).attr( "name" );
                            name = _this.hyphenToUnderscore( name );

                            // Unchecked
                            off = $( this ).data( 'off' );

                            if ( typeof off != 'undefined' ) {
                                data[ name ] = off;

                            } else {
                                data[ name ] = false;
                            }

                        }

                    });

                    return data;

                }


                /**
                * Add useful atributes to the Date class
                */
            ,   protoMonthsNames: function() {

                    // Prototype Date function
                    Date.prototype.getMonthName = function() {
                        return Date.monthsNames[ this.getMonth() ];
                    };

                    Date.prototype.getMonthNameShort = function() {
                        return Date.monthsNamesShort[ this.getMonth() ];
                    }

                    // Add month names
                    Date.monthsNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    Date.monthsNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                }

                /*
                * Cheks whether an string is empty
                *
                * @param { string } string to test
                * @return { bool }
                */
            ,   isEmptyString: function( string ) {

                    // var filter=/^[0-9A-Za-z][A-Za-z0-9_.-]*@[A-Za-z0-9_-]+\.[A-Za-z0-9_.]+[A-za-z]$/;

                }

                /**
                * Adds trim method to the string object
                * if it does not have it
                */
            ,   handleStringTrim: function() {
                    if ( ! ( 'trim' in String.prototype ) ) {
                        String.prototype.trim = function() {
                            return this.replace( /^\s+/, '' ).replace( /\s+$/, '' );
                        };
                    }

                }

                /**
                * Opens a new window in the passed url
                */
            ,   openWindow: function( url, width, height ) {

                    var width = 575
                        height = 400;

                    options = 'status=1'
                            + ',width=' + width
                            + ',height=' + height
                            + ',top='+ ( $( window ).height() - height ) / 2
                            + ',left='+ ( $( window ).width() - width ) /2;

                    window.open( url, 'twitter', options);

                    return false;

                }

                /**
                * Removes an element from an array and
                * Splice it out.
                */
            ,   remove: function( array, item ) {

                    var index = array.indexOf( item );

                    if ( index == -1 ) {
                        return false;
                    }

                    // Delete
                    delete array[ index ];
                    array.splice( index, 1 );

                    return array;
                }

                /**
                * Removes an element from an array if present
                * otherwise, removes it.
                *
                * Remove by ID
                */
            ,   toggle: function( array, item ) {

                    var item = JSON.stringify( item );
                    $.each( array, function( key, val ) {
                        array[ key ] = JSON.stringify( val );
                    });

                    var index = array.indexOf( item );
                    if ( index == -1 ) {
                        array.push( item );
                    }

                    else {
                        array = this.remove( array, item );
                    }

                    // Return affected array
                    $.each( array, function( key, val ) {
                        array[ key ] = JSON.parse( val );
                    });

                    return array;

                }


                /**
                * All treatment for modal window
                */
            ,   toggleModal: function() {

                    var toggle = '.toggle-modal'
                    ,   backdrop = '.modal-backdrop';

                    $( toggle ).click( function( e ) {

                        e.preventDefault();

                        var selector = $( this ).data( 'modal' );

                        $( selector ).toggle();

                        // Reset the event stated in the hidden input `event`
                        // of the forms which is used to trigger such event
                        // when form operation ends.
                        $( selector ).find( 'input[name="event"]' )
                            .each( function() {
                                $( this ).attr( 'value', '' );
                            });

                        $( backdrop ).toggle();

                    });

                    $( backdrop ).click( function( e ) {

                        e.preventDefault();

                        $( this ).hide();
                        $( '.modal' ).hide();
                    });

                    $( document ).keyup( function( e ) {

                        if( e.keyCode == 27 ) {

                            $( '.modal-backdrop' ).hide();
                            $( '.modal' ).hide();
                        }
                    });
                }

            ,   openModal: function( selector ) {

                    $( selector ).toggle();
                    $( '.modal-backdrop' ).toggle();

                }

                /*
                * Calls the passed method with the
                * specified context
                */
            ,   bind: function( fn, context ) {

                    return function() {
                        return fn.apply( context, arguments );
                    }

                }

                /*
                * Prevent the backspace key from navigating back.
                */
            ,   preventBackBrowser: function() {

                    $( document ).keydown( function( e ){
                        if ( e.keyCode == 8 && e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA' ) {
                            e.preventDefault();
                        }
                    });
                }


                /**
                * Get the true hash value. Cannot use location.hash directly due to bug
                * in firefox where location.hash will always be decoded.
                * Adapted from backbone.
                */
            ,   getHash: function() {

                    var match = window.location.href.match( /(.*)$/ );
                    return match ? match[ 1 ] : '';
                }

                // Get normalized URL path without slash at the beginning.
                //
                //      // When URL is: ".com/wordpress/page/1", this method
                //      // will return "wordpress/page/1"
                //      var path = Utilities.getPath();
                //
            ,   getPath: function() {

                    var routeStripper = /^[#\/]|\s+$/g;

                    return History.getState().hash.replace( routeStripper, '' );
                }

                // Update URL path using `pushState`.
                //
                //      // Will set the URL to ".com/wordpress/page/1"
                //      utilities.updatePath( 'wordpress/page/1' );
                //
                //
            ,   updatePath: function( fragment ) {

                    History.pushState( {}, null, '/' + fragment ); // window.location.origin before '/'
                }

                /*
                * Time ago to show the time live
                */
            ,   timeAgo: function() {

                    $( "abbr.time-ago" ).timeago();
                }

                /**
                * Update the hash location by updating the current entry to
                * the browser history.
                * Adapted from backbone `_updateHash`.
                *
                * @param { string } hash to set
                */
            ,   updateHash: function( fragment ) {

                    var location = window.location;
                    var href = location.href.replace( /(javascript:|#).*$/, '' );

                    location.replace( href + '#' + fragment );

                }

                // Set data-src to src on images in a list
            ,   setImageUrl: function( selector ) {

                    $.each( $( selector + ' img' ), function( key, image ) {

                        var dataSrc = $( image ).data( 'src' );

                        $( image ).attr( 'src', dataSrc );

                    });
                }

                /**
                * Pluralize a string.
                *
                * @param { int }
                * @param { string }
                */
            ,   pluralize: function( count, singular, plural ) {

                    if ( plural == null )
                    plural = singular + 's';

                    return ( count == 1 ? singular : plural );
                }


                /**
                * Return a rendered template
                *
                * <code>
                *
                *       // Get template HTML.
                *       var html = utilities.render( 'person', { 'name': 'John' } );
                *
                *       // Use HTML.
                *       $( '.target' ).append( html );
                *
                * </code>
                *
                * @param { str } Template name
                * @param { obj } View object
                * @return { str } Rendered view
                */
            ,   render: function( templateName, data ) {

                    var template = this.mustacheCache[ templateName ]
                    ,   _this = this;

                    if ( ! template ) {

                        $.ajax({
                                url: window.Constants.JSTemplates + templateName + '.mustache'
                            ,   async: false
                            ,   type: 'get'
                            ,   data: null
                            ,   dataType: 'text'
                            ,   success: function( data )  {
                                    template = _this.mustacheCache[ templateName ] = data ;
                                }
                        });

                    }

                    return Mustache.to_html( template, data );
                }

                /**
                 * Get data from tag and return an object
                 * with underscored attribute names
                 *
                 * <code>
                 *
                 *       // Get clicked element data passing
                 *       // "event" as parameter.
                 *       var data = utilities.data( e );
                 *
                 * </code>
                 *
                 * @param { obj } "e" event from click
                 * @return { obj } underscored tag data object
                 */
            ,   data: function( e ) {

                    var target = e.currentTarget
                    ,   _this = this
                    ,   data = $( target ).data()
                    ,   clone = {};

                    $.each( data, function ( k, v ) {
                        clone[ _this.cammelCaseToUnderscore( k ) ] = v;
                    });

                    return clone;
                }

                /**
                 * Shorten a string
                 *
                 * <code>
                 *
                 *     //
                 *
                 * </code>
                 */
            ,   limit: function( string, limit, end ) {

                    if ( typeof end != 'string' ) {
                        end = '...';
                    }

                    if ( typeof string != 'string' )
                        return;

                    if ( string.length <= limit ) {
                        return string;
                    }

                    return string.substring( 0, limit ) + end;

                }

                // Return the passed number of words
            ,   words: function( string, words, end ) {

                    if ( typeof end != 'string' ) {
                        end = '...';
                    }

                    if ( typeof string != 'string' ) {
                        return false;
                    }

                    var parsed = string.split( ' ' ).slice( 0, words ).join( ' ' );

                    if ( parsed.length < string.length )
                        return parsed + end;

                    return parsed;

                }

                // Wrapper on top of console.log, to prevent compatibility
                // issues when on IE
            ,   log: function() {

                    var args = arguments
                    ,   sliced;

                    if ( typeof console === "object" && typeof console.log === "function" ) {

                        sliced = Array.prototype.slice.call( args );

                        // Print using console
                        console.log.apply( console, args );
                    }

                }


                /**
                * API
                */
            ,   API: function() {

                    utilities.get( 'env_category' );

                    // JavaScript API upgrade
                    // ----------------------
                    // Template methods
                    //  - Pluralize

                }


	};

    // Expose utilities to the global scope
    window.Bppl.Helpers.Utilities = new UtilityHelper();

    window.Bppl.Helpers.Utilities.initialize();


})( jQuery, this, this.document );
