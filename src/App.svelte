<script>
  import { fade, fly } from 'svelte/transition';
  import Example from "$components/Example.svelte";
  import data from "$data/data.js";
  import tippingData from "$data/tippingData.json";
  import { scaleLinear } from "d3-scale";
  import { line } from "d3-shape";
  import parrotbill from "./Assets/birds/parrotbill.png"
  import eider from "./Assets/birds/kingEider.png"
  import allen from "./Assets/birds/allenshumming.png"
  import pipit from "./Assets/birds/pipit.png"
  import blackswift from "./Assets/birds/blackswift.png"
  import duck from "./Assets/birds/duck.png"
  import sage from "./Assets/birds/sage.png"
  import crane from "./Assets/birds/crane.png"
  import warbler from "./Assets/birds/warbler.png"
  import goose from "./Assets/birds/goose.png"
  import mallard from "./Assets/birds/mallard.jpg"
  import bobo from "./Assets/birds/bobo.png";
  import styles from "./styles.css";
  import urgency from "./Assets/birds/urgency.png";
  import panel from "./Assets/birds/Birds-background.png";
  import { onMount } from 'svelte';

  let groups = [];
  let years = [];
  $: selectedGroup = 'Aridland';
  
  let chartWrapper;
  $: width = chartWrapper?.clientWidth || 800;
  $: height = chartWrapper?.clientHeight * 1.2|| 600;

  onMount(() => {
  console.log('onMount: chartWrapper ->', chartWrapper);
  console.log('onMount: querySelector ->', document.querySelector('.chart-container'));
  console.log('onMount: sizes ->', {
    clientWidth: chartWrapper?.clientWidth,
    clientHeight: chartWrapper?.clientHeight
  });
});

