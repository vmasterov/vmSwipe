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
  
      NONE = 'none',
  
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
  
  var position = {};
  
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
        currentDistance = 0,
        direction = null,
        currentDirection = null,
        duration = 0,
        startPosition = 0;
    
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
    
    // Add wrapper
    wrapContent( element );
    var innerWrapper = element.find( '.vm-swipe-inner' );
    
    // Add item classes
    element.children().addClass( 'vm-swipe-item' );
    
    // var elementWidth = element.outerWidth();
    // console.log( elementWidth );
    // debugger;
    
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
      event.preventDefault();
      event = event.originalEvent ? event.originalEvent : event;
      
      var touches = event.touches;
      event = touches ? touches[0] : event;
      
      phase = PHASE_START;
      
      distance = 0;
      direction = null;
      currentDirection = null;
      duration = 0;
      
      getCurrentPosition();
      createFingerData( event );
      
      startTime = getTimeStamp();
      
      // element.on( 'touchend mouseup', touchEnd );
      // element.on( 'touchmove mousemove', touchMove );
      $( document ).on( 'touchend mouseup', $.proxy( touchEnd, element ) );
      $( document ).on( 'touchmove mousemove', $.proxy( touchMove, element ) );
    }
    
    function touchMove( event ){
      // event.preventDefault();
      event = event.originalEvent ? event.originalEvent : event;
      
      var touches = event.touches;
      event = touches ? touches[0] : event;
      
      updateFingerData( event );
      endTime = getTimeStamp();
      phase = PHASE_MOVE;
      // direction = calculateDirection( fingerData.start, fingerData.end );
      currentDirection = calculateDirection( fingerData.last, fingerData.end );
      // distance = calculateDistance( fingerData.start, fingerData.end );
      currentDistance= calculateDistance( fingerData.end, fingerData.last );
      duration = calculateDuration();
      // getCurrentPosition();
      
      changePosition( innerWrapper, currentDirection, currentDistance );
    }
    
    function touchEnd( event ){
      // element.off( 'touchmove mousemove', touchMove );
      // element.off( 'touchend mouseup', touchEnd );
      $( document ).off( 'touchmove mousemove', $.proxy( touchMove, element ) );
      $( document ).off( 'touchmove mousemove', $.proxy( touchEnd, element ) );
    }
    
    winWidthResize( null, function(){
      // elementWidth = element.outerWidth();
      changeHorizontalPosition( innerWrapper, innerWrapper.outerWidth() );
    });
    
    
    
    // Helpers
    function winWidthResize( context, func ){
      var timerId,
          windowWidth = $( window ).width(),
          arg = [].slice.call( arguments, 2 );
      
      $( window ).resize( function(){
        if ( windowWidth === $( window ).width() ) return;
        if( timerId ) clearTimeout( timerId );
        
        windowWidth = $( window ).width();
        
        // This function was called once after resize event
        timerId = setTimeout( function(){
          func.apply( context, arg );
          clearTimeout( timerId );
        }, 150);
      });
    }
    
    function getCurrentPosition(){
      if( supports.transform ){
        position = innerWrapper.css( 'transform' ).replace( /.*\(|\)| /g, '' ).split( ',' );
        position = {
          x: +position[position.length === 16 ? 12 : 4],
          y: +position[position.length === 16 ? 13 : 5]
        };
      }
      else{
        position = innerWrapper.position();
        position = {
          x: +position.left,
          y: +position.top
        };
      }
    }
    
    function wrapContent( element, wrapper ){
      element.contents().wrapAll( createWrapper() );
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
    
    function createWrapper(){
      var wrapper = $( '<div />',{
        'class': 'vm-swipe-inner'
      });
      wrapper.css({
        'width': getWrapperWidth( element ),
        'transform': 'translate3d(0px, 0px, 0px)'
        
      });
      return wrapper;
    }
    
    function changePosition( innerWrapper, currentDirection, currentDistance ){
      var dist = ( currentDirection === 'left' || currentDirection === 'down' ) ? -currentDistance : currentDistance,
          wrapperHeight;
      
      if( currentDirection === 'up' || currentDirection === 'down' ) return;
      
      if( currentDirection === 'left' || currentDirection === 'right' ){
        position.x += dist;
        changeHorizontalPosition( innerWrapper, innerWrapper.outerWidth() );
      }
    }
    
    function changeHorizontalPosition( innerWrapper, wrapperWidth ){
      if( position.x > 0 )
      {
        position.x = 0;
        console.log( 'position.x = 0;' );
      }
      // if( Math.abs( position.x ) > ( wrapperWidth - elementWidth ) )
      if( Math.abs( position.x ) > ( wrapperWidth - element.outerWidth() ) )
      {
        // position.x = -( wrapperWidth - elementWidth );
        position.x = -( wrapperWidth - element.outerWidth() );
        console.log( 'position.x = big' );
      }
      
      innerWrapper.css({ 'transform': 'translate3d(' + position.x  + 'px, 0px, 0px)' });
    }
    
    function support( values ){
      var styles = $( '<support />' ).get( 0 ).style;
      $.each( values, function( key, value ){
        if( styles[key] !== undefined ) values[key] = true;
      });
    }
    
    function getTimeStamp() {
      return new Date().getTime();
    }
    
    function calculateDirection( startPoint, endPoint ){
      if( comparePoints( startPoint, endPoint ) ) return NONE;
      
      var angle = calculateAngle( startPoint, endPoint );
      
      if( ( angle <= 45 ) && ( angle >= 0 ) ) return LEFT;
      else if( ( angle <= 360 ) && ( angle >= 315 ) ) return LEFT;
      else if( ( angle >= 135 ) && ( angle <= 225 ) ) return RIGHT;
      else if( ( angle > 45 ) && ( angle < 135 ) ) return DOWN;
      else return UP;
    }
    
    function comparePoints( pointA, pointB ){
      return ( pointA.x === pointB.x && pointA.y === pointB.y );
    }
    
    function calculateAngle( startPoint, endPoint ){
      var x = startPoint.x - endPoint.x,
          y = endPoint.y - startPoint.y,
          r = Math.atan2( y, x ), //radians
          angle = Math.round( r * 180 / Math.PI ); //degrees
      
      // console.log( angle );
      //ensure value is positive
      if( angle < 0 ) angle = 360 - Math.abs(angle);
      
      return angle;
    }
    
    function calculateDistance( startPoint, endPoint ) {
      return Math.round( Math.sqrt( Math.pow( endPoint.x - startPoint.x, 2 ) + Math.pow( endPoint.y - startPoint.y, 2 ) ) );
    }
    
    function calculateDuration() {
      return endTime - startTime;
    }
  }
  
})( jQuery );