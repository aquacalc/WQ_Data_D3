
// see: http://bl.ocks.org/ejb/774b87bf0f7482599419d1e7da9ed918

class LineChart_WQ_Data {

  constructor(_parentContainer) {
  // constructor(_parentContainer) {
    this.parentContainer = _parentContainer;

    // let values = $("#wq-select-wq>option").map(function() { return $(this).val(); });
    // console.log(values);

    this.initStaticVis();
  }


  initStaticVis() {

    // define width, height, and margin
    this.padding     = 10;
    // this.heightTotal = 500;
    // this.widthTotal  = 800;

    this.heightTotal = 350;
    this.widthTotal  = 800;

    this.margin = { top: 13, right: 100, bottom: 30, left: 80 },
        this.height = this.heightTotal - this.margin.top  - this.margin.bottom,
        this.width  = this.widthTotal  - this.margin.left - this.margin.right;

    // set up parent element and SVG
    // const svg = d3.select(this.parentContainer)
    this.svg = d3.select(this.parentContainer)
        .append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom);

    // append to a <g> element
    this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // Transition variable
    this.t = () => d3.transition().duration(500);

    // TOOLTIP
    this.tooltip = d3.select('body')
          .append('div')
            .style('opacity', 0)
            .classed('tooltip', true);


    // create the other stuff
    this.createScales();
    this.addAxes();
    // this.wrangleData();

    this.getDisplayVar('wq');