onMount(() => {
  const resizeObserver = new ResizeObserver(() => {
    width = chartWrapper?.clientWidth || 800;
  })
  if (chartWrapper){
    resizeObserver.observe(chartWrapper);
    return () => resizeObserver.disconnect();
  }
})


  //extracting all unique groups from the data
  for (const group of data) {
    if(!groups.find((name) => name == group.Group)){
      groups.push(group.Group);
    }
  }

  //extracting all the years in the data
  for (const group of data) {
    if(group.Group == 'Aridland'){
        years.push(group.Year);
      }
  }

  //extracting percentage data
  $: percentageData = data.filter(d => d.Group === selectedGroup).map(d => d.percent);

  //storing min, max percentages to use for domain later
  $: minPercent = Math.min(...percentageData);
  $: maxPercent = Math.max(...percentageData);

  $: console.log(selectedGroup,percentageData, minPercent, maxPercent);

  // Defining scales
  $: xScale = scaleLinear().domain([1970, 2022]).range([100, width - 100]);
  $: yScale = scaleLinear().domain([minPercent, maxPercent]).range([height - 100, 100]);

  // Prepare data for the line generator
  $: getLineData = (selectedGroup) => {
    const fileteredData = data.filter(d => d.Group === selectedGroup);
    const yearsForTheGroup = fileteredData.map(d => +d.Year);
    const percentageDataForTheGroup = fileteredData.map(d => +d.percent);

    return yearsForTheGroup.map((year, index) => ({
      x: year,
      y: percentageDataForTheGroup[index]
    }))
  }

  let lineData = {};

  $: {
    if(selectedGroup){
      lineData[selectedGroup] = getLineData(selectedGroup);
    }
  }

  // console.log(groups)
  // $: console.log('Width:', width);
  // $: console.log(selectedGroup);
  // $: console.log(lineData[selectedGroup]);
  // $: console.log(lineGenerator(lineData[selectedGroup]));

  //line generator function
  $: lineGenerator = line()
  .x((d) => xScale(d.x))  //Mapping years to x-scale
  .y((d) => yScale(d.y));


  //Axes

  let xTicks = [1970, 1980, 1990, 2000, 2010, 2020];

  $: yTicks = (() => {
    const tickCount = 5;
    if (!isFinite(minPercent) || !isFinite(maxPercent)) return [];

    let step = Math.round((maxPercent - minPercent) / (tickCount - 1)); //Calculating the interval between ticks
    console.log("step:", step);
    return Array.from({length: tickCount}, (_, i) => {
      const value = (minPercent + step * i).toFixed(1);
      console.log(`Tick ${i}`, value);
      return parseFloat(value); //rounds value to one decimal place
    }); //this returns an array of ticks (takes the length and a callback function. The blank in the callback function is because the array is currently empty)
  })(); 

  $: selectedGroupData = data.filter(d => d.Group === selectedGroup);

  $: console.log(selectedGroupData);

  $: maxPoint = selectedGroupData.reduce((prev, current) => {
      return parseFloat(prev.percent) > parseFloat(current.percent) ? prev : current;
    }, selectedGroupData[0])

    $: minPoint = selectedGroupData.reduce((prev, current) => {
      return parseFloat(prev.percent) < parseFloat(current.percent) ? prev : current;
    }, selectedGroupData[0])

  $: console.log(maxPoint, minPoint);

  $: selectedImage = (selectedGroup) => {
    if (selectedGroup == "Grassland"){
      return bobo
    } else if (selectedGroup == "Tipping Point"){
      return parrotbill
    } else if (selectedGroup == "Sea Ducks"){
      return eider
    } else if (selectedGroup == "Western Forest"){
      return blackswift
    } else if (selectedGroup == "Eastern Forest"){
      return warbler
    } else if (selectedGroup == "Geese and Swans"){
      return goose
    } else if (selectedGroup == "Waterbirds"){
      return pipit
    } else if (selectedGroup == "Aridland"){
      return sage
    } else if (selectedGroup == "Dabbling/Diving Ducks"){
      return duck
    } else {
      return allen
    }
  }
  

  $: console.log(yTicks);

  const observe = (node) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if(entry.isIntersecting){
          selectedGroup = node.getAttribute("data-group");
        }
      },{threshold: 0.5}
    )
    observer.observe(node);

    return{
      destroy(){
        observer.unobserve(node);
      }
    }
  }

  $: setGroupInfo = (selectedGroup) => {
    if(selectedGroup == 'Aridland'){
      return `
        <p>These birds have lost 41% of their populations in the last 50 years. Habitat-obligate birds in the American West are facing pressures from drought, wildfires, and invasive plant species, according to the State of the Birds 2025 report by NABCI.</p>
        <p>Efforts are underway to protect birds like the Greater sage-grouse, which has seen steep declines since 1970. The bird is considered a key health indicator of the sagebrush ecosystem, a biodiversity hotspot and home to about 90 bird species.</p>
      `
    } else if (selectedGroup == 'Dabbling/Diving Ducks'){
      return `<p>While ducks and other waterbirds have shown notable population gains due to wetland conservation efforts, the numbers are showing a downward trend recently, according to the State of the Birds 2025 report.</p> <p>The report draws attention to declining duck numbers in the Prairie Pothole region of the Upper Midwest.</p> <p>This wetland region, home to over 50% of North America's migratory waterfowl, has witnessed destruction due to agricultural development and droughts.</p>`
    } else if (selectedGroup == 'Eastern Forest'){
      return `<p>In the last 50 years, the eastern forest region has seen an over 25% decline in bird populations. This has been attributed to development and agricultural activities.</p> <p>Stabilization or modest population gains have been observed in the last decade among birds like Red-cockaded Woodpecker, Cerulean Warbler and Wood Thrush, according to NABCI.</p>`
    } else if (selectedGroup == 'Geese and Swans'){
      return `<p>The impressive surge in geese and swan populations is mainly driven by some species like Canada Geese and Trumpter Swan. Canada Geese numbers have exploded, driven mainly by a surge in resident geese numbers, due to their adaptation to urban landscapes. Concerted conservation efforts helped restore the numbers of Trumpter Swans, which once faced dangers of extinction.</p>`
    } else if (selectedGroup == 'Grassland') {
      return `<p>Dramatic habitat loss and climate change driven by agriculture and development have led to a sharp decline in grassland bird populations.</p>
      <p>One in every four birds in this category has lost over 50% of its population in the last 50 years. Among these are Sprague's Pipit, Mountain Plover, and Bobolink.</p>`;
    } else if (selectedGroup == 'Sea Ducks') {
      return `<p>One in every three sea ducks is a tipping point species that has lost over 50% of its population since 1970, with projections of another 50% loss without urgent conservation efforts.</p>
      <p>This includes birds like the King Eider and Black Scoter. These birds are vulnerable to population declines due to warming waters, climate change, and habitat loss.</p>`;
    } else if (selectedGroup == 'Western Forest') {
      return `<p>Western forest birds have experienced an 11% decline in their populations over the past five decades, and species such as the Rufous Hummingbird are approaching critical tipping points. These downward trends are closely linked to habitat disruption from increasingly severe wildfires and the broader impacts of climate change, which are altering the availability and quality of the forests these birds rely on for survival.</p>`
    } else if (selectedGroup == 'Waterbirds') {
      return `<p>The overall waterbird population has seen a nearly 20% increase, a trend largely driven by the population growth of a few abundant species, such as pelicans. Despite this encouraging overall rise, more than one-third of waterbird species continue to experience population declines, primarily as a result of ongoing wetland loss and habitat degradation. This contrast highlights that while some species are thriving, significant conservation challenges remain for many others that depend on healthy wetland ecosystems.</p>`;
    } else {
      return `<p>A total of 112 bird species have been classified into red (42), orange (37), and yellow (33), categories based on population trend trajectories, threat severity, and the security of core breeding populations, according to the NABCI report.</p>
      <p>These birds have lost over half of their populations since 1970 and are not on a path to recovery without immediate conservation interventions. Sroll to the section below for more information.</p>`;
}
  }

  let fadeClass;

  $: if(selectedGroup){
    fadeClass = ""
    setTimeout(() => {
      fadeClass = "fade-in";
    }, 30)
  } 

  function resizeFlourish() {
  // Trigger a resize of all Flourish embeds
    if (window.Flourish) {
    window.Flourish.resize();
    }
  }


