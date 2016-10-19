(function ($, window, document, undefined) {

    $.extend($.fn, {

        helpMyDOM: function (options) {

            // If nothing is selected, return nothing; can't chain anyway
            if (!this.length) {
                if (options && options.debug && window.console) {
                    console.warn("Nothing selected, can't help you, returning nothing.");
                }
                return;
            }

            // Check if a helper for this element was already created
            var domHelpr = $.data(this[ 0 ], "helper");
            if (domHelpr) {
                return domHelpr;
            }

            domHelpr = new $.domHelpr(options, this[ 0 ]);
            $.data(this[ 0 ], "helper", domHelpr);

            return domHelpr;

        }

    });

    $.domHelpr = function (options, element, attribute) {
        this.settings = $.extend(true, {}, $.domHelpr.defaults, options);
        this.currentElement = element;
        this.dataAttribute = attribute ? attribute : "data-helpmydom";
        this.methods = $.extend(true, {}, $.domHelpr.methods);
        this.parsers = $.extend(true, {}, $.domHelpr.parsers);
        this.init();
    };

    $.extend($.domHelpr, {

        defaults: {
            elements: {},
            actions: ['add'], // list of possible actions
            stopper: ['after'],
            separator: {
                main: ",", // comma separator
                sub: " " // space separator
            },
            valueTypes: {
                ".": "class",
                "#": "id"
            }
        },

        prototype: {

            init: function () {
                console.log("Initializing DOM Helpr");

                if (!this.hasElements()) {
                    console.log("Invalid. DOMHelpr cannot help you!");
                    return;
                }

                // Get all elements that need help
                var elements = this.getElements();

                var _ = this;

                $.each(elements, function (i, v) {
                    _.applyHelp(v);
                });
            },

            hasElements: function () {
                return this.getElements().size() > 0;
            },

            isActionAcceptable: function (action) {
                if (this.isAction(action) === true) {
                    console.log("Action: " + action + " is an action");
                    return true;
                } else {
                    console.log("Action: " + action + " is NOT an action");
                    return false;
                }
            },

            isAction: function (action) {
                return this.settings.actions.indexOf(action) >= 0;
            },
            
            isStopperAcceptable: function(action) {
                if (this.isStopper(action) === true) {
                    console.log("Stopper: " + action + " is a stopper");
                    return true;
                } else {
                    console.log("Stopper: " + action + " is NOT a stopper");
                    return false;
                }
            },

            isStopper: function (action) {
                return this.settings.stopper.indexOf(action) >= 0;
            },

            getElements: function () {
                return $(this.currentElement).find("[" + this.dataAttribute + "]");
            },

            addAcceptableAction: function (newAction) {
                var _ = this;

                switch (typeof newAction) {
                    case "Array":
                        console.log("Concat new actions");
                        $.domHelpr.defaults.actions = this.settings.actions.concat(newAction);
                        break;
                    default: // String
                        console.log("Push new action");
                        $.domHelpr.defaults.actions.push(newAction);
                }

                console.log(newAction);
            },

            getActions: function (actions, separator) {
                if (!separator)
                    separator = this.settings.separator.main;

                if (actions) {
                    actions = actions.split(separator);

                    for (var i = 0; i < actions.length; i++) {
                        actions[i] = actions[i].trim();
                    }
                }

                return actions;
            },

            getValueType: function (value) {
                if (!value)
                    return null;

                var valueTypes = this.settings.valueTypes;

                for (var prop in valueTypes) {
                    if (valueTypes.hasOwnProperty(prop)) {
                        if (value.indexOf(prop) === 0)
                            return valueTypes[prop];
                    }
                }

                return null;
            },
            
            extractValues: function(actions, startIndex) {
                if (!actions)
                    return null;
                
                var values = [];
                var index = startIndex;
                
                for (; index < actions.length; index++) {
                    var a = actions[index];
                    
                    if (this.isActionAcceptable(a))
                        break;
                    else if (this.isStopperAcceptable(a))
                        break;
                    
                    values.push(a);
                }
                
                return {values: values.join(" "), lastIndex: index};
            },

            extractAction: function (action) {

            },

            applyAction: function (action, value, element) {
                var type = this.getValueType(value);

                var actionType = action + (type ? " " + type : "");
                
                // convert to camelcase
                actionType = actionType.replace(/\s(.)/g, function ($1) {
                                            return $1.toUpperCase();
                                        })
                                        .replace(/\s/g, '')
                                        .replace(/^(.)/, function ($1) {
                                            return $1.toLowerCase();
                                        });
                                        
                console.log("actionType: " + actionType);
                
                // load method automatically
                if (this.methods.hasOwnProperty(actionType))
                    this.methods[actionType](value, element);
                else if (this.methods.hasOwnProperty(action))
                    this.methods[action](value, element);
            },

            applyActionWithDelay: function (delay, action, value, element) {
                var _ = this;
                setTimeout(function () {
                    _.applyAction(action, value, element);
                }, delay);
            },

            applyActions: function (actions, element) {
                var subActions = this.getActions(actions, this.settings.separator.sub);

                var collectedActions = {};
                var delayedActions = {};

                if (subActions !== null) {
                    console.log("Sub Actions");
                    console.log(subActions);

                    var prevKey = "";

                    for (var i = 0; i < subActions.length; i++) {
                        var a = subActions[i];
                        var v = null;

                        if (this.isActionAcceptable(a)) {
                            var vs = this.extractValues(subActions, i+1);
                            console.log("extractedValues");
                            console.log(vs);
                            v = vs.values;
                            prevKey = a + " " + vs.values;
                            collectedActions[prevKey] = [a, v];

                            console.log("action: " + a);
                            console.log("value: " + v);
                            i = vs.lastIndex - 1;
                        } else if (this.isStopperAcceptable(a)) {
                            console.log("Adding delay action");
                            v = this.parsers.toMilliseconds(subActions[i+1]);
                            delayedActions[prevKey] = v;

                            console.log("action: " + a);
                            console.log("value: " + v);
                        }
                    }

                    if (collectedActions) {
                        console.log("Collected Actions");
                        console.log(collectedActions);
                        for (var caKey in collectedActions) {
                            var subA = collectedActions[caKey][0];
                            var subV = collectedActions[caKey][1];
                            if (delayedActions[caKey]) {
                                var delay = delayedActions[caKey];
                                console.log("Applied delay for " + delay + "ms");
                                this.applyActionWithDelay(delay, subA, subV, element)

                            } else {
                                console.log("No delay");
                                this.applyAction(subA, subV, element);
                            }
                        }
                    }

                    // remove data
                    this.clearActions(element);
                }
            },

            applyHelp: function (element) {
                var dataActions = $(element).attr(this.dataAttribute);
                var actions = this.getActions(dataActions, "");
                console.log(actions);
                if (actions !== null) {
                    for (var i = 0; i < actions.length; ) {
                        var a = actions[i];

                        this.applyActions(a, element);

                        i++;
                    }

                    // remove data
                    this.clearActions(element);
                }
            },

            clearActions: function (element) {
                $(element).removeAttr(this.dataAttribute);
            }

        },
        
        methods: {

            addClass: function (value, element) {
                console.log("Added class name '" + value + "' to element " + element);
                
                if (value.indexOf(".") === 0)
                    value = value.replace(/\./g, "");

                $(element).addClass(value);

            },
            
            addId: function (value, element) {
                console.log("Added id value '" + value + "' to element " + element);
                
                if (value.indexOf("#") === 0)
                    value = value.replace(/\#/g, "").replace(/\s/g, "_");

                $(element).attr("id", value);

            }

        },

        parsers: {

            toMilliseconds: function (str) {
                var multiplier = 1; // milliseconds

                console.log("delay time: " + str);

                if (!str)
                    return null;

                if (str.indexOf("ms") > 0) {
                    str.replace("ms", "");
                } else if (str.indexOf("s") > 0) {
                    multiplier = 1000;
                    str.replace("s", "");
                }

                str = str.trim();

                return parseInt(str) * parseInt(multiplier);
            }

        },

        helpers: {
            // add few helpers here
        }

    });

})(jQuery, this, document);