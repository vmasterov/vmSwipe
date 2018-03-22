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
  
  var supports = {
    transition: null,
    animation: null,
    transform: null
  };
  
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
        plugin = new VmSwipe( it, options );
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
    
    // Finger data object
    var fingerData = {};
    
    // Support css properties
    support( supports );
  
    //Current phase of th touch cycle
    var phase = "start";
  
    //track times
    var startTime = 0,
        endTime = 0,
        previousTouchEndTime = 0;
  
    // Add item classes
    element.children().addClass( 'vm-swipe-item' );
    
    // Add wrapper
    wrapContent( element );
    
    try {
      element.on( 'touchstart mousedown', touchStart );
      // $element.on(cancelEvent, touchCancel);
    } catch (e) {
      $.error('events not supported ' + startEvent + ',' + cancelEvent + ' on jQuery.swipe');
    }
  
    // Public methods
    this.showData = function(){
      console.log( 'showData: ', $( this ).data( PLUGIN_NS ) );
    };
    this.setData = function( str ){
      console.log( 'Your data is: ' + str );
    };
  
    function touchStart( event ){
      console.log( event.type );
      event = event.originalEvent ? event.originalEvent : event;
  
      phase = PHASE_START;
  
      distance = 0;
      direction = null;
      currentDirection=null;
      duration = 0;
      startTouchesDistance = 0;
      endTouchesDistance = 0;
      
      createFingerData( event );
  
      startTime = getTimeStamp();
      
      element.on( 'touchend mouseup', touchEnd );
      element.on( 'touchmove mousemove', touchMove );
    }
    
    function touchMove( event ){
      updateFingerData( event );
      console.log( event.type, distance, fingerData );
    }
    
    function touchEnd( event ){
      element.off( 'touchmove mousemove', touchMove );
      element.off( 'touchend mouseup', touchEnd );
      console.log( event.type );
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
  
    function wrapContent( element ){
      element.contents().wrapAll( '<div class="vm-swipe-inner" style="width:' + getWrapperWidth( element ) + 'px">' );
    }
  
    function createFingerData( event ) {
      var f = {
        start: {
          x: 0,
          y: 0
        },
        last: {
          x: 0,
          y: 0
        },
        end: {
          x: 0,
          y: 0
        }
      };
      f.start.x = f.last.x = f.end.x = event.pageX || event.clientX;
      f.start.y = f.last.y = f.end.y = event.pageY || event.clientY;
      fingerData = f;
      return f;
    }
  
    function updateFingerData( event ){
      if ( !Object.keys( fingerData ).length ) createFingerData( event );
      
      fingerData.last.x = fingerData.end.x;
      fingerData.last.y = fingerData.end.y;
    
      fingerData.end.x = event.pageX || event.clientX;
      fingerData.end.y = event.pageY || event.clientY;
    
      return fingerData;
    }
  
    function getWrapperWidth( element ){
      var width = 0;
    
      element.children().each( function(){
        var it = $( this );
        width += it.outerWidth( true );
      });
    
      return width;
    }
  
    function support( values ){
      var styles = $( '<support />' ).get( 0 ).style;
      $.each( values, function( key, value ){
        if( styles[key] !== undefined ) values[key] = true;
      });
    }
  
    function getTimeStamp() {
      var now = new Date();
      return now.getTime();
    }
  }
  
})( jQuery );