</script>



<div class="title-container">
  <p class="title">Bird population trends in North America</p>
  <p class="subtitle">A spotlight on declining bird populations over the last 50 years</p>
  <p class="byline">by <strong>Manogna Maddipatla</strong></p>
</div>
<div class="panel-container">
  <img src={panel} id="panel" alt="panel"/>
</div>
<div class="lede">
  <p>The oncoming of Spring is always an exciting time for bird watchers. Based on where you are, you might spot robins, cardinals, blue jays, and even be greeted by the distinctive honks of Canada geese calling out to their flock mid-flight. These familiar sights comfort us after a period of their stark absence in the winter. But this surface-level abundance masks a troubling truth: steep declines in bird populations are becoming more common due to habitat loss, climate change, and human activity.</p>
  <br />
  <p>The North American Bird Conservation Initiative (NABCI), a coalition of renowned conservation and scientific organizations, has identified "tipping point" species that have lost over 50% of their populations in the last 50 years. This includes everything from songbirds to migratory species. While waterfowl such as Canada geese are an exception, seeing population increases due to their adaptability to urban environments, all other bird categories have seen significant declines since 1970.</p>
</div>

<!-- <div>
  <button on:click={() => selectedGroup = "Aridland"}>Aridland</button>
  <button on:click={() => selectedGroup = "Dabbling/Diving Ducks"}>Dabbling/Diving Ducks</button>
  <button on:click={() => selectedGroup = "Eastern Forest"}>Eastern Forest</button>
  <button on:click={() => selectedGroup = "Geese and Swans"}>Geese and Swans</button>
  <button on:click={() => selectedGroup = "Grassland"}>Grassland</button>
  <button on:click={() => selectedGroup = "Sea Ducks"}>Sea Ducks</button>
  <button on:click={() => selectedGroup = "Tipping Point"}>Tipping Point</button>
  <button on:click={() => selectedGroup = "Waterbirds"}>Waterbirds</button>
  <button on:click={() => selectedGroup = "Western Forest"}>Western Forest</button>
</div> -->

