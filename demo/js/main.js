( function( $ ){
  // Constants
  var PLUGIN_NS = 'vmSwipe',
      LEFT = 'left',
      RIGHT = 'right',
      UP = 'up',
      DOWN = 'down',
  
      NONE = 'none',
  
      HORIZONTAL = 'horizontal',
      VERTICAL = 'vertical',
  
      PHASE_START = 'start',
      PHASE_MOVE = 'move',
      PHASE_END = 'end',
      PHASE_CANCEL = 'cancel';
  
  var defaults = {
    direction: 'horizontal'
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
    
    var supports = {
      transition: null,
      animation: null,
      transform: null
    };
    
    var position = {
      x: 0,
      y: 0
    };
    
    //touch properties
    var distance = 0,
        currentDistance = 0,
        direction = null,
        currentDirection = null,
        duration = 0,
        speed = 0,
        startPosition = 0;
    
    // Finger data object
    var fingerData = {};
    
    // Direction of swipe (horizontal, vertical, both)
    var swipeDirection = options.direction;
    
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
    // element.children().addClass( 'vm-swipe-item' );
    
    try {
      element.on( 'touchstart.vmswipe mousedown.vmswipe', touchStart );
      element.on( 'touchcancel.vmswipe', touchEnd );
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
    this.destroy = function(){
      removeListeners();
      element.data( PLUGIN_NS, null );
      innerWrapper.children().unwrap();
    };
    this.refresh = function(){
      switch( swipeDirection ){
        case 'horizontal':
          innerWrapper.width( getWrapperWidth( innerWrapper ) );
          position.x = getPosition( innerWrapper.outerWidth(), element.outerWidth(), position.x );
          break;
          
        case 'vertical':
          innerWrapper.height( getWrapperHeight( innerWrapper ) );
          position.y = getPosition( innerWrapper.outerHeight(), element.outerHeight(), position.y );
          break;
          
        case 'both':
          innerWrapper.width( getWrapperWidth( innerWrapper ) );
          innerWrapper.height( getWrapperHeight( innerWrapper ) );
          position.x = getPosition( innerWrapper.outerWidth(), element.outerWidth(), position.x );
          position.y = getPosition( innerWrapper.outerHeight(), element.outerHeight(), position.y );
          break;
      }
  
      innerWrapper.css({ 'transform': 'translate3d(' + position.x  + 'px, ' + position.y  + 'px, 0px)' });
    };
    
    function touchStart( event ){
      event.preventDefault();
      event = event.originalEvent ? event.originalEvent : event;
      
      var touches = event.touches;
      event = touches ? touches[0] : event;
      
      phase = PHASE_START;
  
      distance = 0;
      currentDistance = 0;
      direction = null;
      currentDirection = null;
      duration = 0;
      startTime = 0;
      endTime = 0;
      speed = 0;
  
      element.toggleClass( 'moving', event.type === 'mousedown');
      
      getCurrentPosition();
      createFingerData( event );
      
      // startTime = getTimeStamp();
  
      innerWrapper.stop();
      
      $( document ).on( 'touchend.vmswipe mouseup.vmswipe', $.proxy( touchEnd, element ) );
      $( document ).on( 'touchmove.vmswipe mousemove.vmswipe', $.proxy( touchMove, element ) );
    }
    
    function touchMove( event ){
      event = event.originalEvent ? event.originalEvent : event;
      
      var touches = event.touches;
      event = touches ? touches[0] : event;
      
      updateFingerData( event );
      
      startSwipeTime();
      function startSwipeTime(){
        if( endTime )return;
        startTime = getTimeStamp();
        // console.log( 'endTime:', endTime, 'startTime:', startTime );
      }
      
      endTime = getTimeStamp();
      phase = PHASE_MOVE;
      currentDirection = calculateDirection( fingerData.last, fingerData.end );
      distance = calculateDistance( fingerData.end, fingerData.start );
      currentDistance = calculateCurrentDistance( fingerData.end, fingerData.last );
      
      changePosition( innerWrapper, currentDirection, currentDistance, position );
    }
    
    function touchEnd( event ){
      endTime = getTimeStamp();
      duration = calculateDuration();
      speed = calculateSpeed( distance, duration );
      
      inertia();
      
      // console.log( 'distance:', distance, 'duration:', duration, 'endTime:', endTime, 'startTime:', startTime );
      // console.log( 'speed:', ( speed ).toFixed( 2 ) );
  
      element.removeClass( 'moving' );
      
      $( document ).off( 'touchmove.vmswipe mousemove.vmswipe', $.proxy( touchMove, element ) );
      $( document ).off( 'touchend.vmswipe mouseup.vmswipe', $.proxy( touchEnd, element ) );
    }
    
    winWidthResize( null, function(){
      switch( swipeDirection ){
        case 'horizontal':
          position.x = getPosition( innerWrapper.outerWidth(), element.outerWidth(), position.x );
          break;
    
        case 'vertical':
          position.y = getPosition( innerWrapper.outerHeight(), element.outerHeight(), position.y );
          break;
    
        case 'both':
          position.x = getPosition( innerWrapper.outerWidth(), element.outerWidth(), position.x );
          position.y = getPosition( innerWrapper.outerHeight(), element.outerHeight(), position.y );
          break;
      }
  
      innerWrapper.css({ 'transform': 'translate3d(' + position.x  + 'px, ' + position.y  + 'px, 0px)' });
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
    
    function createWrapper(){
      var wrapper = $( '<div />',{
        'class': 'vm-swipe-inner'
      });
      wrapper.css({
        'width': ( options.direction === 'horizontal' || options.direction === 'both' ) ? getWrapperWidth( element ) : '',
        'height': ( options.direction === 'vertical' || options.direction === 'both' ) ? getWrapperHeight( element ) : '',
        'transform': 'translate3d(0px, 0px, 0px)'
      
      });
      return wrapper;
    }
  
    function getWrapperWidth( element ){
      var width = 0;
    
      element.children().each( function(){
        var it = $( this );
        width += it.outerWidth( true );
      });
    
      return width;
    }
    
    function getWrapperHeight( element ){
      var height = 0;
    
      element.children().each( function(){
        var it = $( this );
        height += it.outerHeight( true );
      });
    
      return height;
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
    
    function changePosition( innerWrapper, currentDirection, currentDistance, position ){
      switch( swipeDirection ){
        case 'horizontal':
          if( currentDirection === 'up' || currentDirection === 'down' ) return;
          position.x += currentDistance.x;
          position.x = getPosition( innerWrapper.outerWidth(), element.outerWidth(), position.x );
          break;
  
        case 'vertical':
          if( currentDirection === 'left' || currentDirection === 'right' ) return;
          position.y += currentDistance.y;
          position.y = getPosition( innerWrapper.outerHeight(), element.outerHeight(), position.y );
          break;
  
        case 'both':
          position.x += currentDistance.x;
          position.y += currentDistance.y;
          position.x = getPosition( innerWrapper.outerWidth(), element.outerWidth(), position.x );
          position.y = getPosition( innerWrapper.outerHeight(), element.outerHeight(), position.y );
          break;
      }
      
      // if( swipeDirection === 'horizontal' ){
      //   if( currentDirection === 'up' || currentDirection === 'down' ) return;
      //   position.x += currentDistance.x;
      //   position.x = getPosition( innerWrapper.outerWidth(), element.outerWidth(), position.x );
      // }
      // if( swipeDirection === 'vertical' ){
      //   if( currentDirection === 'left' || currentDirection === 'right' ) return;
      //   position.y += currentDistance.y;
      //   position.y = getPosition( innerWrapper.outerHeight(), element.outerHeight(), position.y );
      // }
      // if( swipeDirection === 'both' ){
      //     position.x += currentDistance.x;
      //     position.y += currentDistance.y;
      //     position.x = getPosition( innerWrapper.outerWidth(), element.outerWidth(), position.x );
      //     position.y = getPosition( innerWrapper.outerHeight(), element.outerHeight(), position.y );
      // }
      innerWrapper.css({ 'transform': 'translate3d(' + position.x + 'px, ' + position.y + 'px, 0px)' });
    }
    
    function getPosition( wrapperDimensions, elementDimentions, position ){
      if( wrapperDimensions <= elementDimentions ) return 0;
      if( position > 0 ) position = 0;
      if( Math.abs( position ) > ( wrapperDimensions - elementDimentions ) ) position = -( wrapperDimensions - elementDimentions );
      return position;
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
      
      //ensure value is positive
      if( angle < 0 ) angle = 360 - Math.abs(angle);
      
      return angle;
    }
    
    function calculateDistance( startPoint, endPoint ){
      return Math.round( Math.sqrt( Math.pow( endPoint.x - startPoint.x, 2 ) + Math.pow( endPoint.y - startPoint.y, 2 ) ) );
    }
    
    function calculateCurrentDistance( startPoint, endPoint ){
      return {
        x: startPoint.x - endPoint.x,
        y: startPoint.y - endPoint.y
      }
    }
    
    function calculateSpeed( distance, time ){
      return distance / time;
    }
    
    function calculateDuration() {
      var duration;
      if( !startTime ) duration = 0;
      else duration = endTime - startTime;
      return duration;
    }
    
    function removeListeners(){
      $( document ).off( '.vmswipe' );
      element.off( '.vmswipe' );
    }
    
    function inertia(){
      innerWrapper.css({'text-indent': 100});
      innerWrapper.animate({
        textIndent: 0
      },
      {
        duration: speed * 3000,
        step: function( currentStep ){
          // changePosition( innerWrapper, currentDirection, currentDistance, position );
          
          speed *= ( currentStep / 100 );
          var now = getTimeStamp();
          var stepDuration = ( now - endTime );
          endTime = now;
  
          getCurrentPosition();
          var r = ( currentDirection === 'left' ) ? -(speed * stepDuration) : speed * stepDuration;
          var f = {};
          f.x = r;
          // var newLeft = position.x + (-(speed * stepDuration));
          // var newLeft = position.x + r ;
          var newTop = (position.y + (speed * stepDuration));
  
  
          changePosition( innerWrapper, currentDirection, f, position );
          // newLeft = getPosition( innerWrapper.outerWidth(), element.outerWidth(), newLeft );
  
          // innerWrapper.css({ 'transform': 'translate3d(' + newLeft + 'px, 0px, 0px)' });
          
          // console.log( position.x, speed, stepDuration, newLeft );
          console.log( speed * stepDuration, speed , stepDuration );
        }
      });
    }
  }
  
})( jQuery );



// Инерция