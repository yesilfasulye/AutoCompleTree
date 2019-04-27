/**
 *
 * AutoCompleTree
 *
 * Author : Burak Kaya - https://github.com/yesilfasulye
 * License: MIT
 *
 */

(function() {

	var AutoCompleTree = function(input, data){

		var self = this;

		// Unique ID
		AutoCompleTree.id = (AutoCompleTree.id || 0) + 1;
		self.id = AutoCompleTree.id;

		self.input 	  		 = input;
		self.isOpened 		 = false;
		self.selected 	 	 = [];
		self.suggestions 	 = [];
		self.selectedIndex = 0;

		self.options = {
			classPrefix : 'o-autocompletree',
			noResult    : 'No suggestions found!',
			notSelected : 'No items selected!'
		};

		// Add first tree
		if(data){
			if(typeof data == "object" && !Array.isArray(data)){
				self.data = data;
			} else {
				console.error('ERRR! Data type must be object, please check data type for: "#' + input.id +'"');
				return;
			}
			for (var obj in data) {
				if(data[obj] || typeof data[obj] == 'object'){
					self.suggestions.push(obj);
				}
			}
		}

		self.dom   = {
			container : null,
			list 	    : null,
			tags 	    : null
		};

		// Create DOM
		self.input.classList.add(self.options.classPrefix + '__input');
		self.input.setAttribute("autocomplete","off");

		var ddHolder = _createElement('div', {
			className: self.options.classPrefix + '__form',
			around   : self.input
		});

		self.dom.list = _createElement('div',{
			className: self.options.classPrefix + '__suggestion-list',
			after    : self.input
		});

		self.dom.container = _createElement('div', {
			id	      : self.options.classPrefix + '-' + self.id,
			className : self.options.classPrefix + ' '+ self.options.classPrefix + '__container',
			around    : ddHolder
		});

		self.dom.tags = _createElement('ul', {
			className : self.options.classPrefix + '__tag-list',
			before    : ddHolder
		});

		// Event List
		self.events = {
			input: {
				"focus"	  : function(){ self.show() },
				"keydown" : function(){
						var key = event.keyCode || event.charCode;
						var i, index;
						if (key === 8) { // backspace
							if(self.input.value.length <= 0 && self.selected.length > 0) {
								i = self.selected.length - 1;
								if (self.dom.tags.childNodes[i].classList.contains(self.options.classPrefix + '__tag--selected')) {
									self.dom.tags.childNodes[i].remove();
									self.selected.splice(i, 1);
									self.setSuggestions();
									self.show();
								} else {
									self.dom.tags.childNodes[i].classList.add(self.options.classPrefix + '__tag--selected');
									self.hide();
								}
							} else {
								self.setSuggestions();
								self.show();
							}
						}
						if (key === 9) { // tab
							if (self.dom.tags.childNodes.length > 0) {
								i = self.dom.tags.childNodes.length - 1;
								if (self.dom.tags.childNodes[i].classList.contains(self.options.classPrefix + '__tag--selected')) {
									event.preventDefault();
									self.dom.tags.childNodes[i].classList.remove(self.options.classPrefix + '__tag--selected');
									self.setSuggestions();
									self.input.focus();
									self.show();
								}
							}
						}
						if(self.isOpened){
							if (key === 27) { // esc
								self.hide();
								self.input.blur();
							}
							if(key === 13){ //enter
								self.selectItemAtIndex(self.selectedIndex);
								self.show();
							}
							if (key === 38 || key === 40) { // up & down
								self.setItem(key, self.dom.list);
							}
						}
				},
				"keyup"   : function(){
						var key = event.keyCode || event.charCode;
						var arr = [9,27,13,38,40];
						if(!arr.includes(key) && this.input.value != ''){
							self.filter();
						}
				 }
			},
			list: {
				"click" : function(){
					self.select();
				}
			},
			container: {
				"click" : function(){
					self.input.focus();
				}
			}
		};

		// Bind Events
		_bind(self.input, self.events.input);
		_bind(self.dom.list, self.events.list);
		_bind(self.dom.container, self.events.container);

		AutoCompleTree.all.push(self);
	}

	AutoCompleTree.prototype = {
		hide: function(){
			this.isOpened = false;
			this.dom.list.style.display = 'none';
		},
		show: function(){
			if (this.isOpened) return;

			this.dom.list.innerHTML = '';

			if(this.generateList()){
				this.isOpened = true;
				this.dom.list.style.display = 'block';
			}
		},
		getData: function(){
			return this.selected.join('.');
		},
		getSelectedList: function(){
			return this.selected.length > 0 ? this.selected : this.options.notSelected;
		},
		getLastSelected: function(){
			return this.selected.length > 0 ? this.selected[this.selected.length-1] : this.options.notSelected;
		},
		getSuggestions: function(){
			return this.suggestions.length > 0 ? this.suggestions : this.options.noResult;
		},
		destroy: function(){

			// Unbind events
			_unbind(this.input, this.events.input);
			_unbind(this.dom.list, this.events.list);
			_unbind(this.dom.container, this.events.container);

			this.input.classList.remove(this.options.classPrefix + '__input');
			this.input.removeAttribute("autocomplete");

			// Remove DOM elements
			if (this.dom.container) {
				var parentNode = this.dom.container.parentNode;
				parentNode.insertBefore(this.input, this.dom.container);
				parentNode.removeChild(this.dom.container);
			}

			// Remove instance from global array
			var indexOfAutoCompleTree = AutoCompleTree.all.indexOf(this);
			if (indexOfAutoCompleTree !== -1) {
				AutoCompleTree.all.splice(indexOfAutoCompleTree, 1);
			}

		},
		setSuggestions: function(){
			this.suggestions = [];
			var newSuggestions = (this.getData() != '') ? _resolve(this.getData(), this.data) : this.data;
			for (var prop in newSuggestions) {
				if(newSuggestions[prop] || typeof newSuggestions[prop] == 'object'){
					this.suggestions.push(prop.toString());
				}
			}
		},
		select: function(){
			event.preventDefault();
			if(event.target.className != (this.options.classPrefix + '__suggestion')) return;

			this.hide();

			// Create Tag
			_createElement('li', {
				className: this.options.classPrefix + '__tag',
				innerHTML: event.target.text,
				append: this.dom.tags
			});

			this.selected.push(event.target.text);

			// Set new list
			this.setSuggestions();
			this.input.value = '';
		},
		selectItemAtIndex: function(index){
			this.dom.list.childNodes[index].click();
		},
		setItem: function(key, el){
			var index = _getActiveItem(el);
			this.dom.list.childNodes[index].setAttribute('aria-selected', false);

			if (key === 38 && index > 0) { index-- }
			else if (key === 40 && index < this.dom.list.childNodes.length -1) { index++ }
			else { index = 0 }

			this.selectedIndex = index;
			this.dom.list.childNodes[index].setAttribute('aria-selected', true);

		},
		generateList: function(list){
				this.dom.list.innerHTML = '';
				if(list == undefined) {
					list = this.suggestions
				}
				if(list.length <= 0) return false;

				for (var i = 0; i < list.length; i++) {
					_createElement('a', {
						className : this.options.classPrefix + '__suggestion',
						href			: '#',
						innerHTML : list[i],
						append    : this.dom.list,
						"aria-selected": "false"
					});
				}
				this.dom.list.firstChild.setAttribute('aria-selected', true);
				this.selectedIndex = 0;
				return true;
		},
		filter: function(){
			var text = this.input.value;
			var filtered = [];

			if(text != ''){
				filtered = this.suggestions.filter(function(i){
					return RegExp("^" + text.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&"), "i").test(i);
				});
			} else {
				filtered = this.suggestions;
			}

			if (filtered.length > 0) {
				this.generateList(filtered);
			} else {
				if(this.dom.list.innerHTML == ''){
					_createElement('span', {
						className : this.options.classPrefix + '__no-suggestion',
						innerHTML : this.options.noResult,
						append    : this.dom.list
					});
					this.isOpened = true;
					this.dom.list.style.display = 'block';
				}
			}
		}
	};

	AutoCompleTree.all  = [];
	AutoCompleTree.version = '1.0.0';

	// Helpers - Private Methods
	function _getActiveItem(el){
		for (var i = 0; i < el.childNodes.length; i++) {
			if(el.childNodes[i].getAttribute('aria-selected') == 'true'){
				return i
			}
		}
	}

	function _resolve(keys, obj){
		return keys.split('.').reduce(function(prev, curr) {
			return prev ? prev = prev[curr] : undefined;
		}, obj);
	}

	function _bind(element, obj) {
		if (element) {
			for (var event in obj) {
				var callback = obj[event];
				event.split(/\s+/).forEach(function (event) {
					element.addEventListener(event, callback);
				});
			}
		}
	}

	function _unbind(element, obj){
		if (element) {
			for (var event in obj) {
				var callback = obj[event];
				event.split(/\s+/).forEach(function(event) {
					element.removeEventListener(event, callback);
				});
			}
		}
	}

	function _createElement(tag, opt){
		var element = document.createElement(tag);
		for (var key in opt) {
			if (opt.hasOwnProperty(key)) {
				if(key === 'append'){
					opt[key].appendChild(element);
				}
				else if(key === 'after'){
					opt[key].parentNode.insertBefore(element, opt[key].nextSibling);
				}
				else if(key === 'before'){
					opt[key].parentNode.insertBefore(element, opt[key]);
				}
				else if (key === 'around'){
					opt[key].parentNode.insertBefore(element, opt[key]);
					element.appendChild(opt[key]);
				}
				else if (key in element) {
					element[key] = opt[key];
				}
				else {
					element.setAttribute(key, opt[key]);
				}
			}
		}
		return element;
	}

	function _loadData(input, dataURL){
		let req = new XMLHttpRequest();
				req.overrideMimeType("application/json");
				req.open('GET', dataURL, true);
				req.onreadystatechange = function () {
					if (req.readyState === 4) {
						if(req.status === 200){
							let data = JSON.parse(req.responseText);
							new AutoCompleTree(input, data);
						}
						if (req.status === 404) {
							console.error('ERRR! Please check JSON data path for: "#' + input.id + '"');
							return;
						}
					}
				};
				req.send();
	}

	function _init() {
		var inputs = document.querySelectorAll('input[data-autocompletree]');
		for (const input of inputs) {
			_loadData(input, input.dataset.path);
		}
  }

	if (typeof self !== "undefined") {
		self.AutoCompleTree = AutoCompleTree;
	}

	if (typeof Document !== "undefined") {
		if (document.readyState !== "loading") {
			_init();
		}
		else {
			document.addEventListener("DOMContentLoaded", _init);
		}
	}

	return AutoCompleTree;

})();