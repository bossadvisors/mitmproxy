/**
 * Main View
 */
define([
		"require",
		"dojo/_base/declare",
		"dojo/_base/lang",
		"dojo/dom-construct",
		"dijit/layout/BorderContainer",
		"./_DetailViewMixin",
		"./ReportOutput",
		"./ReportEditor",
		"../report/context"
], function(require, declare, lang, domConstruct, BorderContainer, _DetailViewMixin, ReportOutput, ReportEditor, reportContext) {
	return declare([BorderContainer, _DetailViewMixin], {
		design: "sidebar",
		postCreate: function() {
			var self = this;

			this.reportOutput = new ReportOutput({
				region: "center",
				splitter: true
			});

			this.reportEditor = new ReportEditor({
				region: "right",
				splitter: true,
				submitClick: function() {
					var code = self.reportEditor.getCode();
					if (self.detailView)
						self.detailView.destroyRecursive();
					domConstruct.empty(self.reportOutput.out);

					var _mid, _reportContext;

					try {

						/*jshint evil:true, withstmt:true*/
						// https://developers.google.com/closure/compiler/docs/compilation_levels
						// Compilation [...] always preserves the functionality of syntactically valid JavaScript, 
						// provided that the code does not access local variables using string names (by using eval() statements, for example).
                        _reportContext = window.reportContext;
						window.reportContext = lang.mixin({}, reportContext, {
							detailView: {
								showDetails: self.showDetails.bind(self)
							},
							out: self.reportOutput.out,
                            define: function(){
                                var ret = define.apply(this, arguments);
                                console.log(this, arguments, ret);
                                return ret;
                            }
						});

                        //All dependencies are cached by the AMD loader by default -> uncache ReportScript dependencies
                        for(var k in require.modules) {
                            if(k.indexOf("ReportScripts") === 0)
                                delete require.modules[k];
                        }
						//Adjust RequireJS module loading path
						_mid = require.module.mid;
						require.module.mid = "ReportScripts/" + self.reportEditor.filename;

						//noinspection WithStatementJS
                        with(window.reportContext) {
							eval(code);
						}

					} catch (e) {

						//TODO: This is ugly.
						self.reportOutput.out.innerHTML = "<pre>" + e.message + "\n\n" + e.stack.replace(/http.+?\/\/.+?\//g, "") + "</pre>";
						console.error(e);
						window.mitmproxy.exception = e;

					} finally {

						//noinspection JSUnusedAssignment
                        window.reportContext = _reportContext;
						//noinspection JSUnusedAssignment
                        require.module.mid = _mid;

					}
				}
			});

			//populate trafficPane
			self.addChild(self.reportOutput);
			self.addChild(self.reportEditor);
		},
		_onShow: function() {
			this.reportEditor._onShow(); //Delegate _onShow to avoid sizing issues with CodeMirror
		}
	});
});