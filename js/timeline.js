
// see: http://bl.ocks.org/ejb/774b87bf0f7482599419d1e7da9ed918

class TimeLine {

  constructor(_parentContainer) {

    this.parentContainer = _parentContainer;

    this.initStaticVis();
  }


  initStaticVis() {

    // define width, height, and margin
    this.padding     = 10;

    this.heightTotal = 130;
    this.widthTotal  = 800;

    this.margin = { top: 13, right: 100, bottom: 30, left: 80 },
        this.height = this.heightTotal - this.margin.top  - this.margin.bottom,
        this.width  = this.widthTotal  - this.margin.left - this.margin.right;

    // set up parent element and SVG
    this.svg = d3.select(this.parentContainer)
        .append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom);

    // append to a <g> element
    this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // Transition variable
    this.t = () => d3.transition().duration(500);

    // create the other stuff
    this.createScales();
    this.addAxes();

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


    // LEGEND - AM/PM
    this.legendAmPm = this.svg.append('g')
      .attr('transform', `translate(${this.width + 60}, ${this.height - 60})`);

    // this.legendAmPm.append('text')
    //       .style('text-anchor', 'middle')
    //       .style('font-weight', 'bold')
    //       // .style('font-size', 12)
    //       .attr('x', 25)
    //       .attr('y', 10)
    //       .text(`Time of Day`);

    ['PM', 'AM'].forEach((ampm, idx) => {
      let legendRow = this.legendAmPm.append('g')
        .attr('transform', `translate(0, ${idx * 20})`);

      legendRow.append('text')
          .attr('x', 35)
          .attr('y', 35)
          .style('font-size', 16)
          .style('font-weight', 'bold')
          .text(`${ampm}`);

      legendRow.append('circle')
          .attr('cx', 25)
          .attr('cy', 30)
          .attr('r', '3px')
          .attr('stroke', 'black')
          .attr('stroke-width', 0.5)
          .attr('fill', ampm === 'AM' ? 'blue' : 'red'); // based on AM/PM

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

    this.yAxis = this.g.append('g')
          .attr('class', 'y-axis');
          // .transition(this.t())
          // .call(this.yAxisCall);


    this.areaPath = this.g.append('path')
        .attr('fill', '#ccc');

// BRUSH GENERATOR
    this.brush = d3.brushX()
          .handleSize(10)
          .extent([[0, 0], [this.width, this.height]])
          .on('brush', brushed);
          // .on("end", this.displayTable);

    this.brushComponent = this.g.append('g')
          .attr('class', 'brush')
          .call(this.brush);
  }


// see: http://bl.ocks.org/feyderm/6bdbc74236c27a843db633981ad22c1b
  // displayTable() {
  //   console.log(d3.event.selection);
  //
  //   let d_brushed =  d3.selectAll(".brush").data();
  //
  //   console.log(d_brushed.length);
  //
  //   d_brushed.forEach(d_row => console.log(d_row));
  // }


  getDisplayVar(my_select_type) {
    this.option = my_select_type;
    this.wqVar = $("#wq-select-wq").val();
    if(my_select_type !== 'wq') {
      this.wqVar = $("#wq-select-shrimp").val();
    }
    return this.wqVar;
  }


  addScatterPlot(sliderValues) {

    this.tankVar = $("#tank-select").val().toUpperCase();

    this.dataTimeFiltered = filteredData[this.tankVar].filter((d, i) => {
      return d[this.wqVar] != undefined;
    });

    this.dataTimeFiltered.sort((a, b) => a.time - b.time);

    // console.log(this.wqVar);
    // console.log(this.tankVar);
    // console.log(filteredData[this.tankVar]);


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

        // this.g.append("line")
        //    .attr("class", "mean-line")
        //    .attr({
        //      x1: this.xScale(26), y1: this.yScale(this.xMin),
        //      x2: this.xScale(26), y2: this.yScale(this.xMax)
        //     });

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
    // if(this.wqVar === 'o2.hg') {
    //   this.yMin = 0;
    //   // this.yMax = 350;
    // }
    // if(this.wqVar === 'uia.posto') {
    //   this.yMin = 0;
    //   this.yMax = 2.5;
    // }
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

// Update X-AXIS
    // for number of ticks, see: http://www.d3noob.org/2016/08/changing-number-of-ticks-on-axis-in.html
    this.xAxisCall = d3.axisBottom().scale(this.xScale);
          // .ticks(d3.timeDay.every(4));
    this.xAxis
          // .transition(this.t())
          .call(this.xAxisCall);

// Update Y-AXIS
    // this.yAxisCall = d3.axisLeft().scale(this.yScale);
    // this.yAxis
    //       // .transition(this.t())
    //       .call(this.yAxisCall);


// ----------------------------------------------

  this.area = d3.area()
        .x(d => this.xScale(d.time))
        .y0(this.height)
        .y1(d => this.yScale(d[this.wqVar]));

  this.areaPath
        .data([this.dataTimeFiltered])
        .attr('d', this.area);

// ----------------------------------------------

  let plot = this.g.selectAll('circle')
      .data(this.dataTimeFiltered, d => d.time);

   plot.exit()
     // .transition(this.t())
     .attr('r', 0)
     .attr('opacity', 0)
     .remove();

   plot.enter()
     .append('circle')
     // ** WITHOUT ** two lines below, data 'shoot' in from upper right
     // .transition().duration(500)
       .attr('cx', d => this.xScale(d.time))
       .attr('cy', d => this.yScale(d[this.wqVar]))
     .merge(plot)  // HAD TO MERGE!! see:
     .style('pointer-events', 'all')
         .attr('opacity', 0.5)
         .attr('r', '2px')
         // .attr('r', d => this.o2Scale(d['do.mgL']))
         // .transition(this.t()).transition(this.t()).ease(d3.easeBackInOut).delay((d, i) => i * 10)
           .attr('cx', d => this.xScale(d.time))
           .attr('cy', d => this.yScale(d[this.wqVar]))
           .attr('fill', d => d.ampm === 'am' ? 'blue' : 'red'); // based on AM/PM
  }

}
