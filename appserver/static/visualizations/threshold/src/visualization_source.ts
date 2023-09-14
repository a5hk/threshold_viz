/*
 * Visualization source
 */
// @ts-expect-error
define([
  // 'jquery',
  // 'underscore',
  "api/SplunkVisualizationBase",
  "api/SplunkVisualizationUtils",
  "echarts",
  // "echarts/theme/vintage",
  // Add required assets to this list
], function (
  // $,
  // _,
  // @ts-expect-error
  SplunkVisualizationBase,
  // @ts-expect-error
  SplunkVisualizationUtils,
  // @ts-expect-error
  echarts
) {
  // Extend from SplunkVisualizationBase
  return SplunkVisualizationBase.extend({
    initialize: function () {
      this.chunk = 50000;
      this.offset = 0;
      SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

      // Initialization logic goes here
      this.el.classList.add("vizviz-threshold-container");
    },

    // Optionally implement to format data returned from search.
    // The returned object will be passed to updateView as 'data'
    // @ts-expect-error
    formatData: function (data) {
      // Format data
      return data;
    },

    // Implement updateView to render a visualization.
    //  'data' will be the data object returned from formatData or from the search
    //  'config' will be the configuration property object
    // @ts-expect-error
    updateView: function (data, config) {
      if (!data.rows || data.rows.length === 0 || data.rows[0].length === 0) {
        return this;
      }

      let c = this.initChart(this.el);
      let conf = new Config(config, SplunkVisualizationUtils.getCurrentTheme());
      let opt = option(data, conf);
      c.setOption(opt);

      if (data.rows.length >= this.chunk && data.rows.length != 0) {
        this.offset += data.rows.length;
        this.updateDataParams({ count: this.chunk, offset: this.offset });
      }
    },

    // Search data params
    getInitialDataParams: function () {
      return {
        outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
        count: 50000,
      };
    },

    // onConfigChange: function (_configChanges: any, _previousConfig: any) {
    //   this.invalidateFormatData();
    //   this.invalidateReflow();
    // },

    // Override to respond to re-sizing events
    reflow: function () {
      echarts.getInstanceByDom(this.el)?.resize();
    },

    initChart: function (e: HTMLElement) {
      if (SplunkVisualizationUtils.getCurrentTheme() == "dark") {
        return echarts.init(e, "dark");
      }
      return echarts.init(e);
    },
  });
});

// TypeScript from here

interface Field {
  name: string;
  splitby_value?: string;
}

interface SearchResult {
  rows: [];
  fields: Field[];
}

class Config {
  background: string;

  chartType: "line" | "bar";

  cr1min: string | number;
  cr1max: string | number;
  color1: string;

  cr2min: string | number;
  cr2max: string | number;
  color2: string;

  cr3min: string | number;
  cr3max: string | number;
  color3: string;

  cr4min: string | number;
  cr4max: string | number;
  color4: string;

  cr5min: string | number;
  cr5max: string | number;
  color5: string;

  markLinesOpacity: number;
  outOfRangeColor: string;

  constructor(c: any, mode: string) {
    this.background = mode === "dark" ? "#101317" : "#fff";

    this.chartType = c["display.visualizations.custom.threshold_viz.threshold.chartType"] === "bar" ? "bar" : "line";

    this.cr1min = this.sanitizeItem(c["display.visualizations.custom.threshold_viz.threshold.colorRange1Min"]);
    this.cr1max = this.sanitizeItem(c["display.visualizations.custom.threshold_viz.threshold.colorRange1Max"]);
    this.color1 = c["display.visualizations.custom.threshold_viz.threshold.colorRange1"] ?? "#0ce90c";

    this.cr2min = this.cr1max;
    this.cr2max = this.sanitizeItem(c["display.visualizations.custom.threshold_viz.threshold.colorRange2Max"]);
    this.color2 = c["display.visualizations.custom.threshold_viz.threshold.colorRange2"] ?? "#f2f20d";

    this.cr3min = this.cr2max;
    this.cr3max = this.sanitizeItem(c["display.visualizations.custom.threshold_viz.threshold.colorRange3Max"]);
    this.color3 = c["display.visualizations.custom.threshold_viz.threshold.colorRange3"] ?? "#ff9500";

    this.cr4min = this.cr3max;
    this.cr4max = this.sanitizeItem(c["display.visualizations.custom.threshold_viz.threshold.colorRange4Max"]);
    this.color4 = c["display.visualizations.custom.threshold_viz.threshold.colorRange4"] ?? "#ff2222";

    this.cr5min = this.cr4max;
    this.cr5max = this.sanitizeItem(c["display.visualizations.custom.threshold_viz.threshold.colorRange5Max"]);
    this.color5 = c["display.visualizations.custom.threshold_viz.threshold.colorRange5"] ?? "#8d0707";

    this.markLinesOpacity =
      c["display.visualizations.custom.threshold_viz.threshold.thresholdLines"] === "true" ? 1 : 0;
    this.outOfRangeColor = c["display.visualizations.custom.threshold_viz.threshold.outOfRangeColor"] ?? "#0c76e9";
  }

