"use strict";
(function($, ExpressionResolver) {
	de.titus.core.Namespace.create("de.titus.jquery.Typeahead", function() {
		let Typeahead = de.titus.jquery.Typeahead = function(aElement, aData) {
			this.element = aElement;
			this.suggestionBox = undefined;
			this.data = aData || {};
			this.timeoutId = undefined;
			this.suggestionData = undefined;
			this.currentSelection = undefined;
			this.selected = undefined;
			setTimeout(Typeahead.prototype.__init.bind(this), 1);
		};

		Typeahead.CONSTANTS = {
		    Version : "{version}",
		    KEYCODES : {
		        KEY_ARROW_UP : 40,
		        KEY_ARROW_DOWN : 38,
		        KEY_ENTER : 13,
		        KEY_ESC : 27
		    },
		    DEFAULT : {
		        mode : "selection",
		        inputInterval : 300,
		        inputSize : 1,
		        maxSuggestions : 10
		    },
		    EVENTS : {
			    select : "typeahead:select"
		    },
		    MODES : {
		        selection : "selection",
		        suggestion : "suggestion"
		    }
		};

		Typeahead.prototype.__initConfig = function() {
			if (typeof this.data.inputAction === "undefined" || typeof this.data.inputAction !== "function") {
				this.data.inputAction = ExpressionResolver.resolveExpression(this.element.attr("typeahead-input-action"));
				if (typeof this.data.inputAction !== "function")
					throw "Typeahead input action ist not a function!";
			}

			if (typeof this.data.selectionAction === "undefined" || typeof this.data.selectAction !== "function") {
				this.data.selectionAction = ExpressionResolver.resolveExpression(this.element.attr("typeahead-selection-action"));
			}

			if (typeof this.data.mode === "undefined") {
				this.data.mode = (this.element.attr("typeahead-mode") || "").trim();
				if (typeof this.data.mode !== "undefined" && this.data.mode.length == 0)
					this.data.mode = undefined;
			}

			if (typeof this.data.display === "undefined") {
				this.data.display = (this.element.attr("typeahead-display") || "").trim();
				if (typeof this.data.display !== "undefined" && this.data.display.length == 0)
					this.data.display = undefined;
			}

			if (typeof this.data.displayMarker === "undefined")
				this.data.displayMarker = typeof this.element.attr("typeahead-display-marker") !== "undefined";

			if (typeof this.data.interval === "undefined")
				this.data.inputInterval = parseInt(this.element.attr("typeahead-input-interval") || "300");

			if (typeof this.data.inputSize === "undefined")
				this.data.inputSize = parseInt(this.element.attr("typeahead-input-size") || "1");

			if (typeof this.data.maxSuggestions === "undefined")
				this.data.maxSuggestions = parseInt(this.element.attr("typeahead-max-suggestions") || "10");

			if (typeof this.data.template === "undefined")
				this.data.template = this.element.attr("typeahead-template");

			this.data = $.extend({}, Typeahead.CONSTANTS.DEFAULT, this.data);
		};

		Typeahead.prototype.__init = function() {
			this.__initConfig();

			this.suggestionBox = $("<div></div>");
			this.suggestionBox.addClass("typeahead-suggestion-box");
			this.suggestionBox.attr("jstl-ignore", "");

			var innerBox = $("<div></div>");
			innerBox.addClass("typeahead-suggestion-inner-box");
			innerBox.attr("jstl-include", this.data.template);

			this.suggestionBox.append(innerBox);
			this.suggestionBox.appendTo("body");

			this.element.on("keyup keypress change focus click", Typeahead.prototype.inputHandle.bind(this));
		};

		Typeahead.prototype.inputHandle = function(aEvent) {
			if (this.timeoutId)
				clearTimeout(this.timeoutId);

			if (aEvent.type == "click") {
				if (typeof this.selected !== "undefined" && typeof this.selected.data !== "undefined")
					this.setSelectedData(this.selected.data);
				this.__hideSuggestionBox();
			} else if (aEvent.type == "keyup" && (aEvent.keyCode != Typeahead.CONSTANTS.KEYCODES.KEY_ESC && aEvent.keyCode != Typeahead.CONSTANTS.KEYCODES.KEY_ENTER && aEvent.keyCode != Typeahead.CONSTANTS.KEYCODES.KEY_ARROW_UP && aEvent.keyCode != Typeahead.CONSTANTS.KEYCODES.KEY_ARROW_DOWN))
				this.__doInput(aEvent);
			else if (aEvent.type == "keypress" && (aEvent.keyCode == Typeahead.CONSTANTS.KEYCODES.KEY_ESC || aEvent.keyCode == Typeahead.CONSTANTS.KEYCODES.KEY_ENTER || aEvent.keyCode == Typeahead.CONSTANTS.KEYCODES.KEY_ARROW_UP || aEvent.keyCode == Typeahead.CONSTANTS.KEYCODES.KEY_ARROW_DOWN)) {
				aEvent.preventDefault();
				aEvent.stopPropagation();
				if (aEvent.keyCode == Typeahead.CONSTANTS.KEYCODES.KEY_ESC)
					this.__cancelSelection(aEvent);
				else if (aEvent.keyCode == Typeahead.CONSTANTS.KEYCODES.KEY_ENTER) {
					this.__confirmSelection(aEvent);
				} else if (aEvent.keyCode == Typeahead.CONSTANTS.KEYCODES.KEY_ARROW_UP || aEvent.keyCode == Typeahead.CONSTANTS.KEYCODES.KEY_ARROW_DOWN)
					this.__selectionByKey(aEvent);
			} else if (aEvent.type == "change" && !this.suggestionBox.is(".active"))
				this.__doInput(aEvent);
			else if (aEvent.type == "focus")
				if (typeof this.selected !== "undefined" && typeof this.selected.data !== "undefined")
					this.setSelectedData(this.selected.data);
		};

		Typeahead.prototype.__doInput = function(aEvent) {
			let value = (this.element.val() || "")
			if (this.data.mode === Typeahead.CONSTANTS.MODES.suggestion)
				this.setSelectedData(value);

			if (value.length >= this.data.inputSize)
				this.timeoutId = setTimeout(Typeahead.prototype.__callInputAction.bind(this, value.trim()), this.data.inputInterval);
			else
				this.__hideSuggestionBox();
		};

		Typeahead.prototype.__selectionByKey = function(aEvent) {
			if (typeof this.suggestionData === "undefined")
				return;

			if (typeof this.currentSelection !== "undefined") {
				this.suggestionBox.find("[typeahead-selection-id='" + this.currentSelection.id + "']").removeClass("active");
				var index = this.currentSelection.index + (aEvent.keyCode == Typeahead.CONSTANTS.KEYCODES.KEY_ARROW_UP ? 1 : -1);

				if (index >= this.suggestionData.list.length)
					index = 0;
				else if (index < 0)
					index = this.suggestionData.list.length - 1;

				this.currentSelection = this.suggestionData.list[index];
			} else
				this.currentSelection = this.suggestionData.list[0];

			this.suggestionBox.find("[typeahead-selection-id='" + this.currentSelection.id + "']").addClass("active");

		};

		Typeahead.prototype.__cancelSelection = function(aEvent) {
			this.currentSelection = undefined;
			if (typeof this.selected !== "undefined")
				this.__doSelected(this.selected);
			this.__hideSuggestionBox();
		};

		Typeahead.prototype.__confirmSelection = function(aEvent) {
			if (this.currentSelection)
				this.__doSelected(this.currentSelection);
			else if (typeof this.suggestionData !== "undefined" && this.suggestionData.list.length == 1)
				this.__doSelected(this.suggestionData.list[0]);
			else
				this.__doSelected();
			this.__hideSuggestionBox();
		};

		Typeahead.prototype.__callInputAction = function(aValue) {
			this.data.inputAction(aValue, Typeahead.prototype.inputActionCallback.bind(this, aValue));
		};

		Typeahead.prototype.inputActionCallback = function(aValue, aValues) {
			let value = (this.element.val() || "").trim();
			if (value == aValue && typeof aValues !== 'undefined' && aValues.length > 0) {
				this.suggestionData = this.__transformValues(aValue, aValues);
				this.suggestionBox.jstl({
				    data : {
				        value : aValue,
				        items : this.suggestionData.list
				    },
				    callback : Typeahead.prototype.__initSuggestionBox.bind(this)
				});
			} else {
				if (typeof this.selected !== "undefined" && typeof this.selected.data !== "undefined")
					this.setSelectedData(this.selected.data);
				this.__hideSuggestionBox();
			}
		};

		Typeahead.prototype.__transformValues = function(aValue, aValues) {
			let result = {
			    map : {},
			    list : []
			};
			let min = Math.min(aValues.length, this.data.maxSuggestions);
			let markerRegex = this.__buildDisplayMakerRegex(aValue);
			for (let i = 0; i < min; i++) {
				let item = this.__buildItemData(aValues[i], markerRegex);
				item.index = i;
				item.id = "item-id-" + i;
				result.map[item.id] = item;
				result.list.push(item);
			}

			return result;
		};

		Typeahead.prototype.__buildDisplayMakerRegex = function(aValue) {
			if (!this.data.displayMarker || typeof aValue !== "string")
				return undefined;

			let regex = "";
			aValue.trim().split(" ").filter(function(a) {
				return a.length > 0
			}).sort(function(a, b) {
				return b.length - a.length;
			}).forEach(function(value, index) {
				if (index != 0)
					regex += "|";
				regex += value.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			});
			return new RegExp(regex, "ig");
		};

		Typeahead.prototype.__buildItemData = function(aData, aMarkerRegex) {
			let itemData = aData;
			let value = aData;
			if (typeof this.data.display !== "undefined")
				value = ExpressionResolver.resolveExpression(this.data.display, itemData, this.data.display);
			return {
			    display : this.__buildDisplay(value, aMarkerRegex),
			    value : value,
			    data : itemData
			};
		};

		Typeahead.prototype.__buildDisplay = function(aDisplay, aMarkerRegex) {
			if (!this.data.displayMarker || typeof aMarkerRegex === "undefined" || typeof aDisplay !== "string")
				return aDisplay;

			return aDisplay.replace(aMarkerRegex, function(aMatch) {
				return "<b>" + aMatch + "</b>";
			});
		};

		Typeahead.prototype.__initSuggestionBox = function() {
			this.suggestionBox.find("[typeahead-selection-id]").on("click", Typeahead.prototype.__selectionHandle.bind(this));
			this.__showSuggestionBox();
		};

		Typeahead.prototype.__selectionHandle = function(aEvent) {
			aEvent.preventDefault();
			aEvent.stopPropagation();
			let id = $(aEvent.currentTarget).attr("typeahead-selection-id");
			if (typeof id !== "undefined")
				this.__doSelected(this.suggestionData.map[id]);
		};

		Typeahead.prototype.__doSelected = function(aItem) {
			this.selected = aItem;
			if (typeof aItem === "undefined")
				this.element.val("");
			else {
				this.element.val(this.selected.value);
				if (typeof this.data.selectionAction === "function")
					this.data.selectionAction(this.selected.data);
			}
			this.__hideSuggestionBox();

			setTimeout((function() {
				this.element.trigger("typeahead:select", [ this.selected, this ]);
			}).bind(this), 1);
		}

		Typeahead.prototype.__showSuggestionBox = function() {
			let offset = this.element.offset();
			this.suggestionBox.css("top", offset.top + this.element.outerHeight() + "px");
			this.suggestionBox.css("left", offset.left + "px");

			this.suggestionBox.width(this.element.outerWidth());

			this.suggestionBox.addClass("active");

			this.suggestionBoxCloseListener = (function(aEvent) {
				this.__doSelected(this.selected);
				this.__hideSuggestionBox();
			}).bind(this);

			$(document).on("click", this.suggestionBoxCloseListener);

		};

		Typeahead.prototype.__hideSuggestionBox = function() {
			this.suggestionBox.removeClass("active");
			this.suggestionData = undefined;
			this.currentSelection = undefined;

			if (typeof this.suggestionBoxCloseListener !== "undefined") {
				$(document).off("click", this.suggestionBoxCloseListener);
				this.suggestionBoxCloseListener = undefined;
			}
		};

		Typeahead.prototype.setSelectedData = function(aData) {
			if (typeof aData !== "undefined") {
				let item = this.__buildItemData(aData);
				this.__doSelected(item);
			} else
				this.__doSelected();
		}

		Typeahead.prototype.getSelectedData = function() {
			if (typeof this.selected !== "undefined")
				return this.selected.data;
		}

		de.titus.core.jquery.Components.asComponent("de.titus.Typeahead", Typeahead);
		$(document).ready(function() {
			$(".jstl-typeahead").de_titus_Typeahead();
		});
	});
})($, new de.titus.core.ExpressionResolver());