<div class="scrolly-wrapper">
  <!-- left chart (fixed) -->
  
  <div class="sticky chart-container" bind:this={chartWrapper}>
    <h2 class="group-heading">{selectedGroup}</h2>
    <svg id="canvas" viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet">

      <!-- Chart title -->
      <text id="title" transform="translate(120, 30)">Y/Y population change (1970 - 2022)</text>

      <g id="chart-group" transform="translate(0, 20)">

      <!-- Drawing line graphs for each group -->
      
      {#if lineData[selectedGroup] && lineData[selectedGroup].length > 0}
        <path d={lineGenerator(lineData[selectedGroup])} fill="none" stroke="#E75480" stroke-width="2" id="line-path"/>
      {/if}
      
      <!-- X axis ticks -->
      <g class="xTicks" transform="translate(0, {height / 1.13})">
        {#each xTicks as tick}
          <g class="tick" transform="translate({xScale(tick)}, 8)">
            <text class="tick">{tick}</text>
          </g>
        {/each}
      </g>
  
      <!-- X axis line -->
  
      <line x1={xScale(1970)} y1={height / 1.18} x2={xScale(2022) + 10} y2={height / 1.18} stroke="steelblue" stroke-width="1"/>
  
      <!-- Y axis ticks -->
      <g class="yTicks" transform="traslate(100, 0)">
        {#each yTicks as tick}
          <g class="tick" transform="translate(48, {yScale(tick)})">
            <text class="tick">{tick}</text>
          </g>
        {/each}
      </g>
  
      <!-- Y axis line -->
      <line x1={100} y1={height / 1.18} x2={100} y2={30} stroke="steelblue" stroke-width="1"/>

      <!-- x axis label -->
       <text x={(xScale(1970) + xScale(2022) / 3)} y={height} text-anchor="middle" font-size="1.5rem" fill="steelblue">Year</text>

      <!-- y-axis label -->

      <text x={-height / 2} y={30} transform="rotate(-90)"text-anchor="middle" font-size="1.3rem" fill="steelblue">
        Percent change (%)
      </text>
  
      {#if maxPoint}
        <circle cx={xScale(+maxPoint.Year)} cy={yScale(+maxPoint.percent)} r="2" fill="darkred"/>
        <text
          x={xScale(+maxPoint.Year) + 6}
          y={yScale(+maxPoint.percent) - 6}
          font-size="1.2rem"
          fill="black"
        >
          {(+maxPoint.percent).toFixed(1)}%
        </text>
      {/if}
  
      {#if minPoint}
        <circle cx={xScale(+minPoint.Year)} cy={yScale(+minPoint.percent)} r="2" fill="darkred"/>
        <text
          x={xScale(+minPoint.Year) + 6}
          y={yScale(+minPoint.percent) - 6}
          font-size="1.2rem"
          fill="black"
        >
          {(+minPoint.percent).toFixed(1)}%
        </text>
        
      {/if}

    </g>
    </svg>
     <div id="img-container">
      <img id="img" src={selectedImage(selectedGroup)} alt={selectedGroup} class={fadeClass}/>
    </div>
  </div>
  <!-- Bird Info Section -->
  <div class="sticky info-container">
    <div id="info-text" class={fadeClass}>
      <p class="birdInfo">{@html setGroupInfo(selectedGroup)}</p>
    </div>
  </div>

  <!-- Invisible scroll steps -->
   <div class="scroll-overlay">
    {#each groups as group}
      <div class="scroll-step" use:observe data-group={group}></div>
    {/each}
   </div>
</div>
<h3 id="section2Title">Tipping point</h3>
<section id="section2">
<div id="tipping-point">
  <p class="outro">112 tipping point species have lost over half of their population in the last five decades. Without urgent intervention and conservation efforts, they are on the path of continued decline, scientists say.</p>
  <br />
  <table>
  <thead>
    <tr>
      <th>Urgency category</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
      <tr>
        <td>Red</td>
        <td>High vulnerability scores, dwindling population and  plunging / unknown population trend <br /><br /> <strong>Ex: Tricolored Blackbird, Baird's Sparrow</strong></td>
      </tr>
      <tr>
        <td>Orange</td>
        <td>Long term population loss of over three-quarters with continued rapid declines in the last three generations <br /><br /> <strong>Ex: Dovekie, Sprague's Pipit, King Rail</strong>
      </td>
      </tr>
      <tr>
        <td>Yellow</td>
        <td>Long term population loss of over 50%, showing stability or improving trends in the last three generations <br /><br /> <strong>Ex: Wood Thrush, Black Scoter</strong></td>
      </tr>
  </tbody>
</table>
<p class="outro">These concerning population trends mirror the environmental shifts we all face. Understanding their story is the first step toward a more balanced future. For more information on the population trends and conservation challenges, see <a href="https://www.stateofthebirds.org/2025/">NABCI State of the Birds 2025</a>.</p>

</div>

<iframe src='https://flo.uri.sh/visualisation/22997181/embed' title='Interactive or visual content' class='flourish-embed-iframe' frameborder='0' scrolling='no' style='width:100% !important;height:600px !important;' sandbox='allow-same-origin allow-forms allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation'></iframe><div style='width:100%!;margin-top:4px!important;text-align:right!important;'><a class='flourish-credit' href='https://public.flourish.studio/visualisation/22997181/?utm_source=embed&utm_campaign=visualisation/22997181' target='_top' style='text-decoration:none!important'><img alt='Made with Flourish' src='https://public.flourish.studio/resources/made_with_flourish.svg' style='width:105px!important;height:16px!important;border:none!important;margin:0!important;'> </a></div>

</section>
<section id="footer">
  <h2>Sources</h2>
  <p>U.S. Geological Survey Eastern Ecological Science Center</p>
  <p>U.S. Fish & Wildlife Service</p>
  <p>National Audubon Society</p>
  <p><a href="https://www.stateofthebirds.org/2025/">NABCI State of the Birds 2025</a></p>
  <p><a href="https://r2rbirds.org/about-us/">Road to Recovery</a></p>

</section>



<!-- <main bind:clientWidth={width}
bind:clientHeight={height} class="container">
</main> -->


<style>
</style>
