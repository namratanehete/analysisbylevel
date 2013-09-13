Ext.onReady(function() {

    // load trend line lib
    Ext.Loader.setConfig({enabled: true});
    Ext.Loader.setPath('regression', serverUrl+'/dhis-web-commons/javascripts');
    Ext.require('regression.simpleRegression');

	// chart tips css
	var css = '.dv-chart-tips { \n border-radius: 2px; \n padding: 0px 3px 1px; \n border: 2px solid #777; \n background-color: #f1f1f1; \n } \n';
	css += '.dv-chart-tips .x-tip-body { \n background-color: #f1f1f1; \n font-size: 13px; \n font-weight: normal; \n color: #444; \n -webkit-text-stroke: 0; \n } \n';

	// load mask css
	css += '.x-mask-msg { \n padding: 0; \n	border: 0 none; \n background-image: none; \n background-color: transparent; \n } \n';
	css += '.x-mask-msg div { \n background-position: 11px center; \n } \n';
	css += '.x-mask-msg .x-mask-loading { \n border: 0 none; \n	background-color: #000; \n color: #fff; \n border-radius: 2px; \n padding: 12px 14px 12px 30px; \n opacity: 0.65; \n } \n';

	Ext.util.CSS.createStyleSheet(css);

    // plugin
    DV.plugin = {};

	DV.plugin.getChart = function(config) {
		var validateConfig,
			createViewport,
			initialize,
			dv;

		validateConfig = function(config) {
			if (!Ext.isObject(config)) {
				console.log('Chart configuration is not an object');
				return;
			}

			if (!Ext.isString(config.el)) {
				console.log('No element id provided');
				return;
			}

			return true;
		};

		createViewport = function() {
			var el = Ext.get(dv.init.el),
				setFavorite,
				centerRegion,
				elBorderW = parseInt(el.getStyle('border-left-width')) + parseInt(el.getStyle('border-right-width')),
				elBorderH = parseInt(el.getStyle('border-top-width')) + parseInt(el.getStyle('border-bottom-width')),
				elPaddingW = parseInt(el.getStyle('padding-left')) + parseInt(el.getStyle('padding-right')),
				elPaddingH = parseInt(el.getStyle('padding-top')) + parseInt(el.getStyle('padding-bottom')),
				width = el.getWidth() - elBorderW - elPaddingW,
				height = el.getHeight() - elBorderH - elPaddingH;

			setFavorite = function(layout) {
				dv.engine.createChart(layout, dv);
			};

			centerRegion = Ext.create('Ext.panel.Panel', {
				renderTo: el,
				bodyStyle: 'border: 0 none',
				width: config.width || width,
				height: config.height || height,
				layout: 'fit'
			});

			return {
				setFavorite: setFavorite,
				centerRegion: centerRegion
			};
		};

		initialize = function() {

			if (!validateConfig(config)) {
				return;
			}

			Ext.data.JsonP.request({
				url: config.url + '/dhis-web-visualizer/initialize.action',
				success: function(r) {
                    dv = DV.core.getInstance(r);

                    dv.init.el = config.el;
                    dv.isPlugin = true;
                    dv.viewport = createViewport();

					if (config.uid) {
						dv.engine.loadChart(config.uid, dv);
					}
					else {
						layout = dv.api.layout.Layout(config);

						if (!layout) {
							return;
						}

						dv.engine.createChart(layout, dv);
					}
				}
			});
		}();
	};
});