    let sliderValues = $("#date-slider").slider('option',"values");
    this.addScatterPlot(sliderValues);
  }


  createScales() {

// AXIS SCALES
    // calculate max and min for data
    this.yExtent = d3.extent(filteredData, d => d.temp);

    this.xScale = d3.scaleTime()
          .domain(d3.extent(filteredData, d => d.time))
          .range([this.padding, this.width - this.padding]);

    this.yScale = d3.scaleLinear()
          // .domain([25, this.yExtent[1]])
          .range([this.height - this.padding, this.padding]);

    this.phScale = d3.scaleLinear()
          .domain([6.5, 7.0, 7.5])
          .range(['red', 'green', '#003100']);

    this.o2Scale = d3.scaleLinear()
    // initial o2Scale for static LEGEND? (over-ridden for dynamic chart in addScatterPlot(), below)
          .domain([4, 15])
          .range([2, 15]); // range of radii



  // LEGEND - pH -- in this app, requires color scale
    this.legend = this.g.append('g')
      .attr('transform', `translate(${this.width + 90}, ${this.height - 130})`);

    ['7.50', '7.25', '7.00', '6.75', '6.50'].forEach((ph, idx) => {
      let legendRow = this.legend.append('g')
        // .classed('legend', true)
        .attr('transform', `translate(0, ${idx * 25})`);

      legendRow.append('text')
          .attr('x', -10)
          .attr('y', 10)
          .style('text-anchor', 'end')
          .style('font-weight', 'bold')
          .style('font-size', 16)
          .attr('opacity', 0.5)
          .attr('fill', this.phScale(ph))
          .text(`pH ${ph}`);
    });

    // LEGEND - O2 -- in this app, requires area scale
    this.legendO2 = this.svg.append('g')
      .attr('transform', `translate(${this.width + 90}, ${this.height - 240})`);
      // .attr('transform', `translate(${this.width + 90}, ${this.height - 240})`);

    this.legendO2.append('text')
          .attr('x', 45)
          .attr('y', -10)
          // .attr('x', -35)
          // .attr('y', -18)
          .style('text-anchor', 'middle')
          .style('font-weight', 'bold')
          // .style('font-size', 12)
          .text(`DO (mg/L)`);

    ['8.0', '7.0', '6.0', '5.0'].forEach((o2, idx) => {
      let legendRow = this.legendO2.append('g')
        .attr('transform', `translate(0, ${idx * 25})`);

      legendRow.append('text')
          .attr('x', 45)
          .attr('y', 15)
          .style('font-size', 16)
          .style('font-weight', 'bold')
          .text(`${o2}`);
          // .html(`${o2} mg O<sub>2</sub>/L`);

      legendRow.append('circle')
          .attr('cx', 25)
          .attr('cy', 10)
          .attr('r', this.o2Scale(o2))
          .attr('stroke', 'black')
          .attr('stroke-width', 0.5)
          .attr('fill', 'white');
    });

  }


  addAxes() {

    // create and append axis elements
    // AXIS GENERATOR FUNCTIONS
    this.xAxisCall = d3.axisBottom().scale(this.xScale);
    this.yAxisCall = d3.axisLeft().scale(this.yScale);

    // AXIS SVG GROUPS
    this.xAxis = this.g.append('g')
          .attr('class', 'x-axis')
          .attr('transform', `translate(0, ${this.height})`);
          // .transition(this.t())
          // .call(this.xAxisCall);

    this.yAxis  = this.g.append('g')
          .attr('class', 'y-axis');
          // .transition(this.t())
          // .call(this.yAxisCall);


    // Labels
    this.xLabel = this.g.append("text")
        .attr("class", "x axisLabel")
        .attr("y", this.height + 50)
        .attr("x", this.width / 2)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .text("Date (2012)");

    this.yLabel = this.g.append("text")
        .attr("class", "y axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -170)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .text("Price (USD)")

  }


  getDisplayVar(my_select_type) {
    this.option = my_select_type;
    this.wqVar = $("#wq-select-wq").val();
    if(my_select_type !== 'wq') {
      this.wqVar = $("#wq-select-shrimp").val();
    }
    return this.wqVar;
  }


  addScatterPlot(sliderValues) {

  // console.log(this.wqVar);
  // get current control values
    // this.wqVar = $("#wq-select-wq").val();

    // this.wqVar   = $("#wq-select-wq").val();
    // this.wqVar   = $("#wq-select-shrimp").val();
    this.tankVar = $("#tank-select").val().toUpperCase();

    this.dataTimeFiltered = filteredData[this.tankVar].filter((d, i) => {
    // [OLD] this.dataTimeFiltered = filteredData.filter((d, i) => { [OLD]
      return (d.time >= sliderValues[0]) &&
             (d.time <= sliderValues[1]) &&
             (d[this.wqVar] != undefined);
             // &&
             // (d.tank === this.tankVar);
    });


    // this.dataTimeFiltered.sort((a, b) => parseTime(a.time).getTime() - parseTime(b.time).getTime());
    this.dataTimeFiltered.sort((a, b) => a.time - b.time);


    // Update X-SCALE
    this.xMin = d3.min(this.dataTimeFiltered, d => d.time);
    this.xMax = d3.max(this.dataTimeFiltered, d => d.time);

    this.xScale
          .domain([this.xMin, this.xMax]);
          // .domain(d3.extent(this.dataTimeFiltered, d => d.time));

    // Update Y-SCALE
    this.yMin = d3.min(this.dataTimeFiltered, d => d[this.wqVar]);
    this.yMax = d3.max(this.dataTimeFiltered, d => d[this.wqVar]);


// *** Over-ride y-axis min/max conditioned on wqVar
// *** e.g., if wqVar = count.lb.tails, this.yMin = 20

// first, enforce bottom-to-top y-axis scale (conditional reversal for count/tail)

    if(this.wqVar === 'count.lb.tails') {
      this.yMax = 300;
      this.yMin = 30;
      this.yScale
        .range([this.padding, this.height - this.padding]);

    } else if(this.wqVar == 'count.kg.heads') {
      this.yMax = 400;
      this.yMin = 40;
      this.yScale
        .range([this.padding, this.height - this.padding]);

    } else {
      this.yScale
        .range([this.height - this.padding, this.padding]);
    }

    // if(this.wqVar === 'temp') {
    //   this.yMin = 26;
    //   this.yMax = 33;
    // }
    // if(this.wqVar === 'sal') {
    //   this.yMin = 24;
    //   this.yMax = 38;
    // }
    // if(this.wqVar === 'ph') {
    //   this.yMin = 6.3;
    //   this.yMax = 7.8;
    // }
    // if(this.wqVar === 'co2.mgL') {
    //   this.yMin = 0;
    //   this.yMax = 70;
    // }
    if(this.wqVar === 'o2.hg') {
      this.yMin = this.yMin > 70 ? 70 : this.yMin;
      this.yMax = this.yMax < 100 ? 100 : this.yMax;
    }
    // if(this.wqVar === 'uia.posto') {
    //   this.yMin = 0;
    //   this.yMax = 2.5;
    // }
    if(this.wqVar === 'feed.day') {
      this.yMin =0;
    }
    if(this.wqVar === 'wbar') {
       this.yMin = 0;
       this.yMax = 23;
    }
    if(this.wqVar === 'FCR') {
      this.yMin = 0;
      this.yMax = 1.2;
    }

    this.yScale
          .domain([this.yMin / 1.005, this.yMax * 1.005]);

// nb: AFTER WRANGLING WQ Data, had to move o2Scale domain calc here, else got NaN
// UPDATE: HARD-CODED above when define O2 scale
    // this.o2Scale
    //       .domain(d3.extent(this.dataTimeFiltered, d => d['do.mgL']))


    // Update X-AXIS
    // for number of ticks, see: http://www.d3noob.org/2016/08/changing-number-of-ticks-on-axis-in.html
    this.xAxisCall = d3.axisBottom().scale(this.xScale);
          // .ticks(d3.timeDay.every(4));
    this.xAxis
          .transition(this.t())
          .call(this.xAxisCall);

    // Update Y-AXIS
    this.yAxisCall = d3.axisLeft().scale(this.yScale);
    this.yAxis
          .transition(this.t())
          .call(this.yAxisCall);

// ***************************
  // define the line
  let valueline = d3.line()
      .x(d => this.xScale(d.time))
      .y(d => this.yScale(d[this.wqVar]));

  // Add the valueline path.
   // this.g.enter().append("path")
   let my_line = this.g.selectAll('path')
           .data(this.dataTimeFiltered);

    my_line.exit()
        .transition(this.t())
          // .attr('opacity', 0)
          .remove();

    my_line.enter()
        .append("path")
          .merge(my_line)
          .transition(this.t()).transition(this.t()).ease(d3.easeBackInOut).delay((d, i) => i * 5)
        // .data(this.dataTimeFiltered)
        // .attr("class", "line")
            .attr('fill', 'none')
            .attr('stroke', 'lightgrey')
            .attr('opacity', 0.8)
            .attr('stroke-width', '0.5px')
            .attr("d", valueline(this.dataTimeFiltered));

// ----------------------------------------------

  let plot = this.g.selectAll('circle')
      .data(this.dataTimeFiltered, d => d.time);

   plot.exit()
     .transition(this.t())
     .attr('r', 0)
     .attr('opacity', 0)
     .remove();

   plot.enter()
     .append('circle')
     // ** WITHOUT ** two lines below, data 'shoot' in from upper right
     // .transition().duration(500)
       .attr('cx', d => this.xScale(d.time))
       .attr('cy', d => this.yScale(d[this.wqVar]))

     .on('mousemove', d => {
       this.tooltip
         .style('opacity', 0.7)
         .style('font-face', 'bold')
         .style('left',  d3.event.x - (this.tooltip.node().offsetWidth / 2) + 'px')
         .style('top', d3.event.y + 20 + 'px')
         // .html(wq_tip_text);
         .html(`
           <p>${formatTime(d.time)} ${formatTimeT(d.time)}</p>
           <p>${d.temp} C</p>
           <p>${d.sal} ppt</p>
           <p>${d['do.mgL']} mg O<sub>2</sub>/L</p>
           <p>pH ${d.ph} (NBS)</p>
         `);
     })

     .on('mouseout', () => {
       this.tooltip.style('opacity', 0);
     })

     .merge(plot)  // HAD TO MERGE!! see: https://stackoverflow.com/questions/20708442/d3-js-chart-not-updated-with-new-data

     .attr('fill', d => this.phScale(d.ph))  // based on pH
     // .attr('cx', d => this.xScale(d.time))
     .style('pointer-events', 'all')
         .attr('opacity', 0.5)
         .attr('r', d => this.o2Scale(d['do.mgL']))
         .transition(this.t()).transition(this.t()).ease(d3.easeBackInOut).delay((d, i) => i * 10)
           .attr('cx', d => this.xScale(d.time))
           .attr('cy', d => this.yScale(d[this.wqVar]));
       // .attr('fill', d => d.ampm === 'am' ? 'blue' : 'red') // based on AM/PM


// *** KLUDGE **** Why must repeat this code here (else, axes disappear)
       this.xAxisCall = d3.axisBottom().scale(this.xScale);
             // .ticks(d3.timeDay.every(4));
       this.xAxis
             .transition(this.t())
             .call(this.xAxisCall);

       // Update Y-AXIS
       this.yAxisCall = d3.axisLeft().scale(this.yScale);
       this.yAxis
             .transition(this.t())
             .call(this.yAxisCall);


    // Update y-axis label
    if(this.option === 'wq') {
      this.newText = $("#wq-select-wq option:selected").text();
    } else {
      this.newText = $("#wq-select-shrimp option:selected").text();
    }
    this.yLabel.transition(this.t()).text(this.newText);
  }

}
