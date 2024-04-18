let circle_size;
const primary_types = [
  {
    type: "Primary Type",
  },
  {
    type: "Secondary Type",
  },
];

d3.csv("./src/assets/pokemon.csv").then(function (data) {
  //Convert string values to appropriate data types
  data.forEach(function (d) {
    d["Pokedex Number"] = parseInt(d["Pokedex Number"]);
    d["Height_m"] = parseFloat(d["Height_m"]);
    d["Weight_kg"] = parseFloat(d["Weight_kg"]);
    d["HP"] = parseInt(d["HP"]);
    d["Speed"] = parseInt(d["Speed"]);
    d["Attack"] = parseInt(d["Attack"]);
    d["Special Attack"] = parseInt(d["Special Attack"]);
    d["Defense"] = parseInt(d["Defense"]);
    d["Special Defense"] = parseInt(d["Special Defense"]);
    d["Happiness"] = parseInt(d["Happiness"]);
    d["Is Legendary"] = d["Is Legendary"] === "True";
  });

  const speedValues = data.map((d) => d["Speed"]);
  const minSpeed = d3.min(speedValues);
  const maxSpeed = d3.max(speedValues);

  // Extract unique primary types from the data array
  const primary_types_array = [
    ...new Set(data.map((d) => d["Primary Type"])),
  ].map((type) => ({ type }));

  // Extract unique secondary types from the data array
  const secondary_types_array = [
    ...new Set(
      data.map((d) => d["Secondary Type"]).filter((type) => type !== "")
    ),
  ].map((type) => ({ type }));

  const numericalColumns = Object.keys(data[0]).filter((column) => {
    return !isNaN(parseFloat(data[0][column]));
  });
  const columnOptions = [];
  numericalColumns.forEach((column) => {
    columnOptions.push({ value: column, text: column });
  });

  //X Axis dropdown
  const xAxisSelect = document.createElement("web-provenance-dropdown");
  xAxisSelect.id = "xAxis";
  xAxisSelect.options = columnOptions;
  xAxisSelect.optionLabel = "text";
  xAxisSelect.dataKey = "value";
  xAxisSelect.selected = undefined;
  xAxisSelect.addEventListener("selectedChange", (event) => {
    xAxisSelect.selected = event.detail;
    updatePlotXAxis(event);
  });
  document
    .querySelector("label[for='xAxis']")
    ?.insertAdjacentElement("afterend", xAxisSelect);

  //Y Axis dropdown
  const yAxisSelect = document.createElement("web-provenance-dropdown");
  yAxisSelect.id = "yAxis";
  yAxisSelect.options = columnOptions;
  yAxisSelect.optionLabel = "text";
  yAxisSelect.dataKey = "value";
  yAxisSelect.selected = undefined;
  yAxisSelect.addEventListener("selectedChange", (event) => {
    yAxisSelect.selected = event.detail;
    updatePlotYAxis(event);
  });
  document
    .querySelector("label[for='yAxis']")
    ?.insertAdjacentElement("afterend", yAxisSelect);

  //Radio for filtering data based on type of pokemon
  const radiobutton = document.createElement("web-provenance-radiobutton");
  radiobutton.id = "type";
  radiobutton.data = primary_types;
  radiobutton.label = "type";
  radiobutton.value = "type";
  radiobutton.selected = undefined;
  radiobutton.addEventListener("selectedChange", (event) => {
    radiobutton.selected = event.detail;
    filterByType(event.detail);
  });
  document
    .querySelector("label[for='type']")
    ?.insertAdjacentElement("afterend", radiobutton);

  //Multiselect for filtering based on primary type
  const multiselect = document.createElement("web-provenance-multiselect");
  multiselect.id = "primary-type";
  multiselect.options = primary_types_array;
  multiselect.optionLabel = "type";
  multiselect.dataKey = "type";
  multiselect.selected = undefined;
  multiselect.addEventListener("selectedChange", (event) => {
    // Mandatory to update the selected property
    multiselect.selected = event.detail;
    filterByPrimaryTypes(event.detail);
  });

  document
    .querySelector("label[for='primary-type']")
    ?.insertAdjacentElement("afterend", multiselect);

  //Slider to adjust the size of the circles
  const sliderOpts = { floor: 0, ceil: 20, showTicks: true, tickStep: 5 };

  const slider = document.createElement("web-provenance-slider");
  slider.id = "circle-size";
  slider.value = 7;
  slider.options = sliderOpts;
  slider.provenance = undefined;

  // Listening to events
  slider.addEventListener("provenanceChange", console.log);
  slider.addEventListener("selectedChange", (event) => {
    circle_size = event.detail.value;
    chart.selectAll("circle").attr("r", event.detail.value);
  });

  document
    .querySelector("label[for='circle-size']")
    ?.insertAdjacentElement("afterend", slider);

  //Range slider to select pokemon based on speed
  const rangeSliderOpts = {
    floor: minSpeed,
    ceil: maxSpeed,
    showTicks: true,
    tickStep: 10,
  };
  const rangeSlider = document.createElement("web-provenance-slider");
  rangeSlider.id = "speed-range";
  rangeSlider.value = minSpeed;
  rangeSlider.highValue = maxSpeed;
  rangeSlider.options = rangeSliderOpts;
  slider.addEventListener("provenanceChange", console.log);
  rangeSlider.addEventListener("selectedChange", (event) => {
    updateChartBySpeedRange(event.detail);
  });
  document
    .querySelector("label[for='speed-range']")
    ?.insertAdjacentElement("afterend", rangeSlider);

  //Input text to highlight pokemon
  const inputtext = document.createElement("web-provenance-inputtext");
  document
    .querySelector("label[for='pokemon-name']")
    ?.insertAdjacentElement("afterend", inputtext);

  inputtext.addEventListener("valueChange", function (event) {
    const pokemonName = event.detail.trim().toLowerCase();
    const filteredData = data.filter((d) =>
      d.Name.toLowerCase().includes(pokemonName)
    );

    chart
      .selectAll("circle")
      .attr("fill", (d) => (filteredData.includes(d) ? "#ebff3a" : "#833b3b"));

    const originalRadius = circle_size;
    const highlightedCircle = chart
      .selectAll("circle")
      .filter((d) => filteredData.includes(d));

    highlightedCircle
      .transition()
      .duration(500)
      .attr("r", originalRadius * 3);

    if (pokemonName === "") {
      chart
        .selectAll("circle")
        .transition()
        .duration(500)
        .attr("r", circle_size)
        .attr("fill", "#833b3b");
    }
  });

  //Checbox to filter out secondary types
  const checkbox = document.createElement("web-provenance-checkbox");

  checkbox.id = "secondary-type";
  checkbox.data = secondary_types_array;
  checkbox.name = "undefined";
  checkbox.label = "type";
  checkbox.value = "type";
  checkbox.selected = undefined;
  checkbox.addEventListener("selectedChange", (event) => {
    // Mandatory to update the selected property
    checkbox.selected = event.detail;
    filterBySecondaryTypes(event.detail);
  });

  document
    .querySelector("label[for='secondary-type']")
    ?.insertAdjacentElement("afterend", checkbox);

  //Set default axes
  let xColumn = numericalColumns[0];
  let yColumn = numericalColumns[1];

  //Create SVG container for the scatter plot
  const titleText = "Pokemon Visualizer";
  const svgWidth = 800;
  const svgHeight = 400;
  const margin = { top: 20, right: 20, bottom: 50, left: 50 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  const svg = d3
    .select("#visualization")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  //Create scales for X and Y axes
  const xScale = d3
    .scaleLinear()
    .range([0, width])
    .domain(d3.extent(data, (d) => d[xColumn]));

  const yScale = d3
    .scaleLinear()
    .range([height, 0])
    .domain(d3.extent(data, (d) => d[yColumn]));

  //Create X and Y axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  chart
    .append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .text(titleText);

  chart.append("g").attr("transform", `translate(0, ${height})`).call(xAxis);

  chart.append("g").call(yAxis);

  //Create circles for data points
  chart
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d[xColumn]))
    .attr("cy", (d) => yScale(d[yColumn]))
    .attr("r", 7)
    .attr("fill", (d) => "#833b3b");

  //Update axis function X
  function updatePlotXAxis(event) {
    xColumn = event.detail.value;
    xScale.domain(d3.extent(data, (d) => d[xColumn]));
    yScale.domain(d3.extent(data, (d) => d[yColumn]));

    chart
      .selectAll("circle")
      .transition()
      .duration(500)
      .attr("cx", (d) => xScale(d[xColumn]))
      .attr("cy", (d) => yScale(d[yColumn]));
  }

  //Update axis function Y
  function updatePlotYAxis(event) {
    yColumn = event.detail.value;
    xScale.domain(d3.extent(data, (d) => d[xColumn]));
    yScale.domain(d3.extent(data, (d) => d[yColumn]));

    chart
      .selectAll("circle")
      .transition()
      .duration(500)
      .attr("cx", (d) => xScale(d[xColumn]))
      .attr("cy", (d) => yScale(d[yColumn]));
  }

  //Filter by type function
  function filterByType(type) {
    const filteredData = data.filter((d) => {
      if (type === "Primary Type") {
        return d["Primary Type"] !== "";
      } else if (type === "Secondary Type") {
        return d["Secondary Type"] !== "";
      }
    });

    xScale.domain(d3.extent(filteredData, (d) => d[xColumn]));
    yScale.domain(d3.extent(filteredData, (d) => d[yColumn]));

    chart
      .selectAll("circle")
      .data(filteredData)
      .transition()
      .duration(500)
      .attr("cx", (d) => xScale(d[xColumn]))
      .attr("cy", (d) => yScale(d[yColumn]));
  }

  //Filter by primary type function
  function filterByPrimaryTypes(selectedTypes) {
    const filteredData = data.filter((d) => {
      return !selectedTypes.some(
        (typeObj) => typeObj.type === d["Primary Type"]
      );
    });

    xScale.domain(d3.extent(filteredData, (d) => d[xColumn]));
    yScale.domain(d3.extent(filteredData, (d) => d[yColumn]));

    // Update circles in the chart with transition
    chart
      .selectAll("circle")
      .data(filteredData)
      .transition()
      .duration(500)
      .attr("cx", (d) => xScale(d[xColumn]))
      .attr("cy", (d) => yScale(d[yColumn]));
  }

  // Filter Pokémon by secondary type function
  function filterBySecondaryTypes(selectedTypes) {
    const filteredData = data.filter((d) => {
      return !selectedTypes.some((typeObj) => typeObj === d["Secondary Type"]);
    });

    xScale.domain(d3.extent(filteredData, (d) => d[xColumn]));
    yScale.domain(d3.extent(filteredData, (d) => d[yColumn]));

    // Update circles in the chart with transition
    chart
      .selectAll("circle")
      .data(filteredData)
      .transition()
      .duration(500)
      .attr("cx", (d) => xScale(d[xColumn]))
      .attr("cy", (d) => yScale(d[yColumn]));
  }

  //Update chart by speed range function
  function updateChartBySpeedRange(speedRange) {
    const lowSpeed = speedRange.value;
    const highSpeed = speedRange.highValue;

    const filteredData = data.filter(
      (d) => d["Speed"] >= lowSpeed && d["Speed"] <= highSpeed
    );

    chart
      .selectAll("circle")
      .data(filteredData)
      .transition()
      .duration(500)
      .attr("cx", (d) => xScale(d[xColumn]))
      .attr("cy", (d) => yScale(d[yColumn]));
  }
});
