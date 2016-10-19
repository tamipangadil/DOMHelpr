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
                    console.log("Action: " + action + " is an action");
                    return false;
                }
            },

            isAction: function (action) {
                return this.settings.actions.indexOf(action) >= 0;
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
                        //_.settings.actions = this.settings.actions.concat(newAction);
                        break;
                    default: // String
                        console.log("Push new action");
                        //_.settings.actions.push(newAction);
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
                            return prop;
                    }
                }

                return null;
            },

            extractAction: function (action) {

            },

            applyAction: function (action, value, element) {
                var type = this.getValueType(value);

                var actionType = action + (type ? " " + type : "");
                console.log("actionType: " + actionType);
                switch (actionType) {
                    case 'add attr-class':
                        this.methods.addAttrClass(value, element);
                        break;
                    case 'animate':
                        this.methods.animateCss(value, element);
                        break;

                    default:
                }
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

                    for (var i = 0; i < subActions.length; ) {
                        var a = subActions[i];
                        var v = null;

                        if (this.isActionAcceptable(a)) {
                            v = subActions[++i];
                            prevKey = a + " " + v;
                            collectedActions[prevKey] = [a, v];

                            console.log("action: " + a);
                            console.log("value: " + v);



                        } else if (this.isStopper(a)) {
                            console.log("Adding delay action");
                            v = this.parsers.toMilliseconds(subActions[++i]);
                            delayedActions[prevKey] = v;

                            console.log("action: " + a);
                            console.log("value: " + v);
                        }

                        i++;
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

            addAttrClass: function (value, element) {
                console.log("Added class name '" + value + "' to element " + element);

                if (value.indexOf(".") === 0)
                    value = value.substring(1);

                $(element).addClass(value);

            }

        },

        parsers: {

            toMilliseconds: function (str) {
                var multiplier = 1; // milliseconds

                console.log("str=" + str);

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
            
            // String Helpers
            toCamelCase = function () {
                return this
                        .replace(/\s(.)/g, function ($1) {
                            return $1.toUpperCase();
                        })
                        .replace(/\s/g, '')
                        .replace(/^(.)/, function ($1) {
                            return $1.toLowerCase();
                        });
            },

            camelizeOne = function () {
                return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
                    return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
                }).replace(/\s+/g, '');
            },

            camelizeTwo = function () {
                return this.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
                    if (+match === 0)
                        return ""; // or if (/\s+/.test(match)) for white spaces
                    return index === 0 ? match.toLowerCase() : match.toUpperCase();
                });
            },

            toUpperCaseFirstChar = function () {
                return this.substr(0, 1).toUpperCase() + this.substr(1);
            },

            toLowerCaseFirstChar = function () {
                return this.substr(0, 1).toLowerCase() + this.substr(1);
            },

            toUpperCaseEachWord = function (delim) {
                delim = delim ? delim : ' ';
                return this.split(delim).map(function (v) {
                    return v.toUpperCaseFirstChar();
                }).join(delim);
            },

            toLowerCaseEachWord = function (delim) {
                delim = delim ? delim : ' ';
                return this.split(delim).map(function (v) {
                    return v.toLowerCaseFirstChar();
                }).join(delim);
            },

            toCamelCaseSimoVersion = function () {
                var re = /(?:-|\s)+([^-\s])/g;
                return function (capFirst) {
                    var str = (' ' + this).replace(re, function (a, b) {
                        return b.toUpperCase();
                    });
                    return capFirst ? str : (str.substr(0, 1).toLowerCase() + str.substr(1));
                };
            },

            replaceSpace = function (replaceWith) {
                replaceWith = replaceWith ? replaceWith : '';

                return this.replace(/\s/g, replaceWith);
            }
            
        }

    });

})(jQuery, this, document);