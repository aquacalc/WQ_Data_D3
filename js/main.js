// STATIC CHART

// declare lineChart instance variable
  let lineChart,
      timeLine;

  // Time parsing & formatting
  // "2012-06-01 08:30:00" -> "%Y-%m-%d %H:%M:%S"
  let parseTime   = d3.timeParse("%Y-%m-%d %H:%M:%S");
  let formatTime  = d3.timeFormat("%d/%m/%Y"); // %d-%b-%y
  let formatTimeT = d3.timeFormat("%H:%M"); // %d-%b-%y

// see: https://learn.jquery.com/using-jquery-core/faq/how-do-i-get-the-text-value-of-a-selected-option/
    // $('#wq-select').on('change', () => console.log(`The WQ variable is ${$('#wq-select option:selected').text()}`));
    // $('#wq-select-wq').on('change', () => lineChart.addScatterPlot($("#date-slider").slider('option',"values")));
    // $('#wq-select-shrimp').on('change', () => lineChart.addScatterPlot($("#date-slider").slider('option',"values")));
    $('#wq-select-wq').on('change', () => sendSelectionChangeToChart('wq'));
    $('#wq-select-wq').on('click', () => sendSelectionChangeToChart('wq'));
    $('#wq-select-shrimp').on('change', () => sendSelectionChangeToChart('shrimp'));
    $('#wq-select-shrimp').on('click', () => sendSelectionChangeToChart('shrimp'));

    $('#tank-select').on('change', () => lineChart.addScatterPlot($("#date-slider").slider('option',"values")));
    $('#tank-select').on('change', () => timeLine.addScatterPlot($("#date-slider").slider('option',"values")));

    // Add jQuery UI slider
    $("#date-slider").slider({
        range: true,
        min: parseTime("2012-06-01 08:21:21").getTime(),
        max: parseTime("2012-08-08 16:21:39").getTime(),
        // step: 86400000, // msec / day
        step: 43200000, // msec / half-day
        // step: 3600000, // msec / hr
        values: [parseTime("2012-06-01 08:21:21").getTime(),
                 parseTime("2012-08-08 16:21:39").getTime()],
        slide: (event, ui) => {
            $("#dateLabel1").text(formatTime(new Date(ui.values[0])));
            $("#dateLabel2").text(formatTime(new Date(ui.values[1])));

            valuemin = ui.values[0];
            valuemax = ui.values[1];

            next = $(this).next().val(valuemax);
            prev = $(this).prev().val(valuemin);

            // lineChart.addScatterPlot(ui.values);


            dates = ui.values.map(val => new Date(val));
            xVals = dates.map(date => timeLine.xScale(date));

            timeLine.brushComponent
                .call(timeLine.brush.move, xVals);
        }
    });

    let brushed = () => {

      let selection = d3.event.selection || timeLine.xScale.range();
      let newValues = selection.map(timeLine.xScale.invert);

      $('#date-slider')
        .slider('values', 0, newValues[0])
        .slider('values', 1, newValues[1]);
      $('#dateLabel1').text(formatTime(newValues[0]));
      $('#dateLabel2').text(formatTime(newValues[1]));
      // $("#dateLabel1").text(formatTime(new Date(ui.values[0])));
      // $("#dateLabel2").text(formatTime(new Date(ui.values[1])));

      lineChart.addScatterPlot($("#date-slider").slider('option',"values"));
    };

      // {
      //   "time":"2012-06-19 16:46:00",
      //   "temp":30.44,
      //   "sal":31.88,
      //   "do.posto":79,
      //   "do.mgL":4.97,
      //   "ph":7.36,
      //   "alk":254,
      //   "wbar":5.4,
      //   "b":108000,
      //   "feed.day":6,
      //   "feed.cum":71.805,
      //   "ampm":"pm",
      //   "tank":"RW1",
      //   "temp.k":303.54,
      //   "temp.f":86.792,
      //   "ph.free":7.3514,
      //   "uia.posto":1.3864,
      //   "alk.meq":5.0756,
      //   "dic":0.0051,
      //   "co2.mgL":8.2797,
      //   "co2":0.0002,
      //   "hco3":0.0049,
      //   "co3":0.0001,
      //   "o2.hg":125.7598,
      //   "spp.feed.rate":5.5556,
      //   "count.lb.heads":84.1741,
      //   "count.lb.tails":137.9903,
      //   "count.kg.heads":185.1852,
      //   "count.kg.tails":303.5823,
      //   "FCR":0.6649,
      //   "spp.growth.rate":5.7283
      // }

      // HOSO (30/40, 40/50, 50/60, etc. pcs/kg). standard pack is 2 kg box, 10 boxes into a master carton.
      // The remaining presentations are graded (U15, 16/20, 21/25, 26/30, 31/35, 36/40, 41/50, etc. pcs/lb). The standard pack is in a 5 lb box, 10 boxes into a master carton.

    d3.json('data/tz.2012.5.json').then(data => {

      let new_data = data
      .slice(0)
      .sort((a, b) => parseTime(a.time).getTime() - parseTime(b.time).getTime())
      .reduce((obj, item) => {
        if (!obj[item.tank]) {
          obj[item.tank] = [item]
        } else {
          obj[item.tank] = [
            ...obj[item.tank],
            item
          ]
        }
        return obj
      }, {});

      // Prepare and clean data
      filteredData = {};

      for(let tank in new_data) {
  // see:https://stackoverflow.com/questions/9396569/javascript-what-is-property-in-hasownproperty
        if (!new_data.hasOwnProperty(tank)) {
            continue;
        }

        filteredData[tank] = new_data[tank].filter(d => d.temp);

        filteredData[tank].forEach(d => d.time = parseTime(d.time).getTime());
      }

      // console.log(`--------------`);
      // console.log(...filteredData['RW1']);
      // console.log(`--------------`);

      // ['RW1', 'RW2', 'RW3', 'RW4','RW5', 'RW6'].map((d, i) =>
      //   lineChart = new LineChart_WQ_Data(`#chart-area-`${i}, d);
      // );

      lineChart = new LineChart_WQ_Data('#chart-area');
      timeLine  = new TimeLine('#timeline-area');

    }).catch(err => console.log(`BLIMEY! ${err}`));


    let sendSelectionChangeToChart = (my_select_input) => {
      lineChart.getDisplayVar(my_select_input);
      lineChart.addScatterPlot($("#date-slider").slider('option',"values"));

      timeLine.getDisplayVar(my_select_input);
      timeLine.addScatterPlot($("#date-slider").slider('option',"values"));
    };
