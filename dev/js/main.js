( function( $ ){
  // Constants
  var PLUGIN_NS = 'vmSwipe',
      VERSION = '10.0',
      LEFT = 'left',
      RIGHT = 'right',
      UP = 'up',
      DOWN = 'down',
      IN = 'in',
      OUT = 'out',

      HORIZONTAL = 'horizontal',
      VERTICAL = 'vertical',

      PHASE_START = 'start',
      PHASE_MOVE = 'move',
      PHASE_END = 'end',
      PHASE_CANCEL = 'cancel';
  
  var defaults = {
    type: 'scroll'
  };
  
  $.fn.vmSwipe = function( method ){
    var it = $( this ),
        plugin = it.data( PLUGIN_NS );
    
    if ( plugin && typeof method === 'string') {
      if( plugin[method] ) return plugin[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
      else $.error( 'Метод с именем ' +  method + ' не существует для jQuery.vmSlider' );
    }
    else if ( plugin && typeof method === 'object' ) plugin['option'].apply( plugin, arguments );
    else if( typeof method === 'object' || !method ) return init.apply( this, arguments );
    
    return it;
  };
  
  $.fn.vmSwipe.defaults = defaults;
  
  function init( options ){
    if ( !options ) options = {};
    options = $.extend( {}, $.fn.vmSwipe.defaults, options );
    
    return this.each( function(){
      var it = $( this );
      
      var plugin = it.data( PLUGIN_NS );
  
      if ( !plugin ) {
        plugin = new VmSwipe( this, options );
        it.data( PLUGIN_NS, plugin );
      }
    });
  }
  
  function VmSwipe( element, options ){
    var options = $.extend( {}, options );
  
    //touch properties
    var distance = 0,
        direction = null,
        currentDirection = null,
        duration = 0,
        startTouchesDistance = 0,
        endTouchesDistance = 0;
  
    //Current phase of th touch cycle
    var phase = "start";
  
    //track times
    var startTime = 0,
        endTime = 0,
        previousTouchEndTime = 0;
    
    var supportsTouch = 'ontouchstart' in window,
        supportsPointer_IE10 = window.navigator.msPointerEnabled && !window.navigator.pointerEnabled && !SUPPORTS_TOUCH,
        supportsPointer = (window.navigator.pointerEnabled || window.navigator.msPointerEnabled) && !SUPPORTS_TOUCH;
    
    var startEvent = supportsTouch ? 'touchstart' : ( supportsPointer ? ( supportsPointer_IE10 ? 'MSPointerDown' : 'pointerdown') : 'mousedown' ),
        moveEvent = supportsTouch ? 'touchmove' : ( supportsPointer ? ( supportsPointer_IE10 ? 'MSPointerMove' : 'pointermove') : 'mousemove' ),
        endEvent = supportsTouch ? 'touchend' : ( supportsPointer ? ( supportsPointer_IE10 ? 'MSPointerUp' : 'pointerup') : 'mouseup' ),
        leaveEvent = ( supportsTouch || supportsPointer ) ? ( supportsPointer ? 'mouseleave' : null) : 'mouseleave',
        cancelEvent = ( supportsTouch ? ( supportsPointer_IE10 ? 'MSPointerCancel' : 'pointercancel' ) : 'touchcancel' );
  
    // Add gestures to all swipable areas if supported
    var $element = $( element );
    
    var eventsHandlers = {};
    eventsHandlers[startEvent + 'Handler'] = true;
    
    try {
      $element.on( startEvent, touchStart );
      // $element.on(cancelEvent, touchCancel);
    } catch (e) {
      $.error('events not supported ' + startEvent + ',' + cancelEvent + ' on jQuery.swipe');
    }
  
    console.log( 'ontouchstart' in window );
  
    winWidthResize( null, function(){
      console.log( 'ontouchstart' in window );
      
      supportsTouch = 'ontouchstart' in window;
      supportsPointer_IE10 = window.navigator.msPointerEnabled && !window.navigator.pointerEnabled && !SUPPORTS_TOUCH;
      supportsPointer = (window.navigator.pointerEnabled || window.navigator.msPointerEnabled) && !SUPPORTS_TOUCH;
  
      startEvent = supportsTouch ? 'touchstart' : ( supportsPointer ? ( supportsPointer_IE10 ? 'MSPointerDown' : 'pointerdown') : 'mousedown' );
      moveEvent = supportsTouch ? 'touchmove' : ( supportsPointer ? ( supportsPointer_IE10 ? 'MSPointerMove' : 'pointermove') : 'mousemove' );
      endEvent = supportsTouch ? 'touchend' : ( supportsPointer ? ( supportsPointer_IE10 ? 'MSPointerUp' : 'pointerup') : 'mouseup' );
      leaveEvent = ( supportsTouch || supportsPointer ) ? ( supportsPointer ? 'mouseleave' : null) : 'mouseleave';
      cancelEvent = ( supportsTouch ? ( supportsPointer_IE10 ? 'MSPointerCancel' : 'pointercancel' ) : 'touchcancel' );
  
      eventsHandlers[startEvent + 'Handler'] = true;
      if( eventsHandlers[startEvent + 'Handler'] ) return;
      
      try {
        $element.on( startEvent, touchStart );
        // $element.on(cancelEvent, touchCancel);
      } catch (e){
        $.error( 'events not supported ' + startEvent + ',' + cancelEvent + ' on jQuery.swipe' );
      }
    });
  
    // Public methods
    this.showData = function(){
      console.log( 'showData: ', $( this ).data( PLUGIN_NS ) );
    };
    this.setData = function( str ){
      console.log( 'Your data is: ' + str );
    };
  
    function touchStart( event ){
      console.log( startEvent, event.type );
    }
  
    // Helpers
    function winWidthResize( context, func ){
      var timerId,
          windowWidth = $( window ).width(),
          arg = [].slice.call( arguments, 1 );
    
      $( window ).resize( function(){
        if ( windowWidth === $( window ).width() ) return;
        if( timerId ) clearTimeout( timerId );
      
        windowWidth = $( window ).width();
      
        // This function was called once after resize event
        timerId = setTimeout( function(){
          console.log( 'winWidthResize' );
          func.apply( context, arg );
          clearTimeout( timerId );
        }, 150);
      });
    }
  }
  
})( jQuery );