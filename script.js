Ink.requireModules(["Ink.Dom.Loaded_1", "Ink.Dom.Event_1", "Ink.UI.SlideDeck_1"], function(Loaded, Event, SlideDeck) {
    Loaded.run(function() {
        var slider = new SlideDeck("#slidedeck");

        var socket = io.connect('/webrtc');
        var num_slider = 0;
        var is_sync = 1;

        socket.on('move', function(data) {
            if (("current_slider" in data) && (data.current_slider !== null)) {

                if (data.current_move !== 'slide') {

                    switch (data.current_move) {
                        case 'next':
                        case 'previous':
                            Event.fire(document, data.current_move);
                            break;
                        default:
                            return;
                    }

                } else {
                    Event.fire(document, 'slide', {
                        slide: data.current_slider
                    });
                }
            }
            // $.deck('go',data.current_slider );
        });

        Event.observe(document, 'dataavailable', function(event) {

            if (event.eventName === 'slide') {
                socket.emit('move', {
                    'new_move': 'slide',
                    'new_slider': slider.slideControl.current
                });
            } else {
                socket.emit('move', {
                    'new_move': event.eventName,
                    'new_slider': slider.slideControl.current
                });
            }
        });
    });
});