  sanitizeItem(s: string): number | string {
    return !Number.isNaN(parseInt(s)) ? parseInt(s) : "";
  }
}

function dimensions(fields: Field[]): string[] {
  return fields.flatMap((x) => {
    return x.splitby_value ?? x.name;
  });
}

function firstNonInternalDimention(dim: string[]): string {
  return dim.find((x) => !x.startsWith("_")) ?? "-1";
}

function series(dim: string[], config: Config) {
  let ln = lines(config);
  let ml = {};

  if (ln.length > 0) {
    ml = {
      markLine: {
        silent: true,
        symbol: ["none", "none"],
        lineStyle: { color: "#00000099", opacity: config.markLinesOpacity },
        data: lines(config),
      },
    };
  }

  return dim.flatMap((x) => {
    if (!x.startsWith("_")) {
      return {
        type: config.chartType,
        name: x,
        showSymbol: false,
        encode: {
          x: "_time",
          y: x,
        },
        ...ml,
      };
    } else {
      return [];
    }
  });
}

function isNotEmpty(c: string): boolean {
  if (c !== "") {
    return true;
  }
  return false;
}

function lineItem(c: string | number) {
  return { yAxis: c };
}

function lines(c: Config) {
  let data = [];

  if (c.cr1min !== "") {
    if (c.cr1min !== 0) {
      data.push(lineItem(c.cr1min));
    }
  } else {
    return [];
  }

  if (c.cr1max !== "") {
    if (c.cr1max !== 0) {
      data.push(lineItem(c.cr1max));
    }
  } else {
    return data;
  }

  if (c.cr2max !== "") {
    if (c.cr2max !== 0) {
      data.push(lineItem(c.cr2max));
    }
  } else {
    return data;
  }

  if (c.cr3max !== "") {
    if (c.cr3max !== 0) {
      data.push(lineItem(c.cr3max));
    }
  } else {
    return data;
  }

  if (c.cr4max !== "") {
    if (c.cr4max !== 0) {
      data.push(lineItem(c.cr4max));
    }
  } else {
    return data;
  }

  if (c.cr5max !== "") {
    if (c.cr5max !== "0") {
      data.push(lineItem(c.cr5max));
    }
  }
  return data;
}

function ranges(c: Config) {
  let pieces = [];

  if (c.cr1min !== "" && c.cr1max !== "") {
    pieces.push({
      gte: c.cr1min,
      color: c.color1,
      lt: c.cr1max,
    });
  } else {
    return [];
  }

  pieces.push({ gte: c.cr2min, color: c.color2 });
  if (c.cr2max !== "") {
    pieces[1].lt = c.cr2max;
  } else {
    return pieces;
  }

  pieces.push({ gte: c.cr3min, color: c.color3 });
  if (c.cr3max !== "") {
    pieces[2].lt = c.cr3max;
  } else {
    return pieces;
  }

  pieces.push({ gte: c.cr4min, color: c.color4 });
  if (c.cr4max !== "") {
    pieces[3].lt = c.cr4max;
  } else {
    return pieces;
  }

  pieces.push({ gte: c.cr5min, color: c.color5 });
  if (c.cr5max !== "") {
    pieces[4].lt = c.cr5max;
  }
  return pieces;
}

function option(data: SearchResult, config: Config) {
  let dim = dimensions(data.fields);
  let p = ranges(config);
  let vm = {};

  if (p.length > 0) {
    vm = {
      visualMap: {
        type: "piecewise",
        top: 50,
        right: 10,
        dimension: firstNonInternalDimention(dim),
        pieces: p,
        outOfRange: {
          color: config.outOfRangeColor,
        },
      },
    };
  }

  return {
    backgroundColor: "transparent",
    legend: { type: "scroll" },
    tooltip: { show: true, trigger: "axis", axisPointer: { type: "line" } },
    ...vm,
    dataset: {
      source: data.rows,
      dimensions: dim,
      sourceHeader: false,
    },
    xAxis: {
      type: "time",
      maxInterval: 3600 * 1000 * 12,
    },
    yAxis: {},
    series: series(dim, config),
    toolbox: { feature: { saveAsImage: { backgroundColor: config.background }, dataZoom: {} } },
  };
}
