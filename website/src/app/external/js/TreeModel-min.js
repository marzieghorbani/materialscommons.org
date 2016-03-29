!function(){"use strict";var t;t={};function TreeModel(t){t=t||{};this.config=t;this.config.childrenPropertyName=t.childrenPropertyName||"children";this.config.modelComparatorFn=t.modelComparatorFn}TreeModel.prototype.parse=function(t){var r,o,s;if(!(t instanceof Object)){throw new TypeError("Model must be of type object.")}s=new n(this.config,t);if(t[this.config.childrenPropertyName]instanceof Array){if(this.config.modelComparatorFn){t[this.config.childrenPropertyName]=i(this.config.modelComparatorFn,t[this.config.childrenPropertyName])}for(r=0,o=t[this.config.childrenPropertyName].length;r<o;r++){e(s,this.parse(t[this.config.childrenPropertyName][r]))}}return s};function e(t,e){e.parent=t;t.children.push(e);return e}function n(t,e){this.config=t;this.model=e;this.children=[]}n.prototype.isRoot=function(){return this.parent===undefined};n.prototype.addChild=function(t){var e;if(!(t instanceof n)){throw new TypeError("Child must be of type Node.")}t.parent=this;if(!(this.model[this.config.childrenPropertyName]instanceof Array)){this.model[this.config.childrenPropertyName]=[]}if(this.config.modelComparatorFn){e=s(this.config.modelComparatorFn,this.model[this.config.childrenPropertyName],t.model);this.model[this.config.childrenPropertyName].splice(e,0,t.model);this.children.splice(e,0,t)}else{this.model[this.config.childrenPropertyName].push(t.model);this.children.push(t)}return t};n.prototype.getPath=function(){var t=[];!function e(n){t.unshift(n);if(!n.isRoot()){e(n.parent)}}(this);return t};function r(){var e={};if(arguments.length===1){e.fn=arguments[0]}else if(arguments.length===2){if(typeof arguments[0]==="function"){e.fn=arguments[0];e.ctx=arguments[1]}else{e.options=arguments[0];e.fn=arguments[1]}}else{e.options=arguments[0];e.fn=arguments[1];e.ctx=arguments[2]}e.options=e.options||{};if(!e.options.strategy){e.options.strategy="pre"}if(!t[e.options.strategy]){throw new Error("Unknown tree walk strategy. Valid strategies are 'pre' [default], 'post' and 'breadth'.")}return e}n.prototype.walk=function(){var e;e=r.apply(this,arguments);t[e.options.strategy].call(this,e.fn,e.ctx)};t.pre=function a(t,e){var n,r,i;i=t.call(e,this);for(n=0,r=this.children.length;n<r;n++){if(i===false){return false}i=a.call(this.children[n],t,e)}return i};t.post=function h(t,e){var n,r,i;for(n=0,r=this.children.length;n<r;n++){i=h.call(this.children[n],t,e);if(i===false){return false}}i=t.call(e,this);return i};t.breadth=function l(t,e){var n=[this];!function r(){var i,o,s;if(n.length===0){return}s=n.shift();for(i=0,o=s.children.length;i<o;i++){n.push(s.children[i])}if(t.call(e,s)!==false){r()}}()};n.prototype.all=function(){var e,n=[];e=r.apply(this,arguments);t[e.options.strategy].call(this,function(t){if(e.fn.call(e.ctx,t)){n.push(t)}},e.ctx);return n};n.prototype.first=function(){var e,n;e=r.apply(this,arguments);t[e.options.strategy].call(this,function(t){if(e.fn.call(e.ctx,t)){n=t;return false}},e.ctx);return n};n.prototype.drop=function(){var t;if(!this.isRoot()){t=this.parent.children.indexOf(this);this.parent.children.splice(t,1);this.parent.model.children.splice(t,1);this.parent=undefined;delete this.parent}return this};function i(t,e){var n=e.length,r,s;if(n>=2){r=e.slice(0,n/2);s=e.slice(n/2,n);return o(t,i(t,r),i(t,s))}else{return e}}function o(t,e,n){var r=[],i=e.length,o=n.length;while(i>0&&o>0){if(t(e[0],n[0])<=0){r.push(e.shift());i--}else{r.push(n.shift());o--}}if(i>0){r.push.apply(r,e)}else{r.push.apply(r,n)}return r}function s(t,e,n){var r,i;for(r=0,i=e.length;r<i;r++){if(t(e[r],n)>0){break}}return r}if(typeof exports==="object"){module.exports=TreeModel}else if(typeof define==="function"&&define.amd){define(function(){return TreeModel})}else{this.TreeModel=TreeModel}}.call(this);