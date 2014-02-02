
/**
 *
 */
Ink.createModule("Ink.UI.SyncDeck", "1", ["Ink.Dom.Element_1", "Ink.Dom.Selector_1", "Ink.Dom.Event_1", "Ink.Dom.Css_1", "Ink.Util.Array_1", "Ink.Util.Swipe_1", "Ink.UI.Aux_1"], function(Element, Selector, Event, Css, InkArray, Swipe, Aux) {

    var SyncDeck = function(selector, options) {

        this._element = Aux.elOrSelector(selector, "1st argument");

        this._options = Ink.extendObj({

            slides: 'section',

            /**
             * Custom events to be triggered and listened that will trigger the transitions
             */
            customPreviousEvent: "previous",
            customNextEvent: "next",
            customSlideEvent: "slide",

            /**
             * Classes to be applied for the transition
             */
            classPrevious: "previous",
            classNext: "next",
            classCurrent: "current",

            /**
             * Flags for events (touch events and keyboard events)
             * @type {Boolean}
             */
            supportArrowKeys: false,
            supportTouchEvents: true,

            /**
             * Behavior flags
             */
            cyclicNavigation: false


        }, Element.data(this._element));

        this._options = Ink.extendObj(this._options, options || {});
        this._slides = [];

        this.slideControl = {};
        this.running = false;
        this.stepsVisible = [];
        this.stepsInvisible = [];

        this._handlers = {
            customEvent: Ink.bindEvent(this._customEventHandler, this)
        };

        this._init();
    };

    SyncDeck.prototype = {

        _init: function() {

            this._slides = Ink.ss(this._options.slides, this._element);

            /**
             * Adds touch events handling :)
             */
            if (this._options.supportTouchEvents.toString() === "true") {
                InkArray.each(Ink.ss('.slide', this._element), Ink.bind(function(element) {
                    new Swipe(element, {
                        forceAxis: 'x',
                        minDist: 20,
                        callback: Ink.bind(function(swipeObj, swipeInfo) {
                            if (this.running) return;

                            if (swipeInfo.dr[0] > 0) {
                                Event.fire(document, this._options.customPreviousEvent);
                            } else {
                                Event.fire(document, this._options.customNextEvent);
                            }
                        }, this)
                    });
                }, this));
            }

            /**
             * Adds support for keyboard navigation
             */
            if (this._options.supportArrowKeys.toString() === "true") {
                Event.observe(document, 'keyup', Ink.bindEvent(function(event) {
                    if (this.running) return;

                    if (event.keyCode === 37) {
                        Event.fire(document, this._options.customPreviousEvent);
                    } else if (event.keyCode === 39) {
                        Event.fire(document, this._options.customNextEvent);
                    }
                }, this));
            }

            /**
             * Sets the handler for the custom events
             */
            Event.observe(document, 'dataavailable', this._handlers.customEvent);

            InkArray.each(this._slides, function(elm) {
                Css.addClassName(elm, 'hide-all');
            });

            this.stepsVisible = Ink.ss('.step', this._slides[0]);
            this._hideSteps(this._slides[0]);
            Css.removeClassName(this._slides[0], 'hide-all');
            Css.addClassName(this._slides[0], this._options.classCurrent);
            this.slideControl = {
                previous: this._slides.length - 1,
                current: 0,
                next: 1
            };
        },

        _hideSteps: function(slide) {
            InkArray.each(this.stepsVisible.slice(0), Ink.bind(function(element, index) {
                this.stepsVisible.splice(0, 1);
                this.stepsInvisible.push(element);

                Css.addClassName(element, 'hide-all');
                element.style.opacity = 0;
                Css.removeClassName(element, 'hide-all');
            }, this));
        },

        _showSteps: function(slide) {
            InkArray.each(this.stepsInvisible.slice(0), Ink.bind(function(element, index) {
                this.stepsInvisible.splice(0, 1);
                this.stepsVisible.push(element);

                Css.addClassName(element, 'hide-all');
                element.style.opacity = 1;
                Css.removeClassName(element, 'hide-all');
            }, this));
        },

        _customEventHandler: function(event) {

            if (([this._options.customSlideEvent, this._options.customNextEvent, this._options.customPreviousEvent].indexOf(event.eventName) === -1) || this.running) {
                return;
            }

            var step;
            if ((event.eventName === this._options.customNextEvent) && (this.stepsInvisible.length > 0)) {
                step = this.stepsInvisible.splice(0, 1);
                this.stepsVisible.push(step[0]);
                step[0].style.opacity = 1;
                return;
            } else if ((event.eventName === this._options.customPreviousEvent) && (this.stepsVisible.length > 0)) {
                step = this.stepsVisible.splice((this.stepsVisible.length - 1), 1);
                this.stepsInvisible.splice(0, 0, step[0]);
                step[0].style.opacity = 0;
                return;
            }

            if ((this._options.cyclicNavigation.toString() !== "true") && (event.eventName === 'next') && (this.slideControl.current === (this._slides.length - 1))) {
                return;
            } else if ((this._options.cyclicNavigation.toString() !== "true") && (event.eventName === 'previous') && (this.slideControl.current === 0)) {
                return;
            }

            this.running = true;

            var eventName;
            var currentSlide;

            if (event.eventName === 'slide') {

                if ((this.slideControl.current === event.memo.slide) || (event.memo.slide >= this._slides.length)) {
                    return;
                } else if (this.slideControl.current < event.memo.slide) {
                    eventName = "next";
                    this.slideControl.next = event.memo.slide;
                } else {
                    eventName = "previous";
                    this.slideControl.previous = event.memo.slide;
                }
            } else {
                eventName = event.eventName;
            }


            switch (eventName) {
                case 'next':

                    /**
                     * Changes the order
                     */
                    currentSlide = this.slideControl.current;
                    this.slideControl.current = this.slideControl.next;

                    if (this.slideControl.current === (this._slides.length - 1)) {
                        this.slideControl.next = 0;
                    } else {
                        this.slideControl.next = this.slideControl.current + 1;
                    }

                    if (this.slideControl.current === 0) {
                        this.slideControl.previous = (this._slides.length - 1);
                    } else {
                        this.slideControl.previous = (this.slideControl.current - 1);
                    }

                    this.stepsVisible = Ink.ss('.step', this._slides[this.slideControl.current]);
                    this._hideSteps(this._slides[this.slideControl.current]);
                    Css.addClassName(this._slides[this.slideControl.current], this._options.classNext);
                    Css.removeClassName(this._slides[this.slideControl.current], 'hide-all');
                    setTimeout(Ink.bind(function() {

                        /**
                         * Making the transition
                         */
                        Css.removeClassName(this._slides[currentSlide], this._options.classCurrent);
                        Css.removeClassName(this._slides[this.slideControl.current], this._options.classNext);
                        Css.addClassName(this._slides[currentSlide], this._options.classPrevious);
                        Css.addClassName(this._slides[this.slideControl.current], this._options.classCurrent);

                        /**
                         * Setting an event listener for when the transition ends
                         */
                        var fn = Ink.bindEvent(function(event, elm) {
                            Css.removeClassName(elm, this._options.classPrevious);
                            Css.addClassName(elm, 'hide-all');

                            // And stop observing it so that it runs only once!
                            Event.stopObserving(elm, 'webkitTransitionEnd', fn);

                            this.running = false;
                        }, this, this._slides[currentSlide]);

                        Event.observe(this._slides[currentSlide], 'webkitTransitionEnd', fn);

                    }, this), 0);
                    break;
                case 'previous':

                    /**
                     * Changes the order
                     */
                    currentSlide = this.slideControl.current;
                    this.slideControl.current = this.slideControl.previous;

                    if (this.slideControl.current === (this._slides.length - 1)) {
                        this.slideControl.next = 0;
                    } else {
                        this.slideControl.next = this.slideControl.current + 1;
                    }

                    if (this.slideControl.current === 0) {
                        this.slideControl.previous = (this._slides.length - 1);
                    } else {
                        this.slideControl.previous = (this.slideControl.current - 1);
                    }

                    this.stepsInvisible = Ink.ss('.step', this._slides[this.slideControl.current]);
                    this._showSteps(this._slides[this.slideControl.current]);

                    Css.addClassName(this._slides[this.slideControl.current], this._options.classPrevious);
                    Css.removeClassName(this._slides[this.slideControl.current], 'hide-all');
                    setTimeout(Ink.bind(function() {

                        /**
                         * Making the transition
                         */
                        Css.removeClassName(this._slides[currentSlide], this._options.classCurrent);
                        Css.removeClassName(this._slides[this.slideControl.current], this._options.classPrevious);
                        Css.addClassName(this._slides[currentSlide], this._options.classNext);
                        Css.addClassName(this._slides[this.slideControl.current], this._options.classCurrent);

                        /**
                         * Setting an event listener for when the transition ends
                         */
                        var fn = Ink.bindEvent(function(event, elm) {
                            Css.removeClassName(elm, this._options.classNext);
                            Css.addClassName(elm, 'hide-all');

                            // And stop observing it so that it runs only once!
                            Event.stopObserving(elm, 'webkitTransitionEnd', fn);

                            this.running = false;
                        }, this, this._slides[currentSlide]);

                        Event.observe(this._slides[currentSlide], 'webkitTransitionEnd', fn);

                    }, this), 0);
                    break;
            }

            return;
        }

    };

    return SyncDeck;
});